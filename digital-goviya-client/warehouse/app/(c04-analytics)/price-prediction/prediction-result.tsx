import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
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

// If your tsconfig doesn't have the "@/*" path alias set up, swap this for a
// relative import instead, e.g. require("../../../assets/logo.png")
const APP_LOGO = require("@/assets/logo.png");

const API_BASE = "http://127.0.0.1:8000";
const PREDICT_ENDPOINT = `${API_BASE}/prediction/explanation`;

const EXPLANATION_ROUTE = "/(c04-analytics)/price-prediction/prediction-explanation";
const ADVANCED_DETAILS_ROUTE = "/(c04-analytics)/price-prediction/detailed-analysis";

// ---- Types matching the new nested API schema ----
export type PredictionSection = {
  district: string;
  date: string;
  predicted_price: number;
  previous_price: number;
  currency: string;
};

export type MarketSection = {
  trend: string;
  confidence: string;
  risk_level: string;
  outlook: string;
  recommendation: string;
};

export type ExplanationSection = {
  headline: string;
  explanation: string;
  key_factors: string[];
  generated_by: string;
};

export type TechnicalFeature = {
  feature: string;
  value: number;
  contribution: number;
};

export type TechnicalSection = {
  top_features: TechnicalFeature[];
  shap_reasons: string[];
};

export type PredictionApiResponse = {
  prediction: PredictionSection;
  market: MarketSection;
  explanation: ExplanationSection;
  technical: TechnicalSection;
};

function LogoLoadingState({ label }: { label: string }) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.centerState}>
      <View style={styles.logoLoadingWrap}>
        <Animated.View style={[styles.logoRing, { transform: [{ rotate }] }]} />
        <Animated.Image
          source={APP_LOGO}
          resizeMode="contain"
          style={[styles.logoImage, { transform: [{ scale: pulse }] }]}
        />
      </View>
      <Text style={styles.centerStateTitle}>Crunching the numbers…</Text>
      <Text style={styles.centerStateText}>{label}</Text>
    </View>
  );
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
  const [result, setResult] = useState<PredictionApiResponse | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(PREDICT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, date }),
      });
      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data: PredictionApiResponse = await res.json();
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

  const goToExplanation = () => {
    if (!result) return;
    router.push({
      pathname: EXPLANATION_ROUTE as any,
      params: { data: JSON.stringify(result) },
    });
  };

  const goToAdvancedDetails = () => {
    if (!result) return;
    router.push({
      pathname: ADVANCED_DETAILS_ROUTE as any,
      params: { data: JSON.stringify(result) },
    });
  };

  const p = result?.prediction;
  const delta = p ? p.predicted_price - p.previous_price : 0;
  const deltaUp = delta >= 0;

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

          {loading && <LogoLoadingState label="Getting your price estimate…" />}

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

          {!loading && !error && result && p && (
            <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], flex: 1 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero price card — Prediction section */}
                <LinearGradient
                  colors={["#F5C542", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.priceCard}
                >
                  <Text style={styles.priceLabel}>Predicted Price</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceValue}>{p.predicted_price.toFixed(2)}</Text>
                    <Text style={styles.priceUnit}>{p.currency}</Text>
                  </View>

                  <View style={styles.deltaPill}>
                    <Ionicons
                      name={deltaUp ? "arrow-up" : "arrow-down"}
                      size={12}
                      color="#0B3B22"
                    />
                    <Text style={styles.deltaPillText}>
                      {deltaUp ? "+" : ""}
                      {delta.toFixed(2)} vs previous ({p.previous_price.toFixed(2)} {p.currency})
                    </Text>
                  </View>

                  <View style={styles.paddyTypePill}>
                    <Ionicons name="leaf" size={11} color="#0B3B22" />
                    <Text style={styles.paddyTypePillText}>Long Grain White</Text>
                  </View>

                  {/* Explanation button, anchored right next to the predicted price */}
                  <TouchableOpacity
                    style={styles.explanationBtn}
                    activeOpacity={0.85}
                    onPress={goToExplanation}
                  >
                    <Ionicons name="bulb" size={16} color="#F5C542" />
                    <Text style={styles.explanationBtnText}>Why this price?</Text>
                    <Ionicons name="arrow-forward" size={14} color="#F5C542" />
                  </TouchableOpacity>
                </LinearGradient>

                <View style={styles.contextCard}>
                  <View style={styles.contextRow}>
                    <Ionicons name="location-outline" size={16} color="#15803D" />
                    <Text style={styles.contextLabel}>District</Text>
                    <Text style={styles.contextValue}>{p.district}</Text>
                  </View>
                  <View style={styles.contextDivider} />
                  <View style={styles.contextRow}>
                    <Ionicons name="calendar-outline" size={16} color="#15803D" />
                    <Text style={styles.contextLabel}>Date</Text>
                    <Text style={styles.contextValue}>{p.date}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.advancedBtn}
                  activeOpacity={0.85}
                  onPress={goToAdvancedDetails}
                >
                  <View style={styles.advancedBtnLeft}>
                    <View style={styles.advancedIconBox}>
                      <Ionicons name="stats-chart" size={17} color="#15803D" />
                    </View>
                    <View>
                      <Text style={styles.advancedBtnTitle}>Advanced Details</Text>
                      <Text style={styles.advancedBtnSub}>Market outlook & model breakdown</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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
    paddingTop: 50,
  },
  logoLoadingWrap: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  logoRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#DCFCE7",
    borderTopColor: "#15803D",
  },
  logoImage: {
    width: 54,
    height: 54,
  },
  centerStateTitle: {
    fontSize: 14.5,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
    marginTop: 4,
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
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(11,59,34,0.10)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
  },
  deltaPillText: {
    fontSize: 10.5,
    fontFamily: "Poppins_600SemiBold",
    color: "#0B3B22",
  },
  paddyTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(11,59,34,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  paddyTypePillText: {
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
    color: "#0B3B22",
  },

  explanationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#0B3B22",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  explanationBtnText: {
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
    color: "#F5C542",
  },

  contextCard: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  contextDivider: { height: 1, backgroundColor: "#F3F4F6" },
  contextLabel: {
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    color: "#6B7280",
    flex: 1,
  },
  contextValue: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
  },

  advancedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.4,
    borderColor: "#E5E7EB",
  },
  advancedBtnLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  advancedIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  advancedBtnTitle: {
    fontSize: 13.5,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
  },
  advancedBtnSub: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "#9CA3AF",
    marginTop: 1,
  },
});