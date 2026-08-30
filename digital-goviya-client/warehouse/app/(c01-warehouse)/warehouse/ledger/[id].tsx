import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, RefreshControl
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { COLORS } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LedgerHistoryScreen() {
  const { t } = useLanguage();

  const { id }                      = useLocalSearchParams<{ id: string }>();
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/api/blockchain/warehouses/${id}/history`);
      setData(res.data.data);
    } catch (err: any) {
      Alert.alert(t.warehouse.errors.title, err?.response?.data?.message || t.warehouse.ledger.loadError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t.warehouse.ledger.loading}</Text>
      </View>
    );
  }

  const events: any[] = data?.events ?? [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t.warehouse.ledger.title}</Text>
          <Text style={styles.headerSub}>{data?.warehouse?.name}</Text>
        </View>
        <View style={styles.chainBadge}>
          <Ionicons name="lock-closed" size={11} color={COLORS.info} />
          <Text style={styles.chainBadgeText}>{t.warehouse.ledger.fabric}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.content}>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryTitle}>
                {t.warehouse.ledger.eventsOnChain.replace("{count}", String(events.length))}
              </Text>
            </View>
          </View>

          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⛓</Text>
              <Text style={styles.emptyTitle}>{t.warehouse.ledger.noRecords}</Text>
              <Text style={styles.emptyDesc}>
                {t.warehouse.ledger.noRecordsDesc}
              </Text>
            </View>
          ) : (
            events.map((ev, index) => (
              <View key={ev.id ?? index} style={styles.ledgerCard}>
                <View style={styles.ledgerCardHeader}>
                  <View style={styles.ledgerIndex}>
                    <Text style={styles.ledgerIndexText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.ledgerInfo}>
                    <Text style={styles.ledgerEventType}>
                      {t.warehouse.eventTypes[ev.eventType as keyof typeof t.warehouse.eventTypes] ?? ev.eventType}
                    </Text>
                    <Text style={styles.ledgerTimestamp}>{ev.timestamp}</Text>
                  </View>
                  <Text style={styles.ledgerQty}>{ev.quantityTons}{t.warehouse.units.tonsShort}</Text>
                </View>

                <View style={styles.ledgerFields}>
                  <LedgerField label={t.warehouse.ledger.mspId}    value={ev.reportedByMsp} />
                  <LedgerField label={t.warehouse.ledger.reporter} value={ev.reportedById ? ev.reportedById.slice(0, 16) + "..." : "—"} />
                  <LedgerField label={t.warehouse.ledger.docHash} value={ev.documentHash ? ev.documentHash.slice(0, 20) + "..." : "—"} />
                  {ev.notes && <LedgerField label={t.warehouse.ledger.notes} value={ev.notes} />}
                </View>
              </View>
            ))
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

function LedgerField({ label, value }: { label: string; value: string }) {
  return (
    <View style={fieldStyles.row}>
      <Text style={fieldStyles.label}>{label}</Text>
      <Text style={fieldStyles.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  row:   { flexDirection: "row", paddingVertical: 4 },
  label: { width: 80, fontSize: 11, color: COLORS.textFaint, fontWeight: "600" },
  value: { flex: 1, fontSize: 11, color: COLORS.textMuted, fontFamily: "monospace" },
});

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
  headerInfo:  { flex: 1 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub:   { color: COLORS.primaryLight, fontSize: 12 },
  chainBadge:  {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.infoBg,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, gap: 4,
  },
  chainBadgeText: { fontSize: 11, color: COLORS.info, fontWeight: "600" },

  summaryCard: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.successBg, borderRadius: 12,
    padding: 14, marginBottom: 16, gap: 10,
  },
  summaryText:  { flex: 1 },
  summaryTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.successText },
  summaryDesc:  { fontSize: 12, color: COLORS.successText, marginTop: 4, lineHeight: 18 },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.textSecondary },
  emptyDesc:  { fontSize: 13, color: COLORS.textFaint, textAlign: "center", marginTop: 4 },

  ledgerCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  ledgerCardHeader: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 10, gap: 10,
  },
  ledgerIndex:     {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
  ledgerIndexText: { fontSize: 11, fontWeight: "bold", color: COLORS.primaryDark },
  ledgerInfo:      { flex: 1 },
  ledgerEventType: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  ledgerTimestamp: { fontSize: 11, color: COLORS.textFaint },
  ledgerQty:       { fontSize: 15, fontWeight: "bold", color: COLORS.primary },

  ledgerFields: {
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 8,
  },

  bottomSpacer: { height: 40 },
});