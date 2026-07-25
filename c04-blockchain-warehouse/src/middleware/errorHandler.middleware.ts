import { Request, Response, NextFunction } from 'express';
import { AppError, sendError } from '../utils/errors';
import { config } from '../config/env';
 
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }
 
  // Prisma unique constraint
  const prismaErr = err as { code?: string; meta?: { target?: string[] } };
  if (prismaErr.code === 'P2002') {
    const field = prismaErr.meta?.target?.[0] || 'field';
    sendError(res, `A record with this ${field} already exists`, 409);
    return;
  }
  if (prismaErr.code === 'P2025') {
    sendError(res, 'Record not found', 404);
    return;
  }
 
  console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
  sendError(res, config.server.isDev ? err.message : 'An unexpected error occurred', 500);
}
 
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Route not found: ${req.method} ${req.path}`, 404);
}
