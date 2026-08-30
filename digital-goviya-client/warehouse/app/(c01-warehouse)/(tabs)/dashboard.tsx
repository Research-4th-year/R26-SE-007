import { useEffect, useRef, useState } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  warehouseService,
  NetworkSummary,
  Warehouse,
} from "@/services/warehouse/warehouse.service";
import { authService } from "@/services/shared/auth.service";
import {
  COLORS,
  getUtilizationColors,
  getReliabilityColor,
} from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";


export default function DashboardScreen() {
  const { t } = useLanguage();

  const [summary, setSummary] = useState<NetworkSummary | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const loadingRef = useRef(false);

  const load = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const [s, w, u] = await Promise.all([
        warehouseService.getSummary(),
        warehouseService.listWarehouses(),
        authService.getStoredUser(),
      ]);
      setSummary(s);
      setWarehouses(w);
      setUser(u);
    } catch (err: any) {
      Alert.alert(t.warehouse.errors.title, t.warehouse.dashboard.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Redirect supervisors to their own warehouse view
  useEffect(() => {
    authService.getStoredUser().then((u) => {
      if (u?.role === "WAREHOUSE_SUPERVISOR") {
        router.replace("/(c01-warehouse)/(supervisor)/my-warehouse" as any);
      } else if (u?.role === "AUDITOR") {
        router.replace("/(c01-warehouse)/(auditor)/dashboard" as any);
      }
    });
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/(c01-warehouse)/(auth)/login" as any);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t.warehouse.dashboard.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>{t.warehouse.dashboard.welcomeBack}</Text>
            <Text style={styles.headerName}>{user?.fullName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {user?.role ? t.warehouse.roles[user.role as keyof typeof t.warehouse.roles] : ""}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Alert banner if open disasters */}
        {summary && summary.openDisasters > 0 && (
          <TouchableOpacity
            style={styles.disasterBanner}
            onPress={() => router.push("/(c01-warehouse)/(tabs)/disasters" as any)}
          >
            <Ionicons name="warning" size={20} color={COLORS.white} />
            <Text style={styles.disasterBannerText} numberOfLines={1}>
              {(summary.openDisasters > 1
                ? t.warehouse.dashboard.activeDisasters
                : t.warehouse.dashboard.activeDisaster
              ).replace("{count}", String(summary.openDisasters))}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.white}
              style={styles.disasterBannerChevron}
            />
          </TouchableOpacity>
        )}

        {/* Network Summary Cards */}
        {summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.warehouse.dashboard.networkOverview}</Text>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t.warehouse.dashboard.totalCapacity}</Text>
                <Text style={styles.statValue}>
                  {summary.totalCapacityTons.toLocaleString()}
                </Text>
                <Text style={styles.statUnit}>{t.warehouse.units.tons}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t.warehouse.dashboard.currentStock}</Text>
                <Text style={[styles.statValue, { color: COLORS.success }]}>
                  {summary.totalStockTons.toLocaleString()}
                </Text>
                <Text style={styles.statUnit}>{t.warehouse.units.tons}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t.warehouse.dashboard.available}</Text>
                <Text style={[styles.statValue, { color: COLORS.info }]}>
                  {summary.totalAvailableTons.toLocaleString()}
                </Text>
                <Text style={styles.statUnit}>{t.warehouse.units.tons}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>{t.warehouse.dashboard.utilization}</Text>
                <Text
                  style={[
                    styles.statValue,
                    {
                      color:
                        summary.networkUtilPct > 80
                          ? COLORS.danger
                          : COLORS.textPrimary,
                    },
                  ]}
                >
                  {summary.networkUtilPct}%
                </Text>
                <Text style={styles.statUnit}>{t.warehouse.dashboard.networkWide}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t.warehouse.dashboard.quickActions}</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.danger }]}
            onPress={() => router.push("/(c01-warehouse)/(tabs)/disasters" as any)}
          >
            <Ionicons name="warning" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText} numberOfLines={1}>{t.warehouse.disasters.title}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.info }]}
            onPress={() => router.push("/(c01-warehouse)/(tabs)/warehouses" as any)}
          >
            <Ionicons name="business" size={24} color={COLORS.white} />
            <Text style={styles.actionButtonText} numberOfLines={1}>{t.warehouse.warehouses.title}</Text>
          </TouchableOpacity>
        </View>

        {/* Warehouse List */}
        <Text style={styles.sectionTitle}>
          {t.warehouse.dashboard.warehousesCount.replace("{count}", String(warehouses.length))}
        </Text>
        {warehouses.map((wh) => {
          const util = getUtilizationColors(wh.utilizationPct);
          return (
            <TouchableOpacity
              key={wh.id}
              style={styles.warehouseCard}
              onPress={() => router.push(`/warehouse/${wh.id}` as any)}
            >
              <View style={styles.warehouseCardHeader}>
                <View style={styles.warehouseCardInfo}>
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
                    {wh.utilizationPct}%
                  </Text>
                </View>
              </View>

              {/* Stock bar */}
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

              <View style={styles.warehouseCardFooter}>
                <Text style={styles.stockText}>
                  {t.warehouse.dashboard.tonsInStock.replace("{tons}", String(wh.currentStockTons))}
                </Text>
                {wh.reliabilityScore !== null && (
                  <Text
                    style={[
                      styles.gnnText,
                      { color: getReliabilityColor(wh.reliabilityScore) },
                    ]}
                  >
                    {t.warehouse.dashboard.gnnScore.replace("{score}", (wh.reliabilityScore * 100).toFixed(0))}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
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
  loadingText: { color: COLORS.textFaint, marginTop: 8 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerGreeting: { color: COLORS.primaryLight, fontSize: 14 },
  headerName: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  roleBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  roleBadgeText: { color: COLORS.primaryLight, fontSize: 12, lineHeight: 18 },
  logoutButton: { padding: 8 },

  content: { paddingHorizontal: 16, marginTop: -16 },

  disasterBanner: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  disasterBannerText: {
    color: COLORS.white,
    fontWeight: "bold",
    marginLeft: 8,
    flex: 1,
  },
  disasterBannerChevron: { marginLeft: "auto" },

  section: { marginBottom: 16 },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },

  statRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statLabel: { color: COLORS.textMuted, fontSize: 12 },
  statValue: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "bold" },
  statUnit: { color: COLORS.textFaint, fontSize: 12 },

  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 4,
  },

  warehouseCard: {
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
  warehouseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  warehouseCardInfo: { flex: 1 },
  warehouseName: { color: COLORS.textPrimary, fontWeight: "bold" },
  warehouseSubtitle: { color: COLORS.textMuted, fontSize: 12 },
  utilBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  utilBadgeText: { fontSize: 12, fontWeight: "bold" },

  progressTrack: {
    marginTop: 12,
    backgroundColor: COLORS.borderLight,
    borderRadius: 999,
    height: 8,
  },
  progressFill: { height: 8, borderRadius: 999 },

  warehouseCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  stockText: { color: COLORS.textMuted, fontSize: 12 },
  gnnText: { fontSize: 12, fontWeight: "500" },

  bottomSpacer: { height: 32 },
});