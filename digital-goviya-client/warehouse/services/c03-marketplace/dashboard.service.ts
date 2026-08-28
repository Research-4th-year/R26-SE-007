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
        "/dashboard/farmer"
      );

    return response.data;
  },

  async getMillerDashboard():
    Promise<MillerDashboardResponse> {
    const response =
      await marketplaceApiClient.get<MillerDashboardResponse>(
        "/dashboard/miller"
      );

    return response.data;
  },
};