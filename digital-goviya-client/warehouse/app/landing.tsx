import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const LOGO = require("../assets/logo.png");

const COMPONENTS = [
  {
    id: "warehouse",
    title: "Warehouse Management",
    desc: "PMB paddy warehouse coordination & blockchain audit",
    icon: "business",
    color: "#15803D",
    bg: "#DCFCE7",
    route: "/(c01-warehouse)/(auth)/login",
    ready: true,
  },
  {
    id: "farming",
    title: "Digital Farming",
    desc: "Smart farming assistance and crop management",
    icon: "leaf",
    color: "#0369A1",
    bg: "#E0F2FE",
    route: "/(c02-farming)/home",
    ready: true,
  },
  {
    id: "marketplace",
    title: "Marketplace",
    desc: "Agricultural produce trading platform",
    icon: "storefront",
    color: "#B45309",
    bg: "#FEF3C7",
    route: "/(c03-marketplace)",
    ready: false,
  },
  {
    id: "analytics",
    title: "Paddy Price Forecasting",
    desc: "Price Forecasting & Week Predictions with Explanations",
    icon: "trending-up-outline",
    color: "#7C3AED",
    bg: "#EDE9FE",
    route: "/(c04-analytics)/home",
    ready: true,
  },
];

export default function LandingScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
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
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <View style={styles.logoCircle}>
              <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.eyebrowPill}>
            <Ionicons name="sparkles" size={11} color="#F5C542" />
            <Text style={styles.eyebrow}>SMART AGRICULTURE PLATFORM</Text>
          </View>

          <Text style={styles.title}>Digital Goviya</Text>
          <Text style={styles.slogan}>Smart Agricultural Management System</Text>
        </View>

        {/* Bottom sheet */}
        <Animated.View
          style={[styles.sheet, { opacity: fade, transform: [{ translateY: rise }] }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sectionLabel}>MODULES</Text>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
          >
            {COMPONENTS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.card, !c.ready && styles.cardDisabled]}
                onPress={() => c.ready && router.push(c.route as any)}
                disabled={!c.ready}
                activeOpacity={c.ready ? 0.7 : 1}
              >
                <View style={[styles.iconBox, { backgroundColor: c.bg }]}>
                  <Ionicons name={c.icon as any} size={26} color={c.color} />
                </View>
                <View style={styles.cardText}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    {!c.ready && (
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonText}>Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{c.desc}</Text>
                </View>
                {c.ready && (
                  <View style={styles.chevronCircle}>
                    <Ionicons name="chevron-forward" size={16} color="#15803D" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <Text style={styles.footer}>Digital Goviya v1.0 · SLIIT Research 2026</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B3B22" },
  safe: { flex: 1 },

  hero: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 12,
  },

  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 4,
    backgroundColor: "rgba(245,197,66,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  logoImage: { width: "100%", height: "100%" },

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
  title: {
    color: "white",
    fontSize: 26,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  slogan: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12.5,
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
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 2,
  },

  grid: { gap: 12, paddingBottom: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDisabled: { opacity: 0.55 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  cardTitle: { fontSize: 14.5, fontWeight: "700", color: "#1F2937" },
  cardDesc: { fontSize: 11.5, color: "#6B7280", lineHeight: 15 },
  soonBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  soonText: { fontSize: 9.5, color: "#B45309", fontWeight: "700" },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    paddingVertical: 10,
  },
});