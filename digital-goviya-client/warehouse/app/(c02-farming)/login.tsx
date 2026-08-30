import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFarmingAuth } from "@/contexts/FarmingAuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../i18n";

export default function LoginScreen() {
  const { login } = useFarmingAuth();
  const { language } = useLanguage();
  const t = translations[language].c02Farming.authAndProfile;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await login(email.trim(), password);
      // AuthGuard in _layout.tsx will redirect to home automatically
      router.replace("/(c02-farming)/home" as any);
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function friendlyError(code: string) {
    switch (code) {
      case "auth/user-not-found": return "No account found with this email.";
      case "auth/wrong-password": return "Incorrect password. Please try again.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/too-many-requests": return "Too many attempts. Please try again later.";
      default: return "Login failed. Please check your credentials.";
    }
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0A331D", "#12522E", "#0B3B22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={36} color="#0A331D" />
            </View>
            <Text style={styles.brandName}>Digital Goviya</Text>
            <Text style={styles.brandTagline}>Smart Farming & Advisory</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.loginTitle}</Text>
            <Text style={styles.cardSubtitle}>{t.loginSubtitle}</Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.email}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t.emailPlaceholder}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t.password}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={["#15803D", "#0A331D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>{t.loginBtn}</Text>
                    <Ionicons name="arrow-forward" size={18} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t.needAccount}</Text>
              <TouchableOpacity onPress={() => router.push("/(c02-farming)/register" as any)}>
                <Text style={styles.footerLink}>{t.registerHere}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  // Brand
  brandSection: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#F5C542",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    shadowColor: "#F5C542",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  brandName: {
    fontFamily: "Poppins_700Bold", fontSize: 28, color: "white",
  },
  brandTagline: {
    fontFamily: "Poppins_500Medium", fontSize: 13,
    color: "rgba(255,255,255,0.6)", marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontFamily: "Poppins_700Bold", fontSize: 22, color: "#1F2937",
    marginBottom: 6,
  },
  cardSubtitle: {
    fontFamily: "Poppins_500Medium", fontSize: 13, color: "#6B7280",
    marginBottom: 24, lineHeight: 20,
  },

  // Error
  errorBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF2F2", borderRadius: 10,
    padding: 12, marginBottom: 16,
  },
  errorText: {
    fontFamily: "Poppins_500Medium", fontSize: 13, color: "#DC2626", marginLeft: 8, flex: 1,
  },

  // Input
  inputGroup: { marginBottom: 18 },
  inputLabel: {
    fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#374151", marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    backgroundColor: "#F9FAFB", paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, height: 48,
    fontFamily: "Poppins_500Medium", fontSize: 14, color: "#1F2937",
  },
  eyeBtn: { padding: 4 },

  // Login button
  loginBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  loginBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 8,
  },
  loginBtnText: {
    fontFamily: "Poppins_700Bold", fontSize: 16, color: "white",
  },

  // Footer
  footer: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginTop: 20,
  },
  footerText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#6B7280" },
  footerLink: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#15803D" },
});
