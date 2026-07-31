import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MarketplaceButton } from "@/components/c03-marketplace/MarketplaceButton";

import { MarketplaceInput } from "@/components/c03-marketplace/MarketplaceInput";

import { OptionSelector } from "@/components/c03-marketplace/OptionSelector";

import { demandService } from "@/services/c03-marketplace/demand.service";

import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";

import type { PaddyType } from "@/types/c03-marketplace/harvest.types";

const PADDY_OPTIONS: Array<{
  label: string;
  value: PaddyType;
}> = [
  {
    label: "Nadu",
    value: "nadu",
  },
  {
    label: "Samba",
    value: "samba",
  },
  {
    label: "Keeri Samba",
    value: "keeri samba",
  },
];

interface FormErrors {
  quantityNeeded?: string;
  offeredPrice?: string;
}

export default function CreateDemandScreen() {
  const [paddyType, setPaddyType] = useState<PaddyType>("nadu");

  const [quantityNeeded, setQuantityNeeded] = useState("");

  const [offeredPrice, setOfferedPrice] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};

    const parsedQuantity = Number(quantityNeeded);

    const parsedPrice = Number(offeredPrice);

    if (!quantityNeeded.trim()) {
      nextErrors.quantityNeeded = "Please enter the required quantity.";
    } else if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      nextErrors.quantityNeeded = "Quantity must be greater than zero.";
    }

    if (!offeredPrice.trim()) {
      nextErrors.offeredPrice = "Please enter your offered price.";
    } else if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      nextErrors.offeredPrice = "Offered price must be greater than zero.";
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

      Alert.alert("Unable to create demand", getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.navigationHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </Pressable>

          <View style={styles.navigationText}>
            <Text style={styles.navigationTitle}>Create Demand</Text>

            <Text style={styles.navigationSubtitle}>
              Publish a paddy requirement
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Ionicons name="business-outline" size={27} color="#FFFFFF" />
            </View>

            <View style={styles.heroText}>
              <Text style={styles.heroEyebrow}>MILLER MARKETPLACE</Text>

              <Text style={styles.heroTitle}>Find suitable paddy harvests</Text>

              <Text style={styles.heroDescription}>
                Publish your current requirement so the matching engine can
                identify compatible farmer harvests.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#15803D"
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Demand information</Text>

                <Text style={styles.sectionDescription}>
                  Enter the paddy requirement accurately.
                </Text>
              </View>
            </View>

            <OptionSelector
              label="Paddy type"
              value={paddyType}
              options={PADDY_OPTIONS}
              onChange={setPaddyType}
            />

            <MarketplaceInput
              label="Quantity needed"
              value={quantityNeeded}
              onChangeText={(value) => {
                setQuantityNeeded(value);

                setErrors((current) => ({
                  ...current,
                  quantityNeeded: undefined,
                }));
              }}
              placeholder="Example: 1500"
              keyboardType="decimal-pad"
              error={errors.quantityNeeded}
            />

            <Text style={styles.helper}>
              Enter the required quantity in kilograms.
            </Text>

            <MarketplaceInput
              label="Offered price per kilogram"
              value={offeredPrice}
              onChangeText={(value) => {
                setOfferedPrice(value);

                setErrors((current) => ({
                  ...current,
                  offeredPrice: undefined,
                }));
              }}
              placeholder="Example: 128"
              keyboardType="decimal-pad"
              error={errors.offeredPrice}
            />

            <Text style={styles.helper}>
              Enter the buying price in Sri Lankan Rupees.
            </Text>

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#1D4ED8"
              />

              <Text style={styles.infoText}>
                Your demand will be marked as Open and considered by the
                AI-based matching system.
              </Text>
            </View>

            <MarketplaceButton
              title="Publish Demand"
              onPress={handleSubmit}
              loading={submitting}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

  navigationHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  navigationText: {
    flex: 1,
    marginLeft: 14,
  },

  navigationTitle: {
    color: "#1F2937",
    fontSize: 19,
    fontWeight: "800",
  },

  navigationSubtitle: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
    gap: 20,
  },

  heroCard: {
    flexDirection: "row",
    gap: 14,
    borderRadius: 23,
    padding: 19,
    backgroundColor: "#14532D",
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  heroText: {
    flex: 1,
  },

  heroEyebrow: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 5,
  },

  heroDescription: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  formCard: {
    borderRadius: 22,
    padding: 18,
    gap: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "800",
  },

  sectionDescription: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 3,
  },

  helper: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: -12,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  infoText: {
    flex: 1,
    color: "#1E40AF",
    fontSize: 11,
    lineHeight: 17,
  },

  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
});
