import { Stack } from "expo-router";

import { useMarketplaceAppearance } from "@/contexts/c03-marketplace/MarketplaceAppearanceContext";

export default function FarmerLayout() {
  const { isDark } = useMarketplaceAppearance();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: isDark ? "#0F172A" : "#F8FAF8",
        },
      }}
    />
  );
}
