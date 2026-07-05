import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { authService } from "../services/auth.service";

export default function IndexScreen() {
  useEffect(() => {
    authService.isLoggedIn().then((loggedIn) => {
      if (loggedIn) {
        router.replace("/(tabs)/dashboard");
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
