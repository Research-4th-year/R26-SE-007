import {
  Stack,
} from "expo-router";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  MarketplaceAuthProvider,
} from "@/contexts/c03-marketplace/MarketplaceAuthContext";

import {
  FloatingRagBot,
} from "@/components/c03-marketplace/FloatingRagBot";

import {
  MarketplaceBottomNav,
} from "@/components/c03-marketplace/MarketplaceBottomNav";

export default function MarketplaceLayout() {
  return (
    <MarketplaceAuthProvider>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown:
              false,

            contentStyle: {
              backgroundColor:
                "#F8FAF8",
            },
          }}
        />

        <FloatingRagBot />

        <MarketplaceBottomNav />
      </View>
    </MarketplaceAuthProvider>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },
  });