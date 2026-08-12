import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  FavoritePartnerResponse,
  PartnerDetailResponse,
  PartnerListResponse,
  PartnerType,
} from "@/types/c03-marketplace/partner.types";

export const partnerService = {
  async getMyPartners(): Promise<PartnerListResponse> {
    const response =
      await marketplaceApiClient.get<PartnerListResponse>(
        "/partners"
      );

    return response.data;
  },

  async getPartnerDetails(
    partnerType: PartnerType,
    partnerId: string
  ): Promise<PartnerDetailResponse> {
    const response =
      await marketplaceApiClient.get<PartnerDetailResponse>(
        `/partners/${partnerType}/${partnerId}`
      );

    return response.data;
  },

  async addFavorite(
    partnerType: PartnerType,
    partnerId: string
  ): Promise<FavoritePartnerResponse> {
    const response =
      await marketplaceApiClient.post<FavoritePartnerResponse>(
        `/partners/${partnerType}/${partnerId}/favorite`
      );

    return response.data;
  },

  async removeFavorite(
    partnerType: PartnerType,
    partnerId: string
  ): Promise<FavoritePartnerResponse> {
    const response =
      await marketplaceApiClient.delete<FavoritePartnerResponse>(
        `/partners/${partnerType}/${partnerId}/favorite`
      );

    return response.data;
  },
};