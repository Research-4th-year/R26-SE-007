import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

export default function MarketplaceIndexScreen() {
  const {
    isLoading,
    isAuthenticated,
    user,
  } = useMarketplaceAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="large"
          color="#15803D"
        />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Redirect
        href="/(c03-marketplace)/(auth)/login"
      />
    );
  }

  if (user.role === "farmer") {
    return (
      <Redirect
        href="/(c03-marketplace)/(farmer)/home"
      />
    );
  }

  return (
    <Redirect
      href="/(c03-marketplace)/(miller)/home"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAF8",
  },
});