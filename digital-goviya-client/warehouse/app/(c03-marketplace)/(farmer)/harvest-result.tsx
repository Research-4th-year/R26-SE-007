import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface HarvestResultParams {
  harvestId?: string;
  paddyType?: string;
  season?: string;
  quantity?: string;

  expectedPrice?: string;
  aiPredictedPrice?: string;
  priceDifference?: string;
  priceLevel?: string;

  harvestScore?: string;
  marketStatus?: string;
  recommendedAction?: string;

  recommendationEnglish?: string;
  recommendationSinhala?: string;

  matchingPaddyDemands?: string;
  quantityCompatibleDemands?: string;
  sameDistrictDemands?: string;

  priceCompatibility?: string;
  quantityCompatibility?: string;
  paddyDemand?: string;
  districtDemand?: string;

  createdAt?: string;
}

export default function HarvestResultScreen() {
  const params =
  useLocalSearchParams() as HarvestResultParams;

  const quantity = toNumber(params.quantity);
  const expectedPrice = toNumber(params.expectedPrice);
  const aiPredictedPrice = toNumber(params.aiPredictedPrice);
  const harvestScore = toNumber(params.harvestScore);

  const priceDifference =
    toNumber(params.priceDifference) ??
    (aiPredictedPrice !== null && expectedPrice !== null
      ? expectedPrice - aiPredictedPrice
      : null);

  const recommendation =
    params.recommendationEnglish?.trim() ||
    createRecommendation(expectedPrice, aiPredictedPrice);

  const sinhalaRecommendation = params.recommendationSinhala?.trim() || "";

  return (
    <SafeAreaView style={styles.screen}>
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

        <View style={styles.headerTitleArea}>
          <Text style={styles.headerTitle}>AI Harvest Result</Text>

          <Text style={styles.headerSubtitle}>Market price recommendation</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
            </View>

            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI GENERATED</Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>Recommended market price</Text>

          <Text style={styles.heroPrice}>
            {aiPredictedPrice !== null
              ? formatCurrency(aiPredictedPrice)
              : "Prediction pending"}
          </Text>

          <Text style={styles.heroUnit}>per kilogram</Text>

          {priceDifference !== null ? (
            <View style={styles.differenceBadge}>
              <Ionicons
                name={
                  priceDifference >= 0
                    ? "trending-up-outline"
                    : "trending-down-outline"
                }
                size={18}
                color="#14532D"
              />

              <Text style={styles.differenceText}>
                {priceDifference >= 0
                  ? `Your expected price is ${formatCurrency(
                      priceDifference,
                    )} above the AI estimate`
                  : `Your expected price is ${formatCurrency(
                      Math.abs(priceDifference),
                    )} below the AI estimate`}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Harvest summary</Text>

        <View style={styles.summaryCard}>
          <SummaryRow
            icon="leaf-outline"
            label="Paddy type"
            value={formatLabel(params.paddyType)}
          />

          <Divider />

          <SummaryRow
            icon="calendar-outline"
            label="Season"
            value={formatLabel(params.season)}
          />

          <Divider />

          <SummaryRow
            icon="cube-outline"
            label="Quantity"
            value={
              quantity !== null
                ? `${formatNumber(quantity)} kg`
                : "Not available"
            }
          />

          <Divider />

          <SummaryRow
            icon="cash-outline"
            label="Expected price"
            value={
              expectedPrice !== null
                ? `${formatCurrency(expectedPrice)} / kg`
                : "Not available"
            }
          />

          <Divider />

          <SummaryRow
            icon="time-outline"
            label="Submitted date"
            value={formatDate(params.createdAt)}
          />
        </View>

        {harvestScore !== null ? (
          <>
            <Text style={styles.sectionTitle}>Harvest score</Text>

            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View>
                  <Text style={styles.scoreTitle}>Market readiness</Text>

                  <Text style={styles.scoreDescription}>
                    Based on price and current demand conditions.
                  </Text>
                </View>

                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>
                    {Math.round(harvestScore)}
                  </Text>

                  <Text style={styles.scoreTotal}>/100</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(Math.max(harvestScore, 0), 100)}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.scoreStatus}>
                {getScoreDescription(harvestScore)}
              </Text>
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>AI recommendation</Text>

        <View style={styles.recommendationCard}>
          <View style={styles.recommendationIcon}>
            <Ionicons name="bulb-outline" size={26} color="#B45309" />
          </View>

          <View style={styles.recommendationContent}>
            <Text style={styles.recommendationTitle}>Suggested action</Text>

            <Text style={styles.recommendationText}>{recommendation}</Text>

            {sinhalaRecommendation ? (
              <>
                <View style={styles.recommendationDivider} />

                <Text style={styles.sinhalaRecommendation}>
                  {sinhalaRecommendation}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {params.marketStatus ? (
          <View style={styles.statusCard}>
            <View>
              <Text style={styles.statusLabel}>Market status</Text>

              <Text style={styles.statusValue}>
                {formatLabel(params.marketStatus)}
              </Text>
            </View>

            <Ionicons name="analytics-outline" size={27} color="#15803D" />
          </View>
        ) : null}

        <Pressable
          onPress={() => router.push("./my-harvests")}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="list-outline" size={20} color="#FFFFFF" />

          <Text style={styles.primaryButtonText}>View All Harvests</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("./add-harvest")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add-circle-outline" size={20} color="#15803D" />

          <Text style={styles.secondaryButtonText}>Add Another Harvest</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

interface SummaryRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons name={icon} size={20} color="#15803D" />
      </View>

      <View style={styles.summaryTextArea}>
        <Text style={styles.summaryLabel}>{label}</Text>

        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function toNumber(value?: string): number | null {
  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatLabel(value?: string): string {
  if (!value) {
    return "Not available";
  }

  return value
    .trim()
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrency(value: number): string {
  return `LKR ${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatDate(value?: string): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createRecommendation(
  expectedPrice: number | null,
  predictedPrice: number | null,
): string {
  if (expectedPrice === null || predictedPrice === null) {
    return (
      "The AI prediction is still being processed. " +
      "Review this harvest again after the market " +
      "analysis is complete."
    );
  }

  const difference = predictedPrice - expectedPrice;

  if (difference >= 5) {
    return (
      "The predicted market price is higher than your " +
      "expected price. Consider listing near the AI " +
      "recommended price while allowing a small range " +
      "for negotiation."
    );
  }

  if (difference <= -5) {
    return (
      "Your expected price is higher than the current " +
      "AI estimate. Consider reviewing current demand " +
      "or waiting for stronger market conditions before " +
      "accepting an offer."
    );
  }

  return (
    "Your expected price is close to the AI market " +
    "estimate. This is a competitive price for matching " +
    "with suitable millers."
  );
}

function getScoreDescription(score: number): string {
  if (score >= 80) {
    return "Excellent market readiness";
  }

  if (score >= 60) {
    return "Good market readiness";
  }

  if (score >= 40) {
    return "Moderate market readiness";
  }

  return "Market conditions may need improvement";
}

const styles = StyleSheet.create({
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

  headerTitleArea: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitle: {
    color: "#1F2937",
    fontSize: 19,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  heroCard: {
    borderRadius: 25,
    padding: 21,
    backgroundColor: "#14532D",
    marginBottom: 25,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  aiBadge: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: "#FDE68A",
  },

  aiBadgeText: {
    color: "#14532D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  heroLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
  },

  heroPrice: {
    color: "#FFFFFF",
    fontSize: 33,
    fontWeight: "900",
    marginTop: 6,
  },

  heroUnit: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    marginTop: 3,
  },

  differenceBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#FDE68A",
    marginTop: 18,
  },

  differenceText: {
    color: "#14532D",
    fontSize: 10,
    fontWeight: "800",
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 3,
  },

  summaryCard: {
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 24,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  summaryTextArea: {
    flex: 1,
    marginLeft: 12,
  },

  summaryLabel: {
    color: "#64748B",
    fontSize: 10,
  },

  summaryValue: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 13,
  },

  scoreCard: {
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 17,
    marginBottom: 24,
  },

  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  scoreTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "800",
  },

  scoreDescription: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    maxWidth: 230,
  },

  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
  },

  scoreNumber: {
    color: "#15803D",
    fontSize: 21,
    fontWeight: "900",
  },

  scoreTotal: {
    color: "#64748B",
    fontSize: 9,
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginTop: 17,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },

  scoreStatus: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 9,
  },

  recommendationCard: {
    flexDirection: "row",
    gap: 13,
    borderRadius: 21,
    padding: 17,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 16,
  },

  recommendationIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  recommendationContent: {
    flex: 1,
  },

  recommendationTitle: {
    color: "#92400E",
    fontSize: 13,
    fontWeight: "800",
  },

  recommendationText: {
    color: "#78350F",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
  },

  statusCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 24,
  },

  statusLabel: {
    color: "#64748B",
    fontSize: 10,
  },

  statusValue: {
    color: "#14532D",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#15803D",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 12,
  },

  secondaryButtonText: {
    color: "#15803D",
    fontSize: 13,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },

  recommendationDivider: {
    height: 1,
    backgroundColor: "#FDE68A",
    marginVertical: 12,
  },

  sinhalaRecommendation: {
    color: "#78350F",
    fontSize: 12,
    lineHeight: 21,
  },
});
