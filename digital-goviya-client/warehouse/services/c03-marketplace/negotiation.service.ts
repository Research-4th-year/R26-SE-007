import {
  MarketplaceApiError,
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  NegotiationHealthResponse,
  NegotiationListResponse,
  NegotiationResponse,
  StartNegotiationRequest,
} from "@/types/c03-marketplace/negotiation.types";

const NEGOTIATION_TIMEOUT_MS = 330000;

export const negotiationService = {
  async checkHealth():
    Promise<NegotiationHealthResponse> {
    const response =
      await marketplaceApiClient.get<NegotiationHealthResponse>(
        "/negotiations/health",
        {
          timeout: 10000,
        }
      );

    return response.data;
  },

  async startNegotiation(
    payload: StartNegotiationRequest
  ): Promise<NegotiationResponse> {
    console.log(
      "POST /negotiations/start:",
      payload
    );

    try {
      const response =
        await marketplaceApiClient.post<NegotiationResponse>(
          "/negotiations/start",
          payload,
          {
            timeout:
              NEGOTIATION_TIMEOUT_MS,
          }
        );

      console.log(
        "Negotiation response:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      return response.data;
    } catch (error) {
      if (
        error instanceof
          MarketplaceApiError &&
        error.message ===
          "The server request timed out."
      ) {
        throw new MarketplaceApiError(
          "The AI agents are taking longer than expected. Please try again.",
          error.statusCode
        );
      }

      throw error;
    }
  },

  async getNegotiation(
    negotiationId: string
  ): Promise<NegotiationResponse> {
    const response =
      await marketplaceApiClient.get<NegotiationResponse>(
        `/negotiations/${negotiationId}`
      );

    return response.data;
  },

  async getMyNegotiations():
    Promise<NegotiationListResponse> {
    const response =
      await marketplaceApiClient.get<NegotiationListResponse>(
        "/negotiations/mine"
      );

    return response.data;
  },
};