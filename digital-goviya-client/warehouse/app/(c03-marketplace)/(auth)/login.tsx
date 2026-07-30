import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMarketplaceAuth } from "@/contexts/c03-marketplace/MarketplaceAuthContext";
import { MarketplaceUserRole } from "../../../types/marketplace-auth";

export default function MarketplaceLoginScreen() {
  const { signIn } = useMarketplaceAuth();

  const [role, setRole] =
    useState<MarketplaceUserRole>("farmer");

  const [email, setEmail] =
    useState("farmer@digitalgoviya.lk");

  const [password, setPassword] =
    useState("demo123");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function selectRole(selectedRole: MarketplaceUserRole) {
    setRole(selectedRole);

    setEmail(
      selectedRole === "farmer"
        ? "farmer@digitalgoviya.lk"
        : "miller@digitalgoviya.lk"
    );

    setPassword("demo123");
  }

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing information",
        "Enter your email and password."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await signIn({
        email,
        password,
        role,
      });

      router.replace(
        role === "farmer"
          ? "/(c03-marketplace)/(farmer)/home"
          : "/(c03-marketplace)/(miller)/home"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed.";

      Alert.alert("Unable to sign in", message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LinearGradient
      colors={["#0A331D", "#12522E", "#0B3B22"]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              style={styles.backButton}
              onPress={() => router.replace("/landing")}
            >
              <Ionicons
                name="arrow-back"
                size={21}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.logoCircle}>
                <Ionicons
                  name="storefront"
                  size={32}
                  color="#15803D"
                />
              </View>

              <Text style={styles.eyebrow}>
                DIGITAL GOVIYA MARKETPLACE
              </Text>

              <Text style={styles.heading}>
                Welcome back
              </Text>

              <Text style={styles.description}>
                Trade paddy securely and negotiate fair
                prices using intelligent farmer and miller
                agents.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Select your account
              </Text>

              <View style={styles.roleRow}>
                <RoleCard
                  title="Farmer"
                  subtitle="Sell paddy"
                  icon="leaf"
                  selected={role === "farmer"}
                  onPress={() => selectRole("farmer")}
                />

                <RoleCard
                  title="Miller"
                  subtitle="Purchase paddy"
                  icon="business"
                  selected={role === "miller"}
                  onPress={() => selectRole("miller")}
                />
              </View>

              <Text style={styles.label}>Email address</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#6B7280"
                />

                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <Text style={styles.label}>Password</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#6B7280"
                />

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />

                <Pressable
                  onPress={() =>
                    setShowPassword((current) => !current)
                  }
                >
                  <Ionicons
                    name={
                      showPassword
                        ? "eye-off-outline"
                        : "eye-outline"
                    }
                    size={20}
                    color="#6B7280"
                  />
                </Pressable>
              </View>

              <View style={styles.demoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color="#B45309"
                />

                <Text style={styles.demoText}>
                  Demo credentials are already filled.
                  Password: demo123
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                  isSubmitting &&
                    styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>
                      Continue as{" "}
                      {role === "farmer"
                        ? "Farmer"
                        : "Miller"}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={19}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

interface RoleCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}

function RoleCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: RoleCardProps) {
  return (
    <Pressable
      style={[
        styles.roleCard,
        selected && styles.roleCardSelected,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.roleIcon,
          selected && styles.roleIconSelected,
        ]}
      >
        <Ionicons
          name={icon}
          size={23}
          color={selected ? "#FFFFFF" : "#15803D"}
        />
      </View>

      <Text
        style={[
          styles.roleTitle,
          selected && styles.roleTitleSelected,
        ]}
      >
        {title}
      </Text>

      <Text style={styles.roleSubtitle}>
        {subtitle}
      </Text>

      {selected && (
        <View style={styles.selectedCheck}>
          <Ionicons
            name="checkmark"
            size={12}
            color="#FFFFFF"
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.11)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  hero: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 22,
  },

  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 13,
  },

  eyebrow: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 8,
  },

  description: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 330,
    marginTop: 7,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 8,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 13,
  },

  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  roleCard: {
    flex: 1,
    minHeight: 122,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAF9",
    padding: 13,
  },

  roleCardSelected: {
    borderColor: "#15803D",
    backgroundColor: "#F0FDF4",
  },

  roleIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 10,
  },

  roleIconSelected: {
    backgroundColor: "#15803D",
  },

  roleTitle: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
  },

  roleTitleSelected: {
    color: "#14532D",
  },

  roleSubtitle: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },

  selectedCheck: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803D",
  },

  label: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 15,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    marginBottom: 15,
  },

  input: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
  },

  demoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "#FFFBEB",
    marginBottom: 17,
  },

  demoText: {
    flex: 1,
    color: "#92400E",
    fontSize: 11,
    lineHeight: 16,
  },

  loginButton: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#15803D",
  },

  loginButtonPressed: {
    opacity: 0.86,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});