import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";

import {
  useFonts,
  Poppins_900Black,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { useLanguage } from "@/contexts/LanguageContext";

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
  status?: string;
}

export default function HarvestResultScreen() {
  const params =
    useLocalSearchParams() as HarvestResultParams;

  const { t, language } = useLanguage();

  const quantity = toNumber(params.quantity);
  const expectedPrice = toNumber(params.expectedPrice);
  const aiPredictedPrice = toNumber(params.aiPredictedPrice);
  const harvestScore = toNumber(params.harvestScore);

  const matchingPaddyDemands =
    toNumber(params.matchingPaddyDemands) ?? 0;

  const quantityCompatibleDemands =
    toNumber(params.quantityCompatibleDemands) ?? 0;

  const sameDistrictDemands =
    toNumber(params.sameDistrictDemands) ?? 0;

  const normalizedMarketStatus =
    params.marketStatus?.trim().toUpperCase();

  const listingStatus =
    params.status?.trim().toLowerCase() || "available";

  const canFindMatchingMillers =
    Boolean(params.harvestId) &&
    listingStatus === "available" &&
    normalizedMarketStatus !== "LOW_DEMAND";

  const priceDifference =
    toNumber(params.priceDifference) ??
    (aiPredictedPrice !== null && expectedPrice !== null
      ? expectedPrice - aiPredictedPrice
      : null);

  const recommendation =
    language === "si"
      ? params.recommendationSinhala?.trim() ||
        createRecommendation(
          expectedPrice,
          aiPredictedPrice,
          t,
        )
      : params.recommendationEnglish?.trim() ||
        createRecommendation(
          expectedPrice,
          aiPredictedPrice,
          t,
        );

  const sinhalaRecommendation =
    language === "si"
      ? ""
      : params.recommendationSinhala?.trim() || "";

  const [fontsLoaded] = useFonts({
    Poppins_900Black,
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;
  const matchPulse = useRef(new Animated.Value(1)).current;
  const matchGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded, fade, rise]);

  useEffect(() => {
    if (!canFindMatchingMillers) {
      matchPulse.setValue(1);
      matchGlow.setValue(0);
      return;
    }

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(matchPulse, {
            toValue: 1.015,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(matchGlow, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(matchPulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(matchGlow, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ]),
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [canFindMatchingMillers, matchGlow, matchPulse]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER */}
      <View style={styles.navigationHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.harvestResult.goBack}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#1F2937"
          />
        </Pressable>

        <View style={styles.headerTitleArea}>
          <Text style={styles.headerTitle}>
            {t.harvestResult.title}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t.harvestResult.subtitle}
          </Text>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{
          opacity: fade,
          transform: [{ translateY: rise }],
        }}
      >
        {/* HERO */}
        <View style={styles.heroCardShadow}>
          <LinearGradient
            colors={["#0A331D", "#12522E", "#0B3B22"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroIconRing}>
                <View style={styles.heroIcon}>
                  <Ionicons
                    name="sparkles"
                    size={24}
                    color="#15803D"
                  />
                </View>
              </View>

              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>
                  {t.harvestResult.aiGenerated}
                </Text>
              </View>
            </View>

            <Text style={styles.heroLabel}>
              {t.harvestResult.recommendedMarketPrice}
            </Text>

            <Text style={styles.heroPrice}>
              {aiPredictedPrice !== null
                ? formatCurrency(aiPredictedPrice)
                : t.harvestResult.predictionPending}
            </Text>

            <Text style={styles.heroUnit}>
              {t.harvestResult.perKilogram}
            </Text>

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
                    ? t.harvestResult.expectedPriceAbove.replace(
                        "{{amount}}",
                        formatCurrency(priceDifference),
                      )
                    : t.harvestResult.expectedPriceBelow.replace(
                        "{{amount}}",
                        formatCurrency(
                          Math.abs(priceDifference),
                        ),
                      )}
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        {/* HARVEST SUMMARY */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBoxGreen}>
            <Ionicons
              name="document-text-outline"
              size={16}
              color="#15803D"
            />
          </View>

          <Text style={styles.sectionTitle}>
            {t.harvestResult.harvestSummary}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <SummaryRow
            icon="leaf-outline"
            label={t.harvestResult.paddyType}
            value={translatePaddyType(
              params.paddyType,
              t,
              t.harvestResult.notAvailable,
            )}
          />

          <Divider />

          <SummaryRow
            icon="calendar-outline"
            label={t.harvestResult.season}
            value={translateSeason(
              params.season,
              t,
              t.harvestResult.notAvailable,
            )}
          />

          <Divider />

          <SummaryRow
            icon="cube-outline"
            label={t.harvestResult.quantity}
            value={
              quantity !== null
                ? `${formatNumber(quantity)} kg`
                : t.harvestResult.notAvailable
            }
          />

          <Divider />

          <SummaryRow
            icon="cash-outline"
            label={t.harvestResult.expectedPrice}
            value={
              expectedPrice !== null
                ? `${formatCurrency(expectedPrice)} / kg`
                : t.harvestResult.notAvailable
            }
          />

          <Divider />

          <SummaryRow
            icon="time-outline"
            label={t.harvestResult.submittedDate}
            value={formatDate(
              params.createdAt,
              t.harvestResult.notAvailable,
            )}
          />
        </View>

        {/* HARVEST SCORE */}
        {harvestScore !== null ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBoxGreen}>
                <Ionicons
                  name="speedometer-outline"
                  size={16}
                  color="#15803D"
                />
              </View>

              <Text style={styles.sectionTitle}>
                {t.harvestResult.harvestScore}
              </Text>
            </View>

            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <View style={styles.scoreTextArea}>
                  <Text style={styles.scoreTitle}>
                    {t.harvestResult.marketReadiness}
                  </Text>

                  <Text style={styles.scoreDescription}>
                    {t.harvestResult.scoreDescription}
                  </Text>
                </View>

                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>
                    {Math.round(harvestScore)}
                  </Text>

                  <Text style={styles.scoreTotal}>
                    /100
                  </Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={["#4ADE80", "#15803D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(
                        Math.max(harvestScore, 0),
                        100,
                      )}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.scoreStatus}>
                {getScoreDescription(
                  harvestScore,
                  t.harvestResult,
                )}
              </Text>
            </View>
          </>
        ) : null}

        {/* AI RECOMMENDATION */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBoxAmber}>
            <Ionicons
              name="bulb-outline"
              size={16}
              color="#B45309"
            />
          </View>

          <Text style={styles.sectionTitle}>
            {t.harvestResult.aiRecommendation}
          </Text>
        </View>

        <View style={styles.recommendationCard}>
          <View style={styles.recommendationHeader}>
            <View style={styles.recommendationIcon}>
              <Ionicons
                name="bulb-outline"
                size={25}
                color="#B45309"
              />
            </View>

            <View style={styles.recommendationHeadingText}>
              <Text style={styles.recommendationTitle}>
                {t.harvestResult.suggestedAction}
              </Text>

              <Text style={styles.recommendationEyebrow}>
                {t.harvestResult.aiMarketGuidance}
              </Text>
            </View>
          </View>

          <Text style={styles.recommendationText}>
            {recommendation}
          </Text>

          {sinhalaRecommendation ? (
            <>
              <View style={styles.recommendationDivider} />

              <Text style={styles.sinhalaRecommendation}>
                {sinhalaRecommendation}
              </Text>
            </>
          ) : null}

          {/* MATCHING MILLERS */}
          {canFindMatchingMillers ? (
            <Animated.View
              style={{
                transform: [{ scale: matchPulse }],
              }}
            >
              <Animated.View
                style={[
                  styles.matchOpportunityPanel,
                  {
                    borderColor: matchGlow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        "#FDE68A",
                        "#F59E0B",
                      ],
                    }),
                  },
                ]}
              >
                <View style={styles.matchOpportunityHeader}>
                  <View style={styles.matchOpportunityIcon}>
                    <Ionicons
                      name="sparkles"
                      size={19}
                      color="#B45309"
                    />
                  </View>

                  <View style={styles.matchOpportunityText}>
                    <View
                      style={styles.matchOpportunityTitleRow}
                    >
                      <Text
                        style={styles.matchOpportunityTitle}
                      >
                        {
                          t.harvestResult
                            .matchingOpportunitiesFound
                        }
                      </Text>

                      {matchingPaddyDemands > 0 ? (
                        <View
                          style={styles.matchOpportunityCount}
                        >
                          <Text
                            style={
                              styles.matchOpportunityCountText
                            }
                          >
                            {matchingPaddyDemands}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text
                      style={
                        styles.matchOpportunityDescription
                      }
                    >
                      {matchingPaddyDemands > 0
                        ? t.harvestResult.openMillerDemandsMatch.replace(
                            "{{count}}",
                            String(matchingPaddyDemands),
                          )
                        : t.harvestResult
                            .searchCurrentMillerDemands}

                      {sameDistrictDemands > 0
                        ? ` · ${sameDistrictDemands} ${t.harvestResult.inYourDistrict}`
                        : ""}
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    t.harvestResult.findMatchingMillers
                  }
                  onPress={() =>
                    router.push({
                      pathname:
                        "/(c03-marketplace)/(farmer)/matched-millers",
                      params: {
                        harvestId: params.harvestId,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.matchMillersButtonShadow,
                    pressed &&
                      styles.matchButtonPressed,
                  ]}
                >
                  <LinearGradient
                    colors={["#F59E0B", "#B45309"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.matchMillersButton}
                  >
                    <View style={styles.matchButtonIcon}>
                      <Ionicons
                        name="git-compare-outline"
                        size={18}
                        color="#92400E"
                      />
                    </View>

                    <Text
                      style={styles.matchMillersButtonText}
                    >
                      {t.harvestResult.findMatchingMillers}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#FFFFFF"
                    />
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            </Animated.View>
          ) : null}
        </View>

        {/* MARKET STATUS */}
        {params.marketStatus ? (
          <View style={styles.statusCard}>
            <View>
              <Text style={styles.statusLabel}>
                {t.harvestResult.marketStatus}
              </Text>

              <Text style={styles.statusValue}>
                {formatLabel(
                  params.marketStatus,
                  t.harvestResult.notAvailable,
                )}
              </Text>
            </View>

            <View style={styles.statusIconRing}>
              <Ionicons
                name="analytics-outline"
                size={22}
                color="#15803D"
              />
            </View>
          </View>
        ) : null}

        {/* VIEW ALL */}
        <Pressable
          onPress={() => router.push("./my-harvests")}
          style={({ pressed }) => [
            styles.primaryButtonShadow,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={["#15803D", "#0B3B22"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Ionicons
              name="list-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.primaryButtonText}>
              {t.harvestResult.viewAllHarvests}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* ADD ANOTHER */}
        <Pressable
          onPress={() => router.push("./add-harvest")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="add-circle-outline"
            size={20}
            color="#15803D"
          />

          <Text style={styles.secondaryButtonText}>
            {t.harvestResult.addAnotherHarvest}
          </Text>
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

interface SummaryRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function SummaryRow({
  icon,
  label,
  value,
}: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#15803D"
        />
      </View>

      <View style={styles.summaryTextArea}>
        <Text style={styles.summaryLabel}>
          {label}
        </Text>

        <Text style={styles.summaryValue}>
          {value}
        </Text>
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

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

function translatePaddyType(
  value: string | undefined,
  t: any,
  fallback: string,
): string {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "nadu") {
    return t.c3paddyTypes.Nadu;
  }

  if (normalized === "samba") {
    return t.c3paddyTypes.Samba;
  }

  if (normalized === "keeri samba" || normalized === "keerisamba") {
    return t.c3paddyTypes.KeeriSamba;
  }

  return formatLabel(value, fallback);
}

function translateSeason(
  value: string | undefined,
  t: any,
  fallback: string,
): string {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "maha") {
    return t.c3seasons.Maha;
  }

  if (normalized === "yala") {
    return t.c3seasons.Yala;
  }

  return formatLabel(value, fallback);
}

function formatLabel(
  value?: string,
  fallback = "Not available",
): string {
  if (!value) {
    return fallback;
  }

  return value
    .trim()
    .split(/[\s_-]+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase(),
    )
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

function formatDate(
  value?: string,
  fallback = "Not available",
): string {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
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
  t: any,
): string {
  if (
    expectedPrice === null ||
    predictedPrice === null
  ) {
    return t.harvestResult.predictionProcessing;
  }

  const difference =
    predictedPrice - expectedPrice;

  if (difference >= 5) {
    return t.harvestResult.predictedPriceHigher;
  }

  if (difference <= -5) {
    return t.harvestResult.expectedPriceHigher;
  }

  return t.harvestResult.priceCloseToEstimate;
}

function getScoreDescription(
  score: number,
  harvestResult: any,
): string {
  if (score >= 80) {
    return harvestResult.excellentMarketReadiness;
  }

  if (score >= 60) {
    return harvestResult.goodMarketReadiness;
  }

  if (score >= 40) {
    return harvestResult.moderateMarketReadiness;
  }

  return harvestResult.marketConditionsNeedImprovement;
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
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
    fontFamily: "Poppins_800ExtraBold",
  },

  headerSubtitle: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  heroCardShadow: {
    borderRadius: 26,
    marginBottom: 25,
    shadowColor: "#14532D",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  heroCard: {
    borderRadius: 26,
    padding: 21,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  heroIconRing: {
    width: 60,
    height: 60,
    borderRadius: 19,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
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
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.8,
  },

  heroLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  heroPrice: {
    color: "#FFFFFF",
    fontSize: 33,
    fontFamily: "Poppins_900Black",
    marginTop: 6,
  },

  heroUnit: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
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
    fontFamily: "Poppins_700Bold",
    maxWidth: 240,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 3,
  },

  sectionIconBoxGreen: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionIconBoxAmber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontFamily: "Poppins_800ExtraBold",
  },

  summaryCard: {
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF0ED",
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
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
    fontFamily: "Poppins_500Medium",
  },

  summaryValue: {
    color: "#1F2937",
    fontSize: 13,
    fontFamily: "Poppins_800ExtraBold",
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
    borderColor: "#EEF0ED",
    padding: 17,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  scoreTextArea: {
    flex: 1,
    marginRight: 12,
  },

  scoreTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontFamily: "Poppins_800ExtraBold",
  },

  scoreDescription: {
    color: "#64748B",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    lineHeight: 15,
    marginTop: 4,
  },

  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  scoreNumber: {
    color: "#15803D",
    fontSize: 21,
    fontFamily: "Poppins_900Black",
  },

  scoreTotal: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
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
  },

  scoreStatus: {
    color: "#15803D",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 9,
  },

  recommendationCard: {
    borderRadius: 21,
    padding: 18,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 16,
  },

  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  recommendationIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#92400E",
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  recommendationHeadingText: {
    flex: 1,
  },

  recommendationTitle: {
    color: "#92400E",
    fontSize: 13,
    fontFamily: "Poppins_800ExtraBold",
  },

  recommendationEyebrow: {
    color: "#B45309",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
    marginTop: 2,
  },

  recommendationText: {
    color: "#78350F",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    lineHeight: 18,
    marginTop: 14,
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
    fontFamily: "Poppins_500Medium",
  },

  statusValue: {
    color: "#14532D",
    fontSize: 14,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 3,
  },

  statusIconRing: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  primaryButtonShadow: {
    borderRadius: 16,
    shadowColor: "#15803D",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_800ExtraBold",
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
    fontFamily: "Poppins_800ExtraBold",
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
    fontFamily: "Poppins_500Medium",
    lineHeight: 21,
  },

  matchOpportunityPanel: {
    borderRadius: 17,
    padding: 13,
    backgroundColor: "#FFF7DD",
    borderWidth: 1,
    marginTop: 16,
    shadowColor: "#B45309",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  matchOpportunityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  matchOpportunityIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },

  matchOpportunityText: {
    flex: 1,
  },

  matchOpportunityTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  matchOpportunityTitle: {
    flex: 1,
    color: "#92400E",
    fontSize: 10.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  matchOpportunityCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    backgroundColor: "#FDE68A",
  },

  matchOpportunityCountText: {
    color: "#92400E",
    fontSize: 8.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  matchOpportunityDescription: {
    color: "#92400E",
    fontSize: 8.5,
    lineHeight: 14,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  matchMillersButtonShadow: {
    borderRadius: 14,
    marginTop: 12,
    shadowColor: "#92400E",
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  matchMillersButton: {
    minHeight: 49,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
  },

  matchButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
  },

  matchMillersButtonText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
  },

  matchButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.975 }],
  },
});