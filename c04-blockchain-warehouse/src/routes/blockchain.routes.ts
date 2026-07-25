import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, allStaff, adminOrRM } from '../middleware/auth.middleware';
import { sendSuccess, AppError } from '../utils/errors';
import * as fabricService from '../services/fabric.service';
import { prisma } from '../config/prisma';

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

      // Try ledger — gracefully handle events not yet anchored
      let ledgerRecord = null;
      let blockchainAnchored = !!dbRecord.blockchainTxId;
      let hashMatch = false;

      if (blockchainAnchored) {
        try {
          ledgerRecord = await fabricService.queryStockEvent(req.params.eventId);
          hashMatch = dbRecord.documentHash === (ledgerRecord as any).documentHash;
        } catch {
          // Event has a txId in DB but isn't found on ledger
          // This can happen after network restart — ledger was wiped
          blockchainAnchored = false;
        }
      }

      sendSuccess(res, {
        ledger:   ledgerRecord,
        database: dbRecord,
        integrity: {
          hashMatch,
          blockchainAnchored,
          message: !blockchainAnchored
            ? 'Event not yet anchored on blockchain'
            : hashMatch
            ? 'Document hash matches ledger record → data integrity confirmed'
            : 'WARNING: Document hash mismatch → possible tampering detected',
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

      const ledgerHistory = await fabricService.queryWarehouseHistory(req.params.warehouseId);

      sendSuccess(res, {
        warehouse,
        totalOnChain: Array.isArray(ledgerHistory) ? ledgerHistory.length : 0,
        events:       ledgerHistory,
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

      // Try ledger — gracefully handle records not found (e.g. after network restart)
      let ledgerRecord = null;
      let blockchainAnchored = !!dbRecord.blockchainTxId;

      if (blockchainAnchored) {
        try {
          ledgerRecord = await fabricService.queryDisasterEvent(req.params.disasterId);
        } catch {
          blockchainAnchored = false;
        }
      }

      sendSuccess(res, {
        ledger:   ledgerRecord,
        database: dbRecord,
        integrity: {
          blockchainAnchored,
          mspId: blockchainAnchored ? (ledgerRecord as any)?.reportedByMsp : null,
          message: !blockchainAnchored
            ? 'Event not yet anchored on blockchain'
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

      // Pull full audit trail from ledger
      const ledgerAudit = await fabricService.queryDisasterAuditTrail(req.params.disasterId);

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
          blockchainAnchored: !!dbDisaster.blockchainTxId,
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

      let ledgerRecord = null;
      let blockchainAnchored = !!dbRecord.blockchainTxId;

      if (blockchainAnchored) {
        try {
          ledgerRecord = await fabricService.queryRedistributionOrder(req.params.orderId);
        } catch {
          blockchainAnchored = false;
        }
      }

      sendSuccess(res, {
        ledger:   ledgerRecord,
        database: dbRecord,
        integrity: {
          blockchainAnchored,
          rmSignature: blockchainAnchored ? (ledgerRecord as any)?.rmSignature : null,
          issuedByMsp: blockchainAnchored ? (ledgerRecord as any)?.issuedByMsp : null,
          message: !blockchainAnchored
            ? 'Order not yet anchored on blockchain'
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
 * Admin / RM — check if the Fabric network is reachable.
 */
router.get(
  '/status',
  allStaff,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Count anchored records in DB
      const [stockEvents, disasters, orders] = await Promise.all([
        prisma.stockEvent.count({ where: { blockchainTxId: { not: null } } }),
        prisma.disasterEvent.count({ where: { blockchainTxId: { not: null } } }),
        prisma.redistributionOrder.count({ where: { blockchainTxId: { not: null } } }),
      ]);

      sendSuccess(res, {
        network:  'warehousechannel',
        chaincode: 'warehousecc',
        status:   'connected',
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