import { Router, Request, Response, NextFunction } from 'express';
import { gnnService } from '../services/gnn.service';
import { authenticate, adminOrRM, allStaff } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/errors';

const router = Router();

router.use(authenticate);

/**
 * GET /api/scores
 * All staff — get latest GNN reliability scores for all warehouses
 */
router.get(
  '/',
  allStaff,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const scores = await gnnService.getAllLatestScores();
      sendSuccess(res, scores);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/scores/refresh
 * Admin / RM — trigger a fresh GNN inference run
 */
router.post(
  '/refresh',
  adminOrRM,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const scores = await gnnService.refreshScores();
      sendSuccess(res, { count: scores.length, scores }, 'Scores refreshed successfully');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/scores/:warehouseId
 * All staff — get latest score for a specific warehouse
 */
router.get(
  '/:warehouseId',
  allStaff,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const score = await gnnService.getLatestScore(req.params.warehouseId);
      if (!score) {
        sendSuccess(res, null, 'No score computed yet for this warehouse');
        return;
      }
      sendSuccess(res, score);
    } catch (err) {
      next(err);
    }
  }
);

export default router;