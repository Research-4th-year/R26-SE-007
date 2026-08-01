import { Stack } from "expo-router";
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

export default function MarketplaceLayout() {
  return (
    <MarketplaceAuthProvider>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        <FloatingRagBot />
      </View>
    </MarketplaceAuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});