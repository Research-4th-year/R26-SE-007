import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import {
  COLORS,
  getUtilizationColors,
  getReliabilityColor,
} from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";
import { authService } from "@/services/shared/auth.service";

interface StockEvent {
  id: string;
  eventType: string;
  quantityTons: number;
  notes: string | null;
  documentHash: string | null;
  blockchainTxId: string | null;
  timestamp: string;
  reportedBy: { fullName: string; role: string };
}

const EVENT_COLORS: Record<string, { bg: string; text: string; icon: string }> =
  {
    INFLOW: { bg: "#DCFCE7", text: "#15803D", icon: "arrow-down-circle" },
    OUTFLOW: { bg: "#FEE2E2", text: "#B91C1C", icon: "arrow-up-circle" },
    REDISTRIBUTION: { bg: "#EFF6FF", text: "#1D4ED8", icon: "swap-horizontal" },
    DAMAGE: { bg: "#FEF3C7", text: "#A16207", icon: "warning" },
    ADJUSTMENT: { bg: "#F3F4F6", text: "#374151", icon: "pencil" },
  };

const EVENT_TYPE_FILTER_KEYS = [
  "ALL",
  "INFLOW",
  "OUTFLOW",
  "REDISTRIBUTION",
  "DAMAGE",
  "ADJUSTMENT",
] as const;

