import {
  Stack,
  usePathname,
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

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

export default function MarketplaceLayout() {
  return (
    <MarketplaceAuthProvider>
      <MarketplaceLayoutContent />
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

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor:
              "#F8FAF8",
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