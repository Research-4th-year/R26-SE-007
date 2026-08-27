import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useCallback,
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
} from "react-native";

import {
  matchingService,
} from "@/services/c03-marketplace/matching.service";
import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";
import type {
  FarmerHarvestMatch,
  MillerMatchingResponse,
} from "@/types/c03-marketplace/matching.types";

const THEME = {
  page: "#FBF8F1",
  primary: "#92400E",
  dark: "#78350F",
  accent: "#D97706",
  soft: "#FEF3C7",
  border: "#FDE68A",
  ink: "#292524",
  muted: "#78716C",
};

export default function MatchedFarmersScreen() {
  const params = useLocalSearchParams();
  const demandId = readString(params.demandId);

  const [data, setData] =
    useState<MillerMatchingResponse["data"] | null>(null);
  const [selectedHarvestIds, setSelectedHarvestIds] =
    useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  const loadMatches = useCallback(
    async (refresh = false): Promise<void> => {
      if (!demandId) {
        setErrorMessage("Demand ID is missing.");
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
          await matchingService.getDemandMatches(demandId);

        setData(response.data);

        fade.setValue(0);
        rise.setValue(14);

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
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [demandId, fade, rise],
  );

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const toggleSelection = (harvestId: string) => {
    setSelectedHarvestIds((current) =>
      current.includes(harvestId)
        ? current.filter((id) => id !== harvestId)
        : [...current, harvestId],
    );
  };

  const handleSendRequests = async (): Promise<void> => {
    if (
      submitting ||
      !demandId ||
      selectedHarvestIds.length === 0
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await matchingService.createMillerSelections({
          demandId,
          harvestIds: selectedHarvestIds,
        });

      console.log(
        "Miller match requests created:",
        JSON.stringify(response.data, null, 2),
      );

      router.replace(
        "/(c03-marketplace)/(miller)/received-match-requests" as any,
      );
    } catch (error) {
      Alert.alert(
        "Unable to send match requests",
        getApiErrorMessage(error),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const matches = data?.matches ?? [];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={THEME.dark}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Matching Farmers
          </Text>
          <Text style={styles.headerSubtitle}>
            AI-ranked harvest opportunities
          </Text>
        </View>

        <View style={styles.headerAi}>
          <Ionicons
            name="sparkles"
            size={19}
            color={THEME.primary}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadMatches(true)}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }
      >
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => void loadMatches()}
          />
        ) : matches.length === 0 ? (
          <EmptyState />
        ) : (
          <Animated.View
            style={{
              opacity: fade,
              transform: [{ translateY: rise }],
            }}
          >
            {data ? <DemandBanner data={data} /> : null}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.eyebrow}>
                  AI RECOMMENDATIONS
                </Text>
                <Text style={styles.sectionTitle}>
                  Best Farmer Matches
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countValue}>
                  {matches.length}
                </Text>
                <Text style={styles.countLabel}>
                  matches
                </Text>
              </View>
            </View>

            <View style={styles.cards}>
              {matches.map((match, index) => (
                <FarmerMatchCard
                  key={match.harvest._id}
                  match={match}
                  rank={index + 1}
                  selected={selectedHarvestIds.includes(
                    match.harvest._id,
                  )}
                  onPress={() =>
                    toggleSelection(match.harvest._id)
                  }
                />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {matches.length > 0 &&
      selectedHarvestIds.length > 0 ? (
        <View style={styles.bottomBar}>
          <View style={styles.selectedCount}>
            <Text style={styles.selectedValue}>
              {selectedHarvestIds.length}
            </Text>
            <Text style={styles.selectedLabel}>
              selected
            </Text>
          </View>

          <Pressable
            disabled={
              submitting ||
              selectedHarvestIds.length === 0
            }
            onPress={() => void handleSendRequests()}
            style={({ pressed }) => [
              styles.sendButton,
              (submitting ||
                selectedHarvestIds.length === 0) &&
                styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="paper-plane-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.sendButtonText}>
                  {selectedHarvestIds.length > 0
                    ? `Send ${selectedHarvestIds.length} Request${
                        selectedHarvestIds.length === 1
                          ? ""
                          : "s"
                      }`
                    : "Select Farmer"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color="#FFFFFF"
                />
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function DemandBanner({
  data,
}: {
  data: MillerMatchingResponse["data"];
}) {
  return (
    <View style={styles.demandBanner}>
      <View style={styles.demandIcon}>
        <Ionicons
          name="business-outline"
          size={22}
          color={THEME.primary}
        />
      </View>

      <View style={styles.demandText}>
        <Text style={styles.demandEyebrow}>
          YOUR OPEN DEMAND
        </Text>
        <Text style={styles.demandTitle}>
          {formatLabel(data.demand.paddyType)}
        </Text>
        <Text style={styles.demandMeta}>
          {formatNumber(data.demand.quantityNeeded)} kg ·
          {" "}Rs.{data.demand.offeredPrice.toFixed(2)}/kg
        </Text>
      </View>

      <View style={styles.aiChip}>
        <Ionicons
          name="sparkles"
          size={13}
          color={THEME.primary}
        />
        <Text style={styles.aiChipText}>AI</Text>
      </View>
    </View>
  );
}

function FarmerMatchCard({
  match,
  rank,
  selected,
  onPress,
}: {
  match: FarmerHarvestMatch;
  rank: number;
  selected: boolean;
  onPress: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View
      style={[
        styles.card,
        selected && styles.cardSelected,
      ]}
    >
      <View style={styles.cardTop}>
        <View style={styles.rank}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>

        <View style={styles.farmerInfo}>
          <Text style={styles.farmerName}>
            {match.farmer.farmerName}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={THEME.muted}
            />
            <Text style={styles.locationText}>
              {match.farmer.location}, {match.farmer.district}
            </Text>
          </View>
        </View>

        <View style={styles.scorePill}>
          <Text style={styles.scorePillValue}>
            {match.matchingPercentage.toFixed(0)}%
          </Text>
          <Text style={styles.scorePillLabel}>
            match
          </Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min(
                match.matchingPercentage,
                100,
              )}%`,
            },
          ]}
        />
      </View>

      <View style={styles.harvestBox}>
        <View style={styles.harvestTitleRow}>
          <View style={styles.harvestIcon}>
            <Ionicons
              name="leaf"
              size={18}
              color="#15803D"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.harvestEyebrow}>
              AVAILABLE HARVEST
            </Text>
            <Text style={styles.harvestName}>
              {formatLabel(match.harvest.paddyType)}
            </Text>
          </View>
          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>
              Available
            </Text>
          </View>
        </View>

        <View style={styles.harvestMetrics}>
          <SmallMetric
            label="Quantity"
            value={`${formatNumber(
              match.harvest.quantity,
            )} kg`}
          />
          <SmallMetric
            label="Farmer asks"
            value={`Rs.${match.harvest.expectedPrice.toFixed(
              2,
            )}`}
          />
          <SmallMetric
            label="AI price"
            value={`Rs.${match.harvest.aiPredictedPrice.toFixed(
              2,
            )}`}
            accent
          />
        </View>
      </View>

      <View style={styles.breakdown}>
        <ScoreMetric
          icon="location-outline"
          label="Location"
          value={match.scoreBreakdown.location}
          max={40}
        />
        <ScoreMetric
          icon="leaf-outline"
          label="Paddy"
          value={match.scoreBreakdown.paddyType}
          max={30}
        />
        <ScoreMetric
          icon="cash-outline"
          label="Price"
          value={match.scoreBreakdown.priceCompatibility}
          max={20}
        />
        <ScoreMetric
          icon="cube-outline"
          label="Quantity"
          value={match.scoreBreakdown.quantityCompatibility}
          max={10}
        />
      </View>

      <Pressable
        onPress={() => setExpanded((value) => !value)}
        style={styles.explanationButton}
      >
        <View style={styles.explanationIcon}>
          <Ionicons
            name="sparkles"
            size={14}
            color={THEME.primary}
          />
        </View>
        <Text style={styles.explanationButtonText}>
          {expanded
            ? "Hide AI explanation"
            : "Why is this Farmer recommended?"}
        </Text>
        <Ionicons
          name={
            expanded
              ? "chevron-up"
              : "chevron-down"
          }
          size={16}
          color={THEME.primary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.explanation}>
          <Text style={styles.explanationTitle}>
            AI Recommendation
          </Text>
          <Text style={styles.explanationText}>
            {match.recommendation.english}
          </Text>
          <Text style={styles.explanationSinhala}>
            {match.recommendation.sinhala}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.selectButton,
          selected && styles.selectButtonSelected,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={
            selected
              ? "checkmark-circle"
              : "person-add-outline"
          }
          size={18}
          color={
            selected
              ? "#FFFFFF"
              : THEME.primary
          }
        />
        <Text
          style={[
            styles.selectButtonText,
            selected && styles.selectButtonTextSelected,
          ]}
        >
          {selected
            ? "Farmer Selected"
            : "Select this Farmer"}
        </Text>
      </Pressable>
    </View>
  );
}

function SmallMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.smallMetric}>
      <Text style={styles.smallMetricLabel}>
        {label}
      </Text>
      <Text
        style={[
          styles.smallMetricValue,
          accent && styles.smallMetricAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function ScoreMetric({
  icon,
  label,
  value,
  max,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  max: number;
}) {
  return (
    <View style={styles.scoreMetric}>
      <Ionicons
        name={icon}
        size={15}
        color={THEME.primary}
      />
      <Text style={styles.scoreMetricValue}>
        {value}/{max}
      </Text>
      <Text style={styles.scoreMetricLabel}>
        {label}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerState}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator
            size="large"
            color={THEME.primary}
          />
        </View>
        <Text style={styles.stateTitle}>
          Finding suitable Farmers
        </Text>
        <Text style={styles.stateText}>
          AI is comparing paddy variety, district,
          quantity and market price.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function EmptyState() {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="leaf-outline"
          size={39}
          color={THEME.primary}
        />
      </View>
      <Text style={styles.stateTitle}>
        No matching harvests yet
      </Text>
      <Text style={styles.stateText}>
        There are currently no available Farmer
        harvests matching this demand. Pull down to
        check again later.
      </Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons
          name="warning-outline"
          size={37}
          color="#B91C1C"
        />
      </View>
      <Text style={styles.stateTitle}>
        Unable to load matches
      </Text>
      <Text style={styles.stateText}>
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Ionicons
          name="refresh"
          size={17}
          color="#FFFFFF"
        />
        <Text style={styles.retryButtonText}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

function readString(
  value: string | string[] | undefined,
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

function formatLabel(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase(),
    )
    .join(" ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-LK").format(value);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: THEME.page,
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 17,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE7D8",
  },

  headerButton: {
    width: 41,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F1E8",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: THEME.ink,
    fontSize: 18,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: THEME.muted,
    fontSize: 9.5,
    marginTop: 2,
  },

  headerAi: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.soft,
  },

  content: {
    padding: 17,
    paddingBottom: 205,
  },

  demandBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 20,
    padding: 15,
    backgroundColor: THEME.soft,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 23,
  },

  demandIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  demandText: {
    flex: 1,
  },

  demandEyebrow: {
    color: THEME.primary,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  demandTitle: {
    color: THEME.dark,
    fontSize: 14.5,
    fontWeight: "900",
    marginTop: 2,
  },

  demandMeta: {
    color: THEME.muted,
    fontSize: 9,
    marginTop: 3,
  },

  aiChip: {
    alignItems: "center",
    gap: 2,
    borderRadius: 11,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },

  aiChipText: {
    color: THEME.primary,
    fontSize: 7,
    fontWeight: "900",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  eyebrow: {
    color: THEME.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sectionTitle: {
    color: THEME.ink,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 3,
  },

  countBadge: {
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: THEME.soft,
  },

  countValue: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  countLabel: {
    color: THEME.muted,
    fontSize: 7,
  },

  cards: {
    gap: 16,
  },

  card: {
    borderRadius: 23,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE7D8",
  },

  cardSelected: {
    borderWidth: 2,
    borderColor: THEME.accent,
    backgroundColor: "#FFFCF7",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  rank: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.dark,
  },

  rankText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  farmerInfo: {
    flex: 1,
    marginLeft: 10,
  },

  farmerName: {
    color: THEME.ink,
    fontSize: 14,
    fontWeight: "900",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },

  locationText: {
    color: THEME.muted,
    fontSize: 8.5,
  },

  scorePill: {
    alignItems: "center",
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: THEME.soft,
  },

  scorePillValue: {
    color: THEME.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  scorePillLabel: {
    color: THEME.muted,
    fontSize: 7,
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#F1EDE5",
    marginTop: 14,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: THEME.accent,
  },

  harvestBox: {
    borderRadius: 17,
    padding: 14,
    backgroundColor: "#F8FAF8",
    marginTop: 15,
  },

  harvestTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  harvestIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  harvestEyebrow: {
    color: "#15803D",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  harvestName: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },

  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#ECFDF5",
  },

  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },

  availableText: {
    color: "#166534",
    fontSize: 7,
    fontWeight: "800",
  },

  harvestMetrics: {
    flexDirection: "row",
    marginTop: 13,
  },

  smallMetric: {
    flex: 1,
  },

  smallMetricLabel: {
    color: "#94A3B8",
    fontSize: 7.5,
  },

  smallMetricValue: {
    color: "#334155",
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 3,
  },

  smallMetricAccent: {
    color: "#15803D",
  },

  breakdown: {
    flexDirection: "row",
    gap: 6,
    marginTop: 13,
  },

  scoreMetric: {
    flex: 1,
    alignItems: "center",
    borderRadius: 13,
    paddingVertical: 9,
    backgroundColor: THEME.soft,
  },

  scoreMetricValue: {
    color: THEME.ink,
    fontSize: 8.5,
    fontWeight: "900",
    marginTop: 3,
  },

  scoreMetricLabel: {
    color: THEME.muted,
    fontSize: 6.8,
    marginTop: 2,
  },

  explanationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingTop: 13,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3EFE8",
  },

  explanationIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.soft,
  },

  explanationButtonText: {
    flex: 1,
    color: THEME.primary,
    fontSize: 9.5,
    fontWeight: "800",
  },

  explanation: {
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 11,
  },

  explanationTitle: {
    color: THEME.dark,
    fontSize: 10,
    fontWeight: "900",
  },

  explanationText: {
    color: "#57534E",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 5,
  },

  explanationSinhala: {
    color: THEME.muted,
    fontSize: 9,
    lineHeight: 16,
    marginTop: 8,
  },

  selectButton: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.primary,
    backgroundColor: "#FFFFFF",
    marginTop: 15,
  },

  selectButtonSelected: {
    backgroundColor: THEME.primary,
  },

  selectButtonText: {
    color: THEME.primary,
    fontSize: 10.5,
    fontWeight: "900",
  },

  selectButtonTextSelected: {
    color: "#FFFFFF",
  },

 bottomBar: {
  position: "absolute",
  left: 13,
  right: 13,

  // Keep it above the global navigation.
  bottom: 92,

  minHeight: 78,

  flexDirection: "row",
  alignItems: "center",
  gap: 13,

  paddingHorizontal: 15,
  paddingVertical: 11,

  backgroundColor: "#FFFFFF",

  borderRadius: 20,

  borderWidth: 1,
  borderColor: "#EEE7D8",

  shadowColor: "#5C4A24",
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: {
    width: 0,
    height: 5,
  },

  elevation: 8,

  zIndex: 50,
},

  selectedCount: {
    minWidth: 57,
    alignItems: "center",
  },

  selectedValue: {
    color: THEME.primary,
    fontSize: 19,
    fontWeight: "900",
  },

  selectedLabel: {
    color: THEME.muted,
    fontSize: 7.5,
  },

  sendButton: {
    flex: 1,
    minHeight: 51,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: THEME.primary,
  },

  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 75,
  },

  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.soft,
    marginBottom: 17,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.soft,
    marginBottom: 17,
  },

  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginBottom: 17,
  },

  stateTitle: {
    color: THEME.ink,
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },

  stateText: {
    color: THEME.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 290,
  },

  retryButton: {
    minHeight: 47,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 20,
    backgroundColor: THEME.primary,
    marginTop: 18,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.83,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.5,
  },
});