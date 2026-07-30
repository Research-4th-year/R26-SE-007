import { Stack } from "expo-router";

export default function MarketplaceAuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    />
  );
}