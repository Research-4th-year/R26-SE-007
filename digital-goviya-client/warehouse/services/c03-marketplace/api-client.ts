import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

import {
  getMarketplaceSession,
  removeMarketplaceSession,
} from "@/services/c03-marketplace/session-storage.service";

import type {
  MarketplaceSession,
} from "@/types/c03-marketplace/auth.types";

import Constants from 'expo-constants';
import { Platform } from 'react-native';

let LOCAL_IP = "127.0.0.1";
if (__DEV__ && Constants.expoConfig?.hostUri) {
  LOCAL_IP = Constants.expoConfig.hostUri.split(':')[0];
} else if (Platform.OS === 'android') {
  LOCAL_IP = "10.0.2.2";
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_MARKETPLACE_API_URL || `http://${LOCAL_IP}:8000`;

if (!process.env.EXPO_PUBLIC_MARKETPLACE_API_URL && !__DEV__) {
  console.warn(
    "EXPO_PUBLIC_MARKETPLACE_API_URL is not configured for production."
  );
}

export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export class MarketplaceApiError extends Error {
  statusCode?: number;
  fieldErrors?: ApiErrorResponse["errors"];

  constructor(
    message: string,
    statusCode?: number,
    fieldErrors?: ApiErrorResponse["errors"]
  ) {
    super(message);

    this.name = "MarketplaceApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export const marketplaceApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

marketplaceApiClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    const storedSession =
      await getMarketplaceSession();

    if (!storedSession) {
      return config;
    }

    try {
      const session = JSON.parse(
        storedSession
      ) as MarketplaceSession;

      if (session.token) {
        config.headers.Authorization =
          `Bearer ${session.token}`;
      }
    } catch (error) {
      console.error(
        "Failed to read stored marketplace session:",
        error
      );

      await removeMarketplaceSession();
    }

    return config;
  }
);

marketplaceApiClient.interceptors.response.use(
  (response) => response,

  async (error: AxiosError<ApiErrorResponse>) => {
    const statusCode = error.response?.status;

    if (statusCode === 401) {
      await removeMarketplaceSession();
    }

    const responseData = error.response?.data;

    const message =
      responseData?.message ||
      responseData?.error ||
      (error.code === "ECONNABORTED"
        ? "The server request timed out."
        : error.message === "Network Error"
          ? "Unable to connect to the marketplace server."
          : "An unexpected server error occurred.");

    return Promise.reject(
      new MarketplaceApiError(
        message,
        statusCode,
        responseData?.errors
      )
    );
  }
);