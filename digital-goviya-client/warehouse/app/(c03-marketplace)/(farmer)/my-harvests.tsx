import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCallback, useMemo, useState } from "react";

import { harvestService } from "@/services/c03-marketplace/harvest.service";

import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";

import type { Harvest } from "@/types/c03-marketplace/harvest.types";

export default function MyHarvestsScreen() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHarvests = useCallback(async (showRefreshIndicator = false) => {
    try {
      setErrorMessage(null);

      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await harvestService.getMyHarvests();

      const harvestData = Array.isArray(response.data) ? response.data : [];

      setHarvests(harvestData);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHarvests();
    }, [loadHarvests]),
  );

  const sortedHarvests = useMemo(() => {
    return [...harvests].sort((first, second) => {
      const firstDate = new Date(first.createdAt).getTime();

      const secondDate = new Date(second.createdAt).getTime();

      return secondDate - firstDate;
    });
  }, [harvests]);

  if (loading) {
    return <LoadingState />;
  }

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

        <View style={styles.navigationTitleArea}>
          <Text style={styles.navigationTitle}>My Harvests</Text>

          <Text style={styles.navigationSubtitle}>
            {sortedHarvests.length} submitted
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add harvest"
          onPress={() => router.push("./add-harvest")}
          style={({ pressed }) => [
            styles.addHeaderButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          sortedHarvests.length === 0 && styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadHarvests(true)}
            tintColor="#15803D"
            colors={["#15803D"]}
          />
        }
      >
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => void loadHarvests()}
          />
        ) : sortedHarvests.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons name="leaf" size={24} color="#15803D" />
              </View>

              <View style={styles.summaryTextArea}>
                <Text style={styles.summaryTitle}>Harvest portfolio</Text>

                <Text style={styles.summaryDescription}>
                  Review your AI price estimates and market recommendations.
                </Text>
              </View>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Recent harvests</Text>

              <Text style={styles.pullHint}>Pull to refresh</Text>
            </View>

            <View style={styles.harvestList}>
              {sortedHarvests.map((harvest) => (
                <HarvestCard key={harvest._id} harvest={harvest} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface HarvestCardProps {
  harvest: Harvest;
}

function HarvestCard({ harvest }: HarvestCardProps) {
  const displayName = formatPaddyType(harvest.paddyType);

  const marketStatus = formatStatus(harvest.marketStatus);

  const predictedPrice = harvest.aiPredictedPrice;

  const priceDifference =
    typeof predictedPrice === "number"
      ? predictedPrice - harvest.expectedPrice
      : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.harvestCard,
        pressed && styles.cardPressed,
      ]}
      onPress={() => {
        router.push({
          pathname: "/(c03-marketplace)/(farmer)/harvest-result",

          params: {
            harvestId: harvest._id,
            paddyType: harvest.paddyType,
            season: harvest.season,
            quantity: String(harvest.quantity),

            expectedPrice: String(harvest.expectedPrice),

            aiPredictedPrice: String(harvest.aiPredictedPrice),

            priceDifference: String(harvest.priceDifference),

            priceLevel: harvest.priceLevel,

            harvestScore: String(harvest.harvestScore),

            marketStatus: harvest.marketStatus,

            recommendedAction: harvest.recommendedAction,

            recommendationEnglish: harvest.recommendation?.english ?? "",

            recommendationSinhala: harvest.recommendation?.sinhala ?? "",

            createdAt: harvest.createdAt,
          },
        });
      }}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.paddyIcon}>
          <Ionicons name="leaf-outline" size={22} color="#15803D" />
        </View>

        <View style={styles.cardTitleArea}>
          <Text style={styles.paddyName}>{displayName}</Text>

          <Text style={styles.harvestDate}>
            {formatDate(harvest.createdAt)}
          </Text>
        </View>

        {marketStatus ? <StatusBadge status={marketStatus} /> : null}
      </View>

      <View style={styles.detailsGrid}>
        <MetricItem
          label="Quantity"
          value={`${formatNumber(harvest.quantity)} kg`}
          icon="cube-outline"
        />

        <MetricItem
          label="Season"
          value={formatSeason(harvest.season)}
          icon="calendar-outline"
        />

        <MetricItem
          label="Expected"
          value={formatCurrency(harvest.expectedPrice)}
          icon="cash-outline"
        />

        <MetricItem
          label="AI price"
          value={
            typeof predictedPrice === "number"
              ? formatCurrency(predictedPrice)
              : "Pending"
          }
          icon="sparkles-outline"
          emphasized
        />
      </View>

      {typeof priceDifference === "number" ? (
        <View style={styles.insightRow}>
          <Ionicons
            name={
              priceDifference >= 0
                ? "trending-up-outline"
                : "trending-down-outline"
            }
            size={18}
            color={priceDifference >= 0 ? "#15803D" : "#B45309"}
          />

          <Text
            style={[
              styles.insightText,
              priceDifference < 0 && styles.insightWarning,
            ]}
          >
            {priceDifference >= 0 ? "+" : ""}
            {formatCurrency(priceDifference)} compared with your expected price
          </Text>
        </View>
      ) : null}

      {typeof harvest.harvestScore === "number" ? (
        <View style={styles.scoreSection}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>Harvest score</Text>

            <Text style={styles.scoreValue}>
              {Math.round(harvest.harvestScore)}/100
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(Math.max(harvest.harvestScore, 0), 100)}%`,
                },
              ]}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>View AI details</Text>

        <Ionicons name="chevron-forward" size={18} color="#15803D" />
      </View>
    </Pressable>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasized?: boolean;
}

function MetricItem({
  label,
  value,
  icon,
  emphasized = false,
}: MetricItemProps) {
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricLabelRow}>
        <Ionicons
          name={icon}
          size={14}
          color={emphasized ? "#15803D" : "#64748B"}
        />

        <Text style={styles.metricLabel}>{label}</Text>
      </View>

      <Text
        style={[styles.metricValue, emphasized && styles.metricValueEmphasized]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

interface StatusBadgeProps {
  status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const isPositive =
    normalizedStatus.includes("good") ||
    normalizedStatus.includes("fair") ||
    normalizedStatus.includes("high") ||
    normalizedStatus.includes("ready");

  return (
    <View
      style={[
        styles.statusBadge,
        isPositive ? styles.statusPositive : styles.statusNeutral,
      ]}
    >
      <Text
        style={[
          styles.statusText,
          isPositive ? styles.statusPositiveText : styles.statusNeutralText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerState}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color="#15803D" />
        </View>

        <Text style={styles.stateTitle}>Loading harvests</Text>

        <Text style={styles.stateDescription}>
          Retrieving your latest marketplace data.
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
        <Ionicons name="cloud-offline-outline" size={32} color="#B91C1C" />
      </View>

      <Text style={styles.stateTitle}>Unable to load harvests</Text>

      <Text style={styles.stateDescription}>{message}</Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh" size={18} color="#FFFFFF" />

        <Text style={styles.retryButtonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIllustration}>
        <View style={styles.emptySmallCircle}>
          <Ionicons name="leaf-outline" size={36} color="#15803D" />
        </View>
      </View>

      <Text style={styles.stateTitle}>No harvests yet</Text>

      <Text style={styles.stateDescription}>
        Add your first paddy harvest to receive an AI-generated price
        recommendation.
      </Text>

      <Pressable
        onPress={() => router.push("./add-harvest")}
        style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />

        <Text style={styles.emptyButtonText}>Add First Harvest</Text>
      </Pressable>
    </View>
  );
}

function formatPaddyType(value: string): string {
  return value
    .trim()
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatSeason(value: string): string {
  return value
    ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    : "Not specified";
}

function formatStatus(value?: string): string | null {
  if (!value) {
    return null;
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
    backgroundColor: "#F8FAF8",
  },

  navigationHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  navigationTitleArea: {
    flex: 1,
    marginHorizontal: 14,
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

  addHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803D",
  },

  content: {
    padding: 18,
    paddingBottom: 36,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 22,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  summaryTextArea: {
    flex: 1,
  },

  summaryTitle: {
    color: "#14532D",
    fontSize: 14,
    fontWeight: "800",
  },

  summaryDescription: {
    color: "#4B5563",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
  },

  pullHint: {
    color: "#9CA3AF",
    fontSize: 10,
  },

  harvestList: {
    gap: 14,
  },

  harvestCard: {
    borderRadius: 21,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  paddyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  cardTitleArea: {
    flex: 1,
    marginLeft: 12,
  },

  paddyName: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
  },

  harvestDate: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 4,
  },

  statusBadge: {
    maxWidth: 110,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusPositive: {
    backgroundColor: "#DCFCE7",
  },

  statusNeutral: {
    backgroundColor: "#FEF3C7",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },

  statusPositiveText: {
    color: "#166534",
  },

  statusNeutralText: {
    color: "#92400E",
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 17,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    padding: 13,
    rowGap: 15,
  },

  metricItem: {
    width: "50%",
    paddingRight: 8,
  },

  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
  },

  metricValue: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },

  metricValueEmphasized: {
    color: "#15803D",
  },

  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 13,
    backgroundColor: "#F0FDF4",
  },

  insightText: {
    flex: 1,
    color: "#166534",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 15,
  },

  insightWarning: {
    color: "#92400E",
  },

  scoreSection: {
    marginTop: 15,
  },

  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  scoreLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
  },

  scoreValue: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
  },

  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  viewDetailsText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "800",
  },

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 26,
    paddingVertical: 50,
  },

  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
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

  emptyIllustration: {
    width: 104,
    height: 104,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 20,
  },

  emptySmallCircle: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  stateTitle: {
    color: "#1F2937",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  stateDescription: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 290,
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
    marginTop: 20,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    paddingHorizontal: 22,
    backgroundColor: "#15803D",
    marginTop: 22,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
});
