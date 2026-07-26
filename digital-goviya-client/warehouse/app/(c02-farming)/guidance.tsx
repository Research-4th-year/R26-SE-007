import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import {
  getCurrentWeather,
  recommendVariety,
  generateCultivationPlan,
} from "@/services/farming/api";
import { WeatherIntelligenceCard } from "@/components/farming/WeatherIntelligenceCard";
import { CultivationPlanDashboard } from "@/components/farming/CultivationPlanDashboard";

const DISTRICTS_BY_ZONE = {
  "Dry Zone": [
    "Anuradhapura",
    "Polonnaruwa",
    "Kurunegala",
    "Hambantota",
    "Monaragala",
    "Ampara",
    "Trincomalee",
  ],
  "Wet Zone": [
    "Kandy",
    "Matale",
    "Nuwara Eliya",
    "Galle",
    "Matara",
    "Kalutara",
    "Colombo",
    "Ratnapura",
    "Kegalle",
    "Badulla",
  ],
};

export default function FarmerGuidanceScreen() {
  const [step, setStep] = useState(1);

  // Form State
  const [fieldArea, setFieldArea] = useState("1.5");
  const [season, setSeason] = useState("Maha");
  const [zone, setZone] = useState<"Dry Zone" | "Wet Zone">("Dry Zone");
  const [district, setDistrict] = useState("Anuradhapura");

  // Weather Intelligence State
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Recommendation State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [topVariety, setTopVariety] = useState<any>(null);

  // Plan State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [chosenVariety, setChosenVariety] = useState<string>("");

  // Sync District on Zone change
  useEffect(() => {
    const districts = DISTRICTS_BY_ZONE[zone];
    if (!districts.includes(district)) {
      setDistrict(districts[0]);
    }
  }, [zone]);

  // Fetch Weather on District change
  useEffect(() => {
    const fetchWeather = async () => {
      setLoadingWeather(true);
      const data = await getCurrentWeather(district);
      if (data) {
        setWeatherInfo(data);
      } else {
        // Fallback or error state handling could go here
      }
      setLoadingWeather(false);
    };
    fetchWeather();
  }, [district]);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const payload = {
        season,
        zone,
        district,
        field_area_hectares: parseFloat(fieldArea) || 1.0,
      };
      const res = await recommendVariety(payload);
      if (res && res.ranked_recommendations) {
        setRecommendations(res.ranked_recommendations);
        setTopVariety(res.ranked_recommendations[0]);
        setStep(2);
      } else {
        Alert.alert("Error", "Could not fetch recommendations.");
      }
    } catch (e) {
      Alert.alert("Error", "Backend is unreachable or failed to predict.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartCultivationPlan = async (varietyId: string) => {
    setIsGeneratingPlan(true);
    try {
      const payload = {
        variety: varietyId,
        season,
        district,
        field_area_hectares: parseFloat(fieldArea) || 1.0,
      };
      const res = await generateCultivationPlan(payload);
      if (res) {
        setSelectedPlan(res);
        setChosenVariety(varietyId);
        setStep(3);
      } else {
        Alert.alert("Error", "Could not generate cultivation plan.");
      }
    } catch (e) {
      Alert.alert("Error", "Failed to generate plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[
        { num: 1, title: "Field Inputs" },
        { num: 2, title: "AI Pick" },
        { num: 3, title: "Planner" },
      ].map((s) => (
        <View
          key={s.num}
          style={[styles.stepItem, { opacity: step >= s.num ? 1 : 0.4 }]}
        >
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor:
                  step === s.num
                    ? COLORS.primary
                    : step > s.num
                    ? COLORS.primaryDark
                    : COLORS.border,
              },
            ]}
          >
            <Text style={styles.stepNum}>{s.num}</Text>
          </View>
          <Text style={[styles.stepTitle, step === s.num && styles.stepTitleBold]}>
            {s.title}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Ionicons name="sparkles" size={32} color={COLORS.primary} />
        <Text style={styles.title}>AI Variety & Cultivation</Text>
        <Text style={styles.subtitle}>Precision farming driven by local climate</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView contentContainerStyle={styles.content}>
        {/* STEP 1: Inputs & Weather */}
        {step === 1 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Cultivation Setup</Text>

              <Text style={styles.label}>Paddy Field Size (Hectares)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={fieldArea}
                onChangeText={setFieldArea}
              />

              <Text style={styles.label}>Cultivation Season</Text>
              <View style={styles.rowBtnContainer}>
                <TouchableOpacity
                  style={[styles.rowBtn, season === "Maha" && styles.rowBtnActive]}
                  onPress={() => setSeason("Maha")}
                >
                  <Text style={[styles.rowBtnText, season === "Maha" && styles.rowBtnTextActive]}>
                    Maha
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rowBtn, season === "Yala" && styles.rowBtnActive]}
                  onPress={() => setSeason("Yala")}
                >
                  <Text style={[styles.rowBtnText, season === "Yala" && styles.rowBtnTextActive]}>
                    Yala
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Agricultural Zone</Text>
              <View style={styles.rowBtnContainer}>
                <TouchableOpacity
                  style={[styles.rowBtn, zone === "Dry Zone" && styles.rowBtnActive]}
                  onPress={() => setZone("Dry Zone")}
                >
                  <Text
                    style={[styles.rowBtnText, zone === "Dry Zone" && styles.rowBtnTextActive]}
                  >
                    Dry Zone
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rowBtn, zone === "Wet Zone" && styles.rowBtnActive]}
                  onPress={() => setZone("Wet Zone")}
                >
                  <Text
                    style={[styles.rowBtnText, zone === "Wet Zone" && styles.rowBtnTextActive]}
                  >
                    Wet Zone
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Select District</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {DISTRICTS_BY_ZONE[zone].map((dist) => (
                  <TouchableOpacity
                    key={dist}
                    style={[styles.chip, district === dist && styles.chipActive]}
                    onPress={() => setDistrict(dist)}
                  >
                    <Text style={[styles.chipText, district === dist && styles.chipTextActive]}>
                      {dist}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleRunAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Run AI Analysis</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {loadingWeather ? (
              <View style={styles.loadingWeather}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.loadingWeatherText}>Syncing local climate...</Text>
              </View>
            ) : (
              <WeatherIntelligenceCard weatherInfo={weatherInfo} district={district} />
            )}
          </>
        )}

        {/* STEP 2: Variety Recommendation */}
        {step === 2 && topVariety && (
          <>
            <View style={[styles.card, { borderTopWidth: 6, borderTopColor: COLORS.primary }]}>
              <View style={styles.topPickHeader}>
                <Ionicons name="checkmark-circle" size={40} color={COLORS.primary} />
                <View style={styles.topPickTitleBlock}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>AI BEST CHOICE</Text>
                  </View>
                  <Text style={styles.topPickTitle}>{topVariety.name}</Text>
                </View>
              </View>
              <Text style={styles.topPickDesc}>
                Based on {season} season in {district} ({zone}) and climate indicators,{" "}
                <Text style={styles.bold}>{topVariety.name}</Text> is the optimal match.
              </Text>
              <Text style={styles.reasonText}>Reason: {topVariety.reason}</Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => handleStartCultivationPlan(topVariety.id)}
                disabled={isGeneratingPlan}
              >
                {isGeneratingPlan ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Start Cultivation Plan</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeading}>Ranked Alternatives</Text>
            {recommendations.slice(1).map((v: any, index: number) => (
              <View key={v.id} style={styles.altCard}>
                <View style={styles.altCardHeader}>
                  <Text style={styles.altCardTitle}>{v.name}</Text>
                  <Text style={styles.scoreText}>{v.score}% Match</Text>
                </View>
                <Text style={styles.altCardDesc}>
                  {v.growing_days} Days | {v.predicted_yield_t_ha} t/ha | {v.grain_type}
                </Text>
                <TouchableOpacity
                  style={styles.secondaryBtnSmall}
                  onPress={() => handleStartCultivationPlan(v.id)}
                  disabled={isGeneratingPlan}
                >
                  <Text style={styles.secondaryBtnSmallText}>Select & Plan</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
              <Text style={styles.backBtnText}>Change Inputs</Text>
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3: Cultivation Plan */}
        {step === 3 && selectedPlan && (
          <>
            <CultivationPlanDashboard
              plan={selectedPlan}
              fieldArea={parseFloat(fieldArea)}
              district={district}
              season={season}
              onRestart={() => setStep(2)}
            />

            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
              <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
              <Text style={styles.backBtnText}>Back to Varieties</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  headerContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  stepContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.bgCard,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  stepNum: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  stepTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  stepTitleBold: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: COLORS.bgScreen,
  },
  rowBtnContainer: {
    flexDirection: "row",
    gap: 12,
  },
  rowBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    backgroundColor: COLORS.bgScreen,
  },
  rowBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "1A", // light tint
  },
  rowBtnText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  rowBtnTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  chipRow: {
    flexDirection: "row",
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgScreen,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    marginTop: 24,
    gap: 8,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingWeather: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  loadingWeatherText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  topPickHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  topPickTitleBlock: {
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
  topPickTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  topPickDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontWeight: "bold",
  },
  reasonText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  altCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  altCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  altCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  altCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  secondaryBtnSmall: {
    backgroundColor: COLORS.bgScreen,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  secondaryBtnSmallText: {
    color: COLORS.textPrimary,
    fontWeight: "bold",
    fontSize: 13,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  backBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "bold",
  },
});
