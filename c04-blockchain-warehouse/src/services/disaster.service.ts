import { DisasterStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { haversineKm, computeRankingScore } from '../utils/geo';
import { computeStockEventHash } from '../utils/eventHash';
import { warehouseService } from './warehouse.service';
import { JwtPayload } from '../types';
import {
  CreateDisasterInput,
  UpdateDisasterStatusInput,
  CreateRedistributionInput,
  DisasterQueryInput,
} from '../utils/disaster.validators';
import * as fabricService from './fabric.service';

export class DisasterService {

  // ── Create disaster event ─────────────────────────────────────
  async createDisaster(dto: CreateDisasterInput, caller: JwtPayload) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: dto.affectedWarehouseId },
    });

    if (!warehouse) {
      throw AppError.notFound('Affected warehouse not found');
    }
    if (!warehouse.isActive) {
      throw AppError.badRequest('Cannot create a disaster event for an inactive warehouse');
    }

    const existingOpen = await prisma.disasterEvent.findFirst({
      where: {
        affectedWarehouseId: dto.affectedWarehouseId,
        status: { not: DisasterStatus.RESOLVED },
      },
    });

    if (existingOpen) {
      throw AppError.conflict(
        `Warehouse already has an active disaster event (ID: ${existingOpen.id}). ` +
        `Resolve it before creating a new one.`
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

    try {
      await fabricService.recordDisasterEvent({
        id:                  disaster.id,
        disasterType:        dto.disasterType.toString(),
        affectedWarehouseId: dto.affectedWarehouseId,
        estimatedLossTons:   dto.estimatedLossTons ?? 0,
        description:         dto.description ?? '',
        reportedById:        caller.sub,
        occurredAt:          dto.occurredAt.toISOString(),
      });
      await prisma.disasterEvent.update({
        where: { id: disaster.id },
        data:  { blockchainTxId: `fabric:${disaster.id}` },
      });
      console.log(`[Fabric] Disaster event anchored: ${disaster.id}`);
    } catch (fabricErr) {
      console.error('[Fabric] Failed to anchor disaster event:', fabricErr);
    }

    return disaster;
  }

  // ── List disaster events ──────────────────────────────────────
  async listDisasters(query: DisasterQueryInput) {
    const { status, warehouseId, page, limit } = query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status      ? { status }                           : {}),
      ...(warehouseId ? { affectedWarehouseId: warehouseId } : {}),
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

    let rankedCandidates: RankedWarehouse[] = [];
    let stockToEvacuate = 0;

    if (disaster.status !== DisasterStatus.RESOLVED) {
      // Under the evacuation model the relevant figure is how much stock
      // SURVIVED and needs moving — not how much was lost.
      stockToEvacuate = await warehouseService.computeCurrentStock(
        disaster.affectedWarehouseId
      );

      rankedCandidates = await this.rankCandidateWarehouses(
        disaster.affectedWarehouseId,
        disaster.affectedWarehouse.latitude,
        disaster.affectedWarehouse.longitude,
        stockToEvacuate,
        disaster.id
      );
    }

    return { ...disaster, stockToEvacuate, rankedCandidates };
  }

  // ── Update disaster status ────────────────────────────────────
  async updateDisasterStatus(
    disasterId: string,
    dto: UpdateDisasterStatusInput,
    caller: JwtPayload
  ) {
    const disaster = await this.findOrFail(disasterId);

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

  // ── Issue evacuation order ────────────────────────────────────
  // Stock moves OUT of the disaster-affected warehouse INTO a safe
  // warehouse that has sufficient free capacity to receive it.
  async createRedistributionOrder(
    disasterId: string,
    dto: CreateRedistributionInput,
    caller: JwtPayload
  ) {
    const disaster = await this.findOrFail(disasterId);

    if (disaster.status === DisasterStatus.RESOLVED) {
      throw AppError.badRequest('Cannot issue an evacuation order for a resolved disaster');
    }

    const destination = await prisma.warehouse.findUnique({
      where: { id: dto.destinationWarehouseId },
    });

    if (!destination) throw AppError.notFound('Destination warehouse not found');
    if (!destination.isActive) {
      throw AppError.badRequest('Destination warehouse is inactive');
    }
    if (dto.destinationWarehouseId === disaster.affectedWarehouseId) {
      throw AppError.badRequest('Destination cannot be the affected warehouse itself');
    }

    // Composite score recorded on the order for the audit trail
    const distanceKm = haversineKm(
      disaster.affectedWarehouse.latitude,
      disaster.affectedWarehouse.longitude,
      destination.latitude,
      destination.longitude
    );

    const latestScore = await prisma.warehouseScore.findFirst({
      where:   { warehouseId: dto.destinationWarehouseId },
      orderBy: { computedAt: 'desc' },
      select:  { reliabilityScore: true },
    });

    const destStockNow = await warehouseService.computeCurrentStock(dto.destinationWarehouseId);
    const compositeScore = computeRankingScore(
      distanceKm,
      Math.max(0, destination.capacityTons - destStockNow),
      destination.capacityTons,
      latestScore?.reliabilityScore ?? 0.5
    );

    const timestamp = new Date();

    // The order, both stock legs and the status change commit together.
    // A partial failure would otherwise leave stock existing in neither
    // warehouse, or in both.
    const order = await prisma.$transaction(async (tx) => {

      // Lock both warehouse rows in a deterministic order so two concurrent
      // orders involving the same pair cannot deadlock.
      const [firstId, secondId] =
        [disaster.affectedWarehouseId, dto.destinationWarehouseId].sort();
      await tx.$queryRaw`SELECT id FROM warehouses WHERE id = ${firstId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM warehouses WHERE id = ${secondId} FOR UPDATE`;

      const stockOf = async (warehouseId: string) => {
        const [inflow, outflow] = await Promise.all([
          tx.stockEvent.aggregate({
            where: { warehouseId, eventType: 'INFLOW' },
            _sum:  { quantityTons: true },
          }),
          tx.stockEvent.aggregate({
            where: {
              warehouseId,
              eventType: { in: ['OUTFLOW', 'REDISTRIBUTION', 'DAMAGE', 'ADJUSTMENT'] },
            },
            _sum: { quantityTons: true },
          }),
        ]);
        return Math.max(0,
          (inflow._sum.quantityTons ?? 0) - (outflow._sum.quantityTons ?? 0));
      };

      // The affected warehouse must hold the stock being evacuated
      const affectedStock = await stockOf(disaster.affectedWarehouseId);
      if (dto.quantityTons > affectedStock) {
        throw AppError.badRequest(
          `Affected warehouse holds only ${affectedStock.toFixed(2)} tons. ` +
          `Cannot evacuate ${dto.quantityTons} tons.`
        );
      }

      // The destination must have room for it
      const destStock = await stockOf(dto.destinationWarehouseId);
      const destFree  = Math.max(0, destination.capacityTons - destStock);
      if (dto.quantityTons > destFree) {
        throw AppError.badRequest(
          `Destination warehouse has only ${destFree.toFixed(2)} tons of free capacity. ` +
          `Cannot receive ${dto.quantityTons} tons.`
        );
      }

      const created = await tx.redistributionOrder.create({
        data: {
          disasterEventId:        disasterId,
          sourceWarehouseId:      disaster.affectedWarehouseId,   // evacuating FROM
          destinationWarehouseId: dto.destinationWarehouseId,     // evacuating TO
          quantityTons:           dto.quantityTons,
          compositeScore,
          issuedById:             caller.sub,
        },
        include: {
          sourceWarehouse:      { select: { id: true, name: true, code: true, district: true } },
          destinationWarehouse: { select: { id: true, name: true, code: true, district: true } },
          issuedBy:             { select: { id: true, fullName: true, role: true } },
          disasterEvent:        { select: { id: true, disasterType: true, status: true } },
        },
      });

      // Outbound leg — reduces stock at the affected warehouse
      await tx.stockEvent.create({
        data: {
          warehouseId:  disaster.affectedWarehouseId,
          eventType:    'REDISTRIBUTION',
          quantityTons: dto.quantityTons,
          notes:        `Evacuation order ${created.id} → ${destination.code}`,
          documentHash: computeStockEventHash({
            warehouseId:  disaster.affectedWarehouseId,
            eventType:    'REDISTRIBUTION',
            quantityTons: dto.quantityTons,
            reportedById: caller.sub,
            timestamp,
          }),
          reportedById: caller.sub,
          timestamp,
        },
      });

      // Inbound leg — increases stock at the receiving warehouse
      await tx.stockEvent.create({
        data: {
          warehouseId:  dto.destinationWarehouseId,
          eventType:    'INFLOW',
          quantityTons: dto.quantityTons,
          notes:        `Received via evacuation order ${created.id}`,
          documentHash: computeStockEventHash({
            warehouseId:  dto.destinationWarehouseId,
            eventType:    'INFLOW',
            quantityTons: dto.quantityTons,
            reportedById: caller.sub,
            timestamp,
          }),
          reportedById: caller.sub,
          timestamp,
        },
      });

      if (disaster.status === DisasterStatus.OPEN) {
        await tx.disasterEvent.update({
          where: { id: disasterId },
          data:  { status: DisasterStatus.IN_PROGRESS },
        });
      }

      return created;
    });

    // Anchor after the transaction commits — never hold a database
    // transaction open across a network call to the ledger.
    try {
      await fabricService.issueRedistributionOrder({
        id:                     order.id,
        disasterEventId:        disasterId,
        sourceWarehouseId:      disaster.affectedWarehouseId,
        destinationWarehouseId: dto.destinationWarehouseId,
        quantityTons:           dto.quantityTons,
        compositeScore,
        issuedById:             caller.sub,
      });
      await prisma.redistributionOrder.update({
        where: { id: order.id },
        data:  { blockchainTxId: `fabric:${order.id}` },
      });
      console.log(`[Fabric] Evacuation order anchored: ${order.id}`);
    } catch (fabricErr) {
      console.error('[Fabric] Failed to anchor evacuation order:', fabricErr);
    }

    return order;
  }

  // ── List evacuation orders for a disaster ─────────────────────
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

    // 2. ZKP capacity proofs submitted by candidate recipients
    for (const proof of disaster.zkpProofs) {
      timeline.push({
        eventType:   'ZKP_PROOF_SUBMITTED',
        timestamp:   proof.submittedAt,
        actor:       `Warehouse ${proof.warehouseId}`,
        description: `Free-capacity proof submitted — verification: ${proof.verificationResult ?? 'pending'}`,
        metadata:    {
          warehouseId:        proof.warehouseId,
          verificationResult: proof.verificationResult,
          blockchainTxId:     proof.blockchainTxId,
        },
      });
    }

    // 3. Evacuation orders issued
    for (const order of disaster.redistributionOrders) {
      timeline.push({
        eventType:   'REDISTRIBUTION_ORDER_ISSUED',
        timestamp:   order.issuedAt,
        actor:       order.issuedBy.fullName,
        description: `${order.quantityTons} tons evacuated from ${order.sourceWarehouse.name} → ${order.destinationWarehouse.name}`,
        metadata:    {
          sourceWarehouse:      order.sourceWarehouse.name,
          destinationWarehouse: order.destinationWarehouse.name,
          quantityTons:         order.quantityTons,
          compositeScore:       order.compositeScore,
          blockchainTxId:       order.blockchainTxId,
        },
      });
    }

    // 4. Resolution
    if (disaster.resolvedAt) {
      timeline.push({
        eventType:   'DISASTER_RESOLVED',
        timestamp:   disaster.resolvedAt,
        actor:       'System',
        description: `Disaster marked as resolved`,
        metadata:    { status: 'RESOLVED' },
      });
    }

    timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      disaster: {
        id:             disaster.id,
        disasterType:   disaster.disasterType,
        status:         disaster.status,
        occurredAt:     disaster.occurredAt,
        resolvedAt:     disaster.resolvedAt,
        affectedWarehouse: disaster.affectedWarehouse,
        reportedBy:     disaster.reportedBy,
        blockchainTxId: disaster.blockchainTxId,
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

  // ── Private: rank candidate recipient warehouses ─────────────
  private async rankCandidateWarehouses(
    affectedWarehouseId: string,
    affectedLat: number,
    affectedLon: number,
    tonsToEvacuate: number,
    disasterId: string
  ): Promise<RankedWarehouse[]> {
    // The affected warehouse is excluded because it is the SOURCE of the
    // evacuation, not a candidate recipient.
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

        // canFulfil means "can absorb the entire evacuation on its own".
        // A warehouse that cannot is still useful for a partial evacuation,
        // which canAbsorbTons quantifies.
        const canFulfil     = availableTons >= tonsToEvacuate;
        const canAbsorbTons = Math.min(availableTons, tonsToEvacuate);

        const zkpProof = await prisma.zKPProof.findFirst({
          where: {
            warehouseId:        wh.id,
            disasterEventId:    disasterId,
            verificationResult: true,
          },
        });

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
          canAbsorbTons,
          zkpVerified:      !!zkpProof,
        };
      })
    );

    // Warehouses that can absorb the whole evacuation rank first,
    // then by composite score descending.
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
  canAbsorbTons:    number;
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