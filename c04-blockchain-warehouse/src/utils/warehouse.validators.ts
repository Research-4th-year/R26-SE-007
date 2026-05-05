import { z } from 'zod';
import { StockEventType } from '@prisma/client';

// ── Create Warehouse ───────────────────────────────────────────
export const createWarehouseSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(3, 'Name must be at least 3 characters')
    .trim(),
  code: z
    .string({ required_error: 'Code is required' })
    .min(2, 'Code must be at least 2 characters')
    .toUpperCase()
    .trim(),
  district: z
    .string({ required_error: 'District is required' })
    .min(2, 'District must be at least 2 characters')
    .trim(),
  address: z.string().trim().optional(),
  latitude: z
    .number({ required_error: 'Latitude is required', invalid_type_error: 'Latitude must be a number' })
    .min(-90).max(90),
  longitude: z
    .number({ required_error: 'Longitude is required', invalid_type_error: 'Longitude must be a number' })
    .min(-180).max(180),
  capacityTons: z
    .number({ required_error: 'Capacity is required', invalid_type_error: 'Capacity must be a number' })
    .positive('Capacity must be greater than 0'),
});

// ── Update Warehouse ───────────────────────────────────────────
export const updateWarehouseSchema = z.object({
  name: z.string().min(3).trim().optional(),
  district: z.string().min(2).trim().optional(),
  address: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacityTons: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

// ── Stock Event ────────────────────────────────────────────────
export const createStockEventSchema = z.object({
  eventType: z.nativeEnum(StockEventType, {
    errorMap: () => ({ message: 'Invalid event type. Must be INFLOW, OUTFLOW, REDISTRIBUTION, DAMAGE, or ADJUSTMENT' }),
  }),
  quantityTons: z
    .number({ required_error: 'Quantity is required', invalid_type_error: 'Quantity must be a number' })
    .positive('Quantity must be greater than 0'),
  notes: z.string().trim().optional(),
  // warehouseId for REDISTRIBUTION source tracking
  sourceWarehouseId: z.string().uuid('Invalid source warehouse ID').optional(),
});

// ── Pagination + filters ───────────────────────────────────────
export const warehouseQuerySchema = z.object({
  district: z.string().trim().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
});

export const stockEventQuerySchema = z.object({
  eventType: z.nativeEnum(StockEventType).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 20)),
});

export type CreateWarehouseInput  = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput  = z.infer<typeof updateWarehouseSchema>;
export type CreateStockEventInput = z.infer<typeof createStockEventSchema>;
export type WarehouseQueryInput   = z.infer<typeof warehouseQuerySchema>;
export type StockEventQueryInput  = z.infer<typeof stockEventQuerySchema>;