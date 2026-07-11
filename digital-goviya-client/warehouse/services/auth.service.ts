import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "REGIONAL_MANAGER" | "WAREHOUSE_SUPERVISOR" | "AUDITOR";
  warehouseId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post("/api/auth/login", { email, password });
    const data: LoginResponse = res.data.data;
    await AsyncStorage.setItem("accessToken", data.accessToken);
    await AsyncStorage.setItem("refreshToken", data.refreshToken);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (refreshToken) {
      try { await api.post("/api/auth/logout", { refreshToken }); } catch {}
    }
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
  },

  async getStoredUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem("accessToken");
    return !!token;
  },
};
