import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  CreateMillerSelectionsRequest,
  CreateSelectionsRequest,
  CreateSelectionsResponse,
  GetSelectionsResponse,
  MatchingResponse,
  MillerMatchingResponse,
  RespondSelectionResponse,
} from "@/types/c03-marketplace/matching.types";

export const matchingService = {
  async getHarvestMatches(
    harvestId: string,
  ): Promise<MatchingResponse> {
    const response =
      await marketplaceApiClient.get<MatchingResponse>(
        `/matching/harvest/${harvestId}`,
      );

    return response.data;
  },

  async getDemandMatches(
    demandId: string,
  ): Promise<MillerMatchingResponse> {
    console.log(
      "GET Farmer matches for demand:",
      demandId,
    );

    const response =
      await marketplaceApiClient.get<MillerMatchingResponse>(
        `/matching/demand/${demandId}`,
      );

    console.log(
      "Demand matching response:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  },

  async createSelections(
    payload: CreateSelectionsRequest,
  ): Promise<CreateSelectionsResponse> {
    const response =
      await marketplaceApiClient.post<CreateSelectionsResponse>(
        "/match-selections/create",
        payload,
      );

    return response.data;
  },

  async createMillerSelections(
    payload: CreateMillerSelectionsRequest,
  ): Promise<CreateSelectionsResponse> {
    console.log(
      "POST Miller match selections:",
      payload,
    );

    const response =
      await marketplaceApiClient.post<CreateSelectionsResponse>(
        "/match-selections/create-by-miller",
        payload,
      );

    return response.data;
  },

  async getFarmerSelections():
    Promise<GetSelectionsResponse> {
    const response =
      await marketplaceApiClient.get<GetSelectionsResponse>(
        "/match-selections/farmer",
      );

    return response.data;
  },

  async getMillerSelections():
    Promise<GetSelectionsResponse> {
    const response =
      await marketplaceApiClient.get<GetSelectionsResponse>(
        "/match-selections/miller",
      );

    return response.data;
  },

  async respondToSelection(
    selectionId: string,
    decision: "accepted" | "rejected",
  ): Promise<RespondSelectionResponse> {
    const response =
      await marketplaceApiClient.patch<RespondSelectionResponse>(
        `/match-selections/${selectionId}/respond`,
        {
          decision,
        },
      );

    return response.data;
  },
};