import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
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

import {
  matchingService,
} from "@/services/c03-marketplace/matching.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  HarvestMatch,
  MatchSelection,
  MillerSummary,
} from "@/types/c03-marketplace/matching.types";

import type {
  Harvest,
} from "@/types/c03-marketplace/harvest.types";

import type {
  MillerDemand,
} from "@/types/c03-marketplace/demand.types";

export default function MyMatchRequestsScreen() {
  const [selections, setSelections] =
    useState<MatchSelection[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadSelections = useCallback(
    async (
      showRefreshIndicator = false
    ): Promise<void> => {
      try {
        setErrorMessage(null);

        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await matchingService
            .getFarmerSelections();

        setSelections(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void loadSelections();
    }, [loadSelections])
  );

  const sortedSelections = useMemo(
    () =>
      [...selections].sort(
        (first, second) =>
          new Date(
            second.createdAt
          ).getTime() -
          new Date(
            first.createdAt
          ).getTime()
      ),
    [selections]
  );

  const pendingCount =
    sortedSelections.filter(
      (selection) =>
        selection.status === "pending"
    ).length;

  const readyCount =
    sortedSelections.filter(
      (selection) =>
        selection.status ===
        "negotiation_ready"
    ).length;

  if (loading) {
    return <LoadingState />;
  }

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
            size={21}
            color="#1F2937"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            My Match Requests
          </Text>

          <Text style={styles.headerSubtitle}>
            Track requests sent to millers
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="git-compare-outline"
            size={20}
            color="#15803D"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          sortedSelections.length === 0 &&
            styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              void loadSelections(true)
            }
            tintColor="#15803D"
            colors={["#15803D"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() =>
              void loadSelections()
            }
          />
        ) : sortedSelections.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.summaryCard}>
              <SummaryMetric
                icon="time-outline"
                label="Pending"
                value={pendingCount}
              />

              <View style={styles.summaryDivider} />

              <SummaryMetric
                icon="checkmark-circle-outline"
                label="Negotiation ready"
                value={readyCount}
              />

              <View style={styles.summaryDivider} />

              <SummaryMetric
                icon="documents-outline"
                label="Total"
                value={
                  sortedSelections.length
                }
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Sent requests
              </Text>

              <Text style={styles.refreshHint}>
                Pull to refresh
              </Text>
            </View>

            <View style={styles.requestList}>
              {sortedSelections.map(
                (selection) => (
                  <FarmerRequestCard
                    key={selection._id}
                    selection={selection}
                  />
                )
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FarmerRequestCard({
  selection,
}: {
  selection: MatchSelection;
}) {
  const harvest = getHarvest(
    selection.harvestId
  );

  const miller = getMiller(
    selection.millerId
  );

  const demand = getDemand(
    selection.demandId
  );

  const status =
    getStatusDisplay(selection.status);

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTopRow}>
        <View style={styles.millerIcon}>
          <Ionicons
            name="business-outline"
            size={22}
            color="#15803D"
          />
        </View>

        <View style={styles.requestTitleArea}>
          <Text style={styles.millerName}>
            {miller?.name ??
              "Miller"}
          </Text>

          <Text style={styles.millName}>
            {miller?.millName ??
              "Rice Mill"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                status.background,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: status.color,
              },
            ]}
          >
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.scoreCard}>
        <View>
          <Text style={styles.scoreLabel}>
            Matching score
          </Text>

          <Text style={styles.scoreDescription}>
            AI-calculated compatibility
          </Text>
        </View>

        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>
            {selection.matchingScore.toFixed(
              0
            )}
          </Text>

          <Text style={styles.scoreTotal}>
            %
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <DetailItem
          icon="leaf-outline"
          label="Paddy"
          value={formatLabel(
            harvest?.paddyType ?? "-"
          )}
        />

        <DetailItem
          icon="cube-outline"
          label="Quantity"
          value={
            harvest
              ? `${formatNumber(
                  harvest.quantity
                )} kg`
              : "-"
          }
        />

        <DetailItem
          icon="cash-outline"
          label="Miller offer"
          value={
            demand
              ? `Rs.${demand.offeredPrice.toFixed(
                  2
                )}`
              : "-"
          }
        />

        <DetailItem
          icon="location-outline"
          label="District"
          value={
            miller?.district ?? "-"
          }
        />
      </View>

      <View style={styles.timelineRow}>
        <Ionicons
          name="calendar-outline"
          size={15}
          color="#64748B"
        />

        <Text style={styles.timelineText}>
          Sent{" "}
          {formatDate(selection.createdAt)}
        </Text>
      </View>

      {selection.status ===
      "negotiation_ready" ? (
        <Pressable
          onPress={() => {
            /*
             * Connect to negotiation screen
             * in the next phase.
             */
          }}
          style={({ pressed }) => [
            styles.negotiationButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="sparkles"
            size={18}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.negotiationButtonText
            }
          >
            Start AI Negotiation
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.summaryMetric}>
      <Ionicons
        name={icon}
        size={20}
        color="#15803D"
      />

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={16}
          color="#15803D"
        />
      </View>

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
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
            color="#15803D"
          />
        </View>

        <Text style={styles.stateTitle}>
          Loading match requests
        </Text>

        <Text style={styles.stateText}>
          Retrieving your latest matching
          activity.
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
          name="git-compare-outline"
          size={39}
          color="#15803D"
        />
      </View>

      <Text style={styles.stateTitle}>
        No match requests yet
      </Text>

      <Text style={styles.stateText}>
        Select an available harvest and find
        matching millers to send your first
        request.
      </Text>

      <Pressable
        onPress={() =>
          router.push("./my-harvests")
        }
        style={({ pressed }) => [
          styles.emptyButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="leaf-outline"
          size={19}
          color="#FFFFFF"
        />

        <Text style={styles.emptyButtonText}>
          View My Harvests
        </Text>
      </Pressable>
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
          size={38}
          color="#B91C1C"
        />
      </View>

      <Text style={styles.stateTitle}>
        Unable to load requests
      </Text>

      <Text style={styles.stateText}>
        {message}
      </Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="refresh"
          size={18}
          color="#FFFFFF"
        />

        <Text style={styles.retryText}>
          Try Again
        </Text>
      </Pressable>
    </View>
  );
}

function getHarvest(
  value: MatchSelection["harvestId"]
): Harvest | null {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return value as Harvest;
  }

  return null;
}

function getMiller(
  value: MatchSelection["millerId"]
): MillerSummary | null {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return value as MillerSummary;
  }

  return null;
}

