import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, RefreshControl
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { authService } from "@/services/shared/auth.service";
import { COLORS, getUtilizationColors, getReliabilityColor } from "@/constants/theme";

export default function AuditorDashboard() {
  const [summary, setSummary]       = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [disasters, setDisasters]   = useState<any[]>([]);
  const [user, setUser]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [u, s, w, d] = await Promise.all([
        authService.getStoredUser(),
        api.get("/api/warehouses/summary"),
        api.get("/api/warehouses?limit=50"),
        api.get("/api/disasters?limit=10"),
      ]);
      setUser(u);
      setSummary(s.data.data);
      setWarehouses(w.data.data.items);
      setDisasters(d.data.data.items);
    } catch {
      Alert.alert("Error", "Failed to load audit data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/(c01-warehouse)/(auth)/login" as any);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading audit view...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>Audit View</Text>
            <Text style={styles.headerName}>{user?.fullName}</Text>
            <View style={styles.auditorBadge}>
              <Ionicons name="search" size={11} color={COLORS.infoText} />
              <Text style={styles.auditorBadgeText}>READ ONLY</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.content}>

          {/* Read-only notice */}
          <View style={styles.readOnlyBanner}>
            <Ionicons name="information-circle" size={16} color={COLORS.infoText} />
            <Text style={styles.readOnlyText}>
              You have read-only access. You can view all data and verify document integrity but cannot make changes.
            </Text>
          </View>

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Audit Tools</Text>
          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/(c01-warehouse)/(auditor)/verify-document" as any)}
            >
              <View style={[styles.toolIcon, { backgroundColor: COLORS.infoBg }]}>
                <Ionicons name="shield-checkmark" size={24} color={COLORS.info} />
              </View>
              <Text style={styles.toolTitle}>Verify Document</Text>
              <Text style={styles.toolDesc}>Check SHA-256 tamper detection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolCard}
              onPress={() => router.push("/(c01-warehouse)/(auditor)/blockchain-explorer" as any)}
            >
              <View style={[styles.toolIcon, { backgroundColor: COLORS.successBg }]}>
                <Ionicons name="lock-closed" size={24} color={COLORS.success} />
              </View>
              <Text style={styles.toolTitle}>Blockchain Explorer</Text>
              <Text style={styles.toolDesc}>View on-chain records</Text>
            </TouchableOpacity>
          </View>

          {/* Network summary */}
          {summary && (
            <>
              <Text style={styles.sectionTitle}>Network Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{summary.totalWarehouses}</Text>
                  <Text style={styles.summaryLabel}>Warehouses</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                    {summary.totalStockTons.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryLabel}>Stock (t)</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryValue, {
                    color: summary.openDisasters > 0 ? COLORS.danger : COLORS.success
                  }]}>
                    {summary.openDisasters}
                  </Text>
                  <Text style={styles.summaryLabel}>Open Disasters</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{summary.networkUtilPct}%</Text>
                  <Text style={styles.summaryLabel}>Utilization</Text>
                </View>
              </View>
            </>
          )}

          {/* Warehouses */}
          <Text style={styles.sectionTitle}>Warehouses</Text>
          {warehouses.map((wh) => {
            const util = getUtilizationColors(wh.utilizationPct);
            return (
              <TouchableOpacity
                key={wh.id}
                style={styles.warehouseCard}
                onPress={() => router.push(`/warehouse/${wh.id}` as any)}
              >
                <View style={styles.warehouseHeader}>
                  <View>
                    <Text style={styles.warehouseName}>{wh.name}</Text>
                    <Text style={styles.warehouseSub}>{wh.code} · {wh.district}</Text>
                  </View>
                  <View style={[styles.utilBadge, { backgroundColor: util.badgeBg }]}>
                    <Text style={[styles.utilBadgeText, { color: util.badgeText }]}>
                      {wh.utilizationPct}%
                    </Text>
                  </View>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, {
                    width: `${Math.min(wh.utilizationPct, 100)}%`,
                    backgroundColor: util.bar,
                  }]} />
                </View>
                <View style={styles.warehouseFooter}>
                  <Text style={styles.stockText}>{wh.currentStockTons}t in stock</Text>
                  {wh.reliabilityScore !== null && (
                    <View style={styles.gnnRow}>
                      <Ionicons name="analytics" size={11} color={getReliabilityColor(wh.reliabilityScore)} />
                      <Text style={[styles.gnnText, { color: getReliabilityColor(wh.reliabilityScore) }]}>
                        GNN {(wh.reliabilityScore * 100).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Recent disasters */}
          <Text style={styles.sectionTitle}>Recent Disasters</Text>
          {disasters.length === 0 ? (
            <Text style={styles.emptyText}>No disasters recorded</Text>
          ) : (
            disasters.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.disasterCard}
                onPress={() => router.push(`/disaster/${d.id}` as any)}
              >
                <View style={styles.disasterLeft}>
                  <Text style={styles.disasterType}>
                    {d.disasterType.replace(/_/g, " ")}
                  </Text>
                  <Text style={styles.disasterWh}>{d.affectedWarehouse.name}</Text>
                </View>
                <View style={styles.disasterRight}>
                  <View style={[styles.statusBadge, {
                    backgroundColor:
                      d.status === "OPEN" ? COLORS.dangerBg :
                      d.status === "IN_PROGRESS" ? COLORS.warningBg : COLORS.successBg
                  }]}>
                    <Text style={[styles.statusText, {
                      color:
                        d.status === "OPEN" ? COLORS.dangerText :
                        d.status === "IN_PROGRESS" ? COLORS.warningText : COLORS.successText
                    }]}>
                      {d.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push(`/disaster/audit/${d.id}` as any)}
                    style={styles.auditLink}
                  >
                    <Ionicons name="lock-closed" size={12} color={COLORS.info} />
                    <Text style={styles.auditLinkText}>Audit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: COLORS.textFaint, marginTop: 8 },
  scroll:   { flex: 1 },
  content:  { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 20,
  },
  headerTop:    { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerGreeting: { color: COLORS.primaryLight, fontSize: 13 },
  headerName:   { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  auditorBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.infoBg, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
    marginTop: 4, alignSelf: "flex-start", gap: 4,
  },
  auditorBadgeText: { fontSize: 10, fontWeight: "700", color: COLORS.infoText },
  logoutBtn:    { padding: 8 },

  readOnlyBanner: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.infoBg, borderRadius: 12,
    padding: 12, marginBottom: 20, gap: 8,
  },
  readOnlyText: { flex: 1, fontSize: 12, color: COLORS.infoText, lineHeight: 18 },

  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textSecondary, marginBottom: 12, marginTop: 4 },

  toolsGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  toolCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 14,
    padding: 16, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  toolIcon:  { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  toolTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, textAlign: "center" },
  toolDesc:  { fontSize: 11, color: COLORS.textMuted, textAlign: "center", marginTop: 4 },

  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  summaryCard: {
    width: "47%", backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  summaryValue: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  warehouseCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  warehouseHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  warehouseName:   { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  warehouseSub:    { fontSize: 12, color: COLORS.textMuted },
  utilBadge:       { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  utilBadgeText:   { fontSize: 12, fontWeight: "bold" },
  barTrack:        { height: 6, backgroundColor: COLORS.borderLight, borderRadius: 999 },
  barFill:         { height: 6, borderRadius: 999 },
  warehouseFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  stockText:       { fontSize: 11, color: COLORS.textMuted },
  gnnRow:          { flexDirection: "row", alignItems: "center", gap: 4 },
  gnnText:         { fontSize: 11, fontWeight: "600" },

  disasterCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  disasterLeft: { flex: 1 },
  disasterType: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  disasterWh:   { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  disasterRight:{ alignItems: "flex-end", gap: 6 },
  statusBadge:  { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:   { fontSize: 10, fontWeight: "bold" },
  auditLink:    { flexDirection: "row", alignItems: "center", gap: 4 },
  auditLinkText:{ fontSize: 11, color: COLORS.info, fontWeight: "600" },

  emptyText:    { fontSize: 13, color: COLORS.textFaint, marginBottom: 16 },
  bottomSpacer: { height: 40 },
});