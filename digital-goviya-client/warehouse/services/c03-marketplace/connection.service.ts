import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  ConnectionPartnerType,
  MyConnectionsResponse,
  PublicProfileResponse,
  RespondConnectionResponse,
  SearchMarketplaceResponse,
  SendConnectionResponse, 
} from "@/types/c03-marketplace/connection.types";

export const connectionService = {
  async searchUsers(
    options?: {
      query?: string;
      district?: string;
    }
  ): Promise<SearchMarketplaceResponse> {
    const params =
      new URLSearchParams();

    if (
      options?.query?.trim()
    ) {
      params.append(
        "q",
        options.query.trim()
      );
    }

    if (
      options?.district?.trim()
    ) {
      params.append(
        "district",
        options.district.trim()
      );
    }

    const query =
      params.toString();

    const response =
      await marketplaceApiClient.get<SearchMarketplaceResponse>(
        query
          ? `/api/marketplace/api/connections/search?${query}`
          : "/api/marketplace/api/connections/search"
      );

    return response.data;
  },

  async getPublicProfile(
    partnerType:
      ConnectionPartnerType,

    partnerId:
      string
  ): Promise<PublicProfileResponse> {
    const response =
      await marketplaceApiClient.get<PublicProfileResponse>(
        `/api/marketplace/api/connections/profile/${partnerType}/${partnerId}`
      );

    return response.data;
  },

  async sendRequest(
    partnerType:
      ConnectionPartnerType,

    partnerId:
      string
  ): Promise<SendConnectionResponse> {
    const response =
      await marketplaceApiClient.post<SendConnectionResponse>(
        `/api/marketplace/api/connections/request/${partnerType}/${partnerId}`
      );

    return response.data;
  },

  async getMyConnections(
    status?: string
  ): Promise<MyConnectionsResponse> {
    const path =
      status
        ? `/api/marketplace/api/connections/mine?status=${encodeURIComponent(
            status
          )}`
        : "/api/marketplace/api/connections/mine";

    const response =
      await marketplaceApiClient.get<MyConnectionsResponse>(
        path
      );

    return response.data;
  },

  async respond(
    connectionId: string,

    decision:
      | "accepted"
      | "rejected"
  ): Promise<RespondConnectionResponse> {
    const response =
      await marketplaceApiClient.patch<RespondConnectionResponse>(
        `/api/marketplace/api/connections/${connectionId}/respond`,
        {
          decision,
        }
      );

    return response.data;
  },

  async removeConnection(
    connectionId: string
  ) {
    const response =
      await marketplaceApiClient.patch(
        `/api/marketplace/api/connections/${connectionId}/remove`
      );

    return response.data;
  },

  async cancelRequest(
  connectionId: string
) {
  const response =
    await marketplaceApiClient.patch(
      `/api/marketplace/api/connections/${connectionId}/cancel`
    );

  return response.data;
},
};