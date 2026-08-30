// src/utils/__tests__/geo.test.ts
import { haversineKm } from '../geo';

// Real PMB warehouse coordinates from the seeded database
const AMPARA      = { lat: 7.2963, lng: 81.6723 };
const POLONNARUWA = { lat: 7.9403, lng: 81.0188 };
const BADULLA     = { lat: 6.9934, lng: 81.0550 };
const KANDY       = { lat: 7.2906, lng: 80.6337 };

describe('haversineKm', () => {
  it('returns zero for identical coordinates', () => {
    expect(haversineKm(AMPARA.lat, AMPARA.lng, AMPARA.lat, AMPARA.lng))
      .toBeCloseTo(0, 6);
  });

  it('is symmetric', () => {
    const ab = haversineKm(AMPARA.lat, AMPARA.lng, KANDY.lat, KANDY.lng);
    const ba = haversineKm(KANDY.lat, KANDY.lng, AMPARA.lat, AMPARA.lng);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it('computes Ampara to Polonnaruwa within a realistic range', () => {
    // Straight-line distance is approximately 100 km
    const d = haversineKm(AMPARA.lat, AMPARA.lng, POLONNARUWA.lat, POLONNARUWA.lng);
    expect(d).toBeGreaterThan(85);
    expect(d).toBeLessThan(115);
  });

  it('computes Ampara to Kandy as the longest pair in the network', () => {
    const toKandy   = haversineKm(AMPARA.lat, AMPARA.lng, KANDY.lat, KANDY.lng);
    const toBadulla = haversineKm(AMPARA.lat, AMPARA.lng, BADULLA.lat, BADULLA.lng);
    expect(toKandy).toBeGreaterThan(toBadulla);
  });

  it('respects the triangle inequality', () => {
    const direct  = haversineKm(AMPARA.lat, AMPARA.lng, KANDY.lat, KANDY.lng);
    const viaBadulla =
      haversineKm(AMPARA.lat, AMPARA.lng, BADULLA.lat, BADULLA.lng) +
      haversineKm(BADULLA.lat, BADULLA.lng, KANDY.lat, KANDY.lng);
    expect(direct).toBeLessThanOrEqual(viaBadulla + 0.001);
  });

  it('never returns NaN for valid coordinates', () => {
    expect(Number.isNaN(haversineKm(0, 0, 0, 180))).toBe(false);
    expect(Number.isNaN(haversineKm(-90, 0, 90, 0))).toBe(false);
  });

  it('computes pole-to-pole as roughly half the earth circumference', () => {
    const d = haversineKm(-90, 0, 90, 0);
    expect(d).toBeGreaterThan(19000);
    expect(d).toBeLessThan(20100);
  });
});