import axios from 'axios';
import { prisma } from '../config/prisma';
import { config } from '../config/env';

interface GNNScore {
  warehouseId:      string;
  reliabilityScore: number;
  anomalyFlags:     string[];
  isAnomalous:      boolean;
}

export class GNNService {

  // ── Fetch scores from Python service and persist to MySQL ─────
  async refreshScores(): Promise<GNNScore[]> {
    try {
      const response = await axios.get(`${config.gnn.serviceUrl}/score`, {
        timeout: 30000,
      });

      const scores: GNNScore[] = response.data.scores;

      // Persist each score to warehouse_scores table
      await Promise.all(
        scores.map((s) =>
          prisma.warehouseScore.create({
            data: {
              warehouseId:      s.warehouseId,
              reliabilityScore: s.reliabilityScore,
              anomalyFlags:     s.anomalyFlags,
            },
          })
        )
      );

      console.log(`[GNN] Scores refreshed for ${scores.length} warehouses`);
      return scores;
    } catch (err: any) {
      console.error('[GNN] Failed to fetch scores:', err?.message);
      throw err;
    }
  }

  // ── Get latest score for a single warehouse ───────────────────
  async getLatestScore(warehouseId: string): Promise<GNNScore | null> {
    const record = await prisma.warehouseScore.findFirst({
      where:   { warehouseId },
      orderBy: { computedAt: 'desc' },
    });

    if (!record) return null;

    return {
      warehouseId:      record.warehouseId,
      reliabilityScore: record.reliabilityScore,
      anomalyFlags:     (record.anomalyFlags as string[]) ?? [],
      isAnomalous:      record.reliabilityScore < 0.4,
    };
  }

  // ── Get latest scores for all warehouses ─────────────────────
  async getAllLatestScores(): Promise<Record<string, GNNScore>> {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const scores: Record<string, GNNScore> = {};

    await Promise.all(
      warehouses.map(async (wh) => {
        const score = await this.getLatestScore(wh.id);
        if (score) scores[wh.id] = score;
      })
    );

    return scores;
  }
}

export const gnnService = new GNNService();