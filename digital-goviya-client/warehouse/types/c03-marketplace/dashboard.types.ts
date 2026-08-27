import type {
  Harvest,
} from "@/types/c03-marketplace/harvest.types";

import type {
  MillerDemand,
} from "@/types/c03-marketplace/demand.types";

export interface FarmerDashboardSummary {
  totalHarvests: number;
  availableHarvests: number;
  matchedHarvests: number;
  soldHarvests: number;
  cancelledHarvests: number;

  pendingSelections: number;
  negotiationReadySelections: number;
  rejectedSelections: number;

  unreadNotifications: number;
}

export interface FarmerMarketAnalytics {
  totalQuantity: number;
  averageExpectedPrice: number;
  averageAiPredictedPrice: number;
  averageHarvestScore: number;
}

export interface FarmerDashboardData {
  farmer: {
    id: string;
    farmerName: string;
    district: string;
    location: string;
  };

  summary: FarmerDashboardSummary;
  marketAnalytics: FarmerMarketAnalytics;

  latestAiRecommendation: Harvest | null;
  recentHarvests: Harvest[];
  recentSelections: unknown[];
  recentNotifications: unknown[];
}

export interface FarmerDashboardResponse {
  success: boolean;
  data: FarmerDashboardData;
}

export interface MillerDashboardSummary {
  totalDemands: number;
  openDemands: number;
  closedDemands: number;

  pendingSelections: number;
  negotiationReadySelections: number;
  rejectedSelections: number;

  unreadNotifications: number;
}

export interface MillerMarketAnalytics {
  totalQuantityNeeded: number;
  averageOfferedPrice: number;
}

export interface MillerDashboardData {
  miller: {
    id: string;
    name: string;
    millName: string;
    district: string;
    location: string;
  };

  summary: MillerDashboardSummary;
  marketAnalytics: MillerMarketAnalytics;

  recommendedFarmerMatches: unknown[];
  recentDemands: MillerDemand[];
  recentSelections: unknown[];
  recentNotifications: unknown[];
}

export interface MillerDashboardResponse {
  success: boolean;
  data: MillerDashboardData;
}