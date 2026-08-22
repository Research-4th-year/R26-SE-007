import { Stack, router } from "expo-router";
import { FarmingAuthProvider, useFarmingAuth } from "@/contexts/FarmingAuthContext";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Auth guard: redirects to login if not authenticated
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useFarmingAuth();

  useEffect(() => {
    if (!loading && !currentUser) {
      // Not logged in – send to the c02 login screen
      router.replace("/(c02-farming)/login" as any);
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={["#0A331D", "#12522E", "#0B3B22"]}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#F5C542" />
        </LinearGradient>
      </View>
    );
  }

  return <>{children}</>;
}

export default function C02FarmingLayout() {
  return (
    <FarmingAuthProvider>
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGuard>
    </FarmingAuthProvider>
  );
}
