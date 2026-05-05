import { Response } from 'express';
import { ApiResponse } from '../types';
 
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
 
  static badRequest(message: string, errors?: Record<string, string[]>) {
    return new AppError(message, 400, errors);
  }
  static unauthorized(message = 'Unauthorized') { return new AppError(message, 401); }
  static forbidden(message = 'Forbidden') { return new AppError(message, 403); }
  static notFound(message = 'Resource not found') { return new AppError(message, 404); }
  static conflict(message: string) { return new AppError(message, 409); }
  static internal(message = 'Internal server error') { return new AppError(message, 500); }
}
 
export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): Response {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(statusCode).json(body);
}
 
export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201);
}
 
export function sendError(res: Response, message: string, statusCode = 500, errors?: Record<string, string[]>): Response {
  const body: ApiResponse = { success: false, message, errors };
  return res.status(statusCode).json(body);
}
