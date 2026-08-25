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
import districtData from "./districtData.json";

import { API_URL } from "@/services/c02-farming/apiConfig";
const DISTRICTS = Object.keys(districtData);

// Simple inline picker
function PickerField({
  label, value, options, onSelect,
}: {
  label: string; value: string; options: string[]; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 18 }}>
      {!!label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.pickerBtnText}>{value || "Select…"}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color="#9CA3AF" />
      </TouchableOpacity>
      {open && (
        <ScrollView style={styles.pickerDropdown} nestedScrollEnabled>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pickerOption, value === opt && styles.pickerOptionActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[styles.pickerOptionText, value === opt && styles.pickerOptionActiveText]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

export default function RegisterScreen() {
  const { signup } = useFarmingAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState(DISTRICTS[0]);
  const [farmSize, setFarmSize] = useState("");
  const [farmUnit, setFarmUnit] = useState("Acres");

  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    if (!name || !email || !password || !passwordConfirm || !farmSize) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      // 1. Create Firebase user
      const credential = await signup(email.trim(), password);
      const user_id = credential.user.uid;

      // 2. Save profile to backend (same as web Register.jsx)
      const profileData = {
        user_id,
        name,
        phone,
        location,
        farm_size: parseFloat(farmSize) || 0,
        farm_unit: farmUnit,
      };

      const res = await fetch(`${API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save profile");
      }

      // 3. Navigate to home (AuthGuard will handle the rest)
      router.replace("/(c02-farming)/home" as any);
    } catch (err: any) {
      setError(friendlyError(err.code || err.message));
    } finally {
      setLoading(false);
    }
  }

  function friendlyError(code: string) {
    switch (code) {
      case "auth/email-already-in-use": return "An account with this email already exists.";
      case "auth/invalid-email": return "Please enter a valid email address.";
      case "auth/weak-password": return "Password is too weak. Use at least 6 characters.";
      default: return "Registration failed. Please try again.";
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Brand */}
          <View style={styles.brandSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="leaf" size={32} color="#0A331D" />
            </View>
            <Text style={styles.brandName}>Register as Farmer</Text>
            <Text style={styles.brandTagline}>
              Create an account to track your farm's history
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {!!error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Personal Info ── */}
            <Text style={styles.sectionLabel}>Personal Information</Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="John Silva"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="07X-XXX-XXXX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* ── Farm Details ── */}
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Farm Details</Text>

            <PickerField
              label="Location (District) *"
              value={location}
              options={DISTRICTS}
              onSelect={setLocation}
            />

            <View style={styles.row}>
              <View style={{ flex: 2, marginRight: 10 }}>
                <Text style={styles.inputLabel}>Farm Size *</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={farmSize}
                    onChangeText={setFarmSize}
                    placeholder="e.g. 2.5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <PickerField
                  label="Unit"
                  value={farmUnit}
                  options={["Acres", "Perch", "Hectares"]}
                  onSelect={setFarmUnit}
                />
              </View>
            </View>

            {/* ── Account ── */}
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min 6 chars"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPass}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? "eye-off" : "eye"} size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Confirm *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                    placeholder="Repeat"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassConfirm(!showPassConfirm)}>
                    <Ionicons name={showPassConfirm ? "eye-off" : "eye"} size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={[styles.registerBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              <LinearGradient
                colors={["#15803D", "#0A331D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.registerBtnText}>Create Account</Text>
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace("/(c02-farming)/login" as any)}>
                <Text style={styles.footerLink}>Log in here</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },

  headerRow: { marginBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },

  brandSection: { alignItems: "center", marginBottom: 24 },
  logoCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: "#F5C542",
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
    shadowColor: "#F5C542",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  brandName: { fontFamily: "Poppins_700Bold", fontSize: 22, color: "white" },
  brandTagline: {
    fontFamily: "Poppins_500Medium", fontSize: 13,
    color: "rgba(255,255,255,0.6)", marginTop: 4, textAlign: "center",
  },

  card: {
    backgroundColor: "white", borderRadius: 24, padding: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },

  errorBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#DC2626", marginLeft: 8, flex: 1 },

  sectionLabel: {
    fontFamily: "Poppins_700Bold", fontSize: 14, color: "#0A331D",
    marginBottom: 14, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: "#DCFCE7",
  },

  row: { flexDirection: "row", marginBottom: 0 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#374151", marginBottom: 6 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    backgroundColor: "#F9FAFB", paddingHorizontal: 10, height: 46,
    marginBottom: 18,
  },
  inputIcon: { marginRight: 6 },
  input: {
    flex: 1, fontFamily: "Poppins_500Medium", fontSize: 13, color: "#1F2937",
  },

  pickerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    backgroundColor: "#F9FAFB", paddingHorizontal: 10, height: 46,
  },
  pickerBtnText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#1F2937" },
  pickerDropdown: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12,
    backgroundColor: "white", maxHeight: 150, marginTop: 4,
  },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 8 },
  pickerOptionActive: { backgroundColor: "#DCFCE7" },
  pickerOptionText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#374151" },
  pickerOptionActiveText: { color: "#15803D", fontFamily: "Poppins_600SemiBold" },

  registerBtn: { marginTop: 8, borderRadius: 14, overflow: "hidden" },
  registerBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 8,
  },
  registerBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "white" },

  footer: {
    flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20,
  },
  footerText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#6B7280" },
  footerLink: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#15803D" },
});
