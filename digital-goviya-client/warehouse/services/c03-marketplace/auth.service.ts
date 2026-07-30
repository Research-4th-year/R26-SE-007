import {
  marketplaceApiClient,
} from "@/services/c03-marketplace/api-client";

import type {
  CurrentUserResponse,
  LoginCredentials,
  LoginResponse,
  MarketplaceSession,
} from "@/types/c03-marketplace/auth.types";

export async function loginMarketplaceUser(
  credentials: LoginCredentials
): Promise<MarketplaceSession> {
  const response =
    await marketplaceApiClient.post<LoginResponse>(
      "/auth/login",
      {
        email: credentials.email
          .trim()
          .toLowerCase(),

        password: credentials.password,

        role: credentials.role,
      }
    );

  return response.data.data;
}

export async function getCurrentMarketplaceUser(): Promise<
  Omit<MarketplaceSession, "token">
> {
  const response =
    await marketplaceApiClient.get<CurrentUserResponse>(
      "/auth/me"
    );

  return response.data.data;
}