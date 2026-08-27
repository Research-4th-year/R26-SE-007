import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/c03-marketplace/themed-native";
import { router } from "expo-router";
import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { demandService } from "@/services/c03-marketplace/demand.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";
import type { PaddyType } from "@/types/c03-marketplace/harvest.types";
import { useLanguage } from "@/contexts/LanguageContext";

interface FormErrors {
  quantityNeeded?: string;
  offeredPrice?: string;
  maximumBuyingPrice?: string;
}

export default function CreateDemandScreen() {
  const { t } = useLanguage();

  const [paddyType, setPaddyType] = useState<PaddyType>("nadu");
  const [quantityNeeded, setQuantityNeeded] = useState("");
  const [offeredPrice, setOfferedPrice] = useState("");
  const [maximumBuyingPrice, setMaximumBuyingPrice] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  // Entrance animation — presentation only, mirrors the farmer-side add-harvest screen.
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

  const paddyOptions: {
    label: string;
    value: PaddyType;
    icon: keyof typeof Ionicons.glyphMap;
    tag: string;
  }[] = [
    {
      label: t.c3createDemand.nadu,
      value: "nadu",
      icon: "leaf-outline",
      tag: t.c3createDemand.mostCommon,
    },
    {
      label: t.c3createDemand.samba,
      value: "samba",
      icon: "flower-outline",
      tag: t.c3createDemand.premiumGrain,
    },
    {
      label: t.c3createDemand.keeriSamba,
      value: "keeri samba",
      icon: "sparkles-outline",
      tag: t.c3createDemand.fineGrain,
    },
  ];

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const parsedQuantity = Number(quantityNeeded);
    const parsedPrice = Number(offeredPrice);
    const parsedMaximumBuyingPrice = Number(maximumBuyingPrice);

    if (!quantityNeeded.trim()) {
      nextErrors.quantityNeeded =
        t.c3createDemand.validation.quantityRequired;
    } else if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      nextErrors.quantityNeeded =
        t.c3createDemand.validation.quantityGreaterThanZero;
    }

    if (!offeredPrice.trim()) {
      nextErrors.offeredPrice =
        t.c3createDemand.validation.offeredPriceRequired;
    } else if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      nextErrors.offeredPrice =
        t.c3createDemand.validation.offeredPriceGreaterThanZero;
    }

    if (!maximumBuyingPrice.trim()) {
      nextErrors.maximumBuyingPrice =
        t.c3createDemand.validation.maximumPriceRequired;
    } else if (
      !Number.isFinite(parsedMaximumBuyingPrice) ||
      parsedMaximumBuyingPrice <= 0
    ) {
      nextErrors.maximumBuyingPrice =
        t.c3createDemand.validation.maximumPriceGreaterThanZero;
    } else if (
      Number.isFinite(parsedPrice) &&
      parsedMaximumBuyingPrice < parsedPrice
    ) {
      nextErrors.maximumBuyingPrice =
        t.c3createDemand.validation.maximumPriceCannotBeBelowOffer;
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting || !validateForm()) {
      return;
    }

    const payload = {
      paddyType,
      quantityNeeded: Number(quantityNeeded),
      offeredPrice: Number(offeredPrice),
      maximumBuyingPrice: Number(maximumBuyingPrice),
    };

    console.log("Submitting Miller demand:", payload);

    try {
      setSubmitting(true);

      const response = await demandService.createDemand(payload);

      console.log("Demand response:", JSON.stringify(response, null, 2));

      router.replace({
        pathname: "/(c03-marketplace)/(miller)/demand-result",
        params: {
          paddyType,
          quantityNeeded: String(quantityNeeded),
          offeredPrice: String(offeredPrice),
          status: response.data.status,
        },
      });
    } catch (error) {
      console.error("Demand creation failed:", error);
      Alert.alert(
        t.c3createDemand.unableToCreateDemand,
        getApiErrorMessage(error),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!fontsLoaded) return null;

  // Derived, display-only estimate — does not affect submission logic.
  const parsedQuantityPreview = Number(quantityNeeded);
  const parsedPricePreview = Number(offeredPrice);
  const estimatedValue =
    Number.isFinite(parsedQuantityPreview) &&
    parsedQuantityPreview > 0 &&
    Number.isFinite(parsedPricePreview) &&
    parsedPricePreview > 0
      ? parsedQuantityPreview * parsedPricePreview
      : null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.c3createDemand.goBack}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={20} color="#78350F" />
        </Pressable>

        {/* Hero */}
        <LinearGradient
          colors={["#92400E", "#78350F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGrainRow}>
            <Ionicons name="business" size={12} color="#FDE68A" />
            <Text style={styles.heroEyebrow}>
              {t.c3createDemand.eyebrow}
            </Text>
          </View>

          <Text style={styles.heroTitle}>{t.c3createDemand.title}</Text>

          <Text style={styles.heroSubtitle}>
            {t.c3createDemand.subtitle}
          </Text>

          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={13} color="#78350F" />
            <Text style={styles.heroBadgeText}>
              {t.c3createDemand.aiMatchingIncluded}
            </Text>
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
          {/* Demand details */}
          <View style={styles.formCard}>
            <View style={styles.cardSectionLabelRow}>
              <View style={styles.cardSectionIconBox}>
                <Ionicons name="document-text-outline" size={15} color="#92400E" />
              </View>
              <Text style={styles.cardSectionLabel}>
                {t.c3createDemand.demandDetails}
              </Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {t.c3createDemand.paddyType}
              </Text>

              <View style={styles.paddyGrid}>
                {paddyOptions.map((option) => {
                  const active = paddyType === option.value;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      activeOpacity={0.85}
                      onPress={() => setPaddyType(option.value)}
                      style={[styles.paddyCard, active && styles.paddyCardActive]}
                    >
                      {active ? (
                        <View style={styles.paddyCheck}>
                          <Ionicons name="checkmark-circle" size={16} color="#92400E" />
                        </View>
                      ) : null}

                      <View
                        style={[
                          styles.paddyIconBox,
                          active && styles.paddyIconBoxActive,
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={19}
                          color={active ? "#FFFFFF" : "#92400E"}
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
                        {option.tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.formCard}>
            <View style={styles.cardSectionLabelRow}>
              <View style={styles.cardSectionIconBox}>
                <Ionicons name="cash-outline" size={15} color="#92400E" />
              </View>
              <Text style={styles.cardSectionLabel}>
                {t.c3createDemand.pricing}
              </Text>
            </View>

            <Text style={styles.cardSectionDescription}>
              {t.c3createDemand.pricingDescription}
            </Text>

            <NumericField
              label={t.c3createDemand.quantityNeeded}
              value={quantityNeeded}
              onChangeText={(value) => {
                setQuantityNeeded(value);
                setErrors((current) => ({
                  ...current,
                  quantityNeeded: undefined,
                }));
              }}
              placeholder={t.c3createDemand.quantityPlaceholder}
              unit={t.c3createDemand.kg}
              icon="cube-outline"
              error={errors.quantityNeeded}
              helper={t.c3createDemand.quantityHelper}
            />

            <NumericField
              label={t.c3createDemand.offeredPrice}
              value={offeredPrice}
              onChangeText={(value) => {
                setOfferedPrice(value);
                setErrors((current) => ({
                  ...current,
                  offeredPrice: undefined,
                }));
              }}
              placeholder={t.c3createDemand.offeredPricePlaceholder}
              unit={t.c3createDemand.lkrPerKg}
              icon="pricetag-outline"
              error={errors.offeredPrice}
              helper={t.c3createDemand.offeredPriceHelper}
            />

            <NumericField
              label={t.c3createDemand.maximumBuyingPrice}
              value={maximumBuyingPrice}
              onChangeText={(value) => {
                setMaximumBuyingPrice(value);
                setErrors((current) => ({
                  ...current,
                  maximumBuyingPrice: undefined,
                }));
              }}
              placeholder={t.c3createDemand.maximumBuyingPricePlaceholder}
              unit={t.c3createDemand.lkrPerKg}
              icon="shield-checkmark-outline"
              error={errors.maximumBuyingPrice}
              helper={t.c3createDemand.maximumBuyingPriceHelper}
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
                    <Text style={styles.estimateLabel}>
                      {t.c3createDemand.estimatedDemandValue}
                    </Text>
                    <Text style={styles.estimateValue}>
                      {formatCurrency(estimatedValue)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#92400E" />
              <Text style={styles.infoText}>
                {t.c3createDemand.openDemandInfo}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSubmit}
            disabled={submitting}
            style={styles.submitShadow}
          >
            <LinearGradient
              colors={["#FDE68A", "#F5C542"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {submitting ? (
                <ActivityIndicator color="#78350F" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color="#78350F" />
                  <Text style={styles.submitText}>
                    {t.c3createDemand.publishDemand}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
          <Ionicons name={icon} size={17} color={error ? "#DC2626" : "#92400E"} />
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
          <Text style={styles.unitChipText} numberOfLines={1} adjustsFontSizeToFit>
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
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 120,
    gap: 0,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginTop: 14,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  // Hero
  hero: {
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 30,
    marginTop: 14,
    gap: 10,
    overflow: "hidden",
  },

  heroGrainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  heroEyebrow: {
    color: "#FDE68A",
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
    color: "rgba(255,255,255,0.72)",
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
    color: "#78350F",
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
  },

  // Ticket perforation between hero and cards — signature motif shared across the marketplace
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
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  cardSectionLabel: {
    color: "#92400E",
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

  fieldLabel: {
    color: INK,
    fontSize: 12.5,
    fontFamily: "Poppins_600SemiBold",
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
    backgroundColor: "#FFF7ED",
    borderColor: "#92400E",
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
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  paddyIconBoxActive: {
    backgroundColor: "#92400E",
  },

  paddyLabel: {
    color: INK,
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },

  paddyLabelActive: {
    color: "#78350F",
  },

  paddyTag: {
    color: INK_MUTED,
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },

  paddyTagActive: {
    color: "#92400E",
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
    backgroundColor: "#FEF3C7",
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

  // Info box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  infoText: {
    flex: 1,
    color: "#78350F",
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "Poppins_500Medium",
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
    color: "#78350F",
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },
});