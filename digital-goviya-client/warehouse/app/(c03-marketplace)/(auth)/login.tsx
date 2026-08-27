import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";

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

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import type {
  MarketplaceUserRole,
} from "@/types/c03-marketplace/auth.types";

import { useLanguage } from "@/contexts/LanguageContext";

type LoginTheme = {
  backgroundGradient: [
    string,
    string,
    string
  ];

  accent: string;
  accentSoft: string;

  buttonGradient: [
    string,
    string
  ];

  buttonShadow: string;
  ringBackground: string;
  ringBorder: string;
};

const FARMER_THEME:
  LoginTheme = {
    backgroundGradient: [
      "#0A331D",
      "#12522E",
      "#0B3B22",
    ],

    accent:
      "#15803D",

    accentSoft:
      "#DCFCE7",

    buttonGradient: [
      "#F5C542",
      "#D97706",
    ],

    buttonShadow:
      "#D97706",

    ringBackground:
      "rgba(245,197,66,0.16)",

    ringBorder:
      "rgba(245,197,66,0.4)",
  };

const MILLER_THEME:
  LoginTheme = {
    backgroundGradient: [
      "#3B2408",
      "#7A4708",
      "#4A2A08",
    ],

    accent:
      "#C2760C",

    accentSoft:
      "#FBEBD2",

    buttonGradient: [
      "#FCD34D",
      "#92400E",
    ],

    buttonShadow:
      "#92400E",

    ringBackground:
      "rgba(252,211,77,0.18)",

    ringBorder:
      "rgba(252,211,77,0.42)",
  };

export default function MarketplaceLoginScreen() {
  const { t } = useLanguage();
  const {
    signIn,
  } =
    useMarketplaceAuth();

  const [
    role,
    setRole,
  ] =
    useState<MarketplaceUserRole>(
      "farmer"
    );

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    fontsLoaded,
  ] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const theme:
    LoginTheme =
    useMemo(
      () =>
        role === "miller"
          ? MILLER_THEME
          : FARMER_THEME,
      [role]
    );

  function selectRole(
    selectedRole:
      MarketplaceUserRole
  ) {
    setRole(
      selectedRole
    );

    /*
     * Do not auto-fill demo credentials anymore.
     */
    setUsername("");
    setPassword("");
  }

  async function handleLogin():
    Promise<void> {
    if (
      !username.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        t.c3login.missingInformation,
        t.c3login.missingInformationMessage,
      );

      return;
    }

    try {
      setIsSubmitting(
        true
      );

      const session =
        await signIn({
          username,
          password,
          role,
        });

      if (
        session.user
          .mustChangePassword
      ) {
        router.replace(
          "/(c03-marketplace)/(auth)/change-password"
        );

        return;
      }

      if (
        session.user.role ===
        "farmer"
      ) {
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
        error instanceof Error ? error.message : t.c3login.unableToSignIn;

      Alert.alert(t.c3login.loginFailed, message);
    } finally {
      setIsSubmitting(
        false
      );
    }
  }

  if (
    !fontsLoaded
  ) {
    return null;
  }

  return (
    <LinearGradient
      colors={theme.backgroundGradient}
      start={{
        x: 0,
        y: 0,
      }}
      end={{
        x: 0,
        y: 1,
      }}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
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
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.hero}>
              <View
                style={[
                  styles.logoRing,

                  {
                    backgroundColor: theme.ringBackground,

                    borderColor: theme.ringBorder,
                  },
                ]}
              >
                <View style={styles.logoCircle}>
                  <Ionicons name="storefront" size={30} color={theme.accent} />
                </View>
              </View>

              <View style={styles.eyebrowPill}>
                <Ionicons name="sparkles" size={11} color="#F5C542" />

                <Text style={styles.eyebrow}>{t.c3login.eyebrow}</Text>
              </View>

              <Text style={styles.heading}>{t.c3login.heading}</Text>

              <Text style={styles.description}>{t.c3login.description}</Text>
            </View>

            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <Text style={styles.sectionTitle}>{t.c3login.selectAccount}</Text>

              <View style={styles.roleRow}>
                <RoleCard
                  title={t.c3login.farmer.title}
                  subtitle={t.c3login.farmer.subtitle}
                  icon="leaf"
                  selected={role === "farmer"}
                  accent={FARMER_THEME.accent}
                  accentSoft={FARMER_THEME.accentSoft}
                  onPress={() => selectRole("farmer")}
                />

                <RoleCard
                  title={t.c3login.miller.title}
                  subtitle={t.c3login.miller.subtitle}
                  icon="business"
                  selected={role === "miller"}
                  accent={MILLER_THEME.accent}
                  accentSoft={MILLER_THEME.accentSoft}
                  onPress={() => selectRole("miller")}
                />
              </View>

              <Text style={styles.label}>{t.c3login.username}</Text>

              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputIconBox,
                    {
                      backgroundColor: theme.accentSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={17}
                    color={theme.accent}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder={t.c3login.usernamePlaceholder}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={styles.label}>{t.c3login.password}</Text>

              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputIconBox,
                    {
                      backgroundColor: theme.accentSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={17}
                    color={theme.accent}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t.c3login.passwordPlaceholder}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                />

                <Pressable
                  hitSlop={8}
                  onPress={() => setShowPassword((current) => !current)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={19}
                    color="#9CA3AF"
                  />
                </Pressable>
              </View>

              <View style={styles.infoBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color="#B45309"
                />

                <Text style={styles.infoText}>{t.c3login.accountInfo}</Text>
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.loginShadow,

                  {
                    shadowColor: theme.buttonShadow,
                  },

                  pressed && styles.loginPressed,

                  isSubmitting && styles.loginDisabled,
                ]}
              >
                <LinearGradient
                  colors={theme.buttonGradient}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 0,
                  }}
                  style={styles.loginButton}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#0B3B22" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>
                        
                        {role === "farmer"
                          ? t.c3login.farmer.title
                          : t.c3login.miller.title}
                          {" "}{t.c3login.continueAs}
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
              {t.c3login.footer}
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

  icon:
    keyof typeof Ionicons.glyphMap;

  selected: boolean;
  accent: string;
  accentSoft: string;

  onPress:
    () => void;
}

