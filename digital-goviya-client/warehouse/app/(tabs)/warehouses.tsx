import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { warehouseService, Warehouse } from "../../services/warehouse.service";
import {
  COLORS,
  getUtilizationColors,
  getReliabilityColor,
} from "../../constants/theme";
import { router } from "expo-router";

export default function WarehousesScreen() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await warehouseService.listWarehouses();
      setWarehouses(data);
    } catch {
      Alert.alert("Error", "Failed to load warehouses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warehouses</Text>
        <Text style={styles.headerSubtitle}>
          {warehouses.length} active warehouses
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        {warehouses.map((wh) => {
          const util = getUtilizationColors(wh.utilizationPct);
          return (
            <TouchableOpacity
              key={wh.id}
              style={styles.card}
              onPress={() => router.push(`/warehouse/${wh.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.warehouseName}>{wh.name}</Text>
                  <Text style={styles.warehouseSubtitle}>
                    {wh.code} · {wh.district}
                  </Text>
                </View>
                <View
                  style={[styles.utilBadge, { backgroundColor: util.badgeBg }]}
                >
                  <Text
                    style={[styles.utilBadgeText, { color: util.badgeText }]}
                  >
                    {wh.utilizationPct}% full
                  </Text>
                </View>
              </View>

              {/* Utilization bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(wh.utilizationPct, 100)}%`,
                      backgroundColor: util.bar,
                    },
                  ]}
                />
              </View>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Stock</Text>
                  <Text style={styles.statValue}>{wh.currentStockTons} t</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Available</Text>
                  <Text style={[styles.statValue, { color: COLORS.info }]}>
                    {wh.availableTons} t
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Capacity</Text>
                  <Text style={styles.statValue}>{wh.capacityTons} t</Text>
                </View>
                {wh.reliabilityScore !== null && (
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>GNN Score</Text>
                    <View style={styles.gnnRow}>
                      <Ionicons
                        name={
                          wh.reliabilityScore > 0.7
                            ? "shield-checkmark"
                            : "warning"
                        }
                        size={12}
                        color={getReliabilityColor(wh.reliabilityScore)}
                      />
                      <Text
                        style={[
                          styles.gnnValue,
                          { color: getReliabilityColor(wh.reliabilityScore) },
                        ]}
                      >
                        {(wh.reliabilityScore * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgScreen,
  },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: COLORS.primaryLight, fontSize: 14 },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderInfo: { flex: 1 },
  warehouseName: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: 16,
  },
  warehouseSubtitle: { color: COLORS.textMuted, fontSize: 12 },
  utilBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  utilBadgeText: { fontSize: 12, fontWeight: "bold" },

  progressTrack: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 999,
    height: 8,
    marginBottom: 12,
  },
  progressFill: { height: 8, borderRadius: 999 },

  statsRow: { flexDirection: "row" },
  statItem: { flex: 1 },
  statLabel: { color: COLORS.textFaint, fontSize: 12 },
  statValue: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },

  gnnRow: { flexDirection: "row", alignItems: "center" },
  gnnValue: { fontSize: 14, fontWeight: "600", marginLeft: 4 },

  bottomSpacer: { height: 32 },
});
