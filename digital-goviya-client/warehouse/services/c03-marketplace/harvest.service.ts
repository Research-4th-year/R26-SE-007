import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  CreateHarvestRequest,
  CreateHarvestResponse,
  GetHarvestsResponse,
  MarkHarvestSoldResponse,
} from "@/types/c03-marketplace/harvest.types";

export const harvestService = {
  async createHarvest(
    payload: CreateHarvestRequest
  ): Promise<CreateHarvestResponse> {
    console.log(
      "POST /harvests/add:",
      payload
    );

    const response =
      await marketplaceApiClient.post<CreateHarvestResponse>(
        "/harvests/add",
        payload
      );

    return response.data;
  },

  async getMyHarvests(): Promise<GetHarvestsResponse> {
    const response =
      await marketplaceApiClient.get<GetHarvestsResponse>(
        "/harvests/my-harvests"
      );

    return response.data;
  },

  async markHarvestSold(
    harvestId: string
  ): Promise<MarkHarvestSoldResponse> {
    const response =
      await marketplaceApiClient.patch<MarkHarvestSoldResponse>(
        `/harvests/${harvestId}/sold`
      );

    return response.data;
  },
};