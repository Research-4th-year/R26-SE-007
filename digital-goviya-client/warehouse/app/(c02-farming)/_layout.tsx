import { Stack } from "expo-router";
import { COLORS } from "@/constants/theme";
import React from "react";

export default function FarmingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primaryDark },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Digital Farming",
        }}
      />
      <Stack.Screen
        name="guidance"
        options={{
          title: "Farmer Guidance",
        }}
      />
      <Stack.Screen
        name="scan"
        options={{
          title: "Scan Leaf Disease",
        }}
      />
      <Stack.Screen
        name="fertilizer"
        options={{
          title: "Fertilizer Guidance",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: "Settings",
        }}
      />
    </Stack>
  );
}