function RoleCard({
  title,
  subtitle,
  icon,
  selected,
  accent,
  accentSoft,
  onPress,
}: RoleCardProps) {
  return (
    <Pressable
      style={[
        styles.roleCard,

        selected && [
          styles.roleCardSelected,

          {
            borderColor:
              accent,

            backgroundColor:
              accentSoft,
          },
        ],
      ]}
      onPress={
        onPress
      }
    >
      <View
        style={[
          styles.roleIcon,

          {
            backgroundColor:
              accentSoft,
          },

          selected && {
            backgroundColor:
              accent,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={
            selected
              ? "#FFFFFF"
              : accent
          }
        />
      </View>

      <Text
        style={[
          styles.roleTitle,

          selected && {
            color:
              accent,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={
          styles.roleSubtitle
        }
      >
        {subtitle}
      </Text>

      {selected ? (
        <View
          style={[
            styles.selectedCheck,

            {
              backgroundColor:
                accent,
            },
          ]}
        >
          <Ionicons
            name="checkmark"
            size={12}
            color="#FFFFFF"
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
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
      backgroundColor:
        "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.16)",
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
      borderWidth: 1,
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
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 6,
    },

    eyebrowPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor:
        "rgba(255,255,255,0.08)",
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderWidth: 1,
      borderColor:
        "rgba(245,197,66,0.25)",
      marginTop: 4,
    },

    eyebrow: {
      color:
        "rgba(253,230,138,0.85)",
      fontSize: 9.5,
      fontFamily:
        "Poppins_600SemiBold",
      letterSpacing: 1.2,
    },

    heading: {
      color: "#FFFFFF",
      fontSize: 27,
      fontFamily:
        "Poppins_800ExtraBold",
      marginTop: 6,
      textAlign: "center",
      lineHeight: 36,
    },

    description: {
      color:
        "rgba(255,255,255,0.65)",
      fontSize: 12.5,
      fontFamily:
        "Poppins_500Medium",
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
      shadowOffset: {
        width: 0,
        height: -6,
      },
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
      fontFamily:
        "Poppins_700Bold",
      marginBottom: 13,
      lineHeight: 21,
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
      position: "relative",
    },

    roleCardSelected: {
      borderWidth: 1.4,
    },

    roleIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },

    roleTitle: {
      color: "#374151",
      fontSize: 13.5,
      fontFamily:
        "Poppins_700Bold",
        lineHeight: 19,
    },

    roleSubtitle: {
      color: "#9CA3AF",
      fontSize: 9.5,
      fontFamily:
        "Poppins_500Medium",
      marginTop: 2,
      lineHeight: 15,
    },

    selectedCheck: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    label: {
      color: "#374151",
      fontSize: 11,
      fontFamily:
        "Poppins_700Bold",
      marginBottom: 7,
      marginTop: 2,
    },

    inputContainer: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 16,
      paddingHorizontal: 11,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      marginBottom: 15,
    },

    inputIconBox: {
      width: 35,
      height: 35,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },

    input: {
      flex: 1,
      color: "#1F2937",
      fontSize: 12,
      fontFamily:
        "Poppins_500Medium",
      paddingVertical: 0,
    },

    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      borderRadius: 13,
      padding: 11,
      backgroundColor: "#FFFBEB",
      borderWidth: 1,
      borderColor: "#FDE68A",
      marginBottom: 17,
    },

    infoText: {
      flex: 1,
      color: "#92400E",
      fontSize: 9,
      lineHeight: 14,
      fontFamily:
        "Poppins_500Medium",
    },

    loginShadow: {
      borderRadius: 16,
      shadowOpacity: 0.28,
      shadowRadius: 9,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 5,
    },

    loginButton: {
      minHeight: 54,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    loginButtonText: {
      color: "#0B3B22",
      fontSize: 12,
      fontFamily:
        "Poppins_800ExtraBold",
    },

    loginPressed: {
      opacity: 0.9,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    loginDisabled: {
      opacity: 0.6,
    },

    footer: {
      color:
        "rgba(255,255,255,0.5)",
      fontSize: 9,
      fontFamily:
        "Poppins_500Medium",
      textAlign: "center",
      marginTop: 17,
    },
  });