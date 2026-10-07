import { computeRankingScore } from '../geo';

describe('computeRankingScore', () => {
  describe('weight structure', () => {
    it('returns 1.0 when all normalised components are maximal', () => {
      // distanceKm 0 → distanceScore 1; fully empty warehouse; perfect reliability
      expect(computeRankingScore(0, 400, 400, 1)).toBeCloseTo(1.0, 6);
    });

    it('applies exactly the documented 0.40 / 0.35 / 0.25 weights', () => {
      const distanceOnly    = computeRankingScore(0, 0, 400, 0);
      const capacityOnly    = computeRankingScore(Infinity, 400, 400, 0);
      const reliabilityOnly = computeRankingScore(Infinity, 0, 400, 1);

      expect(distanceOnly).toBeCloseTo(0.40, 6);
      expect(capacityOnly).toBeCloseTo(0.35, 6);
      expect(reliabilityOnly).toBeCloseTo(0.25, 6);
    });

    it('produces scores bounded within [0, 1]', () => {
      expect(computeRankingScore(0, 400, 400, 1)).toBeLessThanOrEqual(1);
      expect(computeRankingScore(1000, 0, 400, 0)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('capacity handling', () => {
    it('guards against division by zero when capacity is zero', () => {
      const score = computeRankingScore(10, 0, 0, 0.9);
      expect(Number.isNaN(score)).toBe(false);
      expect(score).toBeCloseTo(0.40 * (1 / 11) + 0.25 * 0.9, 6);
    });

    it('ranks a warehouse with more free space higher, all else equal', () => {
      expect(computeRankingScore(50, 350, 400, 0.9))
        .toBeGreaterThan(computeRankingScore(50, 50, 400, 0.9));
    });

    it('scores a full warehouse on distance and reliability alone', () => {
      expect(computeRankingScore(50, 0, 400, 0.9))
        .toBeCloseTo(0.40 * (1 / 51) + 0.25 * 0.9, 6);
    });
  });

  describe('reliability handling', () => {
    it('defaults to a neutral 0.5 when no GNN score is supplied', () => {
      expect(computeRankingScore(50, 300, 400))
        .toBeCloseTo(computeRankingScore(50, 300, 400, 0.5), 6);
    });

    it('does not penalise an unscored warehouse as if it scored zero', () => {
      expect(computeRankingScore(50, 300, 400))
        .toBeGreaterThan(computeRankingScore(50, 300, 400, 0));
    });

    it('ranks a trusted warehouse above a suspicious one, all else equal', () => {
      expect(computeRankingScore(50, 300, 400, 0.95))
        .toBeGreaterThan(computeRankingScore(50, 300, 400, 0.20));
    });
  });

  describe('distance normalisation behaviour', () => {
    it('ranks a closer warehouse higher, all else equal', () => {
      expect(computeRankingScore(10, 300, 400, 0.9))
        .toBeGreaterThan(computeRankingScore(200, 300, 400, 0.9));
    });

    it('FINDING: 1/(1+d) saturates, so distance under-contributes at realistic ranges', () => {
      // Hyperbolic decay means the nominal 0.40 weight yields only ~0.01 of
      // separation across 30-150 km, the realistic range for the PMB network.
      // Rescaling against the candidate-set maximum is identified as future work.
      const at30km  = computeRankingScore(30,  300, 400, 0.9);
      const at150km = computeRankingScore(150, 300, 400, 0.9);
      expect(at30km - at150km).toBeLessThan(0.02);
    });

    it('FINDING: reliability outweighs distance in practice despite the lower weight', () => {
      const farTrusted  = computeRankingScore(150, 300, 400, 0.95);
      const nearSuspect = computeRankingScore(30,  300, 400, 0.20);
      expect(farTrusted).toBeGreaterThan(nearSuspect);
    });
  });

  describe('regression against observed production values', () => {
    it('reproduces a plausible composite score for KAN-01', () => {
      // ~66 km from Ampara, 100t free of 300t capacity, GNN reliability 0.9851
      const score = computeRankingScore(66, 100, 300, 0.9851);
      expect(score).toBeGreaterThan(0.35);
      expect(score).toBeLessThan(0.50);
    });
  });
});