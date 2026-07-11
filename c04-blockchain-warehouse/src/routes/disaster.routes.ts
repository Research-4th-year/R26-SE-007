import { Router, Request, Response, NextFunction } from 'express';
import { disasterService } from '../services/disaster.service';
import { authenticate, adminOrRM, allStaff } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { validateQuery } from '../middleware/validateQuery.middleware';
import {
  createDisasterSchema,
  updateDisasterStatusSchema,
  createRedistributionOrderSchema,
  disasterQuerySchema,
} from '../utils/disaster.validators';
import { sendSuccess, sendCreated } from '../utils/errors';

const router = Router();

// All disaster routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// Disaster Events
// ─────────────────────────────────────────────

/**
 * POST /api/disasters
 * RM / Admin — report a new disaster event on a warehouse
 * Body: { disasterType, affectedWarehouseId, description?, estimatedLossTons?, occurredAt }
 */
router.post(
  '/',
  adminOrRM,
  validate(createDisasterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const disaster = await disasterService.createDisaster(req.body, req.user!);
      sendCreated(res, disaster, 'Disaster event recorded successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/disasters
 * All staff — paginated list of disaster events
 * Query: status?, warehouseId?, page?, limit?
 */
router.get(
  '/',
  allStaff,
  validateQuery(disasterQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as Request & { parsedQuery: any }).parsedQuery;
      const result = await disasterService.listDisasters(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/disasters/:disasterId
 * All staff — full disaster detail with ranked candidate warehouses
 */
router.get(
  '/:disasterId',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const disaster = await disasterService.getDisaster(req.params.disasterId);
      sendSuccess(res, disaster);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/disasters/:disasterId/status
 * RM / Admin — update disaster status
 * Body: { status, resolvedAt? }
 * Transitions: OPEN → IN_PROGRESS → RESOLVED
 */
router.patch(
  '/:disasterId/status',
  adminOrRM,
  validate(updateDisasterStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const disaster = await disasterService.updateDisasterStatus(
        req.params.disasterId,
        req.body,
        req.user!
      );
      sendSuccess(res, disaster, 'Disaster status updated');
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Redistribution Orders
// ─────────────────────────────────────────────

/**
 * POST /api/disasters/:disasterId/redistribute
 * RM / Admin — issue a redistribution order to a candidate warehouse
 * Body: { sourceWarehouseId, quantityTons }
 * Auto-advances disaster to IN_PROGRESS if still OPEN
 */
router.post(
  '/:disasterId/redistribute',
  adminOrRM,
  validate(createRedistributionOrderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await disasterService.createRedistributionOrder(
        req.params.disasterId,
        req.body,
        req.user!
      );
      sendCreated(res, order, 'Redistribution order issued successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/disasters/:disasterId/orders
 * All staff — list all redistribution orders for a disaster
 */
router.get(
  '/:disasterId/orders',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await disasterService.listRedistributionOrders(req.params.disasterId);
      sendSuccess(res, orders);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/disasters/:disasterId/audit
 * All staff — full chronological audit trail
 * Returns timeline of: disaster reported → ZKP proofs → redistribution orders → resolved
 * blockchainTxId fields will be populated in Phase 4
 */
router.get(
  '/:disasterId/audit',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trail = await disasterService.getAuditTrail(req.params.disasterId);
      sendSuccess(res, trail);
    } catch (err) {
      next(err);
    }
  }
);

export default router;