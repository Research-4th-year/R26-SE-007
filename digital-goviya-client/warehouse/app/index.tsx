import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { authService } from "../services/auth.service";

export default function IndexScreen() {
  useEffect(() => {
authService.isLoggedIn().then(async (loggedIn) => {
  if (loggedIn) {
    const user = await authService.getStoredUser();
    if (user?.role === "WAREHOUSE_SUPERVISOR") {
      router.replace("/(supervisor)/my-warehouse" as any);
    } else if (user?.role === "AUDITOR") {
      router.replace("/(auditor)/dashboard" as any);
    } else {
      router.replace("/(tabs)/dashboard");
    }
  } else {
    router.replace("/(auth)/login");
  }
});
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-green-700">
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}
