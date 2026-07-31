import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  CreateDemandRequest,
  CreateDemandResponse,
  GetDemandsResponse,
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
        "/miller-demand/create",
        payload
      );

    return response.data;
  },

  async getMyDemands(): Promise<GetDemandsResponse> {
    const response =
      await marketplaceApiClient.get<GetDemandsResponse>(
        "/miller-demand/my-demands"
      );

    return response.data;
  },
};