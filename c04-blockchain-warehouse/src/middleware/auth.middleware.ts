import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { Role } from '@prisma/client';
 
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('No token provided');
    }
    const token = authHeader.split(' ')[1];
    if (!token) throw AppError.unauthorized('Malformed authorization header');
    req.user = verifyAccessToken(token);
    next();
  } catch (err: unknown) {
    if (err instanceof AppError) { next(err); return; }
    const message = err instanceof Error ? err.message : 'Invalid token';
    if (message === 'jwt expired') next(AppError.unauthorized('Token has expired'));
    else if (message === 'invalid signature') next(AppError.unauthorized('Invalid token signature'));
    else next(AppError.unauthorized('Invalid token'));
  }
}
 
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) { next(AppError.unauthorized()); return; }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden(`Access denied. Required: ${roles.join(', ')}. Your role: ${req.user.role}`));
      return;
    }
    next();
  };
}
 
export const adminOnly       = authorize(Role.ADMIN);
export const rmOnly          = authorize(Role.REGIONAL_MANAGER);
export const supervisorOnly  = authorize(Role.WAREHOUSE_SUPERVISOR);
export const auditorOnly     = authorize(Role.AUDITOR);
export const adminOrRM       = authorize(Role.ADMIN, Role.REGIONAL_MANAGER);
export const rmOrSupervisor  = authorize(Role.REGIONAL_MANAGER, Role.WAREHOUSE_SUPERVISOR);
export const allStaff        = authorize(Role.ADMIN, Role.REGIONAL_MANAGER, Role.WAREHOUSE_SUPERVISOR, Role.AUDITOR);
 
export function ownWarehouseOrRM(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) { next(AppError.unauthorized()); return; }
  const { role, warehouseId: userWarehouseId } = req.user;
  if (role === Role.ADMIN || role === Role.REGIONAL_MANAGER) { next(); return; }
  const requestedWarehouseId = req.params.warehouseId || req.body.warehouseId;
  if (!requestedWarehouseId) { next(AppError.badRequest('warehouseId is required')); return; }
  if (userWarehouseId !== requestedWarehouseId) {
    next(AppError.forbidden('You can only perform this action for your own warehouse'));
    return;
  }
  next();
}
