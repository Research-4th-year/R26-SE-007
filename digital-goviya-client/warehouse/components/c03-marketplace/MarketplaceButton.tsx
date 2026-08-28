import type { ViewStyle } from "@/components/c03-marketplace/themed-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "@/components/c03-marketplace/themed-native";

interface MarketplaceButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
}

export function MarketplaceButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
}: MarketplaceButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "primary"
          ? styles.primary
          : styles.secondary,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary"
              ? "#FFFFFF"
              : "#166534"
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === "primary"
              ? styles.primaryText
              : styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  primary: {
    backgroundColor: "#166534",
  },

  secondary: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  disabled: {
    opacity: 0.55,
  },

  text: {
    fontSize: 16,
    fontWeight: "700",
  },

  primaryText: {
    color: "#FFFFFF",
  },

  secondaryText: {
    color: "#166534",
  },
});