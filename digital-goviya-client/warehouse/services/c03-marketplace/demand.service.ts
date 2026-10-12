import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  CreateDemandRequest,
  CreateDemandResponse,
  GetDemandsResponse,
  MarkDemandFulfilledResponse,
} from "@/types/c03-marketplace/demand.types";

export const demandService = {
  async createDemand(
    payload: CreateDemandRequest
  ): Promise<CreateDemandResponse> {
    console.log(
      "POST /miller-demand/create:",
      payload
    );

    const response =
      await marketplaceApiClient.post<CreateDemandResponse>(
        "/api/marketplace/api/miller-demand/create",
        payload
      );

    return response.data;
  },

  async getMyDemands(): Promise<GetDemandsResponse> {
    const response =
      await marketplaceApiClient.get<GetDemandsResponse>(
        "/api/marketplace/api/miller-demand/my-demands"
      );

    return response.data;
  },

  async markDemandFulfilled(
    demandId: string
  ): Promise<MarkDemandFulfilledResponse> {
    const response =
      await marketplaceApiClient.patch<MarkDemandFulfilledResponse>(
        `/api/marketplace/api/miller-demand/${demandId}/fulfilled`
      );

    return response.data;
  },
};