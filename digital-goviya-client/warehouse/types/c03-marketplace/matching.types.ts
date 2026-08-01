import type {
  Harvest,
} from "@/types/c03-marketplace/harvest.types";

import type {
  MillerDemand,
} from "@/types/c03-marketplace/demand.types";

export type MatchPriority =
  | "HIGHLY_RECOMMENDED"
  | "RECOMMENDED"
  | "MODERATE_MATCH";

export interface BilingualText {
  english: string;
  sinhala: string;
}

export interface MatchingConfidence {
  level: "HIGH" | "MEDIUM" | "LOW";
  english: string;
  sinhala: string;
}

export interface MatchScoreBreakdown {
  location: number;
  paddyType: number;
  priceCompatibility: number;
  quantityCompatibility: number;
}

export interface MatchPriceAnalysis {
  aiPredictedPrice: number;
  millerOfferedPrice: number;
  absoluteDifference: number;
}

export interface MillerSummary {
  _id: string;
  name: string;
  millName: string;
  district: string;
  location: string;
}

export interface HarvestMatch {
  demand: MillerDemand;
  miller: MillerSummary;

  score: number;
  maximumScore: number;
  matchingPercentage: number;

  priority: MatchPriority;
  confidence: MatchingConfidence;

  scoreBreakdown: MatchScoreBreakdown;
  priceAnalysis: MatchPriceAnalysis;

  reasons: BilingualText[];
  recommendation: BilingualText;
}

export interface MatchingResponse {
  success: boolean;

  data: {
    harvest: Harvest;

    farmer: {
      id: string;
      farmerName: string;
      district: string;
      location: string;
    };

    totalOpenMatchingDemands: number;
    matches: HarvestMatch[];
  };
}

export interface CreateSelectionsRequest {
  harvestId: string;
  demandIds: string[];
}

export interface MatchSelection {
  _id: string;
  harvestId: string | Harvest;
  farmerId: string | FarmerSummary;
  millerId: string | MillerSummary;
  demandId: string | MillerDemand;
  matchingScore: number;

  status:
    | "pending"
    | "negotiation_ready"
    | "rejected"
    | "cancelled";

  createdAt: string;
  updatedAt: string;
}

export interface CreateSelectionsResponse {
  success: boolean;
  message: string;

  data: {
    harvestId: string;
    createdCount: number;
    skippedCount: number;
    selections: MatchSelection[];
    skippedSelections: Array<{
      demandId: string;
      reason: string;
    }>;
  };
}

export interface GetSelectionsResponse {
  success: boolean;
  count: number;
  data: MatchSelection[];
}

export interface FarmerSummary {
  _id: string;
  farmerName: string;
  district: string;
  location: string;
}