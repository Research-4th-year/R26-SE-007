import { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { COLORS } from "../../constants/theme";

const ROLES = [
  { value: "REGIONAL_MANAGER",     label: "Regional Manager",     icon: "person-circle",   desc: "Can trigger disasters and issue redistribution orders" },
  { value: "WAREHOUSE_SUPERVISOR", label: "Warehouse Supervisor",  icon: "business",        desc: "Records stock events for their assigned warehouse" },
  { value: "AUDITOR",              label: "Auditor",               icon: "search",          desc: "Read-only access to all data and blockchain trails" },
  { value: "ADMIN",                label: "Admin",                 icon: "shield-checkmark",desc: "Full system access including user and warehouse management" },
];

export default function RegisterUserScreen() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [fullName, setFullName]   = useState("");
  const [role, setRole]           = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [warehouses, setWarehouses]   = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    api.get("/api/warehouses?limit=50").then((res) => {
      setWarehouses(res.data.data.items);
    });
  }, []);

  const handleSubmit = async () => {
    if (!email.trim())    { Alert.alert("Required", "Enter email address"); return; }
    if (!password.trim()) { Alert.alert("Required", "Enter password"); return; }
    if (!fullName.trim()) { Alert.alert("Required", "Enter full name"); return; }
    if (!role)            { Alert.alert("Required", "Select a role"); return; }
    if (role === "WAREHOUSE_SUPERVISOR" && !warehouseId) {
      Alert.alert("Required", "Select a warehouse for this supervisor");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/auth/register", {
        email:       email.trim().toLowerCase(),
        password,
        fullName:    fullName.trim(),
        role,
        warehouseId: role === "WAREHOUSE_SUPERVISOR" ? warehouseId : undefined,
      });
      Alert.alert("User Created", `${fullName} has been registered as ${role.replace(/_/g, " ")}`, [
        { text: "Done", onPress: () => router.back() },
        { text: "Add Another", onPress: () => {
          setEmail(""); setPassword(""); setFullName("");
          setRole(""); setWarehouseId("");
        }},
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to register user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Register User</Text>
          <Text style={styles.headerSub}>Admin only</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>

          {/* Basic info */}
          <Text style={styles.sectionTitle}>👤 User Details</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Nimal Perera"
            placeholderTextColor={COLORS.textFaint}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. nimal@pmb.lk"
            placeholderTextColor={COLORS.textFaint}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password *</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              placeholderTextColor={COLORS.textFaint}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.passwordHint}>
            e.g. PMBStaff@123
          </Text>

          {/* Role selection */}
          <Text style={styles.sectionTitle}>🎭 Role</Text>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
              onPress={() => { setRole(r.value); setWarehouseId(""); }}
            >
              <View style={[styles.roleIconBox, { backgroundColor: role === r.value ? COLORS.primaryLight : COLORS.borderLight }]}>
                <Ionicons
                  name={r.icon as any}
                  size={20}
                  color={role === r.value ? COLORS.primaryDark : COLORS.textMuted}
                />
              </View>
              <View style={styles.roleInfo}>
                <Text style={[styles.roleLabel, role === r.value && styles.roleLabelSelected]}>
                  {r.label}
                </Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </View>
              {role === r.value && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}

          {/* Warehouse selector — only for supervisors */}
          {role === "WAREHOUSE_SUPERVISOR" && (
            <>
              <Text style={styles.sectionTitle}>🏭 Assign Warehouse *</Text>
              <Text style={styles.hint}>Supervisors can only record events for their assigned warehouse</Text>
              {warehouses.map((wh) => (
                <TouchableOpacity
                  key={wh.id}
                  style={[styles.warehouseRow, warehouseId === wh.id && styles.warehouseRowSelected]}
                  onPress={() => setWarehouseId(wh.id)}
                >
                  <View style={styles.warehouseInfo}>
                    <Text style={styles.warehouseName}>{wh.name}</Text>
                    <Text style={styles.warehouseSub}>{wh.code} · {wh.district}</Text>
                  </View>
                  {warehouseId === wh.id && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name="person-add" size={20} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>Register User</Text>
                </>
            }
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bgScreen },
  scroll:  { flex: 1 },
  content: { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    flexDirection: "row", alignItems: "center",
  },
  backBtn:     { marginRight: 12 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub:   { color: COLORS.primaryLight, fontSize: 12 },

  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textSecondary, marginTop: 20, marginBottom: 8 },
  hint:         { fontSize: 12, color: COLORS.textFaint, marginBottom: 10 },
  label:        { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 4, marginTop: 10 },

  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary,
    backgroundColor: COLORS.bgCard, marginBottom: 4,
  },

  passwordRow: {
    flexDirection: "row", borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, backgroundColor: COLORS.bgCard, marginBottom: 4,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary,
  },
  eyeBtn:       { padding: 12, justifyContent: "center" },
  passwordHint: { fontSize: 11, color: COLORS.textFaint, marginBottom: 4 },

  roleCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 14, marginBottom: 8, gap: 12,
    borderWidth: 1.5, borderColor: "transparent",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  roleCardSelected: { borderColor: COLORS.primary, backgroundColor: "#F0FDF4" },
  roleIconBox:      { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  roleInfo:         { flex: 1 },
  roleLabel:        { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  roleLabelSelected:{ color: COLORS.primaryDark },
  roleDesc:         { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  warehouseRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 10,
    padding: 12, marginBottom: 8, borderWidth: 1.5,
    borderColor: "transparent",
  },
  warehouseRowSelected: { borderColor: COLORS.primary, backgroundColor: "#F0FDF4" },
  warehouseInfo:        { flex: 1 },
  warehouseName:        { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  warehouseSub:         { fontSize: 11, color: COLORS.textMuted },

  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 24,
  },
  submitBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  btnDisabled:   { opacity: 0.6 },
  bottomSpacer:  { height: 40 },
});