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

export type MatchInitiator =
  | "farmer"
  | "miller";

export type MatchSelectionStatus =
  | "pending"
  | "negotiation_ready"
  | "rejected"
  | "cancelled";

export interface ExistingMatchRequest {
  status: MatchSelectionStatus;
  initiatedBy: MatchInitiator;
  selectionId: string;
}

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

export interface MatchQuantityAnalysis {
  harvestQuantity: number;
  demandQuantity: number;
  compatible: boolean;
}

export interface MillerSummary {
  _id: string;
  name: string;
  millName: string;
  district: string;
  location: string;
  businessRegistrationNumber?: string;
  purchasingCapacityKg?: number;
}

export interface FarmerSummary {
  _id: string;
  farmerName: string;
  district: string;
  location: string;
  farmName?: string;
  farmSizeAcres?: number;
  mainPaddyVariety?: string;
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
  quantityAnalysis?: MatchQuantityAnalysis;

  reasons: BilingualText[];
  recommendation: BilingualText;
  existingRequest?: ExistingMatchRequest | null;
}

export interface FarmerHarvestMatch {
  harvest: Harvest;
  farmer: FarmerSummary;

  score: number;
  maximumScore: number;
  matchingPercentage: number;

  priority: MatchPriority;
  confidence: MatchingConfidence;
  scoreBreakdown: MatchScoreBreakdown;
  priceAnalysis: MatchPriceAnalysis;
  quantityAnalysis: MatchQuantityAnalysis;

  reasons: BilingualText[];
  recommendation: BilingualText;
  existingRequest?: ExistingMatchRequest | null;
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

export interface MillerMatchingResponse {
  success: boolean;

  data: {
    demand: MillerDemand;

    miller: {
      id: string;
      name: string;
      millName: string;
      district: string;
      location: string;
    };

    totalAvailableMatchingHarvests: number;
    matches: FarmerHarvestMatch[];
  };
}

export interface CreateSelectionsRequest {
  harvestId: string;
  demandIds: string[];
}

export interface CreateMillerSelectionsRequest {
  demandId: string;
  harvestIds: string[];
}

export interface MatchSelection {
  _id: string;

  harvestId: string | Harvest;
  farmerId: string | FarmerSummary;
  millerId: string | MillerSummary;
  demandId: string | MillerDemand;

  matchingScore: number;
  initiatedBy: MatchInitiator;
  status: MatchSelectionStatus;

  initiatedAt?: string;
  respondedAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateSelectionsResponse {
  success: boolean;
  message: string;

  data: {
    harvestId?: string;
    demandId?: string;
    initiatedBy: MatchInitiator;

    createdCount: number;
    skippedCount: number;

    selections: MatchSelection[];

    skippedSelections: Array<{
      demandId?: string;
      harvestId?: string;
      reason: string;
    }>;
  };
}

export interface GetSelectionsResponse {
  success: boolean;
  count: number;
  data: MatchSelection[];
}

export interface RespondSelectionResponse {
  success: boolean;
  message: string;

  data: {
    selection: MatchSelection;
  };
}