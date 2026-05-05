import { z } from 'zod';
import { DisasterType, DisasterStatus } from '@prisma/client';

// ── Create Disaster Event ──────────────────────────────────────
export const createDisasterSchema = z.object({
  disasterType: z.nativeEnum(DisasterType, {
    errorMap: () => ({ message: 'Invalid disaster type. Must be FLOOD, CYCLONE, ELEPHANT_ATTACK, FIRE, or OTHER' }),
  }),
  affectedWarehouseId: z
    .string({ required_error: 'Affected warehouse ID is required' })
    .uuid('Invalid warehouse ID'),
  description: z.string().trim().optional(),
  estimatedLossTons: z
    .number({ invalid_type_error: 'Estimated loss must be a number' })
    .nonnegative('Estimated loss cannot be negative')
    .optional(),
  occurredAt: z
    .string({ required_error: 'occurredAt is required' })
    .datetime({ message: 'occurredAt must be a valid ISO 8601 datetime string' })
    .transform((v) => new Date(v)),
});

// ── Update Disaster Status ─────────────────────────────────────
export const updateDisasterStatusSchema = z.object({
  status: z.nativeEnum(DisasterStatus, {
    errorMap: () => ({ message: 'Invalid status. Must be OPEN, IN_PROGRESS, or RESOLVED' }),
  }),
  resolvedAt: z
    .string()
    .datetime({ message: 'resolvedAt must be a valid ISO 8601 datetime string' })
    .transform((v) => new Date(v))
    .optional(),
});

// ── Issue Redistribution Order ─────────────────────────────────
export const createRedistributionOrderSchema = z.object({
  sourceWarehouseId: z
    .string({ required_error: 'Source warehouse ID is required' })
    .uuid('Invalid source warehouse ID'),
  quantityTons: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .positive('Quantity must be greater than 0'),
});

// ── Query schemas ──────────────────────────────────────────────
export const disasterQuerySchema = z.object({
  status: z.nativeEnum(DisasterStatus).optional(),
  warehouseId: z.string().uuid().optional(),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Math.min(parseInt(v, 10), 100) : 20)),
});

export type CreateDisasterInput           = z.infer<typeof createDisasterSchema>;
export type UpdateDisasterStatusInput     = z.infer<typeof updateDisasterStatusSchema>;
export type CreateRedistributionInput     = z.infer<typeof createRedistributionOrderSchema>;
export type DisasterQueryInput            = z.infer<typeof disasterQuerySchema>;