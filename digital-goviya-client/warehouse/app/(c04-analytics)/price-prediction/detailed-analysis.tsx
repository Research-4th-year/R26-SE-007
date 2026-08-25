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
import type { PredictionApiResponse } from "./prediction-result";

type TabKey = "market" | "technical";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "market", label: "Market Overview", icon: "bar-chart-outline" },
  { key: "technical", label: "Technical Details", icon: "layers-outline" },
];

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
  if (v === "low") return { bg: "#DCFCE7", fg: "#15803D", icon: "checkmark-circle" };
  if (v === "medium") return { bg: "#FEF3C7", fg: "#B45309", icon: "alert-circle" };
  return { bg: "#FEE2E2", fg: "#DC2626", icon: "warning" };
}

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

export default function DetailedAnalysisScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const result: PredictionApiResponse | null = data ? JSON.parse(data) : null;

  const [activeTab, setActiveTab] = useState<TabKey>("market");

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

  const { market, technical, prediction } = result;
  const trendTone = chipTone("trend", market.trend);
  const confTone = chipTone("confidence", market.confidence);
  const riskTone = chipTone("risk", market.risk_level);

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
            <Text style={styles.eyebrow}>ADVANCED DETAILS</Text>
          </View>
          <Text style={styles.heroTitle}>Behind the Prediction</Text>
          <Text style={styles.heroSub}>
            {prediction.district} · {prediction.date}
          </Text>
        </View>

        {/* Sheet */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {/* Tab bar */}
          <View style={styles.tabBar}>
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
                    size={15}
                    color={active ? "#0B3B22" : "#9CA3AF"}
                  />
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Animated.View style={{ flex: 1, opacity: fade }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeTab === "market" && (
                <View>
                  <View style={styles.chipRow}>
                    <View style={[styles.statusChip, { backgroundColor: trendTone.bg }]}>
                      <Ionicons name={trendTone.icon as any} size={16} color={trendTone.fg} />
                      <Text style={[styles.statusChipLabel, { color: trendTone.fg }]}>Trend</Text>
                      <Text style={[styles.statusChipValue, { color: trendTone.fg }]}>
                        {market.trend}
                      </Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: confTone.bg }]}>
                      <Ionicons name={confTone.icon as any} size={16} color={confTone.fg} />
                      <Text style={[styles.statusChipLabel, { color: confTone.fg }]}>Confidence</Text>
                      <Text style={[styles.statusChipValue, { color: confTone.fg }]}>
                        {market.confidence}
                      </Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: riskTone.bg }]}>
                      <Ionicons name={riskTone.icon as any} size={16} color={riskTone.fg} />
                      <Text style={[styles.statusChipLabel, { color: riskTone.fg }]}>Risk</Text>
                      <Text style={[styles.statusChipValue, { color: riskTone.fg }]}>
                        {market.risk_level}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={[styles.infoIconBox, { backgroundColor: "#E0F2FE" }]}>
                        <Ionicons name="bar-chart" size={16} color="#0369A1" />
                      </View>
                      <Text style={styles.infoCardTitle}>Market Outlook</Text>
                    </View>
                    <Text style={styles.infoCardText}>{market.outlook}</Text>
                  </View>

                  <View style={styles.infoCard}>
                    <View style={styles.infoCardHeader}>
                      <View style={[styles.infoIconBox, { backgroundColor: "#DCFCE7" }]}>
                        <Ionicons name="compass" size={16} color="#15803D" />
                      </View>
                      <Text style={styles.infoCardTitle}>Recommendation</Text>
                    </View>
                    <Text style={styles.infoCardText}>{market.recommendation}</Text>
                  </View>
                </View>
              )}

              {activeTab === "technical" && (
                <View>
                  <Text style={styles.sectionIntro}>
                    These are the factors that influenced this prediction most.
                  </Text>
                  {technical.top_features.map((f, i) => {
                    const positive = f.contribution >= 0;
                    return (
                      <View key={i} style={styles.factorCard}>
                        <View style={styles.factorHeader}>
                          <Text style={styles.factorTitle}>{humanizeFeature(f.feature)}</Text>
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
                              {f.contribution.toFixed(2)} LKR
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.factorValue}>
                          Current Value: <Text style={styles.factorValueBold}>{f.value} LKR/kg</Text>
                        </Text>
                      </View>
                    );
                  })}

                  <Text style={[styles.sectionIntro, { marginTop: 6 }]}>
                    Step-by-step model reasoning (SHAP).
                  </Text>
                  {technical.shap_reasons.map((reason, i) => (
                    <View key={i} style={styles.timelineRow}>
                      <View style={styles.timelineMarkerCol}>
                        <View style={styles.timelineDot}>
                          <Text style={styles.timelineDotText}>{i + 1}</Text>
                        </View>
                        {i < technical.shap_reasons.length - 1 && (
                          <View style={styles.timelineLine} />
                        )}
                      </View>
                      <View style={styles.timelineCard}>
                        <Text style={styles.timelineText}>{reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </SafeAreaView>
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
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 14,
  },
  tabChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
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
});