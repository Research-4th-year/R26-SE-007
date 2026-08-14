import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CurrentUserResponse,
  LoginCredentials,
  LoginResponse,
  MarketplaceSession,
} from "@/types/c03-marketplace/auth.types";

export async function loginMarketplaceUser(
  credentials:
    LoginCredentials
): Promise<MarketplaceSession> {
  const response =
    await marketplaceApiClient.post<LoginResponse>(
      "/auth/login",
      {
        identifier:
          credentials.username
            .trim()
            .toLowerCase(),

        password:
          credentials.password,

        role:
          credentials.role,
      }
    );

  return response.data.data;
}

export async function changeMarketplacePassword(
  payload:
    ChangePasswordRequest
): Promise<MarketplaceSession> {
  const response =
    await marketplaceApiClient.patch<ChangePasswordResponse>(
      "/auth/change-password",
      payload
    );

  return response.data.data;
}

export async function getCurrentMarketplaceUser():
  Promise<
    Omit<
      MarketplaceSession,
      "token"
    >
  > {
  const response =
    await marketplaceApiClient.get<CurrentUserResponse>(
      "/auth/me"
    );

  return response.data.data;
}