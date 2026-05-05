import { DisasterStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { haversineKm, computeRankingScore } from '../utils/geo';
import { warehouseService } from './warehouse.service';
import { JwtPayload } from '../types';
import {
  CreateDisasterInput,
  UpdateDisasterStatusInput,
  CreateRedistributionInput,
  DisasterQueryInput,
} from '../utils/disaster.validators';

export class DisasterService {

  // ── Create disaster event ─────────────────────────────────────
  async createDisaster(dto: CreateDisasterInput, caller: JwtPayload) {
    // Verify the affected warehouse exists and is active
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: dto.affectedWarehouseId },
    });

    if (!warehouse) {
      throw AppError.notFound('Affected warehouse not found');
    }
    if (!warehouse.isActive) {
      throw AppError.badRequest('Cannot create a disaster event for an inactive warehouse');
    }

    // Block duplicate open disasters on the same warehouse
    const existingOpen = await prisma.disasterEvent.findFirst({
      where: {
        affectedWarehouseId: dto.affectedWarehouseId,
        status: { not: DisasterStatus.RESOLVED },
      },
    });

    if (existingOpen) {
      throw AppError.conflict(
        `Warehouse already has an active disaster event (ID: ${existingOpen.id}). Resolve it before creating a new one.`
      );
    }

    const disaster = await prisma.disasterEvent.create({
      data: {
        disasterType:        dto.disasterType,
        affectedWarehouseId: dto.affectedWarehouseId,
        description:         dto.description,
        estimatedLossTons:   dto.estimatedLossTons,
        occurredAt:          dto.occurredAt,
        reportedById:        caller.sub,
        status:              DisasterStatus.OPEN,
      },
      include: {
        affectedWarehouse: {
          select: { id: true, name: true, code: true, district: true, latitude: true, longitude: true },
        },
        reportedBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    return disaster;
  }

  // ── List disaster events ──────────────────────────────────────
  async listDisasters(query: DisasterQueryInput) {
    const { status, warehouseId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status      ? { status }                                : {}),
      ...(warehouseId ? { affectedWarehouseId: warehouseId }      : {}),
    };

    const [disasters, total] = await Promise.all([
      prisma.disasterEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
        include: {
          affectedWarehouse: {
            select: { id: true, name: true, code: true, district: true },
          },
          reportedBy: {
            select: { id: true, fullName: true, role: true },
          },
          _count: {
            select: { redistributionOrders: true, zkpProofs: true },
          },
        },
      }),
      prisma.disasterEvent.count({ where }),
    ]);

    return {
      items:      disasters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Get disaster detail + ranked candidate warehouses ─────────
  async getDisaster(disasterId: string) {
    const disaster = await prisma.disasterEvent.findUnique({
      where: { id: disasterId },
      include: {
        affectedWarehouse: true,
        reportedBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        redistributionOrders: {
          include: {
            sourceWarehouse:      { select: { id: true, name: true, code: true } },
            destinationWarehouse: { select: { id: true, name: true, code: true } },
            issuedBy:             { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { issuedAt: 'desc' },
        },
        zkpProofs: {
          select: {
            id: true, warehouseId: true,
            verificationResult: true, submittedAt: true,
          },
        },
      },
    });

    if (!disaster) throw AppError.notFound('Disaster event not found');

    // Build ranked candidate list only for non-resolved disasters
    let rankedCandidates: RankedWarehouse[] = [];

    if (disaster.status !== DisasterStatus.RESOLVED) {
      rankedCandidates = await this.rankCandidateWarehouses(
        disaster.affectedWarehouseId,
        disaster.affectedWarehouse.latitude,
        disaster.affectedWarehouse.longitude,
        disaster.estimatedLossTons ?? 0
      );
    }

    return { ...disaster, rankedCandidates };
  }

  // ── Update disaster status ────────────────────────────────────
  async updateDisasterStatus(
    disasterId: string,
    dto: UpdateDisasterStatusInput,
    caller: JwtPayload
  ) {
    const disaster = await this.findOrFail(disasterId);

    // Enforce valid status transitions
    const validTransitions: Record<DisasterStatus, DisasterStatus[]> = {
      [DisasterStatus.OPEN]:        [DisasterStatus.IN_PROGRESS, DisasterStatus.RESOLVED],
      [DisasterStatus.IN_PROGRESS]: [DisasterStatus.RESOLVED],
      [DisasterStatus.RESOLVED]:    [],   // terminal state
    };

    if (!validTransitions[disaster.status].includes(dto.status)) {
      throw AppError.badRequest(
        `Invalid status transition: ${disaster.status} → ${dto.status}. ` +
        `Allowed: ${validTransitions[disaster.status].join(', ') || 'none (already resolved)'}`
      );
    }

    const resolvedAt = dto.status === DisasterStatus.RESOLVED
      ? (dto.resolvedAt ?? new Date())
      : null;

    return prisma.disasterEvent.update({
      where: { id: disasterId },
      data:  { status: dto.status, resolvedAt },
      include: {
        affectedWarehouse: { select: { id: true, name: true, code: true } },
        reportedBy:        { select: { id: true, fullName: true } },
      },
    });
  }

  // ── Issue redistribution order ────────────────────────────────
  async createRedistributionOrder(
    disasterId: string,
    dto: CreateRedistributionInput,
    caller: JwtPayload
  ) {
    const disaster = await this.findOrFail(disasterId);

    if (disaster.status === DisasterStatus.RESOLVED) {
      throw AppError.badRequest('Cannot issue a redistribution order for a resolved disaster');
    }

    // Validate source warehouse
    const sourceWarehouse = await prisma.warehouse.findUnique({
      where: { id: dto.sourceWarehouseId },
    });

    if (!sourceWarehouse) throw AppError.notFound('Source warehouse not found');
    if (!sourceWarehouse.isActive) {
      throw AppError.badRequest('Source warehouse is inactive');
    }

    // Cannot redistribute from the affected warehouse itself
    if (dto.sourceWarehouseId === disaster.affectedWarehouseId) {
      throw AppError.badRequest('Source warehouse cannot be the same as the affected warehouse');
    }

    // Check source has enough stock
    const currentStock = await warehouseService.computeCurrentStock(dto.sourceWarehouseId);
    if (dto.quantityTons > currentStock) {
      throw AppError.badRequest(
        `Source warehouse has insufficient stock. Available: ${currentStock.toFixed(2)} tons, ` +
        `Requested: ${dto.quantityTons} tons`
      );
    }

    // Get current ranking score for audit trail
    const distanceKm = haversineKm(
      disaster.affectedWarehouse.latitude,
      disaster.affectedWarehouse.longitude,
      sourceWarehouse.latitude,
      sourceWarehouse.longitude
    );

    const latestScore = await prisma.warehouseScore.findFirst({
      where:   { warehouseId: dto.sourceWarehouseId },
      orderBy: { computedAt: 'desc' },
      select:  { reliabilityScore: true },
    });

    const availableTons = Math.max(0, sourceWarehouse.capacityTons - currentStock);
    const compositeScore = computeRankingScore(
      distanceKm,
      availableTons,
      sourceWarehouse.capacityTons,
      latestScore?.reliabilityScore ?? 0.5
    );

    // Create the redistribution order
    const order = await prisma.redistributionOrder.create({
      data: {
        disasterEventId:       disasterId,
        sourceWarehouseId:     dto.sourceWarehouseId,
        destinationWarehouseId: disaster.affectedWarehouseId,
        quantityTons:          dto.quantityTons,
        compositeScore,
        issuedById:            caller.sub,
      },
      include: {
        sourceWarehouse:      { select: { id: true, name: true, code: true, district: true } },
        destinationWarehouse: { select: { id: true, name: true, code: true, district: true } },
        issuedBy:             { select: { id: true, fullName: true, role: true } },
        disasterEvent:        { select: { id: true, disasterType: true, status: true } },
      },
    });

    // Auto-advance disaster to IN_PROGRESS if still OPEN
    if (disaster.status === DisasterStatus.OPEN) {
      await prisma.disasterEvent.update({
        where: { id: disasterId },
        data:  { status: DisasterStatus.IN_PROGRESS },
      });
    }

    return order;
  }

  // ── List redistribution orders for a disaster ─────────────────
  async listRedistributionOrders(disasterId: string) {
    await this.findOrFail(disasterId);

    return prisma.redistributionOrder.findMany({
      where:   { disasterEventId: disasterId },
      orderBy: { issuedAt: 'desc' },
      include: {
        sourceWarehouse:      { select: { id: true, name: true, code: true, district: true } },
        destinationWarehouse: { select: { id: true, name: true, code: true, district: true } },
        issuedBy:             { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  // ── Audit trail ───────────────────────────────────────────────
  async getAuditTrail(disasterId: string) {
    const disaster = await prisma.disasterEvent.findUnique({
      where: { id: disasterId },
      include: {
        affectedWarehouse: {
          select: { id: true, name: true, code: true, district: true },
        },
        reportedBy: {
          select: { id: true, fullName: true, role: true },
        },
        redistributionOrders: {
          include: {
            sourceWarehouse:      { select: { id: true, name: true, code: true } },
            destinationWarehouse: { select: { id: true, name: true, code: true } },
            issuedBy:             { select: { id: true, fullName: true, role: true } },
          },
          orderBy: { issuedAt: 'asc' },
        },
        zkpProofs: {
          select: {
            id: true, warehouseId: true,
            verificationResult: true,
            submittedAt: true, verifiedAt: true,
            blockchainTxId: true,
          },
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    if (!disaster) throw AppError.notFound('Disaster event not found');

    // Build a chronological event timeline
    const timeline: AuditEntry[] = [];

    // 1. Disaster reported
    timeline.push({
      eventType:   'DISASTER_REPORTED',
      timestamp:   disaster.createdAt,
      actor:       disaster.reportedBy.fullName,
      description: `${disaster.disasterType} disaster reported at ${disaster.affectedWarehouse.name}`,
      metadata:    {
        disasterType:      disaster.disasterType,
        estimatedLossTons: disaster.estimatedLossTons,
        blockchainTxId:    disaster.blockchainTxId,
      },
    });

    // 2. ZKP proofs (Phase 4 — blockchain verification)
    for (const proof of disaster.zkpProofs) {
      timeline.push({
        eventType:   'ZKP_PROOF_SUBMITTED',
        timestamp:   proof.submittedAt,
        actor:       `Warehouse ${proof.warehouseId}`,
        description: `Capacity proof submitted — verification: ${proof.verificationResult ?? 'pending'}`,
        metadata:    {
          warehouseId:        proof.warehouseId,
          verificationResult: proof.verificationResult,
          blockchainTxId:     proof.blockchainTxId,
        },
      });
    }

    // 3. Redistribution orders issued
    for (const order of disaster.redistributionOrders) {
      timeline.push({
        eventType:   'REDISTRIBUTION_ORDER_ISSUED',
        timestamp:   order.issuedAt,
        actor:       order.issuedBy.fullName,
        description: `${order.quantityTons} tons ordered from ${order.sourceWarehouse.name} → ${order.destinationWarehouse.name}`,
        metadata:    {
          sourceWarehouse:      order.sourceWarehouse.name,
          destinationWarehouse: order.destinationWarehouse.name,
          quantityTons:         order.quantityTons,
          compositeScore:       order.compositeScore,
          blockchainTxId:       order.blockchainTxId,
        },
      });
    }

    // 4. Status changes implied by resolvedAt
    if (disaster.resolvedAt) {
      timeline.push({
        eventType:   'DISASTER_RESOLVED',
        timestamp:   disaster.resolvedAt,
        actor:       'System',
        description: `Disaster marked as resolved`,
        metadata:    { status: 'RESOLVED' },
      });
    }

    // Sort chronologically
    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      disaster: {
        id:           disaster.id,
        disasterType: disaster.disasterType,
        status:       disaster.status,
        occurredAt:   disaster.occurredAt,
        resolvedAt:   disaster.resolvedAt,
        affectedWarehouse: disaster.affectedWarehouse,
        reportedBy:   disaster.reportedBy,
        blockchainTxId: disaster.blockchainTxId, // null until Phase 4
      },
      summary: {
        totalRedistributionOrders: disaster.redistributionOrders.length,
        totalQuantityRedistributed: disaster.redistributionOrders.reduce(
          (sum, o) => sum + o.quantityTons, 0
        ),
        zkpProofsSubmitted: disaster.zkpProofs.length,
        zkpProofsVerified:  disaster.zkpProofs.filter((p) => p.verificationResult === true).length,
        blockchainAnchored: !!disaster.blockchainTxId,
      },
      timeline,
    };
  }

  // ── Private: rank candidate warehouses ───────────────────────
  private async rankCandidateWarehouses(
    affectedWarehouseId: string,
    affectedLat: number,
    affectedLon: number,
    requiredTons: number
  ): Promise<RankedWarehouse[]> {
    // Get all active warehouses except the affected one
    const candidates = await prisma.warehouse.findMany({
      where: {
        isActive: true,
        id: { not: affectedWarehouseId },
      },
      include: {
        gnnScores: {
          orderBy: { computedAt: 'desc' },
          take: 1,
          select: { reliabilityScore: true },
        },
      },
    });

    const ranked = await Promise.all(
      candidates.map(async (wh) => {
        const currentStock   = await warehouseService.computeCurrentStock(wh.id);
        const availableTons  = Math.max(0, wh.capacityTons - currentStock);
        const distanceKm     = haversineKm(affectedLat, affectedLon, wh.latitude, wh.longitude);
        const reliability    = wh.gnnScores[0]?.reliabilityScore ?? 0.5;
        const compositeScore = computeRankingScore(distanceKm, availableTons, wh.capacityTons, reliability);
        const canFulfil      = availableTons >= requiredTons;

        return {
          warehouseId:      wh.id,
          name:             wh.name,
          code:             wh.code,
          district:         wh.district,
          latitude:         wh.latitude,
          longitude:        wh.longitude,
          distanceKm:       Math.round(distanceKm * 10) / 10,
          currentStockTons: currentStock,
          availableTons,
          capacityTons:     wh.capacityTons,
          reliabilityScore: reliability,
          compositeScore:   Math.round(compositeScore * 1000) / 1000,
          canFulfil,
          zkpVerified:      false, // will be true after Phase 4 ZKP submission
        };
      })
    );

    // Sort by composite score descending; eligible warehouses first
    return ranked.sort((a, b) => {
      if (a.canFulfil !== b.canFulfil) return a.canFulfil ? -1 : 1;
      return b.compositeScore - a.compositeScore;
    });
  }

  // ── Private helpers ───────────────────────────────────────────
  private async findOrFail(disasterId: string) {
    const disaster = await prisma.disasterEvent.findUnique({
      where: { id: disasterId },
      include: {
        affectedWarehouse: {
          select: { id: true, name: true, latitude: true, longitude: true },
        },
      },
    });
    if (!disaster) throw AppError.notFound('Disaster event not found');
    return disaster;
  }
}

// ── Types ──────────────────────────────────────────────────────
type RankedWarehouse = {
  warehouseId:      string;
  name:             string;
  code:             string;
  district:         string;
  latitude:         number;
  longitude:        number;
  distanceKm:       number;
  currentStockTons: number;
  availableTons:    number;
  capacityTons:     number;
  reliabilityScore: number;
  compositeScore:   number;
  canFulfil:        boolean;
  zkpVerified:      boolean;
};

type AuditEntry = {
  eventType:   string;
  timestamp:   Date;
  actor:       string;
  description: string;
  metadata:    Record<string, unknown>;
};

export const disasterService = new DisasterService();