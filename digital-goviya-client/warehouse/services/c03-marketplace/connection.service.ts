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
          ? `/connections/search?${query}`
          : "/connections/search"
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
        `/connections/profile/${partnerType}/${partnerId}`
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
        `/connections/request/${partnerType}/${partnerId}`
      );

    return response.data;
  },

  async getMyConnections(
    status?: string
  ): Promise<MyConnectionsResponse> {
    const path =
      status
        ? `/connections/mine?status=${encodeURIComponent(
            status
          )}`
        : "/connections/mine";

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
        `/connections/${connectionId}/respond`,
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
        `/connections/${connectionId}/remove`
      );

    return response.data;
  },

  async cancelRequest(
  connectionId: string
) {
  const response =
    await marketplaceApiClient.patch(
      `/connections/${connectionId}/cancel`
    );

  return response.data;
},
};