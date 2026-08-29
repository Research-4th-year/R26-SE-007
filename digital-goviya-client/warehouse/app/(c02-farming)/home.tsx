import { SafeAreaView } from "react-native-safe-area-context";
import { useRef, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../i18n";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  Image,
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
  fertilizer: "/(c02-farming)/fertilizer-guide",
  profile: "/(c02-farming)/profile",
  iotDashboard: "/(c02-farming)/iot-dashboard",
};

export default function FarmingHomeScreen() {
  const { language } = useLanguage();
  const t = translations[language].c02Farming.home;

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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.push(ROUTES.profile as any)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="person" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.eyebrowPill}>
            <Ionicons name="sparkles" size={11} color="#F5C542" />
            <Text style={styles.eyebrow}>{t.eyebrow}</Text>
          </View>

          <Text style={styles.heroTitle}>{t.title}</Text>
          <Text style={styles.heroSub}>
            {t.subtitle}
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
              {t.introText}
            </Text>

            {/* IoT Dashboard card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#E0F2FE", padding: 8 }]}>
                <Image source={require("../../assets/farming-icons/iotsensors.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
              <Text style={styles.featureTitle}>{t.iotDashboardTitle}</Text>
              <Text style={styles.featureDesc}>
                {t.iotDashboardDesc}
              </Text>
              <TouchableOpacity
                style={styles.primaryBtnShadow}
                activeOpacity={0.9}
                onPress={() => router.push(ROUTES.iotDashboard as any)}
              >
                <LinearGradient
                  colors={["#0369A1", "#0C4A6E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={[styles.primaryBtnText, { color: "white" }]}>{t.iotDashboardBtn}</Text>
                  <Ionicons name="arrow-forward" size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Advisory card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#DCFCE7", padding: 8 }]}>
                <Image source={require("../../assets/farming-icons/wheat.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
              <Text style={styles.featureTitle}>{t.varietyTitle}</Text>
              <Text style={styles.featureDesc}>
                {t.varietyDesc}
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
                  <Text style={styles.primaryBtnText}>{t.varietyBtn}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#0B3B22" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Yield card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#E0F2FE", padding: 8 }]}>
                <Image source={require("../../assets/farming-icons/yield.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
              <Text style={styles.featureTitle}>{t.yieldTitle}</Text>
              <Text style={styles.featureDesc}>
                {t.yieldDesc}
              </Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                activeOpacity={0.85}
                onPress={() => router.push(ROUTES.yield as any)}
              >
                <Text style={styles.secondaryBtnText}>{t.yieldBtn}</Text>
                <Ionicons name="arrow-forward" size={16} color="#0369A1" />
              </TouchableOpacity>
            </View>
            
            {/* Disease card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#FEE2E2", padding: 8 }]}>
                <Image source={require("../../assets/farming-icons/paddy iot.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
              <Text style={styles.featureTitle}>{t.diseaseTitle}</Text>
              <Text style={styles.featureDesc}>
                {t.diseaseDesc}
              </Text>
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: "#FEF2F2" }]}
                activeOpacity={0.85}
                onPress={() => router.push(ROUTES.disease as any)}
              >
                <Text style={[styles.secondaryBtnText, { color: "#B91C1C" }]}>{t.diseaseBtn}</Text>
                <Ionicons name="arrow-forward" size={16} color="#B91C1C" />
              </TouchableOpacity>
            </View>

            {/* Fertilizer card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#DCFCE7", padding: 8 }]}>
                <Image source={require("../../assets/farming-icons/fertilizer.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
              <Text style={styles.featureTitle}>{t.fertilizerTitle}</Text>
              <Text style={styles.featureDesc}>
                {t.fertilizerDesc}
              </Text>
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: "#F0FDF4" }]}
                activeOpacity={0.85}
                onPress={() => router.push(ROUTES.fertilizer as any)}
              >
                <Text style={[styles.secondaryBtnText, { color: "#15803D" }]}>{t.fertilizerBtn}</Text>
                <Ionicons name="arrow-forward" size={16} color="#15803D" />
              </TouchableOpacity>
            </View>
            
            {/* Profile card */}
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBox, { backgroundColor: "#EDE9FE", padding: 8 }]}>
                <Image source={require("../../assets/farming-icons/settings.png")} style={{ width: 32, height: 32 }} resizeMode="contain" />
              </View>
              <Text style={styles.featureTitle}>{t.profileTitle}</Text>
              <Text style={styles.featureDesc}>{t.profileDesc}</Text>
              <TouchableOpacity
                style={[styles.secondaryBtn, { backgroundColor: "#F5F3FF" }]}
                activeOpacity={0.85}
                onPress={() => router.push(ROUTES.profile as any)}
              >
                <Text style={[styles.secondaryBtnText, { color: "#7C3AED" }]}>{t.profileBtn}</Text>
                <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
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
