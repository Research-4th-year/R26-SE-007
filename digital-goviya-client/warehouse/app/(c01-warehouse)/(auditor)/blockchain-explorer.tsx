import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, RefreshControl
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { COLORS } from "@/constants/theme";

export default function BlockchainExplorerScreen() {
  const [status, setStatus]         = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [disasters, setDisasters]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [statusRes, whRes, dRes] = await Promise.all([
        api.get("/api/blockchain/status"),
        api.get("/api/warehouses?limit=50"),
        api.get("/api/disasters?limit=20"),
      ]);
      setStatus(statusRes.data.data);
      setWarehouses(whRes.data.data.items);
      setDisasters(dRes.data.data.items);
    } catch {
      Alert.alert("Error", "Failed to load blockchain data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Connecting to Fabric network...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Blockchain Explorer</Text>
          <Text style={styles.headerSub}>Hyperledger Fabric · warehousechannel</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.content}>

          {/* Network status */}
          {status && (
            <View style={styles.networkCard}>
              <View style={styles.networkRow}>
                <View style={[styles.statusDot, {
                  backgroundColor: status.status === "connected" ? COLORS.success : COLORS.danger
                }]} />
                <Text style={styles.networkStatus}>
                  {status.status === "connected" ? "Network Connected" : "Network Offline"}
                </Text>
              </View>
              <Text style={styles.networkSub}>
                Channel: {status.network} · Chaincode: {status.chaincode}
              </Text>
              <View style={styles.anchoredRow}>
                <View style={styles.anchoredStat}>
                  <Text style={styles.anchoredValue}>{status.anchored?.stockEvents ?? 0}</Text>
                  <Text style={styles.anchoredLabel}>Stock Events</Text>
                </View>
                <View style={styles.anchoredStat}>
                  <Text style={styles.anchoredValue}>{status.anchored?.disasters ?? 0}</Text>
                  <Text style={styles.anchoredLabel}>Disasters</Text>
                </View>
                <View style={styles.anchoredStat}>
                  <Text style={styles.anchoredValue}>{status.anchored?.redistributionOrders ?? 0}</Text>
                  <Text style={styles.anchoredLabel}>Orders</Text>
                </View>
                <View style={styles.anchoredStat}>
                  <Text style={styles.anchoredValue}>{status.anchored?.total ?? 0}</Text>
                  <Text style={styles.anchoredLabel}>Total</Text>
                </View>
              </View>
            </View>
          )}

          {/* Warehouse ledger history */}
          <Text style={styles.sectionTitle}>Warehouse Ledger Records</Text>
          {warehouses.map((wh) => (
            <TouchableOpacity
              key={wh.id}
              style={styles.explorerCard}
              onPress={() => router.push(`/warehouse/ledger/${wh.id}` as any)}
            >
              <View style={styles.explorerLeft}>
                <Ionicons name="business" size={18} color={COLORS.primary} />
                <View>
                  <Text style={styles.explorerName}>{wh.name}</Text>
                  <Text style={styles.explorerSub}>{wh.code} · {wh.district}</Text>
                </View>
              </View>
              <View style={styles.explorerRight}>
                <Text style={styles.explorerEvents}>{wh.eventCount} events</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textFaint} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Disaster audit trails */}
          <Text style={styles.sectionTitle}>Disaster Audit Trails</Text>
          {disasters.length === 0 ? (
            <Text style={styles.emptyText}>No disaster records</Text>
          ) : (
            disasters.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={styles.explorerCard}
                onPress={() => router.push(`/disaster/audit/${d.id}` as any)}
              >
                <View style={styles.explorerLeft}>
                  <Ionicons name="warning" size={18} color={COLORS.danger} />
                  <View>
                    <Text style={styles.explorerName}>
                      {d.disasterType.replace(/_/g, " ")}
                    </Text>
                    <Text style={styles.explorerSub}>{d.affectedWarehouse.name}</Text>
                  </View>
                </View>
                <View style={styles.explorerRight}>
                  <View style={[styles.statusPill, {
                    backgroundColor:
                      d.status === "OPEN" ? COLORS.dangerBg :
                      d.status === "IN_PROGRESS" ? COLORS.warningBg : COLORS.successBg
                  }]}>
                    <Text style={[styles.statusPillText, {
                      color:
                        d.status === "OPEN" ? COLORS.dangerText :
                        d.status === "IN_PROGRESS" ? COLORS.warningText : COLORS.successText
                    }]}>
                      {d.status.replace(/_/g, " ")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textFaint} />
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
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    flexDirection: "row", alignItems: "center",
  },
  backBtn:     { marginRight: 12 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub:   { color: COLORS.primaryLight, fontSize: 12 },

  networkCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  networkRow:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  statusDot:    { width: 10, height: 10, borderRadius: 5 },
  networkStatus:{ fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  networkSub:   { fontSize: 12, color: COLORS.textMuted, marginBottom: 14 },
  anchoredRow:  { flexDirection: "row", justifyContent: "space-around", paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  anchoredStat: { alignItems: "center" },
  anchoredValue:{ fontSize: 20, fontWeight: "bold", color: COLORS.primary },
  anchoredLabel:{ fontSize: 10, color: COLORS.textFaint, marginTop: 2 },

  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textSecondary, marginBottom: 10, marginTop: 4 },

  explorerCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  explorerLeft:   { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  explorerName:   { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  explorerSub:    { fontSize: 11, color: COLORS.textMuted },
  explorerRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  explorerEvents: { fontSize: 12, color: COLORS.textFaint },

  statusPill:     { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  statusPillText: { fontSize: 10, fontWeight: "bold" },

  emptyText:    { fontSize: 13, color: COLORS.textFaint, marginBottom: 16 },
  bottomSpacer: { height: 40 },
});