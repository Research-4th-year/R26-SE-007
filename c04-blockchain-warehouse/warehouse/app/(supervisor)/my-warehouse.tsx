import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, RefreshControl
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { authService } from "../../services/auth.service";
import { COLORS, getUtilizationColors } from "../../constants/theme";


interface StockEvent {
  id:           string;
  eventType:    string;
  quantityTons: number;
  notes:        string | null;
  documentHash: string | null;
  blockchainTxId: string | null;
  timestamp:    string;
  reportedBy:   { fullName: string };
}

const EVENT_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  INFLOW:         { bg: "#DCFCE7", text: "#15803D", icon: "arrow-down-circle"  },
  OUTFLOW:        { bg: "#FEE2E2", text: "#B91C1C", icon: "arrow-up-circle"    },
  REDISTRIBUTION: { bg: "#EFF6FF", text: "#1D4ED8", icon: "swap-horizontal"    },
  DAMAGE:         { bg: "#FEF3C7", text: "#A16207", icon: "warning"             },
  ADJUSTMENT:     { bg: "#F3F4F6", text: "#374151", icon: "pencil"              },
};

export default function MyWarehouseScreen() {
  const [warehouse, setWarehouse] = useState<any>(null);
  const [events, setEvents]       = useState<StockEvent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const user = await authService.getStoredUser();
      if (!user?.warehouseId) {
        Alert.alert("Error", "No warehouse assigned to your account");
        return;
      }
      const [whRes, evRes] = await Promise.all([
        api.get(`/api/warehouses/${user.warehouseId}`),
        api.get(`/api/warehouses/${user.warehouseId}/stock-events?limit=20`),
      ]);
      setWarehouse(whRes.data.data);
      setEvents(evRes.data.data.items);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load warehouse data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
  await authService.logout();
  router.replace("/(auth)/login");
};

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading warehouse...</Text>
      </View>
    );
  }

  if (!warehouse) return null;

  const util = getUtilizationColors(warehouse.utilizationPct ?? 0);

  return (
    <View style={styles.screen}>
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>{warehouse.name}</Text>
        <Text style={styles.headerSub}>{warehouse.code} · {warehouse.district}</Text>
      </View> */}
      <View style={styles.header}>
  <View style={styles.headerRow}>
    <View>
      <Text style={styles.headerTitle}>{warehouse.name}</Text>
      <Text style={styles.headerSub}>{warehouse.code} · {warehouse.district}</Text>
    </View>
    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
      <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
    </TouchableOpacity>
  </View>
</View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.content}>

          {/* Stock overview */}
          <View style={styles.overviewCard}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{warehouse.currentStockTons}</Text>
                <Text style={styles.statLabel}>Current (t)</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: COLORS.info }]}>
                  {warehouse.availableTons}
                </Text>
                <Text style={styles.statLabel}>Available (t)</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{warehouse.capacityTons}</Text>
                <Text style={styles.statLabel}>Capacity (t)</Text>
              </View>
            </View>

            <View style={styles.barTrack}>
              <View style={[styles.barFill, {
                width: `${Math.min(warehouse.utilizationPct ?? 0, 100)}%`,
                backgroundColor: util.bar,
              }]} />
            </View>
            <Text style={[styles.utilText, { color: util.text }]}>
              {warehouse.utilizationPct}% utilized
            </Text>

            {warehouse.latestScore && (
              <View style={styles.gnnRow}>
                <Ionicons name="analytics" size={14} color={COLORS.info} />
                <Text style={styles.gnnText}>
                  GNN Reliability: {(warehouse.latestScore.reliabilityScore * 100).toFixed(0)}%
                </Text>
              </View>
            )}
          </View>

          {/* Record stock event button */}
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={() => router.push({
              pathname: "/(supervisor)/record-event" as any,
              params: { warehouseId: warehouse.id, warehouseName: warehouse.name }
            })}
          >
            <Ionicons name="add-circle" size={20} color={COLORS.white} />
            <Text style={styles.recordBtnText}>Record Stock Event</Text>
          </TouchableOpacity>

          {/* Recent events */}
          <Text style={styles.sectionTitle}>Recent Events</Text>
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No events recorded yet</Text>
            </View>
          ) : (
            events.map((ev) => {
              const cfg = EVENT_COLORS[ev.eventType] ?? EVENT_COLORS.ADJUSTMENT;
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.eventCard}
                  onPress={() => router.push({
                    pathname: "/(supervisor)/event-detail" as any,
                    params: { eventId: ev.id, warehouseId: warehouse.id }
                  })}
                >
                  <View style={[styles.eventIcon, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={18} color={cfg.text} />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventType}>{ev.eventType}</Text>
                    <Text style={styles.eventNotes} numberOfLines={1}>
                      {ev.notes ?? "No notes"}
                    </Text>
                    <Text style={styles.eventTime}>
                      {new Date(ev.timestamp).toLocaleDateString("en-US", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </Text>
                  </View>
                  <View style={styles.eventRight}>
                    <Text style={[styles.eventQty, { color: cfg.text }]}>
                      {["OUTFLOW","REDISTRIBUTION","DAMAGE"].includes(ev.eventType) ? "-" : "+"}
                      {ev.quantityTons}t
                    </Text>
                    <View style={styles.eventBadges}>
                      {ev.documentHash && (
                        <Ionicons name="document" size={12} color={COLORS.info} />
                      )}
                      {ev.blockchainTxId && (
                        <Ionicons name="lock-closed" size={12} color={COLORS.success} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
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
  paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
},
headerRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
headerSub:   { color: COLORS.primaryLight, fontSize: 13, marginTop: 2 },
logoutButton:{ padding: 8 },

  overviewCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  statRow:   { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  stat:      { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  barTrack: { height: 8, backgroundColor: COLORS.borderLight, borderRadius: 999 },
  barFill:  { height: 8, borderRadius: 999 },
  utilText: { fontSize: 12, fontWeight: "600", marginTop: 6, textAlign: "right" },

  gnnRow:  { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 6 },
  gnnText: { fontSize: 12, color: COLORS.info, fontWeight: "500" },

  recordBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginBottom: 20,
  },
  recordBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 15 },

  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textSecondary, marginBottom: 12 },

  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyIcon:  { fontSize: 36, marginBottom: 8 },
  emptyText:  { fontSize: 13, color: COLORS.textFaint },

  eventCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 12, marginBottom: 8, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  eventIcon:   { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  eventInfo:   { flex: 1 },
  eventType:   { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  eventNotes:  { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  eventTime:   { fontSize: 10, color: COLORS.textFaint, marginTop: 2 },
  eventRight:  { alignItems: "flex-end", gap: 4 },
  eventQty:    { fontSize: 14, fontWeight: "bold" },
  eventBadges: { flexDirection: "row", gap: 4 },

  bottomSpacer: { height: 40 },
});