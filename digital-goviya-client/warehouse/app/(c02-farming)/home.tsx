import { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
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
  variety: "/(c02-farming)/variety-prediction",
  yield: "/(c02-farming)/yield-prediction",
  disease: "/(c02-farming)/disease-detection",
};

export default function FarmingHomeScreen() {
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

      <View style={{ flex: 1, paddingTop: 60 }}>
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
            <Text style={styles.eyebrow}>AI-POWERED FARMING INSIGHTS</Text>
          </View>

          <Text style={styles.heroTitle}>Smart Farming{"\n"}& Advisory</Text>
          <Text style={styles.heroSub}>
            Optimize your harvest with data-driven insights and disease detection.
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
              Leverage advanced machine learning and real-time IoT data to manage your paddy fields.
            </Text>

            {/* Advisory card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="leaf" size={26} color="#15803D" />
              </View>
              <Text style={styles.featureTitle}>Variety Prediction & Suitability</Text>
              <Text style={styles.featureDesc}>
                Find the best paddy variety for your district and check if your field is ready for planting.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtnShadow}
                activeOpacity={0.9}
                onPress={() => router.push(ROUTES.variety as any)}
              >
                <LinearGradient
                  colors={["#F5C542", "#D97706"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Check Suitability</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0B3B22" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Yield card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#E0F2FE" }]}>
                <Ionicons name="stats-chart" size={26} color="#0369A1" />
              </View>
              <Text style={styles.featureTitle}>Yield Prediction</Text>
              <Text style={styles.featureDesc}>
                Estimate your expected harvest volume based on your land size and IoT metrics.
              </Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push(ROUTES.yield as any)}
              >
                <Text style={styles.secondaryBtnText}>Predict Yield</Text>
                <Ionicons name="arrow-forward" size={16} color="#0369A1" />
              </TouchableOpacity>
            </View>
            
            {/* Disease card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="scan" size={26} color="#B91C1C" />
              </View>
              <Text style={styles.featureTitle}>Disease Detection</Text>
              <Text style={styles.featureDesc}>
                Snap a picture of a paddy leaf to instantly detect Bacterial Blight or Fungal infections.
              </Text>
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: "#FEF2F2" }]}
                activeOpacity={0.85}
                onPress={() => router.push(ROUTES.disease as any)}
              >
                <Text style={[styles.secondaryBtnText, { color: "#B91C1C" }]}>Scan Leaf</Text>
                <Ionicons name="arrow-forward" size={16} color="#B91C1C" />
              </TouchableOpacity>
            </View>
            
            {/* Spacer */}
            <View style={{height: 40}} />

          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A331D" },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  safe: { flex: 1 },
  hero: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 197, 66, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  eyebrow: {
    color: "#F5C542",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.8,
    marginLeft: 6,
    marginTop: 2,
  },
  heroTitle: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 10,
  },
  heroSub: {
    color: "rgba(255,255,255,0.8)",
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    lineHeight: 22,
    paddingRight: 20,
  },
  sheet: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 10,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10 },
  welcomeText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 24,
  },
  featureCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  featureTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 6,
  },
  featureDesc: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryBtnShadow: {
    shadowColor: "#F5C542",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: "#0B3B22",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  secondaryBtnText: {
    color: "#0369A1",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    marginRight: 8,
    marginTop: 2,
  },
});
