import { Stack } from "expo-router";

import {
  MarketplaceAuthProvider,
} from "@/contexts/c03-marketplace/MarketplaceAuthContext";

export default function MarketplaceLayout() {
  return (
    <MarketplaceAuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: {
            backgroundColor: "#F8FAF8",
          },
        }}
      />
    </MarketplaceAuthProvider>
  );
}