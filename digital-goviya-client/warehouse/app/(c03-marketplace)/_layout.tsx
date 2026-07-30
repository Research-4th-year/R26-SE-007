import { Stack } from "expo-router";

import { MarketplaceAuthProvider } from "../../contexts/MarketplaceAuthContext";

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
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(farmer)" />
        <Stack.Screen name="(miller)" />
      </Stack>
    </MarketplaceAuthProvider>
  );
}