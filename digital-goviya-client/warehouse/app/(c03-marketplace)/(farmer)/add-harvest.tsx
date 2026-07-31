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
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            FARMER MARKETPLACE
          </Text>

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
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 22,
  },

  header: {
    gap: 8,
  },

  eyebrow: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    gap: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  helper: {
    marginTop: -12,
    color: "#94A3B8",
    fontSize: 12,
  },
});