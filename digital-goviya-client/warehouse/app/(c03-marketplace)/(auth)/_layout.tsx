import { Stack } from "expo-router";

import { useMarketplaceAppearance } from "@/contexts/c03-marketplace/MarketplaceAppearanceContext";

export default function MarketplaceAuthLayout() {
  const { isDark } = useMarketplaceAppearance();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: isDark ? "#0F172A" : "#0A331D",
        },
      }}
    />
  );
}
