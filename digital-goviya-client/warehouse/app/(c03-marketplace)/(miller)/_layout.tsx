import { Stack } from "expo-router";

import { useMarketplaceAppearance } from "@/contexts/c03-marketplace/MarketplaceAppearanceContext";

export default function MillerLayout() {
  const { isDark } = useMarketplaceAppearance();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: isDark ? "#0F172A" : "#FBF8F2",
        },
      }}
    />
  );
}
