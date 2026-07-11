import { Router, Request, Response, NextFunction } from 'express';
import { warehouseService } from '../services/warehouse.service';
import { authenticate, adminOnly, adminOrRM, allStaff, ownWarehouseOrRM } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { validateQuery } from '../middleware/validateQuery.middleware';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  createStockEventSchema,
  warehouseQuerySchema,
  stockEventQuerySchema,
} from '../utils/warehouse.validators';
import { sendSuccess, sendCreated } from '../utils/errors';

const router = Router();

// All warehouse routes require authentication
router.use(authenticate);

// ─────────────────────────────────────────────
// Network Summary
// ─────────────────────────────────────────────

/**
 * GET /api/warehouses/summary
 * All staff — network-wide totals for the RM dashboard header
 */
router.get(
  '/summary',
  allStaff,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await warehouseService.getNetworkSummary();
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Warehouse CRUD
// ─────────────────────────────────────────────

/**
 * GET /api/warehouses
 * All staff — paginated list with stock levels + GNN scores
 * Query params: district, isActive, page, limit
 */
router.get(
  '/',
  allStaff,
  validateQuery(warehouseQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as Request & { parsedQuery: any }).parsedQuery;
      const result = await warehouseService.listWarehouses(query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/warehouses/:warehouseId
 * All staff — full warehouse detail with supervisors, score history
 */
router.get(
  '/:warehouseId',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const warehouse = await warehouseService.getWarehouse(req.params.warehouseId);
      sendSuccess(res, warehouse);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/warehouses
 * Admin only — create a new warehouse
 */
router.post(
  '/',
  adminOnly,
  validate(createWarehouseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const warehouse = await warehouseService.createWarehouse(req.body);
      sendCreated(res, warehouse, 'Warehouse created successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/warehouses/:warehouseId
 * Admin only — update warehouse details
 */
router.put(
  '/:warehouseId',
  adminOnly,
  validate(updateWarehouseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const warehouse = await warehouseService.updateWarehouse(req.params.warehouseId, req.body);
      sendSuccess(res, warehouse, 'Warehouse updated successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/warehouses/:warehouseId
 * Admin only — soft delete (sets isActive = false)
 */
router.delete(
  '/:warehouseId',
  adminOnly,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await warehouseService.deactivateWarehouse(req.params.warehouseId);
      sendSuccess(res, null, 'Warehouse deactivated successfully');
    } catch (err) {
      next(err);
    }
  }
);

// ─────────────────────────────────────────────
// Stock Events
// ─────────────────────────────────────────────

/**
 * POST /api/warehouses/:warehouseId/stock-events
 * Supervisor (own warehouse) or RM/Admin
 * Body: { eventType, quantityTons, notes? }
 */
router.post(
  '/:warehouseId/stock-events',
  ownWarehouseOrRM,
  validate(createStockEventSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await warehouseService.createStockEvent(
        req.params.warehouseId,
        req.body,
        req.user!
      );
      sendCreated(res, result, 'Stock event recorded successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/warehouses/:warehouseId/stock-events
 * All staff — paginated event history
 * Query params: eventType, page, limit
 */
router.get(
  '/:warehouseId/stock-events',
  allStaff,
  validateQuery(stockEventQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = (req as Request & { parsedQuery: any }).parsedQuery;
      const result = await warehouseService.listStockEvents(req.params.warehouseId, query);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;