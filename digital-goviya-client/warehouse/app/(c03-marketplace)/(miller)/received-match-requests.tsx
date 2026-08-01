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
  Alert,
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
  MatchSelection,
} from "@/types/c03-marketplace/matching.types";

import type {
  Harvest,
} from "@/types/c03-marketplace/harvest.types";

import type {
  MillerDemand,
} from "@/types/c03-marketplace/demand.types";

interface FarmerSummary {
  _id: string;
  farmerName: string;
  district: string;
  location: string;
}

export default function ReceivedMatchRequestsScreen() {
  const [selections, setSelections] =
    useState<MatchSelection[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

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
            .getMillerSelections();

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

  const respond = async (
    selectionId: string,
    decision: "accepted" | "rejected"
  ): Promise<void> => {
    if (processingId) {
      return;
    }

    try {
      setProcessingId(selectionId);

      const response =
        await matchingService
          .respondToSelection(
            selectionId,
            decision
          );

      setSelections((current) =>
        current.map((selection) =>
          selection._id === selectionId
            ? response.data.selection
            : selection
        )
      );

      Alert.alert(
        decision === "accepted"
          ? "Match accepted"
          : "Match rejected",
        response.message
      );
    } catch (error) {
      Alert.alert(
        "Unable to update request",
        getApiErrorMessage(error)
      );
    } finally {
      setProcessingId(null);
    }
  };

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
            Match Requests
          </Text>

          <Text style={styles.headerSubtitle}>
            Farmer harvest requests
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="leaf-outline"
            size={20}
            color="#92400E"
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
            tintColor="#92400E"
            colors={["#92400E"]}
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
                label="Pending"
                value={pendingCount}
                icon="time-outline"
              />

              <View style={styles.summaryDivider} />

              <SummaryMetric
                label="Ready"
                value={readyCount}
                icon="checkmark-circle-outline"
              />

              <View style={styles.summaryDivider} />

              <SummaryMetric
                label="Total"
                value={
                  sortedSelections.length
                }
                icon="documents-outline"
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Received requests
              </Text>

              <Text style={styles.refreshHint}>
                Pull to refresh
              </Text>
            </View>

            <View style={styles.requestList}>
              {sortedSelections.map(
                (selection) => (
                  <MillerRequestCard
                    key={selection._id}
                    selection={selection}
                    processing={
                      processingId ===
                      selection._id
                    }
                    onAccept={() =>
                      void respond(
                        selection._id,
                        "accepted"
                      )
                    }
                    onReject={() =>
                      void respond(
                        selection._id,
                        "rejected"
                      )
                    }
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

function MillerRequestCard({
  selection,
  processing,
  onAccept,
  onReject,
}: {
  selection: MatchSelection;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const harvest = getHarvest(
    selection.harvestId
  );

  const farmer = getFarmer(
    selection.farmerId
  );

  const demand = getDemand(
    selection.demandId
  );

  const status =
    getStatusDisplay(selection.status);

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTopRow}>
        <View style={styles.farmerIcon}>
          <Ionicons
            name="person-outline"
            size={22}
            color="#92400E"
          />
        </View>

        <View style={styles.requestTitleArea}>
          <Text style={styles.farmerName}>
            {farmer?.farmerName ??
              "Farmer"}
          </Text>

          <Text style={styles.locationText}>
            {farmer
              ? `${farmer.location}, ${farmer.district}`
              : "Location unavailable"}
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

      <View style={styles.matchScoreCard}>
        <View>
          <Text style={styles.matchScoreLabel}>
            AI match score
          </Text>

          <Text
            style={
              styles.matchScoreDescription
            }
          >
            Harvest-demand compatibility
          </Text>
        </View>

        <Text style={styles.matchScoreValue}>
          {selection.matchingScore.toFixed(
            0
          )}
          %
        </Text>
      </View>

      <View style={styles.harvestPanel}>
        <View style={styles.harvestHeader}>
          <View style={styles.harvestIcon}>
            <Ionicons
              name="leaf"
              size={19}
              color="#15803D"
            />
          </View>

          <View>
            <Text
              style={
                styles.harvestEyebrow
              }
            >
              FARMER HARVEST
            </Text>

            <Text style={styles.harvestTitle}>
              {formatLabel(
                harvest?.paddyType ?? "-"
              )}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <DetailItem
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
            label="Expected"
            value={
              harvest
                ? `Rs.${harvest.expectedPrice.toFixed(
                    2
                  )}`
                : "-"
            }
          />

          <DetailItem
            label="AI price"
            value={
              harvest
                ? `Rs.${harvest.aiPredictedPrice.toFixed(
                    2
                  )}`
                : "-"
            }
            emphasized
          />

          <DetailItem
            label="Your offer"
            value={
              demand
                ? `Rs.${demand.offeredPrice.toFixed(
                    2
                  )}`
                : "-"
            }
            emphasized
          />
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons
          name="time-outline"
          size={15}
          color="#64748B"
        />

        <Text style={styles.dateText}>
          Received{" "}
          {formatDate(selection.createdAt)}
        </Text>
      </View>

      {selection.status === "pending" ? (
        <View style={styles.actionRow}>
          <Pressable
            disabled={processing}
            onPress={onReject}
            style={({ pressed }) => [
              styles.rejectButton,
              pressed && styles.pressed,
              processing &&
                styles.disabled,
            ]}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#B91C1C"
            />

            <Text style={styles.rejectText}>
              Reject
            </Text>
          </Pressable>

          <Pressable
            disabled={processing}
            onPress={onAccept}
            style={({ pressed }) => [
              styles.acceptButton,
              pressed && styles.pressed,
              processing &&
                styles.disabled,
            ]}
          >
            {processing ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.acceptText}
                >
                  Accept
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      {selection.status ===
      "negotiation_ready" ? (
        <Pressable
          onPress={() => {
            /*
             * Connect to the negotiation
             * screen in the next phase.
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
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.summaryMetric}>
      <Ionicons
        name={icon}
        size={20}
        color="#92400E"
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
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          emphasized &&
            styles.detailValueEmphasized,
        ]}
      >
        {value}
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
            color="#92400E"
          />
        </View>

        <Text style={styles.stateTitle}>
          Loading requests
        </Text>

        <Text style={styles.stateText}>
          Retrieving Farmer matching
          requests.
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
          color="#92400E"
        />
      </View>

      <Text style={styles.stateTitle}>
        No match requests yet
      </Text>

      <Text style={styles.stateText}>
        Farmer requests matching one of your
        open demands will appear here.
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

function getFarmer(
  value: MatchSelection["farmerId"]
): FarmerSummary | null {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return value as FarmerSummary;
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
        label: "New Request",
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

const CREAM = "#FBF8F1";
const BORDER = "#ECE6D6";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 17,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
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
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#7A7364",
    fontSize: 10,
    marginTop: 2,
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
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
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 23,
  },

  summaryMetric: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    color: "#78350F",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
  },

  summaryLabel: {
    color: "#7A7364",
    fontSize: 8.5,
    marginTop: 2,
  },

  summaryDivider: {
    width: 1,
    height: 49,
    backgroundColor: "#FDE68A",
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
    borderColor: BORDER,
  },

  requestTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  farmerIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
  },

  requestTitleArea: {
    flex: 1,
    marginLeft: 11,
  },

  farmerName: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "800",
  },

  locationText: {
    color: "#7A7364",
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

  matchScoreCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 16,
    padding: 13,
    backgroundColor: "#FFFBEB",
    marginTop: 16,
  },

  matchScoreLabel: {
    color: "#78350F",
    fontSize: 11,
    fontWeight: "800",
  },

  matchScoreDescription: {
    color: "#7A7364",
    fontSize: 8.5,
    marginTop: 3,
  },

  matchScoreValue: {
    color: "#92400E",
    fontSize: 22,
    fontWeight: "900",
  },

  harvestPanel: {
    borderRadius: 17,
    padding: 14,
    backgroundColor: "#F8FAFC",
    marginTop: 15,
  },

  harvestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  harvestIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  harvestEyebrow: {
    color: "#15803D",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  harvestTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 13,
    marginTop: 14,
  },

  detailItem: {
    width: "50%",
  },

  detailLabel: {
    color: "#94A3B8",
    fontSize: 8,
  },

  detailValue: {
    color: "#334155",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 3,
  },

  detailValueEmphasized: {
    color: "#92400E",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 13,
  },

  dateText: {
    color: "#64748B",
    fontSize: 9,
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  rejectButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  rejectText: {
    color: "#B91C1C",
    fontSize: 11,
    fontWeight: "800",
  },

  acceptButton: {
    flex: 1.2,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#92400E",
  },

  acceptText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  negotiationButton: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#af8b0b",
    marginTop: 16,
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
    backgroundColor: "#FFFBEB",
    marginBottom: 18,
  },

  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
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

  disabled: {
    opacity: 0.55,
  },
});