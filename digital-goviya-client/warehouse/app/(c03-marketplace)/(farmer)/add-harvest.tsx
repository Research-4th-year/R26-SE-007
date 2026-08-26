import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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

import { harvestService } from
  "@/services/c03-marketplace/harvest.service";

import { getApiErrorMessage } from
  "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  PaddySeason,
  PaddyType,
} from "@/types/c03-marketplace/harvest.types";

const PADDY_OPTIONS: {
  label: string;
  value: PaddyType;
}[] = [
  { label: "Nadu", value: "nadu" },
  { label: "Samba", value: "samba" },
  {
    label: "Keeri Samba",
    value: "keeri samba",
  },
];

const SEASON_OPTIONS: {
  label: string;
  value: PaddySeason;
}[] = [
  { label: "Maha", value: "maha" },
  { label: "Yala", value: "yala" },
];

// Presentation-only metadata for the redesigned selectors.
// Does not affect PADDY_OPTIONS / SEASON_OPTIONS or form logic.
const PADDY_META: Record<
  PaddyType,
  { icon: keyof typeof Ionicons.glyphMap; tag: string }
> = {
  nadu: { icon: "leaf-outline", tag: "Most common" },
  samba: { icon: "flower-outline", tag: "Premium grain" },
  "keeri samba": { icon: "sparkles-outline", tag: "Fine grain" },
};

const SEASON_META: Record<
  PaddySeason,
  { icon: keyof typeof Ionicons.glyphMap; range: string; desc: string }
> = {
  maha: {
    icon: "rainy-outline",
    range: "Oct – Mar",
    desc: "The main monsoon-fed growing season.",
  },
  yala: {
    icon: "sunny-outline",
    range: "May – Aug",
    desc: "The secondary, irrigation-fed season.",
  },
};

interface FormErrors {
  quantity?: string;
  expectedPrice?: string;
  minimumAcceptablePrice?: string;
}

