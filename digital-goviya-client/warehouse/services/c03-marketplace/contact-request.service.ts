import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  ContactRequestMutationResponse,
  ContactRequestStateResponse,
  CreateContactRequestPayload,
} from "@/types/c03-marketplace/contact-request.types";

export const contactRequestService = {
  async getForNegotiation(
    negotiationId: string
  ): Promise<ContactRequestStateResponse> {
    const response =
      await marketplaceApiClient.get<ContactRequestStateResponse>(
        `/api/marketplace/api/contact-requests/negotiation/${negotiationId}`
      );

    return response.data;
  },

  async create(
    payload: CreateContactRequestPayload
  ): Promise<ContactRequestMutationResponse> {
    const response =
      await marketplaceApiClient.post<ContactRequestMutationResponse>(
        "/api/marketplace/api/contact-requests",
        payload
      );

    return response.data;
  },

  async respond(
    requestId: string,
    decision: "accepted" | "rejected"
  ): Promise<ContactRequestMutationResponse> {
    const response =
      await marketplaceApiClient.patch<ContactRequestMutationResponse>(
        `/api/marketplace/api/contact-requests/${requestId}/respond`,
        {
          decision,
        }
      );

    return response.data;
  },
};