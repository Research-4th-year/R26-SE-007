import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, RefreshControl
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../services/api";
import { COLORS, DISASTER_ICONS } from "../../../constants/theme";

interface TimelineEntry {
  eventType:   string;
  timestamp:   string;
  actor:       string;
  description: string;
  metadata:    Record<string, any>;
}

interface AuditSummary {
  totalRedistributionOrders:   number;
  totalQuantityRedistributed:  number;
  zkpProofsSubmitted:          number;
  zkpProofsVerified:           number;
  blockchainAnchored:          boolean;
}

interface AuditData {
  disaster: {
    id:                string;
    disasterType:      string;
    status:            string;
    occurredAt:        string;
    resolvedAt:        string | null;
    affectedWarehouse: { id: string; name: string; code: string; district: string };
    reportedBy:        { id: string; fullName: string; role: string };
    blockchainTxId:    string | null;
  };
  summary:  AuditSummary;
  timeline: TimelineEntry[];
}

const EVENT_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  DISASTER_REPORTED:         { icon: "warning",          color: COLORS.danger,  bg: COLORS.dangerBg  },
  ZKP_PROOF_SUBMITTED:       { icon: "shield-checkmark", color: COLORS.info,    bg: COLORS.infoBg    },
  REDISTRIBUTION_ORDER_ISSUED:{ icon: "swap-horizontal", color: COLORS.success, bg: COLORS.successBg },
  DISASTER_RESOLVED:         { icon: "checkmark-circle", color: COLORS.success, bg: COLORS.successBg },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AuditTrailScreen() {
  const { id }                      = useLocalSearchParams<{ id: string }>();
  const [data, setData]             = useState<AuditData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/api/disasters/${id}/audit`);
      setData(res.data.data);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to load audit trail");
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
        <Text style={styles.loadingText}>Loading audit trail...</Text>
      </View>
    );
  }

  if (!data) return null;

  const { disaster, summary, timeline } = data;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Blockchain Audit Trail</Text>
          <Text style={styles.headerSub}>{disaster.affectedWarehouse.name}</Text>
        </View>
        {disaster.blockchainTxId && (
          <View style={styles.chainBadge}>
            <Ionicons name="lock-closed" size={12} color={COLORS.info} />
            <Text style={styles.chainBadgeText}>On-chain</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.content}>

          {/* Disaster info card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.bigIcon}>
                {DISASTER_ICONS[disaster.disasterType] ?? "⚠️"}
              </Text>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>
                  {disaster.disasterType.replace(/_/g, " ")}
                </Text>
                <Text style={styles.cardSub}>
                  {disaster.affectedWarehouse.name} · {disaster.affectedWarehouse.district}
                </Text>
                <Text style={styles.cardSub}>
                  Reported by {disaster.reportedBy.fullName}
                </Text>
              </View>
            </View>

            {disaster.blockchainTxId && (
              <View style={styles.txRow}>
                <Ionicons name="lock-closed" size={12} color={COLORS.info} />
                <Text style={styles.txText} numberOfLines={1}>
                  {disaster.blockchainTxId}
                </Text>
              </View>
            )}
          </View>

          {/* Summary stats */}
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary.totalRedistributionOrders}</Text>
              <Text style={styles.summaryLabel}>Orders Issued</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{summary.totalQuantityRedistributed}</Text>
              <Text style={styles.summaryLabel}>Tons Moved</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: COLORS.info }]}>
                {summary.zkpProofsVerified}/{summary.zkpProofsSubmitted}
              </Text>
              <Text style={styles.summaryLabel}>ZKP Verified</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons
                name={summary.blockchainAnchored ? "shield-checkmark" : "shield-outline"}
                size={22}
                color={summary.blockchainAnchored ? COLORS.success : COLORS.textFaint}
              />
              <Text style={styles.summaryLabel}>
                {summary.blockchainAnchored ? "Anchored" : "Not anchored"}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <Text style={styles.sectionTitle}>Event Timeline</Text>
          <Text style={styles.sectionSub}>
            All events are cryptographically timestamped and immutable on Hyperledger Fabric
          </Text>

          {timeline.map((entry, index) => {
            const cfg = EVENT_ICONS[entry.eventType] ?? {
              icon: "ellipse", color: COLORS.textMuted, bg: COLORS.borderLight,
            };
            const isLast = index === timeline.length - 1;

            return (
              <View key={index} style={styles.timelineRow}>
                {/* Line + dot */}
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
                    <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>

                {/* Content */}
                <View style={[styles.timelineCard, { marginBottom: isLast ? 0 : 16 }]}>
                  <View style={styles.timelineCardHeader}>
                    <Text style={styles.timelineEventType}>
                      {entry.eventType.replace(/_/g, " ")}
                    </Text>
                    <Text style={styles.timelineTime}>{formatDate(entry.timestamp)}</Text>
                  </View>

                  <Text style={styles.timelineDesc}>{entry.description}</Text>
                  <Text style={styles.timelineActor}>by {entry.actor}</Text>

                  {/* Metadata pills */}
                  <View style={styles.metaRow}>
                    {entry.metadata.compositeScore !== undefined && (
                      <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>
                          Score: {Number(entry.metadata.compositeScore).toFixed(3)}
                        </Text>
                      </View>
                    )}
                    {entry.metadata.quantityTons !== undefined && (
                      <View style={styles.metaPill}>
                        <Text style={styles.metaPillText}>
                          {entry.metadata.quantityTons} tons
                        </Text>
                      </View>
                    )}
                    {entry.metadata.verificationResult !== undefined && (
                      <View style={[styles.metaPill, {
                        backgroundColor: entry.metadata.verificationResult
                          ? COLORS.successBg : COLORS.dangerBg
                      }]}>
                        <Text style={[styles.metaPillText, {
                          color: entry.metadata.verificationResult
                            ? COLORS.successText : COLORS.dangerText
                        }]}>
                          ZKP: {entry.metadata.verificationResult ? "VALID" : "INVALID"}
                        </Text>
                      </View>
                    )}
                    {entry.metadata.blockchainTxId && (
                      <View style={[styles.metaPill, { backgroundColor: COLORS.infoBg }]}>
                        <Ionicons name="lock-closed" size={10} color={COLORS.info} />
                        <Text style={[styles.metaPillText, { color: COLORS.infoText, marginLeft: 4 }]}>
                          On-chain
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
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
  screen:  { flex: 1, backgroundColor: COLORS.bgScreen },
  centered:{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bgScreen },
  loadingText: { color: COLORS.textFaint, marginTop: 8 },
  scroll:  { flex: 1 },
  content: { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    flexDirection: "row", alignItems: "center",
  },
  backBtn:       { marginRight: 12 },
  headerContent: { flex: 1 },
  headerTitle:   { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub:     { color: COLORS.primaryLight, fontSize: 12 },
  chainBadge:    {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.infoBg,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
  },
  chainBadgeText: { color: COLORS.info, fontSize: 11, marginLeft: 4, fontWeight: "600" },

  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 16,
    marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  cardRow:  { flexDirection: "row", alignItems: "flex-start" },
  bigIcon:  { fontSize: 32, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle:{ fontSize: 16, fontWeight: "bold", color: COLORS.textPrimary },
  cardSub:  { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  txRow:    {
    flexDirection: "row", alignItems: "center",
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  txText: { fontSize: 11, color: COLORS.info, marginLeft: 6, flex: 1, fontFamily: "monospace" },

  sectionTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.textSecondary, marginBottom: 4 },
  sectionSub:   { fontSize: 12, color: COLORS.textFaint, marginBottom: 16 },

  summaryGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24,
  },
  summaryCard: {
    width: "47%", backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  summaryValue: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, textAlign: "center" },

  timelineRow:  { flexDirection: "row" },
  timelineLeft: { alignItems: "center", marginRight: 12, width: 32 },
  timelineDot:  {
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: COLORS.borderLight,
    marginTop: 4, marginBottom: 0,
  },
  timelineCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  timelineCardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 6,
  },
  timelineEventType: {
    fontSize: 12, fontWeight: "700", color: COLORS.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.5, flex: 1,
  },
  timelineTime: { fontSize: 11, color: COLORS.textFaint, marginLeft: 8 },
  timelineDesc: { fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 },
  timelineActor:{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  metaPill: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.borderLight,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  metaPillText: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },

  bottomSpacer: { height: 40 },
});