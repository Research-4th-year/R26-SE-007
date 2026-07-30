import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const SESSION_KEY = "c03_marketplace_session";

/**
 * Saves the marketplace session.
 *
 * Web:
 * Uses browser localStorage for development/demo purposes.
 *
 * Android/iOS:
 * Uses Expo SecureStore.
 */
export async function saveMarketplaceSession(
  sessionValue: string
): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(SESSION_KEY, sessionValue);
    } catch (error) {
      console.error(
        "Failed to save marketplace session on web:",
        error
      );

      throw new Error("Unable to save the session.");
    }

    return;
  }

  await SecureStore.setItemAsync(
    SESSION_KEY,
    sessionValue
  );
}

/**
 * Retrieves the saved marketplace session.
 */
export async function getMarketplaceSession(): Promise<
  string | null
> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch (error) {
      console.error(
        "Failed to read marketplace session on web:",
        error
      );

      return null;
    }
  }

  return SecureStore.getItemAsync(SESSION_KEY);
}

/**
 * Removes the saved marketplace session.
 */
export async function removeMarketplaceSession(): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error(
        "Failed to remove marketplace session on web:",
        error
      );
    }

    return;
  }

  await SecureStore.deleteItemAsync(SESSION_KEY);
}