import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const ROUTES = {
  prediction: "/(c04-analytics)/price-prediction/prediction-input",
  forecast: "/(c04-analytics)/price-forecasting/forecast-input",
};

const DISTRICTS = ["Ampara", "Anuradhapura", "Polonnaruwa", "Kurunegala"];

export default function AnalyticsHomeScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
            <Ionicons name="sparkles" size={11} color="#F5C542" />
            <Text style={styles.eyebrow}>AI-POWERED PRICE INSIGHTS</Text>
          </View>

          <Text style={styles.heroTitle}>Price Prediction{"\n"}& Forecasting</Text>
          <Text style={styles.heroSub}>
            Know today's paddy price and see where it's headed
          </Text>
        </View>

        {/* Sheet */}
        <Animated.View
          style={[styles.sheet, { opacity: fade, transform: [{ translateY: rise }] }]}
        >
          <View style={styles.sheetHandle} />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.welcomeText}>
              Get an instant price estimate, or see how prices may move over
              the next few weeks — powered by AI trained on real market data.
            </Text>

            {/* Predict card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="pricetag" size={26} color="#15803D" />
              </View>
              <Text style={styles.featureTitle}>Predict Paddy Price</Text>
              <Text style={styles.featureDesc}>
                Get today's estimated market price for your district in seconds.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtnShadow}
                activeOpacity={0.9}
                onPress={() => router.push(ROUTES.prediction as any)}
              >
                <LinearGradient
                  colors={["#F5C542", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Start Prediction</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0B3B22" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Forecast card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="trending-up" size={26} color="#0369A1" />
              </View>
              <Text style={styles.featureTitle}>Forecast Future Prices</Text>
              <Text style={styles.featureDesc}>
                See predicted price trends for the coming weeks, visualized on a chart.
              </Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push(ROUTES.forecast as any)}
              >
                <Text style={styles.secondaryBtnText}>Start Forecast</Text>
                <Ionicons name="arrow-forward" size={16} color="#0369A1" />
              </TouchableOpacity>
            </View>

            {/* Info card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="leaf-outline" size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>Paddy Type</Text>
              </View>
              <View style={styles.paddyTypeBadge}>
                <Text style={styles.paddyTypeText}>Long Grain White</Text>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>Supported Districts</Text>
              </View>
              <View style={styles.districtWrap}>
                {DISTRICTS.map((d) => (
                  <View key={d} style={styles.districtChip}>
                    <Text style={styles.districtText}>{d}</Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B3B22" },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  safe: { flex: 1 },

  hero: {
    paddingTop: 8,
    paddingBottom: 26,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
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
    fontSize: 24,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
    lineHeight: 30,
    marginTop: 4,
  },
  heroSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    paddingHorizontal: 12,
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

  welcomeText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#4B5563",
    fontFamily: "Poppins_500Medium",
    marginBottom: 18,
  },

  featureCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  featureIconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    color: "#1F2937",
    fontFamily: "Poppins_700Bold",
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 12.5,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 16,
  },

  primaryBtnShadow: {
    borderRadius: 13,
    shadowColor: "#D97706",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    paddingVertical: 13,
  },
  primaryBtnText: {
    color: "#0B3B22",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    paddingVertical: 13,
    backgroundColor: "#E0F2FE",
  },
  secondaryBtnText: {
    color: "#0369A1",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },

  infoCard: {
    backgroundColor: "#F5F5F4",
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11.5,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  paddyTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  paddyTypeText: {
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
    color: "#B45309",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  districtWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  districtChip: {
    backgroundColor: "white",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  districtText: {
    fontSize: 11.5,
    fontFamily: "Poppins_600SemiBold",
    color: "#374151",
  },
});