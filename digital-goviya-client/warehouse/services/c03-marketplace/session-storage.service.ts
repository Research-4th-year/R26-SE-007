import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SESSION_KEY = "c03_marketplace_session";

export async function saveMarketplaceSession(
  sessionValue: string
): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(SESSION_KEY, sessionValue);
    return;
  }

  await SecureStore.setItemAsync(
    SESSION_KEY,
    sessionValue
  );
}

export async function getMarketplaceSession(): Promise<
  string | null
> {
  if (Platform.OS === "web") {
    return localStorage.getItem(SESSION_KEY);
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function removeMarketplaceSession(): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}