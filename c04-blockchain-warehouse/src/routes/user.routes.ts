import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { authenticate, adminOnly } from '../middleware/auth.middleware';
import { sendSuccess, AppError } from '../utils/errors';
import { z } from 'zod';
import { validate } from '../middleware/validate.middleware';

const router = Router();
router.use(authenticate, adminOnly);

const updateUserSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID').nullable().optional(),
  isActive:    z.boolean().optional(),
  fullName:    z.string().min(2).trim().optional(),
});

// GET /api/users — list all users
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, fullName: true,
        role: true, isActive: true, warehouseId: true,
        createdAt: true,
        warehouse: { select: { id: true, name: true, code: true, district: true } },
      },
    });
    sendSuccess(res, users);
  } catch (err) { next(err); }
});

// PATCH /api/users/:id — update user (reassign warehouse, deactivate, rename)
router.patch('/:id', validate(updateUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw AppError.notFound('User not found');

    // Validate warehouse exists if provided
    if (req.body.warehouseId) {
      const wh = await prisma.warehouse.findUnique({ where: { id: req.body.warehouseId } });
      if (!wh) throw AppError.badRequest('Warehouse not found', { warehouseId: ['Warehouse does not exist'] });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data:  req.body,
      select: {
        id: true, email: true, fullName: true,
        role: true, isActive: true, warehouseId: true,
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });
    sendSuccess(res, updated, 'User updated successfully');
  } catch (err) { next(err); }
});

export default router;