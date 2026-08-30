import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { COLORS } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventDetailScreen() {
  const { t } = useLanguage();

  const { eventId, warehouseId } = useLocalSearchParams<{
    eventId:     string;
    warehouseId: string;
  }>();

  const [event, setEvent]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/blockchain/stock-events/${eventId}`)
      .then((res) => setEvent(res.data.data))
      .catch(() => Alert.alert(t.warehouse.errors.title, t.warehouse.eventDetail.loadError))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!event) return null;

  const { ledger, database, integrity } = event;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t.warehouse.eventDetail.title}</Text>
          <Text style={styles.headerSub}>{database?.warehouse?.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.content}>

          {/* Integrity banner */}
          <View style={[styles.integrityBanner, {
            backgroundColor: integrity.hashMatch ? COLORS.successBg : COLORS.dangerBg
          }]}>
            <Ionicons
              name={integrity.hashMatch ? "shield-checkmark" : "warning"}
              size={20}
              color={integrity.hashMatch ? COLORS.success : COLORS.danger}
            />
            <Text style={[styles.integrityText, {
              color: integrity.hashMatch ? COLORS.successText : COLORS.dangerText
            }]}>
              {integrity.message}
            </Text>
          </View>

          {/* Database record */}
          <Text style={styles.sectionTitle}>{t.warehouse.eventDetail.stockEvent}</Text>
          <View style={styles.card}>
            <Row label={t.warehouse.eventDetail.type}      value={t.warehouse.eventTypes[database?.eventType as keyof typeof t.warehouse.eventTypes] ?? database?.eventType} />
            <Row label={t.warehouse.eventDetail.quantity}  value={`${database?.quantityTons} ${t.warehouse.units.tons}`} />
            <Row label={t.warehouse.eventDetail.recorded}  value={new Date(database?.timestamp).toLocaleString()} />
            <Row label={t.warehouse.eventDetail.by}        value={database?.reportedBy?.fullName} />
            {database?.notes && <Row label={t.warehouse.eventDetail.notes} value={database.notes} />}
          </View>

          {/* Document hash */}
          {database?.documentHash && (
            <>
              <Text style={styles.sectionTitle}>{t.warehouse.eventDetail.documentHash}</Text>
              <View style={styles.card}>
                <Text style={styles.hashText}>{database.documentHash}</Text>
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={() => router.push({
                      pathname: "/(c01-warehouse)/(supervisor)/upload-document" as any,
                    params: { eventId, warehouseId, verifyMode: "true" }
                  })}
                >
                  <Ionicons name="search" size={14} color={COLORS.info} />
                  <Text style={styles.verifyBtnText}>{t.warehouse.eventDetail.verifyIntegrity}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Blockchain record */}
          {ledger && (
            <>
              <Text style={styles.sectionTitle}>{t.warehouse.eventDetail.blockchainRecord}</Text>
              <View style={styles.card}>
                <Row label={t.warehouse.eventDetail.assetType}  value={ledger.assetType} />
                <Row label={t.warehouse.eventDetail.reportedByMsp} value={ledger.reportedByMsp} />
                <Row label={t.warehouse.eventDetail.timestamp}   value={ledger.timestamp} />
                <Row label={t.warehouse.eventDetail.docHash}    value={ledger.documentHash?.slice(0, 20) + "..."} />
              </View>
            </>
          )}

          {/* Attach document button */}
          {!database?.documentHash && (
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => router.push({
                  pathname: "/(c01-warehouse)/(supervisor)/upload-document" as any,
                params: { eventId, warehouseId }
              })}
            >
              <Ionicons name="document" size={18} color={COLORS.white} />
              <Text style={styles.attachBtnText}>{t.warehouse.eventDetail.attachReceipt}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row:   { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  label: { width: 120, fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  value: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
});

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

  integrityBanner: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 12, padding: 12, marginBottom: 16, gap: 10,
  },
  integrityText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },

  sectionTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.textSecondary, marginBottom: 8, marginTop: 4 },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  hashText: {
    fontSize: 11, color: COLORS.textMuted, fontFamily: "monospace",
    lineHeight: 18, marginBottom: 10,
  },
  verifyBtn: {
    flexDirection: "row", alignItems: "center",
    gap: 6, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  verifyBtnText: { fontSize: 12, color: COLORS.info, fontWeight: "600" },

  attachBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  attachBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 15 },
  bottomSpacer:  { height: 40 },
});