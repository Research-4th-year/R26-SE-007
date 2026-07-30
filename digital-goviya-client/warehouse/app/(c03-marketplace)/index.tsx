import { Redirect } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMarketplaceAuth } from "../../contexts/MarketplaceAuthContext";

export default function MarketplaceIndexScreen() {
  const {
    isLoading,
    isAuthenticated,
    user,
  } = useMarketplaceAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌾</Text>
        </View>

        <Text style={styles.title}>Digital Goviya</Text>
        <Text style={styles.subtitle}>
          Preparing your marketplace
        </Text>

        <ActivityIndicator
          size="large"
          color="#15803D"
          style={styles.loader}
        />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Redirect href="/(c03-marketplace)/(auth)/login" />
    );
  }

  if (user.role === "farmer") {
    return (
      <Redirect href="/(c03-marketplace)/(farmer)/home" />
    );
  }

  return (
    <Redirect href="/(c03-marketplace)/(miller)/home" />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAF8",
    paddingHorizontal: 24,
  },

  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 18,
  },

  logoEmoji: {
    fontSize: 42,
  },

  title: {
    color: "#14532D",
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 5,
  },

  loader: {
    marginTop: 24,
  },
});