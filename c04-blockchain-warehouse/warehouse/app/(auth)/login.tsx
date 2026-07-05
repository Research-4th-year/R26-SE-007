import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Login failed. Check your credentials.";
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🌾</Text>
          </View>
          <Text style={styles.appName}>Paddy Warehouse</Text>
          <Text style={styles.appSub}>PMB Coordination System</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>Sign In</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
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
              : <Text style={styles.buttonText}>Sign In</Text>
            }
          </TouchableOpacity>

          <Text style={styles.footer}>PMB Regional Warehouse Coordination</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#15803D" },
  scroll:       { flexGrow: 1 },
  header:       { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingTop: 80, paddingBottom: 32 },
  iconCircle:   { width: 80, height: 80, borderRadius: 40, backgroundColor: "white", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  icon:         { fontSize: 36 },
  appName:      { color: "white", fontSize: 28, fontWeight: "bold", textAlign: "center" },
  appSub:       { color: "#BBF7D0", fontSize: 14, textAlign: "center", marginTop: 4 },
  form:         { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  title:        { fontSize: 24, fontWeight: "bold", color: "#1F2937", marginBottom: 24 },
  label:        { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 },
  input:        { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: "#1F2937", backgroundColor: "#F9FAFB", marginBottom: 16 },
  button:       { backgroundColor: "#16A34A", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  buttonDisabled: { backgroundColor: "#86EFAC" },
  buttonText:   { color: "white", fontSize: 16, fontWeight: "bold" },
  footer:       { textAlign: "center", color: "#9CA3AF", fontSize: 13, marginTop: 24 },
});
