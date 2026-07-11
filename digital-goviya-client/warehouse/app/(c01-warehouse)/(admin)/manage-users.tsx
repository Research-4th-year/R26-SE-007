import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, RefreshControl
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { COLORS } from "@/constants/theme";

interface User {
  id:          string;
  email:       string;
  fullName:    string;
  role:        string;
  isActive:    boolean;
  warehouseId: string | null;
  warehouse:   { id: string; name: string; code: string; district: string } | null;
  createdAt:   string;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  ADMIN:                { bg: "#EDE9FE", text: "#5B21B6" },
  REGIONAL_MANAGER:     { bg: COLORS.infoBg, text: COLORS.infoText },
  WAREHOUSE_SUPERVISOR: { bg: COLORS.warningBg, text: COLORS.warningText },
  AUDITOR:              { bg: COLORS.borderLight, text: COLORS.textMuted },
};

export default function ManageUsersScreen() {
  const [users, setUsers]           = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [usersRes, whRes] = await Promise.all([
        api.get("/api/users"),
        api.get("/api/warehouses?limit=50"),
      ]);
      setUsers(usersRes.data.data);
      setWarehouses(whRes.data.data.items);
    } catch {
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleReassign = (user: User) => {
    if (user.role !== "WAREHOUSE_SUPERVISOR") {
      Alert.alert("Not applicable", "Only Warehouse Supervisors can be assigned to a warehouse");
      return;
    }

    // Build action sheet options from warehouses
    const options = warehouses.map(wh => ({
      text: `${wh.name} (${wh.code})`,
      onPress: async () => {
        try {
          await api.patch(`/api/users/${user.id}`, { warehouseId: wh.id });
          Alert.alert("Reassigned", `${user.fullName} is now assigned to ${wh.name}`);
          load();
        } catch (err: any) {
          Alert.alert("Error", err?.response?.data?.message || "Failed to reassign");
        }
      },
    }));

    Alert.alert(
      `Reassign ${user.fullName}`,
      `Currently: ${user.warehouse?.name ?? "Unassigned"}\n\nSelect new warehouse:`,
      [
        ...options,
        { text: "Unassign", style: "destructive", onPress: async () => {
          try {
            await api.patch(`/api/users/${user.id}`, { warehouseId: null });
            Alert.alert("Unassigned", `${user.fullName} has been unassigned`);
            load();
          } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Failed to unassign");
          }
        }},
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleToggleActive = (user: User) => {
    Alert.alert(
      user.isActive ? "Deactivate User" : "Reactivate User",
      `${user.isActive ? "Deactivate" : "Reactivate"} ${user.fullName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: user.isActive ? "Deactivate" : "Reactivate",
          style: user.isActive ? "destructive" : "default",
          onPress: async () => {
            try {
              await api.patch(`/api/users/${user.id}`, { isActive: !user.isActive });
              load();
            } catch (err: any) {
              Alert.alert("Error", err?.response?.data?.message || "Failed to update");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const grouped = {
    ADMIN:                users.filter(u => u.role === "ADMIN"),
    REGIONAL_MANAGER:     users.filter(u => u.role === "REGIONAL_MANAGER"),
    WAREHOUSE_SUPERVISOR: users.filter(u => u.role === "WAREHOUSE_SUPERVISOR"),
    AUDITOR:              users.filter(u => u.role === "AUDITOR"),
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Manage Users</Text>
          <Text style={styles.headerSub}>{users.length} registered users</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.content}>
          {Object.entries(grouped).map(([role, roleUsers]) => {
            if (roleUsers.length === 0) return null;
            const colors = ROLE_COLORS[role];
            return (
              <View key={role} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.rolePill, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.rolePillText, { color: colors.text }]}>
                      {role.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <Text style={styles.roleCount}>{roleUsers.length}</Text>
                </View>

                {roleUsers.map((user) => (
                  <View key={user.id} style={[styles.userCard, !user.isActive && styles.userCardInactive]}>
                    <View style={styles.userCardTop}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.userName, !user.isActive && styles.userNameInactive]}>
                            {user.fullName}
                          </Text>
                          {!user.isActive && (
                            <View style={styles.inactiveBadge}>
                              <Text style={styles.inactiveBadgeText}>INACTIVE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userEmail}>{user.email}</Text>
                        {user.warehouse && (
                          <View style={styles.warehouseTag}>
                            <Ionicons name="business" size={11} color={COLORS.info} />
                            <Text style={styles.warehouseTagText}>
                              {user.warehouse.name} ({user.warehouse.code})
                            </Text>
                          </View>
                        )}
                        {role === "WAREHOUSE_SUPERVISOR" && !user.warehouse && (
                          <View style={styles.unassignedTag}>
                            <Ionicons name="warning" size={11} color={COLORS.warning} />
                            <Text style={styles.unassignedTagText}>No warehouse assigned</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                      {role === "WAREHOUSE_SUPERVISOR" && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleReassign(user)}
                        >
                          <Ionicons name="swap-horizontal" size={14} color={COLORS.info} />
                          <Text style={styles.actionBtnText}>Reassign</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionBtn, user.isActive ? styles.actionBtnDanger : styles.actionBtnSuccess]}
                        onPress={() => handleToggleActive(user)}
                      >
                        <Ionicons
                          name={user.isActive ? "person-remove" : "person-add"}
                          size={14}
                          color={user.isActive ? COLORS.danger : COLORS.success}
                        />
                        <Text style={[styles.actionBtnText, {
                          color: user.isActive ? COLORS.danger : COLORS.success
                        }]}>
                          {user.isActive ? "Deactivate" : "Reactivate"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll:   { flex: 1 },
  content:  { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    flexDirection: "row", alignItems: "center",
  },
  backBtn:     { marginRight: 12 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub:   { color: COLORS.primaryLight, fontSize: 12 },

  section:       { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  rolePill:      { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  rolePillText:  { fontSize: 12, fontWeight: "700" },
  roleCount:     { fontSize: 12, color: COLORS.textFaint },

  userCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  userCardInactive: { opacity: 0.6 },
  userCardTop:  { flexDirection: "row", gap: 12, marginBottom: 12 },
  avatar:       {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  avatarText:   { fontSize: 18, fontWeight: "bold", color: COLORS.primaryDark },
  userInfo:     { flex: 1 },
  nameRow:      { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  userName:     { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  userNameInactive: { color: COLORS.textFaint },
  userEmail:    { fontSize: 12, color: COLORS.textMuted },

  inactiveBadge:     { backgroundColor: COLORS.dangerBg, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  inactiveBadgeText: { fontSize: 9, fontWeight: "bold", color: COLORS.dangerText },

  warehouseTag: {
    flexDirection: "row", alignItems: "center",
    gap: 4, marginTop: 4,
  },
  warehouseTagText: { fontSize: 11, color: COLORS.info },

  unassignedTag: {
    flexDirection: "row", alignItems: "center",
    gap: 4, marginTop: 4,
  },
  unassignedTagText: { fontSize: 11, color: COLORS.warning },

  actions: {
    flexDirection: "row", gap: 8,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    paddingTop: 10,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6,
    backgroundColor: COLORS.infoBg,
    borderRadius: 8, paddingVertical: 8,
  },
  actionBtnDanger:  { backgroundColor: COLORS.dangerBg },
  actionBtnSuccess: { backgroundColor: COLORS.successBg },
  actionBtnText:    { fontSize: 12, fontWeight: "600", color: COLORS.info },

  bottomSpacer: { height: 40 },
});