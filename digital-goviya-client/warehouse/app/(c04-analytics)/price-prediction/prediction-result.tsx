import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const API_BASE = "http://127.0.0.1:8000";
const DETAILED_ANALYSIS_ROUTE = "/(c04-analytics)/price-prediction/detailed-analysis";

type PredictionResponse = {
  district: string;
  date: string;
  prediction: number;
  trend: string;
  confidence: string;
  market_outlook: string;
  recommendation: string;
  risk_level: string;
  summary: string;
  top_features: { Feature: string; Value: number; Contribution: number }[];
  reasons: string[];
};

function chipTone(kind: "trend" | "confidence" | "risk", value: string) {
  const v = value.toLowerCase();
  if (kind === "trend") {
    if (v.includes("rising") || v.includes("up")) return { bg: "#DCFCE7", fg: "#15803D", icon: "trending-up" };
    if (v.includes("falling") || v.includes("down")) return { bg: "#FEE2E2", fg: "#DC2626", icon: "trending-down" };
    return { bg: "#E0F2FE", fg: "#0369A1", icon: "remove-outline" };
  }
  if (kind === "confidence") {
    if (v === "high") return { bg: "#DCFCE7", fg: "#15803D", icon: "shield-checkmark" };
    if (v === "medium") return { bg: "#FEF3C7", fg: "#B45309", icon: "shield-half" };
    return { bg: "#FEE2E2", fg: "#DC2626", icon: "shield-outline" };
  }
  // risk
  if (v === "low") return { bg: "#DCFCE7", fg: "#15803D", icon: "checkmark-circle" };
  if (v === "medium") return { bg: "#FEF3C7", fg: "#B45309", icon: "alert-circle" };
  return { bg: "#FEE2E2", fg: "#DC2626", icon: "warning" };
}

