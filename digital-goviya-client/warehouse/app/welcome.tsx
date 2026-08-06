import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path,
  Circle,
  Ellipse,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const { width } = Dimensions.get("window");

const LOGO = require("../assets/logo.png");

type LangCode = "en" | "si" | "ta";

const LANGUAGES: { code: LangCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "EN" },
  { code: "si", label: "Sinhala", native: "සිං" },
  { code: "ta", label: "Tamil", native: "தமி" },
];


function PaddyBackdrop() {
  const h = 350;
  return (
    <Svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <SvgGradient id="sunGlow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FEF3C7" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#F5C542" stopOpacity="0" />
        </SvgGradient>
        <SvgGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1E7A45" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#146336" stopOpacity="0.35" />
        </SvgGradient>
        <SvgGradient id="stalkGrad" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#F5C542" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#FDE68A" stopOpacity="0.05" />
        </SvgGradient>
      </Defs>

      <Circle cx={width * 0.82} cy={46} r={80} fill="url(#sunGlow)" />

      <Path
        d={`M0 190 Q ${width * 0.25} 155 ${width * 0.5} 178 T ${width} 168 L ${width} ${h} L 0 ${h} Z`}
        fill="url(#hillFar)"
      />

      {Array.from({ length: 16 }).map((_, i) => {
        const x = (width / 16) * i + 10;
        return (
          <Path
            key={i}
            d={`M${x} ${h} C ${x - 7} ${h - 30}, ${x + 9} ${h - 40}, ${x - 2} ${h - 64}`}
            stroke="url(#stalkGrad)"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

export default function WelcomeScreen() {
  const [language, setLanguage] = useState<LangCode>("en");

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(18)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.sequence([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, friction: 6 }),
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(rise, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const handleGetStarted = () => {
    router.push("/landing" as any);
  };

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
          <PaddyBackdrop />

          <View style={styles.heroContent}>
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <View style={styles.logoRing}>
                <View style={styles.logoCircle}>
                  <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={{ opacity: fade, transform: [{ translateY: rise }], alignItems: "center" }}
            >
              <View style={styles.eyebrowPill}>
                <Ionicons name="sparkles" size={11} color="#F5C542" />
                <Text style={styles.eyebrow}>SMART AGRICULTURE PLATFORM</Text>
              </View>

              <Text style={styles.title}>Digital Goviya</Text>
              <Text style={styles.slogan}>Smart Paddy Management System</Text>
            </Animated.View>
          </View>
        </View>

        {/* Bottom sheet */}
        <Animated.View
          style={[styles.sheet, { opacity: fade, transform: [{ translateY: rise }] }]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.featureRow}>
            <FeatureItem icon="business-outline" label="Warehouse" />
            <FeatureItem icon="leaf-outline" label="Farming" />
            <FeatureItem icon="storefront-outline" label="Market" />
            <FeatureItem icon="trending-up-outline" label="Forecast" />
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={handleGetStarted} style={styles.ctaShadow}>
            <LinearGradient
              colors={["#F5C542", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.getStartedBtn}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={18} color="#0B3B22" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Language selector */}
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>Choose your language</Text>
            <View style={styles.languageRow}>
              {LANGUAGES.map((lang) => {
                const active = language === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langChip, active && styles.langChipActive]}
                    onPress={() => setLanguage(lang.code)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.langNative, active && styles.langNativeActive]}>
                      {lang.native}
                    </Text>
                    <Text style={[styles.langLabel, active && styles.langLabelActive]}>
                      {lang.label}
                    </Text>
                    {active && (
                      <View style={styles.langCheck}>
                        <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.languageHint}>You can change this anytime in Settings</Text>
          </View>
        </Animated.View>

        <Text style={styles.footer}>Digital Goviya v1.0 · SLIIT Research 2026</Text>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconBox}>
        <Ionicons name={icon as any} size={18} color="#15803D" />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B3B22" },
  safe: { flex: 1, justifyContent: "space-between" },

  hero: {
    height: 350,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },

  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 4,
    backgroundColor: "rgba(245,197,66,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoImage: {
    width: "100%",
    height: "100%",
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
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1.6,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.2,
    textAlign: "center",
    marginTop: 12,
  },
  slogan: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
    textAlign: "center",
  },

  sheet: {
    backgroundColor: "#FAFAF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 22,
    paddingBottom: 8,
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

  featureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  featureItem: { alignItems: "center", flex: 1, gap: 6 },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: { fontSize: 10.5, fontWeight: "600", color: "#4B5563" },

  ctaShadow: {
    borderRadius: 14,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  getStartedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 15,
  },
  getStartedText: {
    color: "#0B3B22",
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  languageSection: { marginTop: 20, paddingBottom: 6 },
  languageLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 10,
    textAlign: "center",
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  langChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1.4,
    borderColor: "#E5E7EB",
    position: "relative",
  },
  langChipActive: {
    borderColor: "#15803D",
    backgroundColor: "#F0FDF4",
  },
  langNative: {
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
  },
  langNativeActive: { color: "#15803D" },
  langLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 2,
  },
  langLabelActive: { color: "#15803D" },
  langCheck: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "white",
    borderRadius: 8,
  },
  languageHint: {
    fontSize: 10.5,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 10,
  },

  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 10.5,
    paddingVertical: 12,
  },
});