export default function WarehouseDetailScreen() {
  const { t } = useLanguage();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [warehouse, setWarehouse] = useState<any>(null);
  const [events, setEvents] = useState<StockEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [deactivating, setDeactivating] = useState(false);

  const loadWarehouse = async () => {
    const res = await api.get(`/api/warehouses/${id}`);
    setWarehouse(res.data.data);
  };

  const loadEvents = async (p = 1, append = false) => {
    const typeParam = filter !== "ALL" ? `&eventType=${filter}` : "";
    const res = await api.get(
      `/api/warehouses/${id}/stock-events?page=${p}&limit=15${typeParam}`,
    );
    const data = res.data.data;
    setTotalPages(data.totalPages);
    setEvents((prev) => (append ? [...prev, ...data.items] : data.items));
  };

const load = async () => {
  try {
    const [, , u] = await Promise.all([
      loadWarehouse(),
      loadEvents(1),
      authService.getStoredUser(),
    ]);
    setUser(u);
  } catch {
    Alert.alert(t.warehouse.errors.title, t.warehouse.warehouses.loadError);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!loading) {
      setPage(1);
      loadEvents(1).catch(() => {});
    }
  }, [filter]);

  const handleLoadMore = async () => {
    if (page >= totalPages || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await loadEvents(next, true);
    setLoadingMore(false);
  };

  const handleRecordEvent = () => {
    router.push({
      pathname: "/(c01-warehouse)/(supervisor)/record-event" as any,
      params: { warehouseId: id, warehouseName: warehouse?.name },
    });
  };

  const handleViewOnChain = () => {
    router.push(`/warehouse/ledger/${id}` as any);
  };

  const getFilterLabel = (f: string): string => {
    if (f === "ALL") return t.warehouse.status.all;
    return t.warehouse.eventTypes[f as keyof typeof t.warehouse.eventTypes] ?? f;
  };

  const handleDeactivate = () => {
  Alert.alert(
    "Deactivate Warehouse",
    `${warehouse.name} (${warehouse.code}) will be removed from disaster ranking and GNN scoring.\n\nStock history and blockchain records are preserved.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          setDeactivating(true);
          try {
            await api.delete(`/api/warehouses/${id}`);
            Alert.alert("Deactivated", `${warehouse.code} is no longer active.`, [
              { text: "Done", onPress: () => router.back() },
            ]);
          } catch (err: any) {
            Alert.alert(
              t.warehouse.errors.title,
              err?.response?.data?.message ?? "Failed to deactivate warehouse"
            );
          } finally {
            setDeactivating(false);
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
        <Text style={styles.loadingText}>{t.warehouse.warehouses.loadingWarehouse}</Text>
      </View>
    );
  }

  if (!warehouse) return null;

  const util = getUtilizationColors(warehouse.utilizationPct ?? 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {warehouse.name}
          </Text>
          <Text style={styles.headerSub}>
            {warehouse.code} · {warehouse.district}
          </Text>
        </View>
        <TouchableOpacity onPress={handleViewOnChain} style={styles.chainBtn}>
          <Ionicons name="lock-closed" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
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
        <View style={styles.content}>
          {/* Stock overview */}
          <View style={styles.overviewCard}>
            <View style={styles.statRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>
                  {warehouse.currentStockTons}
                </Text>
                <Text style={styles.statLabel}>{t.warehouse.warehouses.stock} ({t.warehouse.units.tonsShort})</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: COLORS.info }]}>
                  {warehouse.availableTons}
                </Text>
                <Text style={styles.statLabel}>{t.warehouse.warehouses.available} ({t.warehouse.units.tonsShort})</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{warehouse.capacityTons}</Text>
                <Text style={styles.statLabel}>{t.warehouse.warehouses.capacity} ({t.warehouse.units.tonsShort})</Text>
              </View>
            </View>

            {/* Utilization bar */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(warehouse.utilizationPct ?? 0, 100)}%`,
                    backgroundColor: util.bar,
                  },
                ]}
              />
            </View>
            <View style={styles.barLabels}>
              <Text style={[styles.utilLabel, { color: util.text }]}>
                {t.warehouse.warehouses.utilized.replace("{percent}", String(warehouse.utilizationPct))}
              </Text>
              <Text style={styles.totalEvents}>
                {t.warehouse.warehouses.totalEvents.replace("{count}", String(warehouse.totalEvents))}
              </Text>
            </View>
          </View>

          {/* GNN + supervisors row */}
          <View style={styles.infoRow}>
            {warehouse.latestScore && (
              <View style={styles.infoCard}>
                <Ionicons name="analytics" size={16} color={COLORS.info} />
                <View style={styles.infoCardText}>
                  <Text style={styles.infoCardLabel}>{t.warehouse.warehouses.gnnScore}</Text>
                  <Text
                    style={[
                      styles.infoCardValue,
                      {
                        color: getReliabilityColor(
                          warehouse.latestScore.reliabilityScore,
                        ),
                      },
                    ]}
                  >
                    {t.warehouse.warehouses.reliable.replace("{percent}", (warehouse.latestScore.reliabilityScore * 100).toFixed(0))}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.infoCard}>
              <Ionicons name="people" size={16} color={COLORS.primary} />
              <View style={styles.infoCardText}>
                <Text style={styles.infoCardLabel}>{t.warehouse.warehouses.supervisors}</Text>
                <Text style={styles.infoCardValue}>
                  {t.warehouse.warehouses.supervisorsAssigned.replace("{count}", String(warehouse.supervisors?.length ?? 0))}
                </Text>
              </View>
            </View>
          </View>

          {/* Supervisors list */}
          {warehouse.supervisors?.length > 0 && (
            <View style={styles.supervisorsCard}>
              {warehouse.supervisors.map((sup: any) => (
                <View key={sup.id} style={styles.supervisorRow}>
                  <View style={styles.supervisorAvatar}>
                    <Text style={styles.supervisorAvatarText}>
                      {sup.fullName.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.supervisorName}>{sup.fullName}</Text>
                    <Text style={styles.supervisorEmail}>{sup.email}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleRecordEvent}
            >
              <Ionicons name="add-circle" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>{t.warehouse.warehouses.recordEvent}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: COLORS.info }]}
              onPress={handleViewOnChain}
            >
              <Ionicons name="lock-closed" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>{t.warehouse.warehouses.ledgerHistory}</Text>
            </TouchableOpacity>
          </View>

          {/* Event filter tabs */}
          <Text style={styles.sectionTitle}>{t.warehouse.warehouses.stockEvents}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {EVENT_TYPE_FILTER_KEYS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterPill,
                  filter === f && styles.filterPillActive,
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filter === f && styles.filterPillTextActive,
                  ]}
                >
                  {getFilterLabel(f)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Events list */}
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>{t.warehouse.warehouses.noEventsFound}</Text>
            </View>
          ) : (
            events.map((ev) => {
              const cfg = EVENT_COLORS[ev.eventType] ?? EVENT_COLORS.ADJUSTMENT;
              const isOutgoing = [
                "OUTFLOW",
                "REDISTRIBUTION",
                "DAMAGE",
                "ADJUSTMENT",
              ].includes(ev.eventType);
              return (
                <TouchableOpacity
                  key={ev.id}
                  style={styles.eventCard}
                  onPress={() =>
                    router.push({
                      pathname:
                        "/(c01-warehouse)/(supervisor)/event-detail" as any,
                      params: { eventId: ev.id, warehouseId: id },
                    })
                  }
                >
                  <View style={[styles.eventIcon, { backgroundColor: cfg.bg }]}>
                    <Ionicons
                      name={cfg.icon as any}
                      size={18}
                      color={cfg.text}
                    />
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventType}>
                      {t.warehouse.eventTypes[ev.eventType as keyof typeof t.warehouse.eventTypes] ?? ev.eventType}
                    </Text>
                    <Text style={styles.eventReporter}>
                      {ev.reportedBy.fullName} ·{" "}
                      {t.warehouse.roles[ev.reportedBy.role as keyof typeof t.warehouse.roles] ?? ev.reportedBy.role}
                    </Text>
                    <Text style={styles.eventTime}>
                      {new Date(ev.timestamp).toLocaleDateString("en-US", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {ev.notes && (
                      <Text style={styles.eventNotes} numberOfLines={1}>
                        {ev.notes}
                      </Text>
                    )}
                  </View>
                  <View style={styles.eventRight}>
                    <Text style={[styles.eventQty, { color: cfg.text }]}>
                      {isOutgoing ? "-" : "+"}
                      {ev.quantityTons}{t.warehouse.units.tonsShort}
                    </Text>
                    <View style={styles.eventBadges}>
                      {ev.documentHash && (
                        <Ionicons
                          name="document"
                          size={12}
                          color={COLORS.info}
                        />
                      )}
                      {ev.blockchainTxId && (
                        <Ionicons
                          name="lock-closed"
                          size={12}
                          color={COLORS.success}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Load more */}
          {page < totalPages && (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Text style={styles.loadMoreText}>{t.warehouse.warehouses.loadMore}</Text>
              )}
            </TouchableOpacity>
          )}

          {user?.role === "ADMIN" && (
  <View style={styles.dangerZone}>
    <Text style={styles.dangerTitle}>Admin Actions</Text>
    <Text style={styles.dangerNote}>
      Deactivating removes this warehouse from active operations. Stock
      history and on-chain records are retained.
    </Text>
    <TouchableOpacity
      style={[styles.dangerBtn, deactivating && styles.btnDisabled]}
      onPress={handleDeactivate}
      disabled={deactivating}
    >
      {deactivating ? (
        <ActivityIndicator size="small" color={COLORS.danger} />
      ) : (
        <>
          <Ionicons name="archive-outline" size={16} color={COLORS.danger} />
          <Text style={styles.dangerBtnText}>Deactivate Warehouse</Text>
        </>
      )}
    </TouchableOpacity>
  </View>
)}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: COLORS.textFaint, marginTop: 8 },
  scroll: { flex: 1 },
  content: { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub: { color: COLORS.primaryLight, fontSize: 12 },
  chainBtn: { padding: 8 },

  overviewCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  stat: { alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.borderLight },
  barTrack: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: 999,
  },
  barFill: { height: 8, borderRadius: 999 },
  barLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  utilLabel: { fontSize: 12, fontWeight: "600" },
  totalEvents: { fontSize: 11, color: COLORS.textFaint },

  infoRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  infoCardText: { flex: 1 },
  infoCardLabel: { fontSize: 11, color: COLORS.textMuted },
  infoCardValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 2,
  },

  supervisorsCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  supervisorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  supervisorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  supervisorAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primaryDark,
  },
  supervisorName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  supervisorEmail: { fontSize: 11, color: COLORS.textMuted },

  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 13 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 10,
  },

  filterScroll: { marginBottom: 12 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.bgCard,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: { fontSize: 12, color: COLORS.textMuted, fontWeight: "500" },
  filterPillTextActive: { color: COLORS.white },

  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13, color: COLORS.textFaint },

  eventCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  eventInfo: { flex: 1 },
  eventType: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  eventReporter: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  eventTime: { fontSize: 10, color: COLORS.textFaint, marginTop: 2 },
  eventNotes: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    fontStyle: "italic",
  },
  eventRight: { alignItems: "flex-end", gap: 4 },
  eventQty: { fontSize: 15, fontWeight: "bold" },
  eventBadges: { flexDirection: "row", gap: 4 },

  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    marginBottom: 8,
  },
  loadMoreText: { color: COLORS.primary, fontWeight: "600", fontSize: 13 },

  bottomSpacer: { height: 40 },

  dangerZone: {
  marginTop: 24,
  padding: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: COLORS.dangerBg,
  backgroundColor: COLORS.bgCard,
},
dangerTitle: {
  fontSize: 13,
  fontWeight: "700",
  color: COLORS.dangerText,
  marginBottom: 4,
},
dangerNote: {
  fontSize: 11,
  color: COLORS.textMuted,
  lineHeight: 16,
  marginBottom: 12,
},
dangerBtn: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  paddingVertical: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: COLORS.danger,
  backgroundColor: COLORS.dangerBg,
},
dangerBtnText: {
  color: COLORS.danger,
  fontWeight: "700",
  fontSize: 13,
},
btnDisabled: { opacity: 0.5 },

});