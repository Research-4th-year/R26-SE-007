import { z } from 'zod';

export const documentQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 20)),
});

export const linkDocumentSchema = z.object({
  documentHash: z
    .string({ required_error: 'documentHash is required' })
    .length(64, 'documentHash must be a 64-character SHA-256 hex string')
    .regex(/^[a-f0-9]{64}$/, 'documentHash must be a valid SHA-256 hex string'),
  stockEventId: z
    .string({ required_error: 'stockEventId is required' })
    .uuid('Invalid stockEventId'),
});

export type DocumentQueryInput  = z.infer<typeof documentQuerySchema>;
export type LinkDocumentInput   = z.infer<typeof linkDocumentSchema>;