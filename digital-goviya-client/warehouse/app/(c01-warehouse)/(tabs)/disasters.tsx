import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, StyleSheet
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { disasterService, Disaster } from "@/services/warehouse/disaster.service";
import { COLORS, getStatusColors, DISASTER_ICONS } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

const FILTER_KEYS = [undefined, "OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export default function DisastersScreen() {
  const { t } = useLanguage();

  const [disasters, setDisasters]   = useState<Disaster[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<string | undefined>(undefined);

  const load = async () => {
    try {
      const data = await disasterService.listDisasters(filter);
      setDisasters(data);
    } catch {
      Alert.alert(t.warehouse.errors.title, t.warehouse.disasters.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const getFilterLabel = (s: string | undefined): string => {
    if (!s) return t.warehouse.status.all;
    return t.warehouse.status[s as keyof typeof t.warehouse.status] ?? s;
  };

  const getStatusLabel = (s: string): string => {
    return t.warehouse.status[s as keyof typeof t.warehouse.status] ?? s;
  };

  const getDisasterTypeLabel = (dtype: string): string => {
    return t.warehouse.disasterTypes[dtype as keyof typeof t.warehouse.disasterTypes] ?? dtype;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.warehouse.disasters.title}</Text>
        <Text style={styles.headerSubtitle}>{t.warehouse.disasters.subtitle}</Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTER_KEYS.map((s) => {
          const active = filter === s;
          return (
            <TouchableOpacity
              key={s ?? "ALL"}
              onPress={() => setFilter(s)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {getFilterLabel(s)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.listContent}>
          {disasters.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyTitle}>{t.warehouse.disasters.noneFound}</Text>
              <Text style={styles.emptySubtitle}>
                {filter
                  ? t.warehouse.disasters.noneWithStatus.replace("{status}", getFilterLabel(filter).toLowerCase())
                  : t.warehouse.disasters.allClear}
              </Text>
            </View>
          ) : (
            disasters.map((d) => {
              const status = getStatusColors(d.status);
              return (
                <TouchableOpacity
                  key={d.id}
                  style={styles.card}
                  onPress={() => router.push(`/disaster/${d.id}`)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.disasterIcon}>{DISASTER_ICONS[d.disasterType] ?? "⚠️"}</Text>
                      <View style={styles.cardHeaderInfo}>
                        <Text style={styles.disasterType}>{getDisasterTypeLabel(d.disasterType)}</Text>
                        <Text style={styles.warehouseName}>{d.affectedWarehouse.name}</Text>
                        <Text style={styles.warehouseDistrict}>{d.affectedWarehouse.district}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: status.text }]}>
                        {getStatusLabel(d.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.cardFooterItem}>
                      <Text style={styles.footerLabel}>{t.warehouse.disasters.estimatedLoss}</Text>
                      <Text style={styles.footerValue}>
                        {d.estimatedLossTons ?? "—"} {t.warehouse.units.tons}
                      </Text>
                    </View>
                    <View style={styles.cardFooterItem}>
                      <Text style={styles.footerLabel}>{t.warehouse.disasters.reportedBy}</Text>
                      <Text style={styles.footerValue}>{d.reportedBy.fullName}</Text>
                    </View>
                    <View style={styles.cardFooterEnd}>
                      {d.blockchainTxId ? (
                        <View style={styles.onChainBadge}>
                          <Ionicons name="lock-closed" size={10} color={COLORS.info} />
                          <Text style={styles.onChainText}>{t.warehouse.disasters.onChain}</Text>
                        </View>
                      ) : (
                        <Text style={styles.notAnchoredText}>{t.warehouse.disasters.notAnchored}</Text>
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

      {/* FAB — create disaster */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/create-disaster")}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bgScreen },

  header: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: COLORS.primaryLight, fontSize: 14 },

  filterRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.bgCard, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  filterChip: { marginRight: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: COLORS.borderLight },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 12, fontWeight: "500", color: COLORS.textMuted },
  filterChipTextActive: { color: COLORS.white },

  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { color: COLORS.textSecondary, fontWeight: "500" },
  emptySubtitle: { color: COLORS.textFaint, fontSize: 14 },

  card: { backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  cardHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  disasterIcon: { fontSize: 24, marginRight: 12 },
  cardHeaderInfo: { flex: 1 },
  disasterType: { color: COLORS.textPrimary, fontWeight: "bold" },
  warehouseName: { color: COLORS.textMuted, fontSize: 12 },
  warehouseDistrict: { color: COLORS.textFaint, fontSize: 12 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: "bold" },

  cardFooter: { flexDirection: "row", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cardFooterItem: { flex: 1 },
  cardFooterEnd: { alignItems: "flex-end" },
  footerLabel: { color: COLORS.textFaint, fontSize: 12 },
  footerValue: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "500" },

  onChainBadge: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.infoBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  onChainText: { color: COLORS.info, fontSize: 12, marginLeft: 4 },
  notAnchoredText: { color: COLORS.textDisabled, fontSize: 12 },

  bottomSpacer: { height: 32 },

  fab: { position: "absolute", bottom: 24, right: 24, backgroundColor: COLORS.danger, width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
});