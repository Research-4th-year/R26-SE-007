import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/errors';

// Like validate() but for req.query instead of req.body
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join('.') || 'root';
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      }
      sendError(res, 'Invalid query parameters', 400, errors);
      return;
    }

    // Attach parsed+transformed query to req for use in handlers
    (req as Request & { parsedQuery: unknown }).parsedQuery = result.data;
    next();
  };
}