import { Ionicons } from "@/components/c03-marketplace/themed-native";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";

import {
  MarketplaceButton,
} from "@/components/c03-marketplace/MarketplaceButton";

import {
  matchingService,
} from "@/services/c03-marketplace/matching.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  HarvestMatch,
  MatchingResponse,
} from "@/types/c03-marketplace/matching.types";

import { useLanguage } from "@/contexts/LanguageContext";

export default function MatchedMillersScreen() {
  const { t, language } = useLanguage();

  const rawParams = useLocalSearchParams();

  const harvestId = Array.isArray(
    rawParams.harvestId
  )
    ? rawParams.harvestId[0]
    : rawParams.harvestId;

  const focusMillerId = Array.isArray(
    rawParams.focusMillerId
  )
    ? rawParams.focusMillerId[0]
    : rawParams.focusMillerId;

  const focusDemandId = Array.isArray(
    rawParams.focusDemandId
  )
    ? rawParams.focusDemandId[0]
    : rawParams.focusDemandId;

  const [matchingData, setMatchingData] =
    useState<MatchingResponse["data"] | null>(
      null
    );

  const [selectedDemandIds, setSelectedDemandIds] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const fade = useRef(
    new Animated.Value(0)
  ).current;

  const translateY = useRef(
    new Animated.Value(18)
  ).current;

  const loadMatches = async (
    refresh = false
  ): Promise<void> => {
    if (!harvestId) {
      setErrorMessage(
        t.c3MatchedMillers.harvestUnavailable
      );
      setLoading(false);
      return;
    }

    try {
      setErrorMessage(null);

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await matchingService
          .getHarvestMatches(harvestId, {
            focusMillerId,
            focusDemandId,
          });

      setMatchingData(response.data);

      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),

        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error)
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMatches();
  }, [harvestId, focusMillerId, focusDemandId]);

  const toggleSelection = (
    demandId: string
  ): void => {
    setSelectedDemandIds((current) =>
      current.includes(demandId)
        ? current.filter(
            (id) => id !== demandId
          )
        : [...current, demandId]
    );
  };

  const submitSelections = async (): Promise<void> => {
    if (submitting) {
      return;
    }

    if (!harvestId) {
      Alert.alert(
        t.c3MatchedMillers.harvestUnavailable,
        t.c3MatchedMillers.harvestUnavailableDescription
      );
      return;
    }

    if (selectedDemandIds.length === 0) {
      Alert.alert(
        t.c3MatchedMillers.selectMiller,
        t.c3MatchedMillers.selectMillerDescription
      );
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await matchingService.createSelections({
          harvestId,
          demandIds: selectedDemandIds,
        });

      console.log(
        "Match selections created:",
        JSON.stringify(
          response.data,
          null,
          2
        )
      );

      router.replace(
        "/(c03-marketplace)/(farmer)/my-match-requests" as any
      );
    } catch (error) {
      console.error(
        "Create match selections failed:",
        error
      );

      Alert.alert(
        t.c3MatchedMillers.unableToSendRequests,
        getApiErrorMessage(error)
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerState}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator
              size="large"
              color="#15803D"
            />
          </View>

          <Text style={styles.stateTitle}>
            {t.c3MatchedMillers.loadingTitle}
          </Text>

          <Text style={styles.stateText}>
            {t.c3MatchedMillers.loadingDescription}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const matches =
    matchingData?.matches ?? [];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#1F2937"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {t.c3MatchedMillers.title}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t.c3MatchedMillers.subtitle}
          </Text>
        </View>

        <View style={styles.aiBadge}>
          <Ionicons
            name="sparkles"
            size={16}
            color="#15803D"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              void loadMatches(true)
            }
            colors={["#15803D"]}
          />
        }
      >
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() =>
              void loadMatches()
            }
            t={t}
          />
        ) : matches.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <Animated.View
            style={{
              opacity: fade,
              transform: [
                {
                  translateY,
                },
              ],
            }}
          >
            <View style={styles.harvestCard}>
              <View style={styles.harvestIcon}>
                <Ionicons
                  name="leaf"
                  size={23}
                  color="#15803D"
                />
              </View>

              <View style={styles.harvestText}>
                <Text
                  style={
                    styles.harvestEyebrow
                  }
                >
                  {t.c3MatchedMillers.selectedHarvest}
                </Text>

                <Text
                  style={styles.harvestTitle}
                >
                  {translatePaddyType(
                    matchingData?.harvest
                      .paddyType ?? "",
                    t
                  )}
                </Text>

                <Text
                  style={
                    styles.harvestDescription
                  }
                >
                  {formatNumber(
                    matchingData?.harvest
                      .quantity ?? 0
                  )}{" "}
                  kg · {t.c3MatchedMillers.aiPrice} Rs.{" "}
                  {matchingData?.harvest
                    .aiPredictedPrice?.toFixed(
                      2
                    )}
                </Text>
              </View>

              <View style={styles.matchCount}>
                <Text
                  style={
                    styles.matchCountValue
                  }
                >
                  {matches.length}
                </Text>

                <Text
                  style={
                    styles.matchCountLabel
                  }
                >
                  {t.c3MatchedMillers.matches}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>
                {t.c3MatchedMillers.rankedRecommendations}
              </Text>

              <Text style={styles.sectionHint}>
                {t.c3MatchedMillers.selectUpToFive}
              </Text>
            </View>

            <View style={styles.matchList}>
              {matches.map(
                (match, index) => (
                  <MatchCard
                    key={match.demand._id}
                    match={match}
                    rank={index + 1}
                    selected={selectedDemandIds.includes(
                      match.demand._id
                    )}
                    onSelect={() =>
                      toggleSelection(
                        match.demand._id
                      )
                    }
                    t={t}
                  />
                )
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {matches.length > 0 &&
      selectedDemandIds.length > 0 ? (
        <View style={styles.bottomBar}>
          <View style={styles.selectionText}>
            <Text
              style={
                styles.selectionCount
              }
            >
              {selectedDemandIds.length}
            </Text>

            <Text
              style={
                styles.selectionLabel
              }
            >
              {language === "si"
                ? selectedDemandIds.length === 1
                  ? t.c3MatchedMillers.millerSelected
                  : t.c3MatchedMillers.millersSelected
                : selectedDemandIds.length === 1
                ? t.c3MatchedMillers.millerSelected
                : t.c3MatchedMillers.millersSelected}
            </Text>
          </View>

          <MarketplaceButton
            title={
              t.c3MatchedMillers.sendMatchRequests
            }
            onPress={submitSelections}
            loading={submitting}
            disabled={
              selectedDemandIds.length === 0
            }
            style={styles.sendButton}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

interface MatchCardProps {
  match: HarvestMatch;
  rank: number;
  selected: boolean;
  onSelect: () => void;
  t: any;
}

function MatchCard({
  match,
  rank,
  selected,
  onSelect,
  t,
}: MatchCardProps) {
  const [expanded, setExpanded] =
    useState(false);

  const priority =
    getPriorityDisplay(
      match.priority,
      t
    );

  return (
    <View
      style={[
        styles.matchCard,
        selected &&
          styles.matchCardSelected,
      ]}
    >
      <View style={styles.matchHeader}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>
            #{rank}
          </Text>
        </View>

        <View style={styles.millerTitle}>
          <Text style={styles.millerName}>
            {match.miller.name}
          </Text>

          <Text style={styles.millName}>
            {match.miller.millName}
          </Text>
        </View>

        <View
          style={[
            styles.priorityBadge,
            {
              backgroundColor:
                priority.background,
            },
          ]}
        >
          <Text
            style={[
              styles.priorityText,
              {
                color: priority.color,
              },
            ]}
          >
            {priority.label}
          </Text>
        </View>
      </View>

      <View style={styles.scoreSection}>
        <View style={styles.scoreTop}>
          <Text style={styles.scoreLabel}>
            {t.c3MatchedMillers.matchingScore}
          </Text>

          <Text style={styles.scoreValue}>
            {match.matchingPercentage}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  `${match.matchingPercentage}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.confidenceText}>
          {match.confidence.english}
        </Text>
      </View>

      <View style={styles.metricGrid}>
        <MatchMetric
          icon="location-outline"
          label={t.c3MatchedMillers.location}
          score={
            match.scoreBreakdown.location
          }
          maximum={40}
        />

        <MatchMetric
          icon="leaf-outline"
          label={t.c3MatchedMillers.paddyType}
          score={
            match.scoreBreakdown.paddyType
          }
          maximum={30}
        />

        <MatchMetric
          icon="cash-outline"
          label={t.c3MatchedMillers.price}
          score={
            match.scoreBreakdown
              .priceCompatibility
          }
          maximum={20}
        />

        <MatchMetric
          icon="cube-outline"
          label={t.c3MatchedMillers.quantity}
          score={
            match.scoreBreakdown
              .quantityCompatibility
          }
          maximum={10}
        />
      </View>

      <View style={styles.priceCard}>
        <PriceItem
          label={
            t.c3MatchedMillers.aiMarketPrice
          }
          value={
            match.priceAnalysis
              .aiPredictedPrice
          }
        />

        <Ionicons
          name="swap-horizontal"
          size={19}
          color="#94A3B8"
        />

        <PriceItem
          label={
            t.c3MatchedMillers.millerOffer
          }
          value={
            match.priceAnalysis
              .millerOfferedPrice
          }
          emphasized
        />
      </View>

      <View style={styles.locationRow}>
        <Ionicons
          name="location"
          size={16}
          color="#64748B"
        />

        <Text style={styles.locationText}>
          {match.miller.location},{" "}
          {translateDistrict(
            match.miller.district,
            t.c3districts,
            match.miller.district
          )}
        </Text>
      </View>

      <Pressable
        onPress={() =>
          setExpanded((current) => !current)
        }
        style={styles.explanationButton}
      >
        <Ionicons
          name="information-circle-outline"
          size={17}
          color="#15803D"
        />

        <Text
          style={
            styles.explanationButtonText
          }
        >
          {expanded
            ? t.c3MatchedMillers.hideAiExplanation
            : t.c3MatchedMillers.whyRecommended}
        </Text>

        <Ionicons
          name={
            expanded
              ? "chevron-up"
              : "chevron-down"
          }
          size={17}
          color="#15803D"
        />
      </Pressable>

      {expanded ? (
        <View style={styles.explanationPanel}>
          <Text
            style={
              styles.recommendationEnglish
            }
          >
            {match.recommendation.english}
          </Text>

          <Text
            style={
              styles.recommendationSinhala
            }
          >
            {match.recommendation.sinhala}
          </Text>

          {match.reasons.map(
            (reason, index) => (
              <View
                key={index}
                style={styles.reasonRow}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color="#15803D"
                />

                <View style={styles.reasonText}>
                  <Text
                    style={
                      styles.reasonEnglish
                    }
                  >
                    {reason.english}
                  </Text>

                  <Text
                    style={
                      styles.reasonSinhala
                    }
                  >
                    {reason.sinhala}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      ) : null}

      <Pressable
        onPress={onSelect}
        style={[
          styles.selectButton,
          selected &&
            styles.selectButtonSelected,
        ]}
      >
        <Ionicons
          name={
            selected
              ? "checkmark-circle"
              : "ellipse-outline"
          }
          size={20}
          color={
            selected
              ? "#FFFFFF"
              : "#15803D"
          }
        />

        <Text
          style={[
            styles.selectButtonText,
            selected &&
              styles.selectButtonTextSelected,
          ]}
        >
          {selected
            ? t.c3MatchedMillers.selected
            : t.c3MatchedMillers.selectThisMiller}
        </Text>
      </Pressable>
    </View>
  );
}

function MatchMetric({
  icon,
  label,
  score,
  maximum,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  score: number;
  maximum: number;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons
        name={icon}
        size={17}
        color="#15803D"
      />

      <Text style={styles.metricValue}>
        {score}/{maximum}
      </Text>

      <Text style={styles.metricLabel}>
        {label}
      </Text>
    </View>
  );
}

function PriceItem({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.priceItem}>
      <Text style={styles.priceLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.priceValue,
          emphasized &&
            styles.priceValueEmphasized,
        ]}
      >
        Rs.{value.toFixed(2)}
      </Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
  t,
}: {
  message: string;
  onRetry: () => void;
  t: any;
}) {
  return (
    <View style={styles.centerState}>
      <Ionicons
        name="cloud-offline-outline"
        size={44}
        color="#B91C1C"
      />

      <Text style={styles.stateTitle}>
        {t.c3MatchedMillers.unableToLoad}
      </Text>

      <Text style={styles.stateText}>
        {message}
      </Text>

      <MarketplaceButton
        title={t.c3MatchedMillers.tryAgain}
        onPress={onRetry}
      />
    </View>
  );
}

function EmptyState({
  t,
}: {
  t: any;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="people-outline"
          size={40}
          color="#15803D"
        />
      </View>

      <Text style={styles.stateTitle}>
        {t.c3MatchedMillers.noCompatibleMillers}
      </Text>

      <Text style={styles.stateText}>
        {t.c3MatchedMillers.noCompatibleMillersDescription}
      </Text>
    </View>
  );
}

function getPriorityDisplay(
  priority: HarvestMatch["priority"],
  t: any
) {
  switch (priority) {
    case "HIGHLY_RECOMMENDED":
      return {
        label:
          t.c3MatchedMillers.highlyRecommended,
        background: "#DCFCE7",
        color: "#166534",
      };

    case "RECOMMENDED":
      return {
        label:
          t.c3MatchedMillers.recommended,
        background: "#DBEAFE",
        color: "#1D4ED8",
      };

    default:
      return {
        label:
          t.c3MatchedMillers.moderateMatch,
        background: "#FEF3C7",
        color: "#92400E",
      };
  }
}

function formatLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(" ");
}

function translatePaddyType(
  value: string,
  t: any
): string {
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

  return formatLabel(value);
}

function translateDistrict(
  district: string | undefined,
  translations: {
    Ampara: string;
    Badulla: string;
    Kandy: string;
    Monaragala: string;
  },
  fallback: string
): string {
  if (!district) {
    return fallback;
  }

  const districtMap: Record<string, string> = {
    Ampara: translations.Ampara,
    Badulla: translations.Badulla,
    Kandy: translations.Kandy,
    Monaragala: translations.Monaragala,
  };

  return districtMap[district.trim()] ?? district.trim();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    "en-LK"
  ).format(value);
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 17,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 2,
  },

  aiBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  content: {
    padding: 17,
    paddingBottom: 205,
  },

  harvestCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 23,
  },

  harvestIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  harvestText: {
    flex: 1,
  },

  harvestEyebrow: {
    color: "#15803D",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  harvestTitle: {
    color: "#14532D",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  harvestDescription: {
    color: "#4B5563",
    fontSize: 10,
    marginTop: 3,
  },

  matchCount: {
    alignItems: "center",
  },

  matchCountValue: {
    color: "#15803D",
    fontSize: 19,
    fontWeight: "900",
  },

  matchCountLabel: {
    color: "#6B7280",
    fontSize: 8,
  },

  sectionHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "800",
  },

  sectionHint: {
    color: "#9CA3AF",
    fontSize: 9,
  },

  matchList: {
    gap: 15,
  },

  matchCard: {
    padding: 17,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  matchCardSelected: {
    borderColor: "#15803D",
    borderWidth: 2,
    backgroundColor: "#F7FFF9",
  },

  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  rankBadge: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#14532D",
  },

  rankText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  millerTitle: {
    flex: 1,
    marginLeft: 11,
  },

  millerName: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "800",
  },

  millName: {
    color: "#6B7280",
    fontSize: 9.5,
    marginTop: 2,
  },

  priorityBadge: {
    maxWidth: 115,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  priorityText: {
    fontSize: 7.5,
    fontWeight: "900",
    textAlign: "center",
  },

  scoreSection: {
    marginTop: 17,
  },

  scoreTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  scoreLabel: {
    color: "#64748B",
    fontSize: 10,
  },

  scoreValue: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "900",
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginTop: 8,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },

  confidenceText: {
    color: "#15803D",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 7,
  },

  metricGrid: {
    flexDirection: "row",
    gap: 7,
    marginTop: 15,
  },

  metric: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
  },

  metricValue: {
    color: "#1F2937",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 7.5,
    marginTop: 2,
  },

  priceCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#ECFDF5",
  },

  priceItem: {
    flex: 1,
    alignItems: "center",
  },

  priceLabel: {
    color: "#64748B",
    fontSize: 8.5,
  },

  priceValue: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  priceValueEmphasized: {
    color: "#15803D",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 13,
  },

  locationText: {
    color: "#64748B",
    fontSize: 10,
  },

  explanationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 15,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  explanationButtonText: {
    flex: 1,
    color: "#15803D",
    fontSize: 10,
    fontWeight: "700",
  },

  explanationPanel: {
    marginTop: 13,
    padding: 13,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
  },

  recommendationEnglish: {
    color: "#334155",
    fontSize: 10,
    lineHeight: 17,
    fontWeight: "700",
  },

  recommendationSinhala: {
    color: "#475569",
    fontSize: 10,
    lineHeight: 18,
    marginTop: 9,
  },

  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },

  reasonText: {
    flex: 1,
  },

  reasonEnglish: {
    color: "#475569",
    fontSize: 9,
    lineHeight: 14,
  },

  reasonSinhala: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 16,
    marginTop: 3,
  },

  selectButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#15803D",
    backgroundColor: "#FFFFFF",
  },

  selectButtonSelected: {
    backgroundColor: "#15803D",
  },

  selectButtonText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
  },

  selectButtonTextSelected: {
    color: "#FFFFFF",
  },

  bottomBar: {
  position: "absolute",
  left: 13,
  right: 13,

  // Leave space for global bottom navigation.
  bottom: 92,

  minHeight: 78,

  flexDirection: "row",
  alignItems: "center",
  gap: 15,

  paddingHorizontal: 15,
  paddingVertical: 11,

  backgroundColor: "#FFFFFF",

  borderRadius: 20,

  borderWidth: 1,
  borderColor: "#E5E7EB",

  shadowColor: "#000000",
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: {
    width: 0,
    height: 5,
  },

  elevation: 8,

  zIndex: 50,
},

  selectionText: {
    minWidth: 65,
  },

  selectionCount: {
    color: "#15803D",
    fontSize: 19,
    fontWeight: "900",
  },

  selectionLabel: {
    color: "#64748B",
    fontSize: 8,
  },

  sendButton: {
    flex: 1,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 70,
  },

  loadingIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    marginBottom: 18,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 18,
  },

  stateTitle: {
    color: "#1F2937",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 14,
  },

  stateText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
});