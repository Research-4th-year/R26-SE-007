import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your Mac's local IP address — NOT localhost
// Find it: System Preferences → Network → WiFi → IP Address
// Your phone and Mac must be on the same WiFi network

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 — token expired
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    }
    return Promise.reject(err);
  }
);

export default api;
