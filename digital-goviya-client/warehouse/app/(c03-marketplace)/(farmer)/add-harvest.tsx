import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { MarketplaceButton } from
  "@/components/c03-marketplace/MarketplaceButton";
import { MarketplaceInput } from
  "@/components/c03-marketplace/MarketplaceInput";
import { OptionSelector } from
  "@/components/c03-marketplace/OptionSelector";

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

interface FormErrors {
  quantity?: string;
  expectedPrice?: string;
}

export default function AddHarvestScreen() {
  const [paddyType, setPaddyType] =
    useState<PaddyType>("nadu");

  const [season, setSeason] =
    useState<PaddySeason>("maha");

  const [quantity, setQuantity] = useState("");
  const [expectedPrice, setExpectedPrice] =
    useState("");

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

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const parsedQuantity = Number(quantity);
    const parsedExpectedPrice =
      Number(expectedPrice);

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

  return (
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
        <View style={styles.header}>
          <View style={styles.eyebrowPill}>
            <Ionicons name="leaf" size={11} color="#15803D" />
            <Text style={styles.eyebrow}>
              FARMER MARKETPLACE
            </Text>
          </View>

          <Text style={styles.title}>
            Add Harvest
          </Text>

          <Text style={styles.subtitle}>
            Enter your harvest details to receive an
            AI-powered price recommendation and market
            insight.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.cardSectionLabelRow}>
            <View style={styles.cardSectionDot} />
            <Text style={styles.cardSectionLabel}>
              Harvest details
            </Text>
          </View>

          <OptionSelector
            label="Paddy type"
            value={paddyType}
            options={PADDY_OPTIONS}
            onChange={setPaddyType}
          />

          <OptionSelector
            label="Season"
            value={season}
            options={SEASON_OPTIONS}
            onChange={setSeason}
          />

          <View style={styles.divider} />

          <View style={styles.cardSectionLabelRow}>
            <View style={styles.cardSectionDot} />
            <Text style={styles.cardSectionLabel}>
              Pricing
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <MarketplaceInput
              label="Quantity"
              value={quantity}
              onChangeText={(value) => {
                setQuantity(value);
                setErrors((current) => ({
                  ...current,
                  quantity: undefined,
                }));
              }}
              placeholder="Example: 1000"
              keyboardType="decimal-pad"
              error={errors.quantity}
            />

            <Text style={styles.helper}>
              Enter quantity in kilograms.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <MarketplaceInput
              label="Expected price per kilogram"
              value={expectedPrice}
              onChangeText={(value) => {
                setExpectedPrice(value);
                setErrors((current) => ({
                  ...current,
                  expectedPrice: undefined,
                }));
              }}
              placeholder="Example: 125"
              keyboardType="decimal-pad"
              error={errors.expectedPrice}
            />

            <Text style={styles.helper}>
              Enter the amount in Sri Lankan Rupees.
            </Text>
          </View>

          <MarketplaceButton
            title="Get AI Recommendation"
            onPress={handleSubmit}
            loading={submitting}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 22,
  },

  header: {
    gap: 8,
  },

  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 2,
  },

  eyebrow: {
    color: "#15803D",
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1.2,
  },

  title: {
    color: "#0F172A",
    fontSize: 28,
    fontFamily: "Poppins_800ExtraBold",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: "Poppins_500Medium",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    gap: 18,
    borderWidth: 1,
    borderColor: "#EEF0ED",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  cardSectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: -4,
    marginBottom: -6,
  },

  cardSectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#15803D",
  },

  cardSectionLabel: {
    color: "#15803D",
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F1EF",
    marginVertical: 2,
  },

  fieldGroup: {
    gap: 6,
  },

  helper: {
    marginTop: -10,
    color: "#94A3B8",
    fontSize: 11.5,
    fontFamily: "Poppins_500Medium",
  },
});