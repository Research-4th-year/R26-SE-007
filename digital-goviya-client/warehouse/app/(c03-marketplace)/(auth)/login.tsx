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
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";
import { MarketplaceUserRole } from "@/types/c03-marketplace/auth.types";

export default function MarketplaceLoginScreen() {
  const { signIn } = useMarketplaceAuth();

  const [role, setRole] =
    useState<MarketplaceUserRole>("farmer");

  const [email, setEmail] =
    useState("farmer@digitalgoviya.lk");

  const [password, setPassword] =
    useState("Demo123");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  function selectRole(
  selectedRole: MarketplaceUserRole
) {
  setRole(selectedRole);

  setEmail(
    selectedRole === "farmer"
      ? "farmer@digitalgoviya.lk"
      : "demomiller@gmail.com"
  );

  setPassword("Demo1234");
}

  async function handleLogin(): Promise<void> {
  if (!email.trim() || !password.trim()) {
    Alert.alert(
      "Missing information",
      "Enter your email and password."
    );
    return;
  }

  try {
    setIsSubmitting(true);

    const session = await signIn({
      email,
      password,
      role,
    });

    if (session.user.role === "farmer") {
      router.replace(
        "/(c03-marketplace)/(farmer)/home"
      );

      return;
    }

    router.replace(
      "/(c03-marketplace)/(miller)/home"
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to sign in.";

    Alert.alert("Login failed", message);
  } finally {
    setIsSubmitting(false);
  }
}

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={["#0A331D", "#12522E", "#0B3B22"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.hero}>
              <View style={styles.logoRing}>
                <View style={styles.logoCircle}>
                  <Ionicons
                    name="storefront"
                    size={30}
                    color="#15803D"
                  />
                </View>
              </View>

              <View style={styles.eyebrowPill}>
                <Ionicons name="sparkles" size={11} color="#F5C542" />
                <Text style={styles.eyebrow}>
                  DIGITAL GOVIYA MARKETPLACE
                </Text>
              </View>

              <Text style={styles.heading}>
                Welcome back
              </Text>

              <Text style={styles.description}>
                Trade paddy securely and negotiate fair
                prices using intelligent farmer and miller
                agents.
              </Text>
            </View>

            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

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
                <View style={styles.inputIconBox}>
                  <Ionicons
                    name="mail-outline"
                    size={17}
                    color="#15803D"
                  />
                </View>

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
                <View style={styles.inputIconBox}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={17}
                    color="#15803D"
                  />
                </View>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />

                <Pressable
                  hitSlop={8}
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
                    size={19}
                    color="#9CA3AF"
                  />
                </Pressable>
              </View>

              <View style={styles.demoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color="#B45309"
                />

                <Text style={styles.demoText}>
                  Demo credentials are already filled.
                  Password: Demo123
                </Text>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.loginShadow,
                  pressed && styles.loginPressed,
                  isSubmitting && styles.loginDisabled,
                ]}
              >
                <LinearGradient
                  colors={["#F5C542", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginButton}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#0B3B22" />
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
                        size={18}
                        color="#0B3B22"
                      />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <Text style={styles.footer}>
              Digital Goviya v1.0 · SLIIT Research 2026
            </Text>
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
          size={22}
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
    paddingBottom: 24,
  },

  backButton: {
    marginTop: 6,
    marginLeft: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },

  hero: {
    alignItems: "center",
    paddingTop: 14,
    paddingBottom: 26,
    paddingHorizontal: 28,
    gap: 10,
  },

  logoRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 4,
    backgroundColor: "rgba(245,197,66,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.25)",
    marginTop: 4,
  },

  eyebrow: {
    color: "rgba(253,230,138,0.85)",
    fontSize: 9.5,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1.2,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 27,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 6,
    textAlign: "center",
  },

  description: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 300,
    marginTop: 2,
  },

  sheet: {
    backgroundColor: "#FAFAF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 18,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 14.5,
    fontFamily: "Poppins_700Bold",
    marginBottom: 13,
  },

  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  roleCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: 16,
    borderWidth: 1.4,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 13,
  },

  roleCardSelected: {
    borderColor: "#15803D",
    backgroundColor: "#F0FDF4",
  },

  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    fontSize: 13.5,
    fontFamily: "Poppins_700Bold",
  },

  roleTitleSelected: {
    color: "#14532D",
  },

  roleSubtitle: {
    color: "#9CA3AF",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  selectedCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803D",
  },

  label: {
    color: "#374151",
    fontSize: 11.5,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 7,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.4,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
  },

  inputIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    color: "#111827",
    fontSize: 13.5,
    fontFamily: "Poppins_500Medium",
  },

  demoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    borderRadius: 13,
    backgroundColor: "#FFFBEB",
    marginBottom: 18,
  },

  demoText: {
    flex: 1,
    color: "#92400E",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
    lineHeight: 15,
  },

  loginShadow: {
    borderRadius: 15,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  loginPressed: {
    opacity: 0.9,
  },

  loginDisabled: {
    opacity: 0.65,
  },

  loginButton: {
    height: 54,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  loginButtonText: {
    color: "#0B3B22",
    fontSize: 14.5,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.2,
  },

  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
    paddingTop: 14,
  },
});