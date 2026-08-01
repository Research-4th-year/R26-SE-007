import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import type {
  DemandStatus,
  MillerDemand,
} from "@/types/c03-marketplace/demand.types";

const CREAM = "#FBF8F1";
const CARD_BORDER = "#ECE6D6";
const INK = "#16241C";
const INK_MUTED = "#7A7364";

export default function MyDemandsScreen() {
  const [demands, setDemands] = useState<MillerDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const loadDemands = useCallback(async (showRefreshIndicator = false) => {
    try {
      setErrorMessage(null);

      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await demandService.getMyDemands();

      setDemands(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDemands();
    }, [loadDemands])
  );

  const sortedDemands = useMemo(() => {
    return [...demands].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
    );
  }, [demands]);

  // Derived, display-only stat counts for the summary strip.
  const statCounts = useMemo(() => {
    const counts = {
      open: 0,
      negotiating: 0,
      agreed: 0,
    };

    for (const demand of demands) {
      if (demand.status === "open") counts.open += 1;
      else if (
        demand.status === "negotiation_ready" ||
        demand.status === "negotiating"
      )
        counts.negotiating += 1;
      else if (demand.status === "agreement_reached") counts.agreed += 1;
    }

    return counts;
  }, [demands]);

  // Entrance animation — presentation only, mirrors the other marketplace screens.
  const cardsFade = useRef(new Animated.Value(0)).current;
  const cardsRise = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (!fontsLoaded || loading) return;
    cardsFade.setValue(0);
    cardsRise.setValue(14);
    Animated.parallel([
      Animated.timing(cardsFade, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(cardsRise, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded, loading]);

  if (!fontsLoaded) return null;

  if (loading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.navigationHeader}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={20} color="#78350F" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>My Demands</Text>

          <Text style={styles.headerSubtitle}>
            {sortedDemands.length} published
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("./create-demand")}
          style={({ pressed }) => [
            styles.addShadow,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={["#FDE68A", "#F5C542"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={22} color="#78350F" />
          </LinearGradient>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          sortedDemands.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadDemands(true)}
            colors={["#92400E"]}
            tintColor="#92400E"
          />
        }
      >
        {errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void loadDemands()} />
        ) : sortedDemands.length === 0 ? (
          <EmptyState />
        ) : (
          <Animated.View
            style={{
              opacity: cardsFade,
              transform: [{ translateY: cardsRise }],
            }}
          >
            {/* Portfolio summary hero */}
            <LinearGradient
              colors={["#92400E", "#78350F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryHero}
            >
              <View style={styles.summaryHeroTopRow}>
                <View style={styles.summaryHeroIcon}>
                  <Ionicons name="analytics-outline" size={22} color="#FFFFFF" />
                </View>

                <View style={styles.summaryHeroTextArea}>
                  <Text style={styles.summaryHeroEyebrow}>DEMAND PORTFOLIO</Text>
                  <Text style={styles.summaryHeroTitle}>
                    {sortedDemands.length} requirement
                    {sortedDemands.length === 1 ? "" : "s"} tracked
                  </Text>
                </View>
              </View>

              <View style={styles.statChipRow}>
                <StatChip
                  icon="radio-button-on-outline"
                  label="Open"
                  value={statCounts.open}
                />
                <StatChip
                  icon="chatbubbles-outline"
                  label="Negotiating"
                  value={statCounts.negotiating}
                />
                <StatChip
                  icon="checkmark-done-outline"
                  label="Agreed"
                  value={statCounts.agreed}
                />
              </View>
            </LinearGradient>

            {/* Ticket perforation — signature motif shared across the marketplace */}
            <View style={styles.perforationRow}>
              <View style={styles.perforationNotchLeft} />
              <View style={styles.perforationLine} />
              <View style={styles.perforationNotchRight} />
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Recent demands</Text>
              <View style={styles.refreshHintRow}>
                <Ionicons name="arrow-down-circle-outline" size={12} color="#B7AF9C" />
                <Text style={styles.refreshHint}>Pull to refresh</Text>
              </View>
            </View>

            <View style={styles.list}>
              {sortedDemands.map((demand) => (
                <DemandCard key={demand._id} demand={demand} />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatChipProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}

function StatChip({ icon, label, value }: StatChipProps) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={13} color="#FDE68A" />
      <Text style={styles.statChipValue}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

interface DemandCardProps {
  demand: MillerDemand;
}

function DemandCard({ demand }: DemandCardProps) {
  return (
    <View style={styles.demandCard}>
      <View style={styles.cardHeader}>
        <View style={styles.paddyIcon}>
          <Ionicons name="leaf-outline" size={21} color="#92400E" />
        </View>

        <View style={styles.cardTitleArea}>
          <Text style={styles.paddyTitle}>{formatLabel(demand.paddyType)}</Text>

          <Text style={styles.createdDate}>{formatDate(demand.createdAt)}</Text>
        </View>

        <DemandStatusBadge status={demand.status} />
      </View>

      <View style={styles.metricContainer}>
        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <Ionicons name="cube-outline" size={17} color="#78350F" />
          </View>

          <View>
            <Text style={styles.metricLabel}>Quantity needed</Text>

            <Text style={styles.metricValue}>
              {formatNumber(demand.quantityNeeded)} kg
            </Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <View style={[styles.metricIcon, styles.priceMetricIcon]}>
            <Ionicons name="cash-outline" size={17} color="#92400E" />
          </View>

          <View>
            <Text style={styles.metricLabel}>Offered price</Text>

            <Text style={styles.priceMetricValue}>
              {formatCurrency(demand.offeredPrice)}/kg
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.activityDot} />

        <Text style={styles.activityText}>
          {getDemandActivityText(demand.status)}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={15}
          color="#D8CFB8"
          style={styles.cardFooterChevron}
        />
      </View>
    </View>
  );
}

interface DemandStatusBadgeProps {
  status: DemandStatus;
}

function DemandStatusBadge({ status }: DemandStatusBadgeProps) {
  const badgeStyle = getStatusStyle(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: badgeStyle.background }]}>
      <View style={[styles.statusDot, { backgroundColor: badgeStyle.text }]} />
      <Text style={[styles.statusText, { color: badgeStyle.text }]}>
        {formatLabel(status)}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerState}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color="#92400E" />
        </View>

        <Text style={styles.stateTitle}>Loading demands</Text>

        <Text style={styles.stateDescription}>
          Retrieving your latest paddy requirements.
        </Text>
      </View>
    </SafeAreaView>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons name="cloud-offline-outline" size={31} color="#B91C1C" />
      </View>

      <Text style={styles.stateTitle}>Unable to load demands</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryShadow, pressed && styles.pressed]}
      >
        <View style={styles.retryButton}>
          <Ionicons name="refresh" size={17} color="#FFFFFF" />
          <Text style={styles.retryText}>Try Again</Text>
        </View>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="document-text-outline" size={37} color="#92400E" />
      </View>

      <Text style={styles.stateTitle}>No demands yet</Text>

      <Text style={styles.stateDescription}>
        Publish your first paddy requirement to start finding suitable
        farmer harvests.
      </Text>

      <Pressable
        onPress={() => router.push("./create-demand")}
        style={({ pressed }) => [styles.emptyShadow, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["#FDE68A", "#F5C542"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyButton}
        >
          <Ionicons name="add-circle-outline" size={19} color="#78350F" />
          <Text style={styles.emptyButtonText}>Create First Demand</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function getStatusStyle(status: DemandStatus): {
  background: string;
  text: string;
} {
  switch (status) {
    case "open":
      return { background: "#FEF3C7", text: "#92400E" };

    case "negotiation_ready":
      return { background: "#DBEAFE", text: "#1D4ED8" };

    case "negotiating":
      return { background: "#FDE68A", text: "#78350F" };

    case "agreement_reached":
      return { background: "#D1FAE5", text: "#065F46" };

    case "negotiation_failed":
    case "rejected":
      return { background: "#FEE2E2", text: "#B91C1C" };

    case "cancelled":
      return { background: "#F1EEE4", text: "#7A7364" };

    default:
      return { background: "#F1EEE4", text: "#7A7364" };
  }
}

function getDemandActivityText(status: DemandStatus): string {
  switch (status) {
    case "open":
      return "Available for harvest matching";

    case "negotiation_ready":
      return "Ready to start negotiation";

    case "negotiating":
      return "AI negotiation is active";

    case "agreement_reached":
      return "An agreement was reached";

    case "negotiation_failed":
      return "Negotiation ended without agreement";

    case "rejected":
      return "The demand was rejected";

    case "cancelled":
      return "The demand was cancelled";

    default:
      return "Demand status updated";
  }
}

function formatLabel(value: string): string {
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

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  navigationHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },

  headerText: {
    flex: 1,
    marginHorizontal: 14,
  },

  headerTitle: {
    color: INK,
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
  },

  headerSubtitle: {
    color: INK_MUTED,
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  addShadow: {
    borderRadius: 14,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  // Portfolio summary hero
  summaryHero: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    overflow: "hidden",
  },

  summaryHeroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  summaryHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  summaryHeroTextArea: {
    flex: 1,
  },

  summaryHeroEyebrow: {
    color: "#FDE68A",
    fontSize: 9.5,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1.2,
  },

  summaryHeroTitle: {
    color: "#FFFFFF",
    fontSize: 15.5,
    fontFamily: "Poppins_700Bold",
    marginTop: 4,
  },

  statChipRow: {
    flexDirection: "row",
    gap: 8,
  },

  statChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.28)",
    alignItems: "center",
    gap: 3,
  },

  statChipValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  statChipLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  // Ticket perforation — signature motif shared across the marketplace
  perforationRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 20,
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

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    color: INK,
    fontSize: 15.5,
    fontFamily: "Poppins_700Bold",
  },

  refreshHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  refreshHint: {
    color: "#B7AF9C",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },

  list: {
    gap: 13,
  },

  demandCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  paddyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
  },

  cardTitleArea: {
    flex: 1,
    marginLeft: 12,
  },

  paddyTitle: {
    color: INK,
    fontSize: 14.5,
    fontFamily: "Poppins_700Bold",
  },

  createdDate: {
    color: "#B7AF9C",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  statusBadge: {
    maxWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 8.5,
    fontFamily: "Poppins_700Bold",
  },

  metricContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#FAFAF7",
    borderWidth: 1,
    borderColor: "#F1EEE4",
    marginTop: 15,
  },

  metric: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  metricDivider: {
    width: 1,
    height: 38,
    backgroundColor: CARD_BORDER,
    marginHorizontal: 11,
  },

  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEADA",
  },

  priceMetricIcon: {
    backgroundColor: "#FEF3C7",
  },

  metricLabel: {
    color: INK_MUTED,
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
  },

  metricValue: {
    color: INK,
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },

  priceMetricValue: {
    color: "#92400E",
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "#F1EEE4",
    paddingTop: 12,
    marginTop: 14,
  },

  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
  },

  activityText: {
    flex: 1,
    color: INK_MUTED,
    fontSize: 10.5,
    fontFamily: "Poppins_600SemiBold",
  },

  cardFooterChevron: {
    marginLeft: "auto",
  },

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 27,
    paddingVertical: 50,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    marginBottom: 18,
  },

  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginBottom: 18,
  },

  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    marginBottom: 20,
  },

  stateTitle: {
    color: INK,
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
  },

  stateDescription: {
    color: INK_MUTED,
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 290,
  },

  retryShadow: {
    borderRadius: 15,
    marginTop: 20,
  },

  retryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    paddingHorizontal: 22,
    backgroundColor: "#B91C1C",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  emptyShadow: {
    borderRadius: 15,
    marginTop: 22,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  emptyButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    paddingHorizontal: 22,
  },

  emptyButtonText: {
    color: "#78350F",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});