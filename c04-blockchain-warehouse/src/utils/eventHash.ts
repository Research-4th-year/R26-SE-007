import crypto from 'crypto';

/**
 * Canonical hash input for a stock event.
 *
 * Every field here is persisted to the database, so the digest can be
 * recomputed from the stored row at any time. That is what makes tamper
 * detection possible: if any field is modified directly in MySQL, the
 * recomputed hash will not match the stored one.
 *
 * The previous implementation hashed `new Date().toISOString()` taken at
 * hash time, which was never stored — making the digest unverifiable by
 * construction.
 *
 * Field order is fixed. Changing it invalidates every existing hash.
 */
export function computeStockEventHash(input: {
  warehouseId:  string;
  eventType:    string;
  quantityTons: number;
  reportedById: string;
  timestamp:    Date;
}): string {
  const canonical = JSON.stringify({
    warehouseId:  input.warehouseId,
    eventType:    input.eventType,
    quantityTons: input.quantityTons,
    reportedById: input.reportedById,
    timestamp:    input.timestamp.toISOString(),
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}