export default function AddHarvestScreen() {
  const [paddyType, setPaddyType] =
    useState<PaddyType>("nadu");

  const [season, setSeason] =
    useState<PaddySeason>("maha");

  const [quantity, setQuantity] = useState("");
  const [expectedPrice, setExpectedPrice] =
    useState("");

  const [
    minimumAcceptablePrice,
    setMinimumAcceptablePrice,
  ] = useState("");

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [submitting, setSubmitting] =
    useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  // Entrance animation — presentation only.
  const cardsFade = useRef(new Animated.Value(0)).current;
  const cardsRise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.parallel([
      Animated.timing(cardsFade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(cardsRise, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded]);

  // Season segmented-toggle animation — presentation only, does not affect `season` state/logic.
  const [seasonToggleWidth, setSeasonToggleWidth] = useState(0);
  const seasonAnim = useRef(
    new Animated.Value(season === "maha" ? 0 : 1)
  ).current;

  useEffect(() => {
    Animated.timing(seasonAnim, {
      toValue: season === "maha" ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [season]);

  const seasonSegmentWidth =
    seasonToggleWidth > 0 ? (seasonToggleWidth - 8) / 2 : 0;

  const seasonIndicatorTranslate = seasonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, seasonSegmentWidth],
  });

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const parsedQuantity = Number(quantity);
    const parsedExpectedPrice =
      Number(expectedPrice);

    const parsedMinimumAcceptablePrice =
      Number(minimumAcceptablePrice);

    if (!quantity.trim()) {
      nextErrors.quantity =
        "Please enter the harvest quantity.";
    } else if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      nextErrors.quantity =
        "Quantity must be greater than zero.";
    }

    if (!expectedPrice.trim()) {
      nextErrors.expectedPrice =
        "Please enter your expected price.";
    } else if (
      !Number.isFinite(parsedExpectedPrice) ||
      parsedExpectedPrice <= 0
    ) {
      nextErrors.expectedPrice =
        "Expected price must be greater than zero.";
    }

    if (!minimumAcceptablePrice.trim()) {
      nextErrors.minimumAcceptablePrice =
        "Please enter your minimum acceptable price.";
    } else if (
      !Number.isFinite(parsedMinimumAcceptablePrice) ||
      parsedMinimumAcceptablePrice <= 0
    ) {
      nextErrors.minimumAcceptablePrice =
        "Minimum acceptable price must be greater than zero.";
    } else if (
      Number.isFinite(parsedExpectedPrice) &&
      parsedMinimumAcceptablePrice > parsedExpectedPrice
    ) {
      nextErrors.minimumAcceptablePrice =
        "Minimum acceptable price cannot exceed your expected price.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
  if (submitting) {
    return;
  }

  if (!validateForm()) {
    console.log("Harvest form validation failed.");
    return;
  }

  const payload = {
    paddyType,
    season,
    quantity: Number(quantity),
    expectedPrice: Number(expectedPrice),
    minimumAcceptablePrice: Number(
      minimumAcceptablePrice
    ),
  };

  console.log("Submitting harvest:", payload);

  try {
  setSubmitting(true);

  const response =
    await harvestService.createHarvest({
      paddyType,
      season,
      quantity: Number(quantity),
      expectedPrice: Number(expectedPrice),
      minimumAcceptablePrice: Number(
        minimumAcceptablePrice
      ),
    });

  console.log(
    "Create harvest response:",
    JSON.stringify(response, null, 2)
  );

  const result = response.data;
  const harvest = result.harvest;

  router.replace({
    pathname:
      "/(c03-marketplace)/(farmer)/harvest-result",

    params: {
      harvestId: harvest._id,
      paddyType: harvest.paddyType,
      season: harvest.season,
      quantity: String(harvest.quantity),
      expectedPrice: String(
        harvest.expectedPrice
      ),
      aiPredictedPrice: String(
        harvest.aiPredictedPrice
      ),
      priceDifference: String(
        harvest.priceDifference
      ),
      priceLevel: harvest.priceLevel,
      harvestScore: String(
        harvest.harvestScore
      ),
      marketStatus: harvest.marketStatus,
      recommendedAction:
        harvest.recommendedAction,

      recommendationEnglish:
        harvest.recommendation.english,

      recommendationSinhala:
        harvest.recommendation.sinhala,

      matchingPaddyDemands: String(
        result.demandSummary
          .matchingPaddyDemands
      ),

      quantityCompatibleDemands: String(
        result.demandSummary
          .quantityCompatibleDemands
      ),

      sameDistrictDemands: String(
        result.demandSummary
          .sameDistrictDemands
      ),

      createdAt: harvest.createdAt,
    },
  });
} catch (error) {
  console.error(
    "Create harvest failed:",
    error
  );

  Alert.alert(
    "Unable to add harvest",
    getApiErrorMessage(error)
  );
} finally {
  setSubmitting(false);
}
};

  if (!fontsLoaded) return null;

  // Derived, display-only estimate — does not affect submission logic.
  const parsedQuantityPreview = Number(quantity);
  const parsedPricePreview = Number(expectedPrice);
  const estimatedValue =
    Number.isFinite(parsedQuantityPreview) &&
    parsedQuantityPreview > 0 &&
    Number.isFinite(parsedPricePreview) &&
    parsedPricePreview > 0
      ? parsedQuantityPreview * parsedPricePreview
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Hero */}
        <LinearGradient
          colors={["#1B5E3A", "#0F3D26"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGrainRow}>
            <Ionicons name="leaf" size={12} color="#BBF7D0" />
            <Text style={styles.heroEyebrow}>FARMER MARKETPLACE</Text>
          </View>

          <Text style={styles.heroTitle}>New Harvest{"\n"}Entry</Text>

          <Text style={styles.heroSubtitle}>
            Tell us what you've grown — we'll match it against
            live demand and suggest a fair price.
          </Text>

          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={13} color="#0B3B22" />
            <Text style={styles.heroBadgeText}>AI price insight included</Text>
          </View>
        </LinearGradient>

        {/* Ticket perforation between hero and form */}
        <View style={styles.perforationRow}>
          <View style={styles.perforationNotchLeft} />
          <View style={styles.perforationLine} />
          <View style={styles.perforationNotchRight} />
        </View>

        <Animated.View
          style={{
            opacity: cardsFade,
            transform: [{ translateY: cardsRise }],
          }}
        >
          {/* Harvest details */}
          <View style={styles.formCard}>
            <View style={styles.cardSectionLabelRow}>
              <View style={styles.cardSectionIconBox}>
                <Ionicons name="leaf-outline" size={15} color="#166534" />
              </View>
              <Text style={styles.cardSectionLabel}>Harvest details</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Paddy type</Text>

              <View style={styles.paddyGrid}>
                {PADDY_OPTIONS.map((option) => {
                  const active = paddyType === option.value;
                  const meta = PADDY_META[option.value];

                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.85}
                      onPress={() => setPaddyType(option.value)}
                      style={[styles.paddyCard, active && styles.paddyCardActive]}
                    >
                      {active ? (
                        <View style={styles.paddyCheck}>
                          <Ionicons name="checkmark-circle" size={16} color="#166534" />
                        </View>
                      ) : null}

                      <View
                        style={[
                          styles.paddyIconBox,
                          active && styles.paddyIconBoxActive,
                        ]}
                      >
                        <Ionicons
                          name={meta.icon}
                          size={19}
                          color={active ? "#FFFFFF" : "#166534"}
                        />
                      </View>

                      <Text
                        style={[
                          styles.paddyLabel,
                          active && styles.paddyLabelActive,
                        ]}
                      >
                        {option.label}
                      </Text>

                      <Text
                        style={[
                          styles.paddyTag,
                          active && styles.paddyTagActive,
                        ]}
                      >
                        {meta.tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Season</Text>
                <Text style={styles.fieldHint}>{SEASON_META[season].range}</Text>
              </View>

              {/* Segmented toggle replaces the old two-card grid */}
              <View
                style={styles.seasonToggle}
                onLayout={(event) =>
                  setSeasonToggleWidth(event.nativeEvent.layout.width)
                }
              >
                {seasonSegmentWidth > 0 ? (
                  <Animated.View
                    style={[
                      styles.seasonIndicator,
                      {
                        width: seasonSegmentWidth,
                        transform: [{ translateX: seasonIndicatorTranslate }],
                      },
                    ]}
                  />
                ) : null}

                {SEASON_OPTIONS.map((option) => {
                  const active = season === option.value;
                  const meta = SEASON_META[option.value];

                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.8}
                      onPress={() => setSeason(option.value)}
                      style={styles.seasonSegment}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={16}
                        color={active ? "#FFFFFF" : "#166534"}
                      />
                      <Text
                        style={[
                          styles.seasonSegmentText,
                          active && styles.seasonSegmentTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldDescription}>
                {SEASON_META[season].desc}
              </Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.formCard}>
            <View style={styles.cardSectionLabelRow}>
              <View style={styles.cardSectionIconBox}>
                <Ionicons name="cash-outline" size={15} color="#166534" />
              </View>
              <Text style={styles.cardSectionLabel}>Pricing</Text>
            </View>

            <Text style={styles.cardSectionDescription}>
              Set your quantity and expected price — we'll work out the
              estimated value as you type.
            </Text>

            <NumericField
              label="Quantity"
              value={quantity}
              onChangeText={(value) => {
                setQuantity(value);
                setErrors((current) => ({
                  ...current,
                  quantity: undefined,
                }));
              }}
              placeholder="  1000"
              unit="kg"
              icon="cube-outline"
              error={errors.quantity}
              helper="Enter quantity in kilograms."
            />

            <NumericField
              label="Expected price per kilogram"
              value={expectedPrice}
              onChangeText={(value) => {
                setExpectedPrice(value);
                setErrors((current) => ({
                  ...current,
                  expectedPrice: undefined,
                }));
              }}
              placeholder="  125"
              unit="LKR/kg"
              icon="pricetag-outline"
              error={errors.expectedPrice}
              helper="Enter the amount in Sri Lankan Rupees."
            />

            <NumericField
              label="Minimum acceptable price per kilogram"
              value={minimumAcceptablePrice}
              onChangeText={(value) => {
                setMinimumAcceptablePrice(value);
                setErrors((current) => ({
                  ...current,
                  minimumAcceptablePrice: undefined,
                }));
              }}
              placeholder="  120"
              unit="LKR/kg"
              icon="shield-checkmark-outline"
              error={errors.minimumAcceptablePrice}
              helper="Private: used only by your Farmer AI agent during negotiation."
            />

            {estimatedValue !== null ? (
              <View style={styles.estimateStub}>
                <View style={styles.estimateStubNotchLeft} />
                <View style={styles.estimateStubNotchRight} />

                <View style={styles.estimateRow}>
                  <View style={styles.estimateIconBox}>
                    <Ionicons name="calculator-outline" size={18} color="#B45309" />
                  </View>
                  <View style={styles.estimateTextArea}>
                    <Text style={styles.estimateLabel}>Estimated harvest value</Text>
                    <Text style={styles.estimateValue}>
                      {formatCurrency(estimatedValue)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submitShadow}
          >
            <LinearGradient
              colors={["#F5C542", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color="#0B3B22" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#0B3B22" />
                  <Text style={styles.submitText}>Get AI Recommendation</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface NumericFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  unit: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  helper: string;
}

function NumericField({
  label,
  value,
  onChangeText,
  placeholder,
  unit,
  icon,
  error,
  helper,
}: NumericFieldProps) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={[styles.inputRow, error && styles.inputRowError]}>
        <View style={[styles.inputIconBox, error && styles.inputIconBoxError]}>
          <Ionicons name={icon} size={17} color={error ? "#DC2626" : "#166534"} />
        </View>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B7AF9C"
          keyboardType="decimal-pad"
        />

        <View style={styles.unitChip}>
          <Text
            style={styles.unitChipText}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {unit}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.messageRow}>
          <Ionicons name="alert-circle" size={12} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.messageRow}>
          <Ionicons name="information-circle-outline" size={12} color="#9C9280" />
          <Text style={styles.helper}>{helper}</Text>
        </View>
      )}
    </View>
  );
}

function formatCurrency(value: number): string {
  return `LKR ${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

const CREAM = "#FBF8F1";
const CARD_BORDER = "#ECE6D6";
const INK = "#16241C";
const INK_MUTED = "#7A7364";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: CREAM,
  },

  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 0,
  },

  // Hero
  hero: {
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 30,
    marginTop: 14,
    gap: 10,
  },

  heroGrainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  heroEyebrow: {
    color: "#BBF7D0",
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1.4,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 34,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  heroSubtitle: {
    color: "#DCEFE1",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Poppins_500Medium",
    maxWidth: "92%",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#F5C542",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 6,
  },

  heroBadgeText: {
    color: "#0B3B22",
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
  },

  // Ticket perforation between hero and cards — the signature motif
  perforationRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 16,
  },

  perforationLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D8CFB8",
    marginHorizontal: -6,
  },

  perforationNotchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CREAM,
    marginLeft: -8,
  },

  perforationNotchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CREAM,
    marginRight: -8,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  cardSectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cardSectionIconBox: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  cardSectionLabel: {
    color: "#166534",
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  cardSectionDescription: {
    color: INK_MUTED,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Poppins_500Medium",
    marginTop: -8,
  },

  fieldBlock: {
    gap: 10,
  },

  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fieldLabel: {
    color: INK,
    fontSize: 12.5,
    fontFamily: "Poppins_600SemiBold",
  },

  fieldHint: {
    color: "#166534",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },

  fieldDescription: {
    color: INK_MUTED,
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: "Poppins_500Medium",
    marginTop: -2,
  },

  // Paddy type cards
  paddyGrid: {
    flexDirection: "row",
    gap: 10,
  },

  paddyCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: "#FAFAF7",
    borderWidth: 1.4,
    borderColor: "#E7E2D3",
    alignItems: "center",
    gap: 7,
  },

  paddyCardActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "#166534",
  },

  paddyCheck: {
    position: "absolute",
    top: -7,
    right: -7,
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
  },

  paddyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  paddyIconBoxActive: {
    backgroundColor: "#166534",
  },

  paddyLabel: {
    color: INK,
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },

  paddyLabelActive: {
    color: "#14532D",
  },

  paddyTag: {
    color: INK_MUTED,
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },

  paddyTagActive: {
    color: "#166534",
  },

  // Season segmented toggle — replaces the old two-card grid
  seasonToggle: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    position: "relative",
    overflow: "hidden",
  },

  seasonIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 12,
    backgroundColor: "#166534",
  },

  seasonSegment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    zIndex: 1,
  },

  seasonSegmentText: {
    color: "#166534",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  seasonSegmentTextActive: {
    color: "#FFFFFF",
  },

  // Numeric field
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.4,
    borderColor: "#E7E2D3",
    backgroundColor: "#FAFAF7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },

  inputRowError: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },

  inputIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  inputIconBoxError: {
    backgroundColor: "#FEE2E2",
  },

  input: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: INK,
    paddingVertical: 10,
  },

  unitChip: {
    flexShrink: 0,
    maxWidth: 78,
    backgroundColor: "#EFEADA",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  unitChipText: {
    color: "#5C5540",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  helper: {
    color: INK_MUTED,
    fontSize: 11.5,
    fontFamily: "Poppins_500Medium",
  },

  errorText: {
    color: "#DC2626",
    fontSize: 11.5,
    fontFamily: "Poppins_600SemiBold",
  },

  // Estimate — styled like a receipt stub torn from the form
  estimateStub: {
    position: "relative",
    borderRadius: 16,
    padding: 14,
    paddingTop: 18,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderStyle: "dashed",
    overflow: "visible",
  },

  estimateStubNotchLeft: {
    position: "absolute",
    top: -9,
    left: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },

  estimateStubNotchRight: {
    position: "absolute",
    top: -9,
    right: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },

  estimateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  estimateIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  estimateTextArea: {
    flex: 1,
  },

  estimateLabel: {
    color: "#92400E",
    fontSize: 10.5,
    fontFamily: "Poppins_600SemiBold",
  },

  estimateValue: {
    color: "#78350F",
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  // Submit
  submitShadow: {
    borderRadius: 16,
    marginTop: 22,
    shadowColor: "#D97706",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  submitButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 16,
  },

  submitText: {
    color: "#0B3B22",
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },
});