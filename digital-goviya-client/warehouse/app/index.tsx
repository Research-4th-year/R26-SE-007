import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";

export default function IndexScreen() {
  useEffect(() => {
    router.replace("/landing");
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-green-700">
      <ActivityIndicator size="large" color="white" />
    </View>
  );
}