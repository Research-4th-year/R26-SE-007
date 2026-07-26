import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { FERTILIZER_GUIDE, FertilizerGuideItem } from "@/constants/farming/fertilizerData";
import { SensorCard } from "@/components/farming/SensorCard";
import { getLatestData, autoPredict } from "@/services/farming/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

const DEFAULT_NPK = { N: 55, P: 35, K: 45 };
const DEFAULT_SENSORS = { temperature: 28.5, humidity: 75, rain: 5, soil1: 40, soil2: 45 };

function getNpkStatus(npk: { N: number; P: number; K: number }) {
  if (npk.N < 50) return { label: "Low Nitrogen", color: COLORS.warning };
  if (npk.P < 30) return { label: "Low Phosphorus", color: COLORS.danger };
  if (npk.K < 30) return { label: "Low Potassium", color: COLORS.info };
  return { label: "Balanced", color: COLORS.success };
}

function calcAdjustedDose(item: FertilizerGuideItem, npk: { N: number; P: number; K: number }) {
  const val = item.id === "urea" ? npk.N : item.id === "tsp" ? npk.P : npk.K;
  const threshold = item.id === "urea" ? 50 : 30;
  const base = parseInt(item.historicalDose.split("–")[0].replace(/[^0-9]/g, ""), 10);
  return val < threshold ? Math.round(base * 1.15) : Math.round(base * 0.95);
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function FertilizerGuidanceScreen() {
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const result = await getLatestData();
        setLiveData(result);
      } catch {
        // fall back to defaults — no crash
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const npk = liveData?.predictions?.npk ?? DEFAULT_NPK;
  const sensors = liveData?.sensors ?? DEFAULT_SENSORS;
  const yieldKg = liveData?.predictions?.yield_prediction_kg_per_ha ?? 4200;
  const backendAdvice = liveData?.recommendations?.fertilizer ?? null;
  const npkStatus = getNpkStatus(npk);

  const fertilizerCards = FERTILIZER_GUIDE.map((item) => ({
    ...item,
    adjustedDose: calcAdjustedDose(item, npk),
    priority:
      (item.id === "urea" ? npk.N : item.id === "tsp" ? npk.P : npk.K) <
      (item.id === "urea" ? 50 : 30)
        ? "High priority"
        : "Supportive",
  }));

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const payload = {
        temperature: sensors.temperature,
        humidity: sensors.humidity,
        moisture: Math.round((sensors.soil1 + sensors.soil2) / 2),
        soil_type: "Loamy",
        crop_type: "Paddy",
        nitrogen: npk.N,
        potassium: npk.K,
        phosphorous: npk.P,
      };
      const result = await autoPredict(payload);
      setAiAdvice(result?.fertilizer ?? result?.prediction ?? "Balanced NPK nutrition recommended.");
    } catch {
      Alert.alert("Analysis Failed", "Could not reach the AI model. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching field data…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fertilizer Guidance</Text>
        <Text style={styles.subtitle}>
          Live sensor readings + AI-powered nutrition advice
        </Text>
      </View>

      <View style={styles.content}>
        {/* ── Summary stats row ── */}
        <Text style={styles.sectionTitle}>Live Soil Snapshot</Text>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderTopColor: npkStatus.color, borderTopWidth: 3 }]}>
            <Text style={styles.statLabel}>N · P · K</Text>
            <Text style={[styles.statValue, { color: npkStatus.color }]}>
              {npk.N} · {npk.P} · {npk.K}
            </Text>
            <View style={[styles.badge, { backgroundColor: npkStatus.color + "20" }]}>
              <Text style={[styles.badgeText, { color: npkStatus.color }]}>
                {npkStatus.label}
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, { borderTopColor: COLORS.info, borderTopWidth: 3 }]}>
            <Text style={styles.statLabel}>Yield Estimate</Text>
            <Text style={[styles.statValue, { color: COLORS.info }]}>
              {Math.round(yieldKg).toLocaleString()}
            </Text>
            <Text style={styles.statUnit}>kg / ha</Text>
          </View>
        </View>

        {/* ── Environmental sensors ── */}
        <Text style={styles.sectionTitle}>Environmental Conditions</Text>
        <View style={styles.sensorRow}>
          <SensorCard label="Temperature" value={sensors.temperature} unit="°C" icon="thermometer-outline" color={COLORS.danger} />
          <SensorCard label="Humidity" value={sensors.humidity} unit="%" icon="water-outline" color={COLORS.info} />
        </View>
        <View style={styles.sensorRow}>
          <SensorCard label="Soil Moisture" value={Math.round((sensors.soil1 + sensors.soil2) / 2)} unit="%" icon="leaf-outline" color={COLORS.success} />
          <SensorCard label="Rainfall" value={sensors.rain} unit="mm" icon="rainy-outline" color="#60A5FA" />
        </View>

        {/* ── AI Recommendation Banner ── */}
        <Text style={styles.sectionTitle}>AI Recommendation</Text>
        <View style={[styles.adviceCard, { borderColor: npkStatus.color + "50", backgroundColor: npkStatus.color + "10" }]}>
          <Ionicons name="sparkles" size={20} color={npkStatus.color} />
          <Text style={[styles.adviceText, { color: npkStatus.color }]}>
            {aiAdvice
              ? aiAdvice
              : backendAdvice
              ? `${backendAdvice}${npkStatus.label === "Balanced"
                  ? " Continue monitoring nutrition balance."
                  : ` Focus next application on ${npkStatus.label.toLowerCase()} support.`}`
              : 'Tap "Run Analysis" to get AI-powered fertilizer advice based on current field conditions.'}
          </Text>
          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: npkStatus.color }]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.analyzeBtnText}>Run Analysis</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Fertilizer Cards ── */}
        <Text style={styles.sectionTitle}>Fertilizer Guide</Text>
        {fertilizerCards.map((item) => (
          <View key={item.id} style={[styles.fertCard, { borderLeftColor: item.accent, borderLeftWidth: 4 }]}>
            <View style={styles.fertCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fertName}>{item.name}</Text>
                <Text style={styles.fertFormula}>{item.formula} · {item.nutrient}</Text>
              </View>
              <View style={[styles.doseBadge, { backgroundColor: item.accent + "18" }]}>
                <Text style={[styles.doseText, { color: item.accent }]}>
                  {item.adjustedDose} kg/ha
                </Text>
              </View>
            </View>

            <View style={[styles.priorityBadge, { backgroundColor: item.accent + "15" }]}>
              <Text style={[styles.priorityText, { color: item.accent }]}>{item.priority}</Text>
            </View>

            <Text style={styles.fertPurpose}>{item.purpose}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaLabel}>Best Window</Text>
                <Text style={styles.metaValue}>{item.bestWindow}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="leaf-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.metaLabel}>Why it matters</Text>
                <Text style={styles.metaValue}>{item.note}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* ── Schedule Table ── */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        <View style={styles.tableCard}>
          {[
            {
              stage: "Land Preparation",
              action: "Apply TSP and part of MOP",
              reason: "Improves early root anchoring and steady growth.",
            },
            {
              stage: "Vegetative Stage",
              action: "Use Urea in split doses",
              reason: "Supports leaf vigour and canopy development.",
            },
            {
              stage: "Panicle / Grain Fill",
              action: "Finish MOP and protect grain filling",
              reason: "Helps grain quality and better stress tolerance.",
            },
          ].map((row, i) => (
            <View key={i} style={[styles.tableRow, i > 0 && { borderTopWidth: 1, borderTopColor: COLORS.borderLight }]}>
              <Text style={styles.tableStage}>{row.stage}</Text>
              <Text style={styles.tableAction}>{row.action}</Text>
              <Text style={styles.tableReason}>{row.reason}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bgScreen },
  loadingText: { marginTop: 12, color: COLORS.textMuted },

  header: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 4 },

  content: { padding: 16 },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: 6,
  },

  // summary stats
  statRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "bold", color: COLORS.textPrimary, marginBottom: 6 },
  statUnit: { fontSize: 11, color: COLORS.textFaint },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  // sensors
  sensorRow: { flexDirection: "row", gap: 8, marginBottom: 8 },

  // advice
  adviceCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  adviceText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  analyzeBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  analyzeBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 15 },

  // fertilizer cards
  fertCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  fertCardTop: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  fertName: { fontSize: 17, fontWeight: "bold", color: COLORS.textPrimary },
  fertFormula: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  doseBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 },
  doseText: { fontWeight: "800", fontSize: 14 },
  priorityBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  priorityText: { fontSize: 12, fontWeight: "700" },
  fertPurpose: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20, marginBottom: 12 },
  metaRow: { gap: 8 },
  metaItem: { backgroundColor: COLORS.bgScreen, borderRadius: 10, padding: 10 },
  metaLabel: { fontSize: 11, fontWeight: "700", color: COLORS.textMuted, textTransform: "uppercase", marginTop: 4 },
  metaValue: { fontSize: 13, color: COLORS.textPrimary, marginTop: 2, lineHeight: 18 },

  // schedule table
  tableCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    marginBottom: 16,
  },
  tableRow: { padding: 14 },
  tableStage: { fontWeight: "bold", color: COLORS.textPrimary, fontSize: 14, marginBottom: 2 },
  tableAction: { color: COLORS.info, fontSize: 13, marginBottom: 2 },
  tableReason: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },

  bottomSpacer: { height: 32 },
});