export default function PredictionResultScreen() {
  const { district, date } = useLocalSearchParams<{ district: string; date: string }>();

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, date }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data: PredictionResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(
        e?.message === "Network request failed"
          ? "Couldn't reach the prediction server. Check your connection and try again."
          : "Something went wrong while getting your prediction."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [district, date]);

  useEffect(() => {
    if (!fontsLoaded || loading) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [fontsLoaded, loading]);

  if (!fontsLoaded) return null;

  const trendTone = result ? chipTone("trend", result.trend) : null;
  const confTone = result ? chipTone("confidence", result.confidence) : null;
  const riskTone = result ? chipTone("risk", result.risk_level) : null;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0A331D", "#12522E", "#0B3B22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroBg}
      />

      <SafeAreaView style={styles.safe}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>

          <View style={styles.eyebrowPill}>
            <Ionicons name="pricetag" size={11} color="#F5C542" />
            <Text style={styles.eyebrow}>PREDICTION RESULT</Text>
          </View>

          <Text style={styles.heroTitle}>Today's Price Estimate</Text>
          <Text style={styles.heroSub}>
            {district} · {date}
          </Text>
        </View>

        {/* Sheet */}
        <Animated.View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {loading && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#15803D" />
              <Text style={styles.centerStateText}>Getting your price estimate…</Text>
            </View>
          )}

          {!loading && error && (
            <View style={styles.centerState}>
              <View style={styles.errorIconBox}>
                <Ionicons name="cloud-offline-outline" size={30} color="#DC2626" />
              </View>
              <Text style={styles.errorTitle}>Prediction failed</Text>
              <Text style={styles.centerStateText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchPrediction} activeOpacity={0.85}>
                <Ionicons name="refresh" size={16} color="#15803D" />
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && result && (
            <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], flex: 1 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero price card */}
                <LinearGradient
                  colors={["#F5C542", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.priceCard}
                >
                  <Text style={styles.priceLabel}>Predicted Price</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceValue}>{result.prediction.toFixed(2)}</Text>
                    <Text style={styles.priceUnit}>LKR/kg</Text>
                  </View>
                  <View style={styles.paddyTypePill}>
                    <Ionicons name="leaf" size={11} color="#0B3B22" />
                    <Text style={styles.paddyTypePillText}>Long Grain White</Text>
                  </View>
                </LinearGradient>

                {/* Status chips */}
                <View style={styles.chipRow}>
                  <View style={[styles.statusChip, { backgroundColor: trendTone!.bg }]}>
                    <Ionicons name={trendTone!.icon as any} size={16} color={trendTone!.fg} />
                    <Text style={[styles.statusChipLabel, { color: trendTone!.fg }]}>Trend</Text>
                    <Text style={[styles.statusChipValue, { color: trendTone!.fg }]}>
                      {result.trend}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: confTone!.bg }]}>
                    <Ionicons name={confTone!.icon as any} size={16} color={confTone!.fg} />
                    <Text style={[styles.statusChipLabel, { color: confTone!.fg }]}>Confidence</Text>
                    <Text style={[styles.statusChipValue, { color: confTone!.fg }]}>
                      {result.confidence}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: riskTone!.bg }]}>
                    <Ionicons name={riskTone!.icon as any} size={16} color={riskTone!.fg} />
                    <Text style={[styles.statusChipLabel, { color: riskTone!.fg }]}>Risk</Text>
                    <Text style={[styles.statusChipValue, { color: riskTone!.fg }]}>
                      {result.risk_level}
                    </Text>
                  </View>
                </View>

                {/* Market outlook */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <View style={[styles.infoIconBox, { backgroundColor: "#E0F2FE" }]}>
                      <Ionicons name="bar-chart" size={17} color="#0369A1" />
                    </View>
                    <Text style={styles.infoCardTitle}>Market Outlook</Text>
                  </View>
                  <Text style={styles.infoCardText}>{result.market_outlook}</Text>
                </View>

                {/* AI recommendation */}
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <View style={[styles.infoIconBox, { backgroundColor: "#DCFCE7" }]}>
                      <Ionicons name="bulb" size={17} color="#15803D" />
                    </View>
                    <Text style={styles.infoCardTitle}>AI Recommendation</Text>
                  </View>
                  <Text style={styles.infoCardText}>{result.recommendation}</Text>
                </View>

                <TouchableOpacity
                  style={styles.detailBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: DETAILED_ANALYSIS_ROUTE as any,
                      params: { data: JSON.stringify(result) },
                    })
                  }
                >
                  <Text style={styles.detailBtnText}>View Detailed Analysis</Text>
                  <Ionicons name="arrow-forward" size={17} color="#0B3B22" />
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B3B22" },
  heroBg: { position: "absolute", top: 0, left: 0, right: 0, height: 220 },
  safe: { flex: 1 },

  hero: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 9,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.25)",
  },
  eyebrow: {
    color: "rgba(253,230,138,0.85)",
    fontSize: 9.5,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: "white",
    fontSize: 21,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
  },
  heroSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },

  sheet: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  scrollContent: { paddingBottom: 28 },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  centerStateText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    lineHeight: 19,
  },
  errorIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#15803D",
  },

  priceCard: {
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "rgba(11,59,34,0.7)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 6, marginTop: 6 },
  priceValue: {
    fontSize: 44,
    fontFamily: "Poppins_800ExtraBold",
    color: "#0B3B22",
    lineHeight: 48,
  },
  priceUnit: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "rgba(11,59,34,0.75)",
    marginBottom: 6,
  },
  paddyTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(11,59,34,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 12,
  },
  paddyTypePillText: {
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
    color: "#0B3B22",
  },

  chipRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statusChip: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statusChipLabel: {
    fontSize: 9.5,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  statusChipValue: {
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
  },

  infoCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  infoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCardTitle: {
    fontSize: 13.5,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
  },
  infoCardText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: "#4B5563",
    fontFamily: "Poppins_500Medium",
  },

  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: "#FEF3C7",
    marginTop: 4,
  },
  detailBtnText: {
    fontSize: 14.5,
    fontFamily: "Poppins_700Bold",
    color: "#92400E",
  },
});