import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";

export default function IndexScreen() {
  useEffect(() => {
    // Defer navigation until Root Layout <Stack> is mounted
    const timer = setTimeout(() => {
      router.replace("/splash-screen");
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-green-700">
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}