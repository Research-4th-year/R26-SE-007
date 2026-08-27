import {
  Stack,
  usePathname,
} from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  StyleSheet,
  View,
} from "@/components/c03-marketplace/themed-native";

import {
  MarketplaceAuthProvider,
} from "@/contexts/c03-marketplace/MarketplaceAuthContext";

import {
  MarketplaceAppearanceProvider,
  useMarketplaceAppearance,
} from "@/contexts/c03-marketplace/MarketplaceAppearanceContext";

import {
  FloatingRagBot,
} from "@/components/c03-marketplace/FloatingRagBot";

import {
  MarketplaceBottomNav,
} from "@/components/c03-marketplace/MarketplaceBottomNav";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

export default function MarketplaceLayout() {
  return (
    <MarketplaceAuthProvider>
      <MarketplaceAppearanceProvider>
        <MarketplaceLayoutContent />
      </MarketplaceAppearanceProvider>
    </MarketplaceAuthProvider>
  );
}

function MarketplaceLayoutContent() {
  const pathname =
    usePathname();

  const {
    user,
    isAuthenticated,
    isLoading,
  } = useMarketplaceAuth();

  const { isDark } =
    useMarketplaceAppearance();

  const isAuthScreen =
    pathname.includes("/login") ||
    pathname.includes("/register") ||
    pathname.includes("/change-password");

  const mustChangePassword =
    Boolean(
      user?.mustChangePassword
    );

  const showMarketplaceUI =
    !isLoading &&
    isAuthenticated &&
    !isAuthScreen &&
    !mustChangePassword;

  const pageBackground =
    isDark ? "#0F172A" : "#F8FAF8";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: pageBackground },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor:
              pageBackground,
          },
        }}
      />

      {showMarketplaceUI ? (
        <>
          <FloatingRagBot />

          <MarketplaceBottomNav />
        </>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
    },
  });