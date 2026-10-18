import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, Image
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/hooks/shared/useAuth";
import { authService } from "@/services/shared/auth.service";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginScreen() {
  const { t } = useLanguage();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();

  useEffect(() => {
    authService.logout();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t.warehouse.errors.title, t.warehouse.auth.errorEmptyFields);
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      if (data.user?.role === "WAREHOUSE_SUPERVISOR") {
        router.replace("/(c01-warehouse)/(supervisor)/my-warehouse" as any);
      } else if (data.user?.role === "AUDITOR") {
        router.replace("/(c01-warehouse)/(auditor)/dashboard" as any);
      } else {
        router.replace("/(c01-warehouse)/(tabs)/dashboard" as any);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || t.warehouse.auth.errorLoginFailed;
      Alert.alert(t.warehouse.auth.loginFailedTitle, msg);
    } finally {
      setLoading(false);
    }
  };

  // Decorative crate/grid texture for the header — purely visual, no logic
  const renderHeaderTexture = () => {
    const rows = 5;
    const cols = 8;
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push(
          <View
            key={`${r}-${c}`}
            style={[
              styles.textureCell,
              {
                top: r * 42 - 20,
                left: c * 46 - 20,
                opacity: (r + c) % 3 === 0 ? 0.10 : 0.05,
              },
            ]}
          />
        );
      }
    }
    return cells;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.flexContent}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={["#0F4C2E", "#15803D", "#0B3B22"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Subtle texture layer */}
          <View style={styles.textureLayer} pointerEvents="none">
            {renderHeaderTexture()}
            <View style={styles.blobTopRight} />
            <View style={styles.blobBottomLeft} />
            <View style={styles.ringAccent} />
          </View>

          <View style={styles.iconCircle}>
            <Image
              source={require("../../../assets/warehouse-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>{t.warehouse.auth.appName}</Text>
          <Text style={styles.appSub}>{t.warehouse.auth.tagline}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>{t.warehouse.auth.signIn}</Text>

          <Text style={styles.label}>{t.warehouse.auth.email}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.warehouse.auth.emailPlaceholder}
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>{t.warehouse.auth.password}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.warehouse.auth.passwordPlaceholder}
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.buttonText}>{t.warehouse.auth.signIn}</Text>
            }
          </TouchableOpacity>

          <Text style={styles.footer}>{t.warehouse.auth.footer}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#15803D" },
  flexContent:  { flex: 1 },
header: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, overflow: "hidden" },

  // Texture layer — sits behind header content
  textureLayer: { ...StyleSheet.absoluteFillObject },
  textureCell: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "white",
  },
  blobTopRight: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "white",
    opacity: 0.06,
  },
  blobBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "white",
    opacity: 0.05,
  },
  ringAccent: {
    position: "absolute",
    top: -30,
    alignSelf: "center",
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  logoImage:    { width: 50, height: 50 },
  appName:      { color: "white", fontSize: 28, fontWeight: "bold", textAlign: "center", letterSpacing: 0.3 },
  appSub:       { color: "#BBF7D0", fontSize: 14, textAlign: "center", marginTop: 4 },
form: { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  title:        { fontSize: 24, fontWeight: "bold", color: "#1F2937", marginBottom: 24 },
  label:        { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input:        { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#1F2937", backgroundColor: "#F9FAFB", marginBottom: 16 },
  button:       { backgroundColor: "#16A34A", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  buttonDisabled: { backgroundColor: "#86EFAC" },
  buttonText:   { color: "white", fontSize: 16, fontWeight: "bold" },
  footer:       { textAlign: "center", color: "#9CA3AF", fontSize: 13, marginTop: 24 },
});