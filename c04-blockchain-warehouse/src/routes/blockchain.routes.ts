import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, allStaff } from '../middleware/auth.middleware';
import { sendSuccess, AppError } from '../utils/errors';
import * as fabricService from '../services/fabric.service';
import { config } from '../config/env';
import { prisma } from '../config/prisma';
import { computeStockEventHash } from '../utils/eventHash';

const router = Router();

router.use(authenticate);

// ─────────────────────────────────────────────
// Stock Event queries
// ─────────────────────────────────────────────

/**
 * GET /api/blockchain/stock-events/:eventId
 * All staff — fetch a single stock event directly from the ledger.
 * Use this to prove the MySQL record matches what's on-chain.
 */
router.get(
  '/stock-events/:eventId',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dbRecord = await prisma.stockEvent.findUnique({
        where:   { id: req.params.eventId },
        include: {
          warehouse:  { select: { id: true, name: true, code: true } },
          reportedBy: { select: { id: true, fullName: true, role: true } },
        },
      });

      if (!dbRecord) throw AppError.notFound('Stock event not found in database');

      // Recompute from the stored row. This is what detects direct
      // modification of event data in MySQL — the stored hash alone
      // proves nothing, since an attacker editing the row could edit it too.
      const recomputedHash = computeStockEventHash({
        warehouseId:  dbRecord.warehouseId,
        eventType:    dbRecord.eventType,
        quantityTons: dbRecord.quantityTons,
        reportedById: dbRecord.reportedById,
        timestamp:    dbRecord.timestamp,
      });
      const databaseIntact = recomputedHash === dbRecord.documentHash;

      const anchoredInDb = !!dbRecord.blockchainTxId;

      let ledgerRecord    = null;
      let ledgerAvailable = config.fabric.enabled;
      let ledgerMatch     = false;

      if (anchoredInDb && config.fabric.enabled) {
        try {
          ledgerRecord = await fabricService.queryStockEvent(req.params.eventId);
          ledgerMatch  = dbRecord.documentHash === (ledgerRecord as any).documentHash;
        } catch {
          ledgerAvailable = false;
        }
      }

      sendSuccess(res, {
        ledger:   ledgerRecord,
        database: dbRecord,
        integrity: {
          databaseIntact,
          ledgerMatch,
          anchoredInDb,
          ledgerAvailable,
          recomputedHash,
          storedHash: dbRecord.documentHash,
          message: !databaseIntact
            ? 'WARNING: Recomputed hash does not match stored hash — event data was modified in the database'
            : !anchoredInDb
            ? 'Event data intact, but not anchored on the ledger'
            : !ledgerAvailable
            ? 'Event data intact; ledger unreachable so the anchor could not be confirmed'
            : ledgerMatch
            ? 'Event data intact and matches ledger record — integrity confirmed'
            : 'WARNING: Stored hash differs from ledger — the hash column was modified',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/blockchain/warehouses/:warehouseId/history
 * All staff — full on-chain event history for a warehouse.
 * Returns every stock event ever recorded on the ledger for this warehouse.
 */
router.get(
  '/warehouses/:warehouseId/history',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const warehouse = await prisma.warehouse.findUnique({
        where:  { id: req.params.warehouseId },
        select: { id: true, name: true, code: true, district: true },
      });

      if (!warehouse) throw AppError.notFound('Warehouse not found');

      let ledgerHistory: any[] = [];
      let ledgerAvailable = config.fabric.enabled;

      if (config.fabric.enabled) {
        try {
          const result = await fabricService.queryWarehouseHistory(req.params.warehouseId);
          ledgerHistory = Array.isArray(result) ? result : [];
        } catch {
          ledgerAvailable = false;
        }
      }

      sendSuccess(res, {
        warehouse,
        ledgerAvailable,
        totalOnChain: ledgerHistory.length,
        events:       ledgerHistory,
        message: ledgerAvailable
          ? undefined
          : 'Ledger unavailable — on-chain history cannot be retrieved',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Disaster event queries
// ─────────────────────────────────────────────

/**
 * GET /api/blockchain/disasters/:disasterId
 * All staff — fetch a disaster event from the ledger.
 */
router.get(
  '/disasters/:disasterId',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dbRecord = await prisma.disasterEvent.findUnique({
        where:   { id: req.params.disasterId },
        include: {
          affectedWarehouse: { select: { id: true, name: true, code: true } },
          reportedBy:        { select: { id: true, fullName: true, role: true } },
        },
      });

      if (!dbRecord) throw AppError.notFound('Disaster event not found in database');

      const anchoredInDb = !!dbRecord.blockchainTxId;

      let ledgerRecord    = null;
      let ledgerAvailable = config.fabric.enabled;

      if (anchoredInDb && config.fabric.enabled) {
        try {
          ledgerRecord = await fabricService.queryDisasterEvent(req.params.disasterId);
        } catch {
          ledgerAvailable = false;
        }
      }

      sendSuccess(res, {
        ledger:   ledgerRecord,
        database: dbRecord,
        integrity: {
          anchoredInDb,
          ledgerAvailable,
          mspId: ledgerRecord ? (ledgerRecord as any)?.reportedByMsp : null,
          message: !anchoredInDb
            ? 'Event not anchored on the ledger'
            : !ledgerAvailable
            ? 'Event is marked as anchored, but the ledger could not be reached to verify it'
            : 'Disaster event confirmed on ledger',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/blockchain/disasters/:disasterId/audit
 * All staff — complete on-chain audit trail for a disaster.
 * Returns disaster event + all redistribution orders + all ZKP proofs
 * exactly as they are stored on the immutable ledger.
 */
router.get(
  '/disasters/:disasterId/audit',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify disaster exists in DB first
      const dbDisaster = await prisma.disasterEvent.findUnique({
        where:   { id: req.params.disasterId },
        include: {
          affectedWarehouse:    { select: { id: true, name: true, code: true, district: true } },
          reportedBy:           { select: { id: true, fullName: true, role: true } },
          redistributionOrders: {
            include: {
              sourceWarehouse:      { select: { id: true, name: true, code: true } },
              destinationWarehouse: { select: { id: true, name: true, code: true } },
              issuedBy:             { select: { id: true, fullName: true } },
            },
          },
        },
      });

      if (!dbDisaster) throw AppError.notFound('Disaster event not found');

      // Pull the full audit trail from the ledger, degrading gracefully
      // when the ledger is disabled or unreachable.
      let ledgerAudit: any = null;
      let ledgerAvailable  = config.fabric.enabled;

      if (config.fabric.enabled) {
        try {
          ledgerAudit = await fabricService.queryDisasterAuditTrail(req.params.disasterId);
        } catch {
          ledgerAvailable = false;
        }
      }

      // Build combined response — DB for rich relational data,
      // ledger for tamper-proof proof of what happened
      sendSuccess(res, {
        summary: {
          disasterId:                req.params.disasterId,
          disasterType:              dbDisaster.disasterType,
          status:                    dbDisaster.status,
          affectedWarehouse:         dbDisaster.affectedWarehouse,
          occurredAt:                dbDisaster.occurredAt,
          resolvedAt:                dbDisaster.resolvedAt,
          totalRedistributionOrders: dbDisaster.redistributionOrders.length,
          totalQuantityRedistributed: dbDisaster.redistributionOrders.reduce(
            (sum, o) => sum + o.quantityTons, 0
          ),
          anchoredInDb:    !!dbDisaster.blockchainTxId,
          ledgerAvailable,
        },
        ledger:   ledgerAudit,
        database: {
          reportedBy:           dbDisaster.reportedBy,
          redistributionOrders: dbDisaster.redistributionOrders,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Redistribution order queries
// ─────────────────────────────────────────────

/**
 * GET /api/blockchain/orders/:orderId
 * All staff — fetch a redistribution order from the ledger.
 * Includes the rmSignature for cryptographic verification.
 */
router.get(
  '/orders/:orderId',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dbRecord = await prisma.redistributionOrder.findUnique({
        where:   { id: req.params.orderId },
        include: {
          sourceWarehouse:      { select: { id: true, name: true, code: true } },
          destinationWarehouse: { select: { id: true, name: true, code: true } },
          issuedBy:             { select: { id: true, fullName: true, role: true } },
          disasterEvent:        { select: { id: true, disasterType: true, status: true } },
        },
      });

      if (!dbRecord) throw AppError.notFound('Redistribution order not found in database');

      const anchoredInDb = !!dbRecord.blockchainTxId;

      let ledgerRecord    = null;
      let ledgerAvailable = config.fabric.enabled;

      if (anchoredInDb && config.fabric.enabled) {
        try {
          ledgerRecord = await fabricService.queryRedistributionOrder(req.params.orderId);
        } catch {
          ledgerAvailable = false;
        }
      }

      sendSuccess(res, {
        ledger:   ledgerRecord,
        database: dbRecord,
        integrity: {
          anchoredInDb,
          ledgerAvailable,
          rmSignature: ledgerRecord ? (ledgerRecord as any)?.rmSignature : null,
          issuedByMsp: ledgerRecord ? (ledgerRecord as any)?.issuedByMsp : null,
          message: !anchoredInDb
            ? 'Order not anchored on the ledger'
            : !ledgerAvailable
            ? 'Order is marked as anchored, but the ledger could not be reached to verify it'
            : 'Redistribution order confirmed on ledger',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Network status
// ─────────────────────────────────────────────

/**
 * GET /api/blockchain/status
 * All staff — report ledger configuration and anchoring counts.
 *
 * Note: the counts come from the application database, not the ledger.
 * They record how many entities were successfully anchored at write time.
 */
router.get(
  '/status',
  allStaff,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [stockEvents, disasters, orders] = await Promise.all([
        prisma.stockEvent.count({ where: { blockchainTxId: { not: null } } }),
        prisma.disasterEvent.count({ where: { blockchainTxId: { not: null } } }),
        prisma.redistributionOrder.count({ where: { blockchainTxId: { not: null } } }),
      ]);

      sendSuccess(res, {
        network:   config.fabric.channelName,
        chaincode: config.fabric.chaincodeName,
        status:    config.fabric.enabled ? 'enabled' : 'ledger_disabled',
        anchored: {
          stockEvents,
          disasters,
          redistributionOrders: orders,
          total: stockEvents + disasters + orders,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;