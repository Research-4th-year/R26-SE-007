import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  CreateSelectionsRequest,
  CreateSelectionsResponse,
  GetSelectionsResponse,
  MatchingResponse,
  MatchSelection,
} from "@/types/c03-marketplace/matching.types";

interface RespondToSelectionResponse {
  success: boolean;
  message: string;

  data: {
    selection: MatchSelection;
  };
}

export const matchingService = {
  async getHarvestMatches(
    harvestId: string
  ): Promise<MatchingResponse> {
    const response =
      await marketplaceApiClient.get<MatchingResponse>(
        `/matching/${harvestId}`
      );

    return response.data;
  },

  async createSelections(
    payload: CreateSelectionsRequest
  ): Promise<CreateSelectionsResponse> {
    const response =
      await marketplaceApiClient.post<CreateSelectionsResponse>(
        "/match-selections/create",
        payload
      );

    return response.data;
  },

  async getFarmerSelections():
    Promise<GetSelectionsResponse> {
    const response =
      await marketplaceApiClient.get<GetSelectionsResponse>(
        "/match-selections/farmer"
      );

    return response.data;
  },

  async getMillerSelections():
    Promise<GetSelectionsResponse> {
    const response =
      await marketplaceApiClient.get<GetSelectionsResponse>(
        "/match-selections/miller"
      );

    return response.data;
  },

  async respondToSelection(
    selectionId: string,
    decision: "accepted" | "rejected"
  ): Promise<RespondToSelectionResponse> {
    const response =
      await marketplaceApiClient.patch<RespondToSelectionResponse>(
        `/match-selections/${selectionId}/respond`,
        {
          decision,
        }
      );

    return response.data;
  },
};