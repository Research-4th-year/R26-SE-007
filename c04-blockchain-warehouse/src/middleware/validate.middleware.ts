import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/errors';
 
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || 'root';
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      }
      sendError(res, 'Validation failed', 400, errors);
      return;
    }
    req.body = result.data;
    next();
  };
}