function getDemand(
  value: MatchSelection["demandId"]
): MillerDemand | null {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return value as MillerDemand;
  }

  return null;
}

function getStatusDisplay(
  status: MatchSelection["status"]
) {
  switch (status) {
    case "pending":
      return {
        label: "Waiting",
        color: "#92400E",
        background: "#FEF3C7",
      };

    case "negotiation_ready":
      return {
        label: "Negotiation Ready",
        color: "#166534",
        background: "#DCFCE7",
      };

    case "rejected":
      return {
        label: "Rejected",
        color: "#B91C1C",
        background: "#FEE2E2",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        color: "#475569",
        background: "#E2E8F0",
      };
  }
}

function formatLabel(
  value: string
): string {
  return value
    .split(/[\s_-]+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(" ");
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-LK"
  ).format(value);
}

function formatDate(
  value: string
): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
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

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  content: {
    padding: 17,
    paddingBottom: 40,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 15,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 23,
  },

  summaryMetric: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    color: "#14532D",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
  },

  summaryLabel: {
    color: "#64748B",
    fontSize: 8.5,
    marginTop: 2,
    textAlign: "center",
  },

  summaryDivider: {
    width: 1,
    height: 49,
    backgroundColor: "#BBF7D0",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "800",
  },

  refreshHint: {
    color: "#9CA3AF",
    fontSize: 9,
  },

  requestList: {
    gap: 15,
  },

  requestCard: {
    borderRadius: 22,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  requestTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  millerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  requestTitleArea: {
    flex: 1,
    marginLeft: 11,
  },

  millerName: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "800",
  },

  millName: {
    color: "#64748B",
    fontSize: 9.5,
    marginTop: 2,
  },

  statusBadge: {
    maxWidth: 115,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
  },

  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 13,
    backgroundColor: "#F0FDF4",
    marginTop: 16,
  },

  scoreLabel: {
    color: "#14532D",
    fontSize: 11,
    fontWeight: "800",
  },

  scoreDescription: {
    color: "#64748B",
    fontSize: 8.5,
    marginTop: 3,
  },

  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 14,
  },

  scoreValue: {
    color: "#15803D",
    fontSize: 19,
    fontWeight: "900",
  },

  scoreTotal: {
    color: "#15803D",
    fontSize: 9,
    fontWeight: "800",
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
    marginTop: 15,
  },

  detailItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
  },

  detailText: {
    flex: 1,
  },

  detailLabel: {
    color: "#94A3B8",
    fontSize: 8,
  },

  detailValue: {
    color: "#334155",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 13,
    marginTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  timelineText: {
    color: "#64748B",
    fontSize: 9,
  },

  negotiationButton: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#15803D",
    marginTop: 15,
  },

  negotiationButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  centerState: {
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
    width: 92,
    height: 92,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 18,
  },

  errorIcon: {
    width: 92,
    height: 92,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginBottom: 18,
  },

  stateTitle: {
    color: "#1F2937",
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
  },

  stateText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  emptyButton: {
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 21,
    backgroundColor: "#15803D",
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  retryButton: {
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 21,
    backgroundColor: "#B91C1C",
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});