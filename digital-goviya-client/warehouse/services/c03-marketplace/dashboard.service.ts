import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  FarmerDashboardResponse,
  MillerDashboardResponse,
} from "@/types/c03-marketplace/dashboard.types";

export const dashboardService = {
  async getFarmerDashboard():
    Promise<FarmerDashboardResponse> {
    const response =
      await marketplaceApiClient.get<FarmerDashboardResponse>(
        "/api/marketplace/api/dashboard/farmer"
      );

    return response.data;
  },

  async getMillerDashboard():
    Promise<MillerDashboardResponse> {
    const response =
      await marketplaceApiClient.get<MillerDashboardResponse>(
        "/api/marketplace/api/dashboard/miller"
      );

    return response.data;
  },
};