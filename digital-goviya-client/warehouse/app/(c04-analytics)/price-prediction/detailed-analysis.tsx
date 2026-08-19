import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
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

type TabKey = "summary" | "factors" | "explanation" | "recommendation";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "summary", label: "Summary", icon: "document-text-outline" },
  { key: "factors", label: "Key Factors", icon: "layers-outline" },
  { key: "explanation", label: "AI Explanation", icon: "bulb-outline" },
  { key: "recommendation", label: "Recommendation", icon: "compass-outline" },
];

const FARMER_TIPS = [
  "Monitor weekly market prices.",
  "Avoid panic selling.",
  "Compare with future forecasts.",
];

function humanizeFeature(key: string) {
  const overrides: Record<string, string> = {
    max_price: "Maximum Market Price",
    min_price: "Minimum Market Price",
    avg_price: "Average Market Price",
  };
  if (overrides[key]) return overrides[key];
  return key
    .split("_")
    .map((w) => (/^\d+w$/.test(w) ? `${w.replace("w", "-Week")}` : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

function riskTone(value: string) {
  const v = value.toLowerCase();
  if (v === "low") return { bg: "#DCFCE7", fg: "#15803D" };
  if (v === "medium") return { bg: "#FEF3C7", fg: "#B45309" };
  return { bg: "#FEE2E2", fg: "#DC2626" };
}

export default function DetailedAnalysisScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const result: PredictionResponse | null = data ? JSON.parse(data) : null;

  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const fade = useRef(new Animated.Value(1)).current;

  const switchTab = (tab: TabKey) => {
    if (tab === activeTab) return;
    fade.setValue(0);
    setActiveTab(tab);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  if (!fontsLoaded || !result) return null;

  const risk = riskTone(result.risk_level);

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
            <Ionicons name="analytics" size={11} color="#F5C542" />
            <Text style={styles.eyebrow}>DETAILED ANALYSIS</Text>
          </View>
          <Text style={styles.heroTitle}>Behind the Prediction</Text>
          <Text style={styles.heroSub}>
            {result.district} · {result.date}
          </Text>
        </View>

        {/* Sheet */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* Tab bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {TABS.map((tab) => {
              const active = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => switchTab(tab.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={active ? "#0B3B22" : "#9CA3AF"}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Animated.View style={{ flex: 1, opacity: fade }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === "summary" && (
                <View>
                  <View style={styles.summaryCard}>
                    <SummaryRow label="District" value={result.district} />
                    <SummaryRow label="Date" value={result.date} />
                    <SummaryRow
                      label="Predicted Price"
                      value={`${result.prediction.toFixed(2)} LKR/kg`}
                      emphasis
                    />
                    <SummaryRow label="Trend" value={result.trend} />
                    <SummaryRow label="Confidence" value={result.confidence} />
                    <SummaryRow label="Risk Level" value={result.risk_level} last />
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={[styles.infoIconBox, { backgroundColor: "#E0F2FE" }]}>
                        <Ionicons name="bar-chart" size={16} color="#0369A1" />
                      </View>
                      <Text style={styles.infoCardTitle}>Market Outlook</Text>
                    </View>
                    <Text style={styles.infoCardText}>{result.market_outlook}</Text>
                  </View>
                </View>
              )}

              {activeTab === "factors" && (
                <View>
                  <Text style={styles.sectionIntro}>
                    These are the factors that influenced this prediction most.
                  </Text>
                  {result.top_features.map((f, i) => {
                    const positive = f.Contribution >= 0;
                    return (
                      <View key={i} style={styles.factorCard}>
                        <View style={styles.factorHeader}>
                          <Text style={styles.factorTitle}>{humanizeFeature(f.Feature)}</Text>
                          <View
                            style={[
                              styles.contributionPill,
                              { backgroundColor: positive ? "#DCFCE7" : "#FEE2E2" },
                            ]}
                          >
                            <Ionicons
                              name={positive ? "arrow-up" : "arrow-down"}
                              size={11}
                              color={positive ? "#15803D" : "#DC2626"}
                            />
                            <Text
                              style={[
                                styles.contributionText,
                                { color: positive ? "#15803D" : "#DC2626" },
                              ]}
                            >
                              {positive ? "+" : ""}
                              {f.Contribution.toFixed(2)} LKR
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.factorValue}>
                          Current Value: <Text style={styles.factorValueBold}>{f.Value} LKR/kg</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {activeTab === "explanation" && (
                <View>
                  <Text style={styles.sectionIntro}>
                    Here's how the AI arrived at this prediction, step by step.
                  </Text>
                  {result.reasons.map((reason, i) => (
                    <View key={i} style={styles.timelineRow}>
                      <View style={styles.timelineMarkerCol}>
                        <View style={styles.timelineDot}>
                          <Text style={styles.timelineDotText}>{i + 1}</Text>
                        </View>
                        {i < result.reasons.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineCard}>
                        <Text style={styles.timelineText}>{reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeTab === "recommendation" && (
                <View>
                  <View style={[styles.riskCard, { backgroundColor: risk.bg }]}>
                    <Ionicons
                      name={
                        result.risk_level.toLowerCase() === "low"
                          ? "checkmark-circle"
                          : "alert-circle"
                      }
                      size={22}
                      color={risk.fg}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.riskLabel, { color: risk.fg }]}>Risk Level</Text>
                      <Text style={[styles.riskValue, { color: risk.fg }]}>
                        {result.risk_level}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={[styles.infoIconBox, { backgroundColor: "#DCFCE7" }]}>
                        <Ionicons name="bulb" size={16} color="#15803D" />
                      </View>
                      <Text style={styles.infoCardTitle}>Advice</Text>
                    </View>
                    <Text style={styles.infoCardText}>{result.recommendation}</Text>
                  </View>

                  <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>Farmer Tips</Text>
                    {FARMER_TIPS.map((tip, i) => (
                      <View key={i} style={styles.tipRow}>
                        <Ionicons name="leaf" size={14} color="#15803D" />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
  last,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasis && styles.summaryValueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B3B22" },
  heroBg: { position: "absolute", top: 0, left: 0, right: 0, height: 200 },
  safe: { flex: 1 },

  hero: {
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
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
    fontSize: 20,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
  },
  heroSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  sheet: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
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
    marginBottom: 14,
  },

  tabBar: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "white",
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
  },
  tabChipActive: {
    backgroundColor: "#F5C542",
    borderColor: "#F5C542",
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#9CA3AF",
  },
  tabLabelActive: { color: "#0B3B22" },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 28 },

  summaryCard: {
    backgroundColor: "white",
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
  },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  summaryLabel: {
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 13.5,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
  },
  summaryValueEmphasis: { color: "#B45309", fontSize: 15 },

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
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCardTitle: { fontSize: 13.5, fontFamily: "Poppins_700Bold", color: "#1F2937" },
  infoCardText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: "#4B5563",
    fontFamily: "Poppins_500Medium",
  },

  sectionIntro: {
    fontSize: 12.5,
    color: "#6B7280",
    fontFamily: "Poppins_500Medium",
    marginBottom: 14,
    lineHeight: 18,
  },

  factorCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },
  factorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  factorTitle: { fontSize: 13.5, fontFamily: "Poppins_700Bold", color: "#1F2937", flex: 1 },
  contributionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  contributionText: { fontSize: 11, fontFamily: "Poppins_700Bold" },
  factorValue: { fontSize: 12, color: "#6B7280", fontFamily: "Poppins_500Medium" },
  factorValueBold: { color: "#1F2937", fontFamily: "Poppins_700Bold" },

  timelineRow: { flexDirection: "row", gap: 12 },
  timelineMarkerCol: { alignItems: "center", width: 26 },
  timelineDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#15803D",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotText: { color: "white", fontSize: 11.5, fontFamily: "Poppins_700Bold" },
  timelineLine: { flex: 1, width: 2, backgroundColor: "#D1FAE1", marginVertical: 4 },
  timelineCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },
  timelineText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: "#374151",
    fontFamily: "Poppins_500Medium",
  },

  riskCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  riskLabel: {
    fontSize: 10.5,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    opacity: 0.85,
  },
  riskValue: { fontSize: 17, fontFamily: "Poppins_800ExtraBold", marginTop: 1 },

  tipsCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  tipsTitle: {
    fontSize: 13.5,
    fontFamily: "Poppins_700Bold",
    color: "#15803D",
    marginBottom: 2,
  },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipText: {
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    color: "#166534",
    flex: 1,
  },
});