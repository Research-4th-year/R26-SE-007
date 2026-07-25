import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Refresh handling ---

// Extend config so we can mark a request as "already retried"
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Prevents multiple simultaneous requests from each independently
// firing their own /refresh call when a token expires
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    // Use a plain axios call, NOT `api` — otherwise this request
    // recurses through the interceptors you're currently defining
    const res = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefreshToken } = res.data.data;

    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", newRefreshToken);
    return accessToken;
  } catch {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as RetryableConfig;

    if (err.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(err);
    }

    // Don't try to refresh using the refresh endpoint itself
    if (originalRequest.url?.includes("/api/auth/refresh")) {
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
      return Promise.reject(err);
    }

    originalRequest._retry = true;

    // Dedupe concurrent refreshes
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      return Promise.reject(err);
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  }
);

export default api;