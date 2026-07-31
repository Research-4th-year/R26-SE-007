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
  demandService,
} from "@/services/c03-marketplace/demand.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  DemandStatus,
  MillerDemand,
} from "@/types/c03-marketplace/demand.types";

export default function MyDemandsScreen() {
  const [demands, setDemands] = useState<
    MillerDemand[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const loadDemands = useCallback(
    async (
      showRefreshIndicator = false
    ) => {
      try {
        setErrorMessage(null);

        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await demandService.getMyDemands();

        setDemands(
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
      void loadDemands();
    }, [loadDemands])
  );

  const sortedDemands = useMemo(() => {
    return [...demands].sort(
      (first, second) =>
        new Date(
          second.createdAt
        ).getTime() -
        new Date(
          first.createdAt
        ).getTime()
    );
  }, [demands]);

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
          <Ionicons
            name="arrow-back"
            size={22}
            color="#1F2937"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            My Demands
          </Text>

          <Text style={styles.headerSubtitle}>
            {sortedDemands.length} published
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push("./create-demand")
          }
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="add"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          sortedDemands.length === 0 &&
            styles.emptyContent,
        ]}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              void loadDemands(true)
            }
            colors={["#15803D"]}
            tintColor="#15803D"
          />
        }
      >
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() =>
              void loadDemands()
            }
          />
        ) : sortedDemands.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="analytics-outline"
                  size={25}
                  color="#15803D"
                />
              </View>

              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  Demand portfolio
                </Text>

                <Text
                  style={
                    styles.summaryDescription
                  }
                >
                  Track published requirements
                  and their negotiation status.
                </Text>
              </View>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>
                Recent demands
              </Text>

              <Text style={styles.refreshHint}>
                Pull to refresh
              </Text>
            </View>

            <View style={styles.list}>
              {sortedDemands.map(
                (demand) => (
                  <DemandCard
                    key={demand._id}
                    demand={demand}
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

interface DemandCardProps {
  demand: MillerDemand;
}

function DemandCard({
  demand,
}: DemandCardProps) {
  return (
    <View style={styles.demandCard}>
      <View style={styles.cardHeader}>
        <View style={styles.paddyIcon}>
          <Ionicons
            name="leaf-outline"
            size={23}
            color="#15803D"
          />
        </View>

        <View style={styles.cardTitleArea}>
          <Text style={styles.paddyTitle}>
            {formatLabel(
              demand.paddyType
            )}
          </Text>

          <Text style={styles.createdDate}>
            {formatDate(
              demand.createdAt
            )}
          </Text>
        </View>

        <DemandStatusBadge
          status={demand.status}
        />
      </View>

      <View style={styles.metricContainer}>
        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <Ionicons
              name="cube-outline"
              size={18}
              color="#475569"
            />
          </View>

          <View>
            <Text style={styles.metricLabel}>
              Quantity needed
            </Text>

            <Text style={styles.metricValue}>
              {formatNumber(
                demand.quantityNeeded
              )}{" "}
              kg
            </Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <View
            style={[
              styles.metricIcon,
              styles.priceMetricIcon,
            ]}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color="#15803D"
            />
          </View>

          <View>
            <Text style={styles.metricLabel}>
              Offered price
            </Text>

            <Text
              style={
                styles.priceMetricValue
              }
            >
              {formatCurrency(
                demand.offeredPrice
              )}
              /kg
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.activityDot} />

        <Text style={styles.activityText}>
          {getDemandActivityText(
            demand.status
          )}
        </Text>
      </View>
    </View>
  );
}

interface DemandStatusBadgeProps {
  status: DemandStatus;
}

function DemandStatusBadge({
  status,
}: DemandStatusBadgeProps) {
  const badgeStyle =
    getStatusStyle(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            badgeStyle.background,
        },
      ]}
    >
      <Text
        style={[
          styles.statusText,
          {
            color: badgeStyle.text,
          },
        ]}
      >
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
          <ActivityIndicator
            size="large"
            color="#15803D"
          />
        </View>

        <Text style={styles.stateTitle}>
          Loading demands
        </Text>

        <Text style={styles.stateDescription}>
          Retrieving your latest paddy
          requirements.
        </Text>
      </View>
    </SafeAreaView>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons
          name="cloud-offline-outline"
          size={33}
          color="#B91C1C"
        />
      </View>

      <Text style={styles.stateTitle}>
        Unable to load demands
      </Text>

      <Text style={styles.stateDescription}>
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

function EmptyState() {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="document-text-outline"
          size={39}
          color="#15803D"
        />
      </View>

      <Text style={styles.stateTitle}>
        No demands yet
      </Text>

      <Text style={styles.stateDescription}>
        Publish your first paddy requirement
        to start finding suitable farmer
        harvests.
      </Text>

      <Pressable
        onPress={() =>
          router.push("./create-demand")
        }
        style={({ pressed }) => [
          styles.emptyButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color="#FFFFFF"
        />

        <Text style={styles.emptyButtonText}>
          Create First Demand
        </Text>
      </Pressable>
    </View>
  );
}

function getStatusStyle(
  status: DemandStatus
): {
  background: string;
  text: string;
} {
  switch (status) {
    case "open":
      return {
        background: "#DCFCE7",
        text: "#166534",
      };

    case "negotiation_ready":
      return {
        background: "#DBEAFE",
        text: "#1D4ED8",
      };

    case "negotiating":
      return {
        background: "#FEF3C7",
        text: "#92400E",
      };

    case "agreement_reached":
      return {
        background: "#D1FAE5",
        text: "#065F46",
      };

    case "negotiation_failed":
    case "rejected":
      return {
        background: "#FEE2E2",
        text: "#B91C1C",
      };

    case "cancelled":
      return {
        background: "#F3F4F6",
        text: "#4B5563",
      };

    default:
      return {
        background: "#F3F4F6",
        text: "#4B5563",
      };
  }
}

function getDemandActivityText(
  status: DemandStatus
): string {
  switch (status) {
    case "open":
      return (
        "Available for harvest matching"
      );

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

function formatLabel(
  value: string
): string {
  return value
    .trim()
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
    "en-LK",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatCurrency(
  value: number
): string {
  return `LKR ${new Intl.NumberFormat(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value)}`;
}

function formatDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
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

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  headerText: {
    flex: 1,
    marginHorizontal: 14,
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

  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#15803D",
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 19,
    padding: 16,
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

  summaryText: {
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
  },

  refreshHint: {
    color: "#9CA3AF",
    fontSize: 10,
  },

  list: {
    gap: 14,
  },

  demandCard: {
    borderRadius: 21,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardHeader: {
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

  paddyTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
  },

  createdDate: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 4,
  },

  statusBadge: {
    maxWidth: 110,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 8.5,
    fontWeight: "900",
    textAlign: "center",
  },

  metricContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#F8FAFC",
    marginTop: 17,
  },

  metric: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  metricDivider: {
    width: 1,
    height: 42,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },

  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },

  priceMetricIcon: {
    backgroundColor: "#DCFCE7",
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 9,
  },

  metricValue: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  priceMetricValue: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 13,
    marginTop: 15,
  },

  activityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
  },

  activityText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "600",
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

  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 20,
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

  retryText: {
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
    transform: [
      {
        scale: 0.98,
      },
    ],
  },
});