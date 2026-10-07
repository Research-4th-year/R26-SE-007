import { StockEventType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { computeStockEventHash } from '../utils/eventHash';
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
          gnnScores: {
            orderBy: { computedAt: 'desc' },
            take: 1,
            select: { reliabilityScore: true, anomalyFlags: true, computedAt: true },
          },
          _count: { select: { supervisors: true, stockEvents: true } },
        },
      }),
      prisma.warehouse.count({ where }),
    ]);

    const warehousesWithStock = await Promise.all(
      warehouses.map(async (wh) => {
        const stockLevel  = await this.computeCurrentStock(wh.id);
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

    const timestamp    = new Date();
    const documentHash = computeStockEventHash({
      warehouseId,
      eventType:    dto.eventType,
      quantityTons: dto.quantityTons,
      reportedById: caller.sub,
      timestamp,
    });

    // Read, validate and write inside one transaction, holding an exclusive
    // lock on the warehouse row. Without the lock, two concurrent events can
    // both read the same stock level, both pass validation, and both insert —
    // letting a warehouse go over capacity or below zero.
    const { event, newStockLevel } = await prisma.$transaction(async (tx) => {

      await tx.$queryRaw`SELECT id FROM warehouses WHERE id = ${warehouseId} FOR UPDATE`;

      const [inflow, outflow] = await Promise.all([
        tx.stockEvent.aggregate({
          where: { warehouseId, eventType: StockEventType.INFLOW },
          _sum:  { quantityTons: true },
        }),
        tx.stockEvent.aggregate({
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

      const currentStock = Math.max(
        0,
        (inflow._sum.quantityTons ?? 0) - (outflow._sum.quantityTons ?? 0)
      );

      // Outbound movements cannot exceed stock on hand
      if (
        dto.eventType === StockEventType.OUTFLOW ||
        dto.eventType === StockEventType.REDISTRIBUTION
      ) {
        if (dto.quantityTons > currentStock) {
          throw AppError.badRequest(
            `Insufficient stock. Current: ${currentStock.toFixed(2)} tons, ` +
            `Requested: ${dto.quantityTons} tons`
          );
        }
      }

      // Inbound movements cannot exceed free capacity
      if (dto.eventType === StockEventType.INFLOW) {
        const available = warehouse.capacityTons - currentStock;
        if (dto.quantityTons > available) {
          throw AppError.badRequest(
            `Exceeds capacity. Available: ${available.toFixed(2)} tons, ` +
            `Requested: ${dto.quantityTons} tons`
          );
        }
      }

      const created = await tx.stockEvent.create({
        data: {
          warehouseId,
          eventType:    dto.eventType,
          quantityTons: dto.quantityTons,
          notes:        dto.notes,
          documentHash,
          reportedById: caller.sub,
          timestamp,          // persist the exact value that was hashed
        },
        include: {
          reportedBy: { select: { id: true, fullName: true, email: true, role: true } },
          warehouse:  { select: { id: true, name: true, code: true } },
        },
      });

      const delta = dto.eventType === StockEventType.INFLOW
        ? dto.quantityTons
        : -dto.quantityTons;

      return {
        event: created,
        newStockLevel: Math.max(0, currentStock + delta),
      };
    });

    // Anchor after the transaction commits — never hold a database
    // transaction open across a network call to the ledger.
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

    return {
      event,
      warehouseSummary: {
        currentStockTons: newStockLevel,
        availableTons:    Math.max(0, warehouse.capacityTons - newStockLevel),
        utilizationPct:   warehouse.capacityTons > 0
          ? Math.round((newStockLevel / warehouse.capacityTons) * 100)
          : 0,
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

    const totalCapacity  = stockLevels.reduce((sum, w) => sum + w.capacityTons, 0);
    const totalStock     = stockLevels.reduce((sum, w) => sum + w.currentStock, 0);
    const totalAvailable = Math.max(0, totalCapacity - totalStock);
    const networkUtilPct = totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;

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

  /**
   * Current stock derived from the event log:
   * INFLOW adds; OUTFLOW / REDISTRIBUTION / DAMAGE / ADJUSTMENT subtract.
   *
   * There is no stored stock column — the event log is the single source
   * of truth, so this must stay consistent with the same derivation in
   * python-service/src/features.py.
   */
  async computeCurrentStock(warehouseId: string): Promise<number> {
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