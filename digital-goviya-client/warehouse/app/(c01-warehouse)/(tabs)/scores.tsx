import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, StyleSheet
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { COLORS, getReliabilityColor } from "@/constants/theme";

interface WarehouseScore {
  warehouseId:      string;
  reliabilityScore: number;
  anomalyFlags:     string[];
  isAnomalous:      boolean;
}

interface ScoreWithWarehouse extends WarehouseScore {
  warehouseName:    string;
  warehouseCode:    string;
  warehouseDistrict:string;
}

export default function ScoresScreen() {
  const [scores, setScores]         = useState<ScoreWithWarehouse[]>([]);
  const [warehouses, setWarehouses] = useState<Record<string, any>>({});
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingScores, setRefreshingScores] = useState(false);

  const load = async () => {
    try {
      const [scoresRes, warehousesRes] = await Promise.all([
        api.get("/api/scores"),
        api.get("/api/warehouses?limit=50"),
      ]);

      const warehouseMap: Record<string, any> = {};
      for (const wh of warehousesRes.data.data.items) {
        warehouseMap[wh.id] = wh;
      }
      setWarehouses(warehouseMap);

      const rawScores = scoresRes.data.data;
      const enriched: ScoreWithWarehouse[] = Object.entries(rawScores).map(
        ([id, score]: [string, any]) => ({
          ...score,
          warehouseName:     warehouseMap[id]?.name    ?? "Unknown",
          warehouseCode:     warehouseMap[id]?.code    ?? "—",
          warehouseDistrict: warehouseMap[id]?.district ?? "—",
        })
      );

      // Sort: anomalous first, then by score ascending (lowest trust first)
      enriched.sort((a, b) => {
        if (a.isAnomalous !== b.isAnomalous) return a.isAnomalous ? -1 : 1;
        return a.reliabilityScore - b.reliabilityScore;
      });

      setScores(enriched);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load scores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefreshScores = async () => {
    setRefreshingScores(true);
    try {
      await api.post("/api/scores/refresh");
      await load();
      Alert.alert("Done", "Scores refreshed successfully");
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to refresh scores");
    } finally {
      setRefreshingScores(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading scores...</Text>
      </View>
    );
  }

  const anomalousCount = scores.filter(s => s.isAnomalous).length;
  const avgScore = scores.length
    ? scores.reduce((sum, s) => sum + s.reliabilityScore, 0) / scores.length
    : 0;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Reliability Scores</Text>
          <Text style={styles.headerSub}>Anomaly detection</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, refreshingScores && styles.refreshBtnDisabled]}
          onPress={handleRefreshScores}
          disabled={refreshingScores}
        >
          {refreshingScores
            ? <ActivityIndicator size="small" color={COLORS.white} />
            : <Ionicons name="refresh" size={18} color={COLORS.white} />
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.content}>

          {/* Network health summary */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{scores.length}</Text>
              <Text style={styles.summaryLabel}>Warehouses</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                {(avgScore * 100).toFixed(0)}%
              </Text>
              <Text style={styles.summaryLabel}>Avg Score</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryValue, {
                color: anomalousCount > 0 ? COLORS.danger : COLORS.success
              }]}>
                {anomalousCount}
              </Text>
              <Text style={styles.summaryLabel}>Anomalous</Text>
            </View>
          </View>

          {/* Explanation */}
          <View style={styles.explainCard}>
            <Ionicons name="information-circle" size={16} color={COLORS.info} />
            <Text style={styles.explainText}>
              Scores below 40% indicate anomalous
              behavior 
            </Text>
          </View>

          {/* Score list */}
          {scores.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🤖</Text>
              <Text style={styles.emptyTitle}>No scores yet</Text>
              <Text style={styles.emptyText}>
                Tap the refresh button to run GNN inference
              </Text>
            </View>
          ) : (
            scores.map((s, index) => {
              const scoreColor  = getReliabilityColor(s.reliabilityScore);
              const scorePct    = Math.round(s.reliabilityScore * 100);
              const barColor    = s.isAnomalous ? COLORS.danger : scoreColor;

              return (
                <View key={s.warehouseId} style={[styles.scoreCard, s.isAnomalous && styles.scoreCardAnomalous]}>
                  <View style={styles.scoreCardHeader}>
                    {/* Rank + name */}
                    <View style={styles.scoreCardLeft}>
                      <View style={[styles.rankBadge, { backgroundColor: s.isAnomalous ? COLORS.dangerBg : COLORS.successBg }]}>
                        <Text style={[styles.rankText, { color: s.isAnomalous ? COLORS.dangerText : COLORS.successText }]}>
                          #{index + 1}
                        </Text>
                      </View>
                      <View style={styles.scoreCardInfo}>
                        <Text style={styles.warehouseName}>{s.warehouseName}</Text>
                        <Text style={styles.warehouseSub}>{s.warehouseCode} · {s.warehouseDistrict}</Text>
                      </View>
                    </View>

                    {/* Score */}
                    <View style={styles.scoreRight}>
                      <Text style={[styles.scoreValue, { color: scoreColor }]}>
                        {scorePct}%
                      </Text>
                      {s.isAnomalous && (
                        <View style={styles.anomalousBadge}>
                          <Ionicons name="warning" size={10} color={COLORS.dangerText} />
                          <Text style={styles.anomalousBadgeText}>ANOMALOUS</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Score bar */}
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, {
                      width: `${scorePct}%`,
                      backgroundColor: barColor,
                    }]} />
                  </View>

                  {/* Anomaly flags */}
                  {s.anomalyFlags && s.anomalyFlags.length > 0 && (
                    <View style={styles.flagsRow}>
                      {s.anomalyFlags.map((flag) => (
                        <View key={flag} style={styles.flagPill}>
                          <Text style={styles.flagText}>
                            {flag.replace(/_/g, " ")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* GNN confidence note */}
                  <Text style={styles.scoreNote}>
                    {s.reliabilityScore > 0.8
                      ? "Normal behavior pattern"
                      : s.reliabilityScore > 0.6
                      ? "Slightly elevated risk"
                      : s.reliabilityScore > 0.4
                      ? "Moderate anomaly signals"
                      : "High anomaly risk — review recommended"}
                  </Text>
                </View>
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
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.bgScreen },
  loadingText: { color: COLORS.textFaint, marginTop: 8 },
  scroll:   { flex: 1 },
  content:  { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub:   { color: COLORS.primaryLight, fontSize: 12, marginTop: 2 },
  refreshBtn:  {
    backgroundColor: COLORS.primary,
    borderRadius: 999, width: 36, height: 36,
    alignItems: "center", justifyContent: "center",
  },
  refreshBtnDisabled: { backgroundColor: COLORS.primaryMuted },

  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 14, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  summaryValue: { fontSize: 22, fontWeight: "bold", color: COLORS.textPrimary },
  summaryLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },

  explainCard: {
    flexDirection: "row", backgroundColor: COLORS.infoBg,
    borderRadius: 12, padding: 12, marginBottom: 20, gap: 8,
  },
  explainText: { flex: 1, fontSize: 12, color: COLORS.infoText, lineHeight: 18 },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.textSecondary },
  emptyText:  { fontSize: 13, color: COLORS.textFaint, marginTop: 4, textAlign: "center" },

  scoreCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 16,
    marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  scoreCardAnomalous: {
    borderWidth: 1.5, borderColor: COLORS.danger,
  },
  scoreCardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 12,
  },
  scoreCardLeft:  { flexDirection: "row", alignItems: "center", flex: 1 },
  rankBadge:      {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  rankText:       { fontSize: 11, fontWeight: "bold" },
  scoreCardInfo:  { flex: 1 },
  warehouseName:  { fontSize: 14, fontWeight: "bold", color: COLORS.textPrimary },
  warehouseSub:   { fontSize: 12, color: COLORS.textMuted },
  scoreRight:     { alignItems: "flex-end" },
  scoreValue:     { fontSize: 22, fontWeight: "bold" },
  anomalousBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.dangerBg,
    borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, gap: 3,
  },
  anomalousBadgeText: { fontSize: 9, fontWeight: "bold", color: COLORS.dangerText },

  barTrack: {
    height: 8, backgroundColor: COLORS.borderLight,
    borderRadius: 999, marginBottom: 10,
  },
  barFill: { height: 8, borderRadius: 999 },

  flagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  flagPill: {
    backgroundColor: COLORS.dangerBg, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  flagText: { fontSize: 10, color: COLORS.dangerText, fontWeight: "600" },

  scoreNote:    { fontSize: 11, color: COLORS.textFaint, fontStyle: "italic" },
  bottomSpacer: { height: 40 },
});