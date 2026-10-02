export type PaddyType =
  | "nadu"
  | "samba"
  | "keeri samba";

export type PaddySeason =
  | "maha"
  | "yala";

export interface BilingualRecommendation {
  english: string;
  sinhala: string;
}

export interface CreateHarvestRequest {
  paddyType: PaddyType;
  season: PaddySeason;
  quantity: number;
  expectedPrice: number;
  minimumAcceptablePrice: number;
}

export interface Harvest {
  _id: string;
  farmerId: string;

  paddyType: string;
  season: string;
  quantity: number;
  expectedPrice: number;

  aiPredictedPrice: number;
  priceDifference: number;
  priceLevel: string;

  harvestScore: number;
  marketStatus: string;
  recommendedAction: string;

  recommendation: BilingualRecommendation;

  status:
    | "available"
    | "matched"
    | "agreement_reached"
    | "sold"
    | "cancelled";

  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface PriceDecision {
  level: string;
  recommendedAction: string;
  signedDifference: number;
  absoluteDifference: number;
  english: string;
  sinhala: string;
}

export interface HarvestIntelligenceBreakdown {
  priceCompatibility: number;
  quantityCompatibility: number;
  paddyDemand: number;
  districtDemand: number;
}

export interface HarvestIntelligence {
  score: number;
  scoreOutOf: number;
  breakdown: HarvestIntelligenceBreakdown;
  marketStatus: string;
}

export interface DemandSummary {
  matchingPaddyDemands: number;
  quantityCompatibleDemands: number;
  sameDistrictDemands: number;
}

export interface MarketRecommendation {
  action: string;
  english: string;
  sinhala: string;
}

export interface CreateHarvestData {
  harvest: Harvest;
  aiSuggestedPrice: number;
  priceDecision: PriceDecision;
  harvestIntelligence: HarvestIntelligence;
  demandSummary: DemandSummary;
  marketRecommendation: MarketRecommendation;
}

export interface CreateHarvestResponse {
  success: boolean;
  message?: string;
  data: CreateHarvestData;
}

export interface GetHarvestsResponse {
  success: boolean;
  count: number;
  data: Harvest[];
}

export interface MarkHarvestSoldResponse {
  success: boolean;
  message?: string;
  data: Harvest;
}