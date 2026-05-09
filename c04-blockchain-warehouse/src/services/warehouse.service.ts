import crypto from 'crypto';
import { StockEventType, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import {
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateStockEventInput,
  WarehouseQueryInput,
  StockEventQueryInput,
} from '../utils/warehouse.validators';
import { JwtPayload } from '../types';
import * as fabricService from './fabric.service';

export class WarehouseService {

  // ── List warehouses ──────────────────────────────────────────
  async listWarehouses(query: WarehouseQueryInput) {
    const { district, isActive, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(district  ? { district: { contains: district } }  : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          // Latest GNN score
          gnnScores: {
            orderBy: { computedAt: 'desc' },
            take: 1,
            select: { reliabilityScore: true, anomalyFlags: true, computedAt: true },
          },
          // Count supervisors
          _count: { select: { supervisors: true, stockEvents: true } },
        },
      }),
      prisma.warehouse.count({ where }),
    ]);

    // Attach computed current stock level to each warehouse
    const warehousesWithStock = await Promise.all(
      warehouses.map(async (wh) => {
        const stockLevel = await this.computeCurrentStock(wh.id);
        const latestScore = wh.gnnScores[0] ?? null;

        return {
          id:               wh.id,
          name:             wh.name,
          code:             wh.code,
          district:         wh.district,
          address:          wh.address,
          latitude:         wh.latitude,
          longitude:        wh.longitude,
          capacityTons:     wh.capacityTons,
          isActive:         wh.isActive,
          fabricPeerId:     wh.fabricPeerId,
          currentStockTons: stockLevel,
          availableTons:    Math.max(0, wh.capacityTons - stockLevel),
          utilizationPct:   wh.capacityTons > 0
            ? Math.round((stockLevel / wh.capacityTons) * 100)
            : 0,
          reliabilityScore: latestScore?.reliabilityScore ?? null,
          anomalyFlags:     latestScore?.anomalyFlags ?? null,
          scoreComputedAt:  latestScore?.computedAt ?? null,
          supervisorCount:  wh._count.supervisors,
          eventCount:       wh._count.stockEvents,
          createdAt:        wh.createdAt,
          updatedAt:        wh.updatedAt,
        };
      })
    );

    return {
      items:      warehousesWithStock,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get single warehouse ─────────────────────────────────────
  async getWarehouse(warehouseId: string) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        supervisors: {
          where: { isActive: true },
          select: { id: true, fullName: true, email: true },
        },
        gnnScores: {
          orderBy: { computedAt: 'desc' },
          take: 5,
          select: { reliabilityScore: true, anomalyFlags: true, computedAt: true },
        },
        _count: { select: { stockEvents: true } },
      },
    });

    if (!warehouse) throw AppError.notFound('Warehouse not found');

    const stockLevel = await this.computeCurrentStock(warehouseId);

    return {
      id:               warehouse.id,
      name:             warehouse.name,
      code:             warehouse.code,
      district:         warehouse.district,
      address:          warehouse.address,
      latitude:         warehouse.latitude,
      longitude:        warehouse.longitude,
      capacityTons:     warehouse.capacityTons,
      isActive:         warehouse.isActive,
      fabricPeerId:     warehouse.fabricPeerId,
      currentStockTons: stockLevel,
      availableTons:    Math.max(0, warehouse.capacityTons - stockLevel),
      utilizationPct:   warehouse.capacityTons > 0
        ? Math.round((stockLevel / warehouse.capacityTons) * 100)
        : 0,
      supervisors:      warehouse.supervisors,
      scoreHistory:     warehouse.gnnScores,
      latestScore:      warehouse.gnnScores[0] ?? null,
      totalEvents:      warehouse._count.stockEvents,
      createdAt:        warehouse.createdAt,
      updatedAt:        warehouse.updatedAt,
    };
  }

  // ── Create warehouse ─────────────────────────────────────────
  async createWarehouse(dto: CreateWarehouseInput) {
    const existing = await prisma.warehouse.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw AppError.conflict(`Warehouse with code '${dto.code}' already exists`);
    }

    return prisma.warehouse.create({ data: dto });
  }

  // ── Update warehouse ─────────────────────────────────────────
  async updateWarehouse(warehouseId: string, dto: UpdateWarehouseInput) {
    await this.findOrFail(warehouseId);
    return prisma.warehouse.update({ where: { id: warehouseId }, data: dto });
  }

  // ── Delete (soft) warehouse ───────────────────────────────────
  async deactivateWarehouse(warehouseId: string) {
    await this.findOrFail(warehouseId);

    // Block deactivation if warehouse has open disaster events
    const openDisasters = await prisma.disasterEvent.count({
      where: { affectedWarehouseId: warehouseId, status: { not: 'RESOLVED' } },
    });

    if (openDisasters > 0) {
      throw AppError.badRequest(
        'Cannot deactivate warehouse with open disaster events. Resolve them first.'
      );
    }

    return prisma.warehouse.update({
      where: { id: warehouseId },
      data: { isActive: false },
    });
  }

  // ── Create stock event ────────────────────────────────────────
  async createStockEvent(
    warehouseId: string,
    dto: CreateStockEventInput,
    caller: JwtPayload
  ) {
    const warehouse = await this.findOrFail(warehouseId);

    if (!warehouse.isActive) {
      throw AppError.badRequest('Cannot record events for an inactive warehouse');
    }

    // Business rule: OUTFLOW / REDISTRIBUTION cannot exceed current stock
    if (
      dto.eventType === StockEventType.OUTFLOW ||
      dto.eventType === StockEventType.REDISTRIBUTION
    ) {
      const currentStock = await this.computeCurrentStock(warehouseId);
      if (dto.quantityTons > currentStock) {
        throw AppError.badRequest(
          `Insufficient stock. Current: ${currentStock.toFixed(2)} tons, Requested: ${dto.quantityTons} tons`
        );
      }
    }

    // Business rule: INFLOW cannot exceed available capacity
    if (dto.eventType === StockEventType.INFLOW) {
      const currentStock = await this.computeCurrentStock(warehouseId);
      const available = warehouse.capacityTons - currentStock;
      if (dto.quantityTons > available) {
        throw AppError.badRequest(
          `Exceeds capacity. Available: ${available.toFixed(2)} tons, Requested: ${dto.quantityTons} tons`
        );
      }
    }

    // Generate a document hash for audit trail
    // In Phase 4 this will be the SHA-256 of an uploaded report document.
    // For now we hash the event data itself as a placeholder.
    const eventData = JSON.stringify({
      warehouseId,
      eventType: dto.eventType,
      quantityTons: dto.quantityTons,
      reportedById: caller.sub,
      timestamp: new Date().toISOString(),
    });
    const documentHash = crypto.createHash('sha256').update(eventData).digest('hex');

    const event = await prisma.stockEvent.create({
      data: {
        warehouseId,
        eventType:    dto.eventType,
        quantityTons: dto.quantityTons,
        notes:        dto.notes,
        documentHash,
        reportedById: caller.sub,
      },
      include: {
        reportedBy: { select: { id: true, fullName: true, email: true, role: true } },
        warehouse:  { select: { id: true, name: true, code: true } },
      },
    });

    try {
  await fabricService.recordStockEvent({
    id:           event.id,
    warehouseId:  warehouseId,
    eventType:    dto.eventType.toString(),
    quantityTons: dto.quantityTons,
    documentHash: documentHash,
    reportedById: caller.sub,
    notes:        dto.notes ?? '',
  });
  await prisma.stockEvent.update({
    where: { id: event.id },
    data:  { blockchainTxId: `fabric:${event.id}` },
  });
  console.log(`[Fabric] Stock event anchored: ${event.id}`);
} catch (fabricErr) {
  console.error('[Fabric] Failed to anchor stock event:', fabricErr);
}


    // Return event with updated stock level
    const newStockLevel = await this.computeCurrentStock(warehouseId);

    return {
      event,
      warehouseSummary: {
        currentStockTons: newStockLevel,
        availableTons:    Math.max(0, warehouse.capacityTons - newStockLevel),
        utilizationPct:   Math.round((newStockLevel / warehouse.capacityTons) * 100),
      },
    };
  }

  // ── List stock events ─────────────────────────────────────────
  async listStockEvents(warehouseId: string, query: StockEventQueryInput) {
    await this.findOrFail(warehouseId);

    const { eventType, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      warehouseId,
      ...(eventType ? { eventType } : {}),
    };

    const [events, total] = await Promise.all([
      prisma.stockEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          reportedBy: { select: { id: true, fullName: true, email: true, role: true } },
        },
      }),
      prisma.stockEvent.count({ where }),
    ]);

    return {
      items:      events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get current stock summary across warehouses ─────────
  async getNetworkSummary() {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true, capacityTons: true },
    });

    const stockLevels = await Promise.all(
      warehouses.map(async (wh) => ({
        warehouseId:  wh.id,
        capacityTons: wh.capacityTons,
        currentStock: await this.computeCurrentStock(wh.id),
      }))
    );

    const totalCapacity    = stockLevels.reduce((sum, w) => sum + w.capacityTons, 0);
    const totalStock       = stockLevels.reduce((sum, w) => sum + w.currentStock, 0);
    const totalAvailable   = Math.max(0, totalCapacity - totalStock);
    const networkUtilPct   = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;

    const openDisasters = await prisma.disasterEvent.count({
      where: { status: { not: 'RESOLVED' } },
    });

    return {
      totalWarehouses:    warehouses.length,
      totalCapacityTons:  totalCapacity,
      totalStockTons:     totalStock,
      totalAvailableTons: totalAvailable,
      networkUtilPct,
      openDisasters,
    };
  }

  // ── Private helpers ───────────────────────────────────────────

  private async findOrFail(warehouseId: string) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw AppError.notFound('Warehouse not found');
    return warehouse;
  }

  // Computes current stock by summing all events:
  // INFLOW adds, OUTFLOW/REDISTRIBUTION/DAMAGE/ADJUSTMENT subtracts
  async computeCurrentStock(warehouseId: string): Promise<number> {
    const result = await prisma.stockEvent.aggregate({
      where: { warehouseId },
      _sum: { quantityTons: true },
    });

    // Separate inflows from outflows
    const [inflow, outflow] = await Promise.all([
      prisma.stockEvent.aggregate({
        where: { warehouseId, eventType: StockEventType.INFLOW },
        _sum: { quantityTons: true },
      }),
      prisma.stockEvent.aggregate({
        where: {
          warehouseId,
          eventType: {
            in: [
              StockEventType.OUTFLOW,
              StockEventType.REDISTRIBUTION,
              StockEventType.DAMAGE,
              StockEventType.ADJUSTMENT,
            ],
          },
        },
        _sum: { quantityTons: true },
      }),
    ]);

    const totalIn  = inflow._sum.quantityTons  ?? 0;
    const totalOut = outflow._sum.quantityTons ?? 0;

    return Math.max(0, totalIn - totalOut);
  }
}

export const warehouseService = new WarehouseService();