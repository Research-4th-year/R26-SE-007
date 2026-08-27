import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
} from "@/components/c03-marketplace/themed-native";

import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/poppins";

import { useLanguage } from "@/contexts/LanguageContext";

import {
  matchingService,
} from "@/services/c03-marketplace/matching.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
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
  const { t, language } = useLanguage();

  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [selections, setSelections] =
    useState<MatchSelection[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [processingId, setProcessingId] =
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
          await matchingService.getFarmerSelections();

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
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
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
        selection.status === "negotiation_ready"
    ).length;

  const acceptedCount =
    sortedSelections.filter(
      (selection) =>
        selection.status === "negotiation_ready"
    ).length;

  if (!fontsLoaded || loading) {
    return <LoadingState t={t} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* ================= HEADER ================= */}
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
            {t.c3myMatchRequests.title}
          </Text>

          <Text style={styles.headerSubtitle}>
            {t.c3myMatchRequests.subtitle}
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="git-compare-outline"
            size={21}
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
        {/* ================= ERROR ================= */}
        {errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() =>
              void loadSelections()
            }
            t={t}
          />
        ) : sortedSelections.length === 0 ? (
          <EmptyState t={t} />
        ) : (
          <>
            {/* ================= WELCOME / OVERVIEW ================= */}
            <View style={styles.overviewCard}>
              <View style={styles.overviewIcon}>
                <Ionicons
                  name="analytics-outline"
                  size={23}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.overviewText}>
                <Text style={styles.overviewTitle}>
                  {t.c3myMatchRequests.overviewTitle}
                </Text>

                <Text style={styles.overviewSubtitle}>
                  {t.c3myMatchRequests.overviewSubtitle}
                </Text>
              </View>
            </View>

            {/* ================= SUMMARY ================= */}
            <View style={styles.summaryCard}>
              <SummaryMetric
                icon="time-outline"
                label={t.c3myMatchRequests.pending}
                value={pendingCount}
              />

              <View style={styles.summaryDivider} />

              <SummaryMetric
                icon="sparkles-outline"
                label={t.c3myMatchRequests.ready}
                value={readyCount}
              />

              <View style={styles.summaryDivider} />

              <SummaryMetric
                icon="documents-outline"
                label={t.c3myMatchRequests.total}
                value={sortedSelections.length}
              />
            </View>

            {/* ================= SECTION HEADER ================= */}
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>
                  {t.c3myMatchRequests.activityTitle}
                </Text>

                <Text style={styles.sectionSubtitle}>
                  {t.c3myMatchRequests.activitySubtitle}
                </Text>
              </View>

              <View style={styles.refreshBadge}>
                <Ionicons
                  name="refresh-outline"
                  size={13}
                  color="#64748B"
                />

                <Text style={styles.refreshHint}>
                  {t.c3myMatchRequests.pullToRefresh}
                </Text>
              </View>
            </View>

            {/* ================= REQUEST LIST ================= */}
            <View style={styles.requestList}>
              {sortedSelections.map(
                (selection) => (
                  <FarmerRequestCard
                    key={selection._id}
                    selection={selection}
                    processing={
                      processingId ===
                      selection._id
                    }
                    onAccept={() =>
                      void respondToMatch(
                        selection._id,
                        "accepted",
                        setProcessingId,
                        setSelections,
                        t
                      )
                    }
                    onReject={() =>
                      void respondToMatch(
                        selection._id,
                        "rejected",
                        setProcessingId,
                        setSelections,
                        t
                      )
                    }
                    t={t}
                    language={language}
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

/* =========================================================
   REQUEST CARD
========================================================= */

function FarmerRequestCard({
  selection,
  processing,
  onAccept,
  onReject,
  t,
  language,
}: {
  selection: MatchSelection;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  t: any;
  language: string;
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
    getStatusDisplay(
      selection.status,
      t
    );

  const isIncoming =
    selection.initiatedBy === "miller";

  const isPendingIncoming =
    isIncoming &&
    selection.status === "pending";

  return (
    <View style={styles.requestCard}>
      {/* ================= REQUEST TYPE ================= */}
      <View style={styles.cardTopRow}>
        <View
          style={[
            styles.directionBadge,
            isIncoming
              ? styles.incomingBadge
              : styles.outgoingBadge,
          ]}
        >
          <Ionicons
            name={
              isIncoming
                ? "arrow-down-outline"
                : "arrow-up-outline"
            }
            size={12}
            color={
              isIncoming
                ? "#15803D"
                : "#64748B"
            }
          />

          <Text
            style={[
              styles.directionText,
              {
                color: isIncoming
                  ? "#15803D"
                  : "#64748B",
              },
            ]}
          >
            {isIncoming
              ? t.c3myMatchRequests.millerRequest
              : t.c3myMatchRequests.sentRequest}
          </Text>
        </View>

        {/* STATUS */}
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                status.background,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  status.color,
              },
            ]}
          />

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

      {/* ================= MILLER INFO ================= */}
      <View style={styles.requestTopRow}>
        <View style={styles.millerIcon}>
          <Ionicons
            name="business-outline"
            size={23}
            color="#15803D"
          />
        </View>

        <View style={styles.requestTitleArea}>
          <Text
            style={styles.millerName}
            numberOfLines={1}
          >
            {miller?.name ??
              t.c3myMatchRequests.miller}
          </Text>

          <View style={styles.millLocationRow}>
            <Ionicons
              name="business-outline"
              size={11}
              color="#94A3B8"
            />

            <Text
              style={styles.millName}
              numberOfLines={1}
            >
              {miller?.millName ??
                t.c3myMatchRequests.riceMill}
            </Text>
          </View>
        </View>
      </View>

      {/* ================= MATCH SCORE ================= */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreLeft}>
          <View style={styles.scoreIcon}>
            <Ionicons
              name="sparkles"
              size={16}
              color="#15803D"
            />
          </View>

          <View>
            <Text style={styles.scoreLabel}>
              {t.c3myMatchRequests.aiMatchingScore}
            </Text>

            <Text style={styles.scoreDescription}>
              {t.c3myMatchRequests.scoreDescription}
            </Text>
          </View>
        </View>

        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>
            {selection.matchingScore.toFixed(0)}
          </Text>

          <Text style={styles.scoreTotal}>
            %
          </Text>
        </View>
      </View>

      {/* ================= DETAILS ================= */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>
          {t.c3myMatchRequests.matchDetails}
        </Text>

        <View style={styles.detailsGrid}>
          <DetailItem
            icon="leaf-outline"
            label={t.c3myMatchRequests.paddy}
            value={translatePaddyType(
              harvest?.paddyType,
              t,
              "-"
            )}
          />

          <DetailItem
            icon="cube-outline"
            label={t.c3myMatchRequests.quantity}
            value={
              harvest
                ? `${formatNumber(
                    harvest.quantity,
                    language
                  )} kg`
                : "-"
            }
          />

          <DetailItem
            icon="cash-outline"
            label={t.c3myMatchRequests.millerOffer}
            value={
              demand
                ? `Rs. ${demand.offeredPrice.toFixed(
                    2
                  )}`
                : "-"
            }
          />

          <DetailItem
            icon="location-outline"
            label={t.c3myMatchRequests.district}
            value={translateDistrict(
              miller?.district,
              t.c3districts,
              "-"
            )}
          />
        </View>
      </View>

      {/* ================= TIMELINE ================= */}
      <View style={styles.timelineRow}>
        <View style={styles.timelineIcon}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color="#64748B"
          />
        </View>

        <View>
          <Text style={styles.timelineLabel}>
            {t.c3myMatchRequests.requestActivity}
          </Text>

          <Text style={styles.timelineText}>
            {isIncoming
              ? t.c3myMatchRequests.received
              : t.c3myMatchRequests.sent}{" "}
            {formatDate(
              selection.createdAt,
              language
            )}
          </Text>
        </View>
      </View>

      {/* ================= ACCEPT / REJECT ================= */}
      {isPendingIncoming ? (
        <View style={styles.responseActions}>
          <Pressable
            disabled={processing}
            onPress={onReject}
            style={({ pressed }) => [
              styles.rejectButton,
              pressed && styles.pressed,
              processing && styles.disabled,
            ]}
          >
            <Ionicons
              name="close-circle-outline"
              size={18}
              color="#B91C1C"
            />

            <Text style={styles.rejectText}>
              {t.c3myMatchRequests.reject}
            </Text>
          </Pressable>

          <Pressable
            disabled={processing}
            onPress={onAccept}
            style={({ pressed }) => [
              styles.acceptButton,
              pressed && styles.pressed,
              processing && styles.disabled,
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

                <Text style={styles.acceptText}>
                  {t.c3myMatchRequests.acceptMatch}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}

      {/* ================= NEGOTIATION ================= */}
      {selection.status ===
      "negotiation_ready" ? (
        <Pressable
          onPress={() => {
            if (!harvest || !demand) {
              return;
            }

            router.push({
              pathname:
                "/(c03-marketplace)/negotiation-start",

              params: {
                selectionId:
                  selection._id,

                paddyType:
                  harvest.paddyType,

                quantity: String(
                  Math.min(
                    harvest.quantity,
                    demand.quantityNeeded
                  )
                ),

                farmerExpectedPrice:
                  String(
                    harvest.expectedPrice
                  ),

                millerOffer:
                  String(
                    demand.offeredPrice
                  ),

                flReferencePrice:
                  String(
                    harvest.aiPredictedPrice
                  ),

                matchingScore:
                  String(
                    selection.matchingScore
                  ),
              },
            });
          }}
          style={({ pressed }) => [
            styles.negotiationButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.negotiationIcon}>
            <Ionicons
              name="sparkles"
              size={16}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.negotiationTextContainer}>
            <Text
              style={
                styles.negotiationButtonText
              }
            >
              {t.c3myMatchRequests.startAiNegotiation}
            </Text>

            <Text
              style={styles.negotiationSubtext}
            >
              {t.c3myMatchRequests.negotiationSubtext}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={19}
            color="#FFFFFF"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

/* =========================================================
   SUMMARY METRIC
========================================================= */

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
      <View style={styles.summaryIcon}>
        <Ionicons
          name={icon}
          size={17}
          color="#15803D"
        />
      </View>

      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

/* =========================================================
   DETAIL ITEM
========================================================= */

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

/* =========================================================
   LOADING STATE
========================================================= */

function LoadingState({
  t,
}: {
  t: any;
}) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.loadingScreen}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator
            size="large"
            color="#15803D"
          />
        </View>

        <Text style={styles.stateTitle}>
          {t.c3myMatchRequests.loadingTitle}
        </Text>

        <Text style={styles.stateText}>
          {t.c3myMatchRequests.loadingText}
        </Text>
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  t,
}: {
  t: any;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="git-compare-outline"
          size={40}
          color="#15803D"
        />
      </View>

      <Text style={styles.stateTitle}>
        {t.c3myMatchRequests.emptyTitle}
      </Text>

      <Text style={styles.stateText}>
        {t.c3myMatchRequests.emptyText}
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
          {t.c3myMatchRequests.viewMyHarvests}
        </Text>

        <Ionicons
          name="arrow-forward"
          size={17}
          color="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

/* =========================================================
   ERROR STATE
========================================================= */

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
      <View style={styles.errorIcon}>
        <Ionicons
          name="warning-outline"
          size={38}
          color="#B91C1C"
        />
      </View>

      <Text style={styles.stateTitle}>
        {t.c3myMatchRequests.errorTitle}
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
          {t.c3myMatchRequests.tryAgain}
        </Text>
      </Pressable>
    </View>
  );
}

/* =========================================================
   HELPERS
========================================================= */

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
  status: MatchSelection["status"],
  t: any
) {
  switch (status) {
    case "pending":
      return {
        label: t.c3myMatchRequests.statusWaiting,
        color: "#92400E",
        background: "#FEF3C7",
      };

    case "negotiation_ready":
      return {
        label:
          t.c3myMatchRequests.statusNegotiationReady,
        color: "#166534",
        background: "#DCFCE7",
      };

    case "rejected":
      return {
        label: t.c3myMatchRequests.statusRejected,
        color: "#B91C1C",
        background: "#FEE2E2",
      };

    case "cancelled":
      return {
        label: t.c3myMatchRequests.statusCancelled,
        color: "#475569",
        background: "#E2E8F0",
      };

    default:
      return {
        label: t.c3myMatchRequests.statusUnknown,
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

function translatePaddyType(
  value: string | undefined,
  t: any,
  fallback: string
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

function formatNumber(
  value: number,
  language: string
): string {
  return new Intl.NumberFormat(
    language === "si" ? "si-LK" : "en-LK"
  ).format(value);
}

function formatDate(
  value: string,
  language: string
): string {
  const date = new Date(value);

  return new Intl.DateTimeFormat(
    language === "si" ? "si-LK" : "en-LK",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

/* =========================================================
   RESPOND TO MATCH
========================================================= */

async function respondToMatch(
  selectionId: string,
  decision: "accepted" | "rejected",
  setProcessingId: (
    value: string | null
  ) => void,
  setSelections: React.Dispatch<
    React.SetStateAction<MatchSelection[]>
  >,
  t: any
): Promise<void> {
  try {
    setProcessingId(selectionId);

    const response =
      await matchingService.respondToSelection(
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
        ? t.c3myMatchRequests.matchAccepted
        : t.c3myMatchRequests.matchRejected,
      response.message
    );
  } catch (error) {
    Alert.alert(
      t.c3myMatchRequests.updateErrorTitle,
      getApiErrorMessage(error)
    );
  } finally {
    setProcessingId(null);
  }
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7FAF8",
  },

  /* ================= HEADER ================= */

  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 17,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EEE9",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7F5",
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: "#17221A",
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
  },

  headerSubtitle: {
    color: "#7A867D",
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F7ED",
  },

  /* ================= CONTENT ================= */

  content: {
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 120,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  /* ================= OVERVIEW ================= */

  overviewCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#14532D",
    marginBottom: 13,
    shadowColor: "#14532D",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },

  overviewIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  overviewText: {
    flex: 1,
    marginLeft: 12,
  },

  overviewTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  overviewSubtitle: {
    color: "#D1FAE5",
    fontSize: 8.5,
    lineHeight: 14,
    fontFamily: "Poppins_400Regular",
    marginTop: 3,
  },

  /* ================= SUMMARY ================= */

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3EAE5",
    marginBottom: 23,
    shadowColor: "#64748B",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  summaryMetric: {
    flex: 1,
    alignItems: "center",
  },

  summaryIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
  },

  summaryValue: {
    color: "#14532D",
    fontSize: 17,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 5,
  },

  summaryLabel: {
    color: "#7A867D",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
  },

  summaryDivider: {
    width: 1,
    height: 49,
    backgroundColor: "#E5EDE7",
  },

  /* ================= SECTION ================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#17221A",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 8.5,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },

  refreshBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
  },

  refreshHint: {
    color: "#64748B",
    fontSize: 7.5,
    fontFamily: "Poppins_500Medium",
  },

  /* ================= REQUEST LIST ================= */

  requestList: {
    gap: 15,
  },

  requestCard: {
    padding: 17,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5EBE7",
    shadowColor: "#475569",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  directionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  incomingBadge: {
    backgroundColor: "#DCFCE7",
  },

  outgoingBadge: {
    backgroundColor: "#F1F5F9",
  },

  directionText: {
    fontSize: 7,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },

  /* ================= STATUS ================= */

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 7.5,
    fontFamily: "Poppins_700Bold",
  },

  /* ================= MILLER ================= */

  requestTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  millerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F7ED",
    borderWidth: 1,
    borderColor: "#CFF0D9",
  },

  requestTitleArea: {
    flex: 1,
    marginLeft: 11,
  },

  millerName: {
    color: "#17221A",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  millLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },

  millName: {
    color: "#7A867D",
    fontSize: 8.5,
    fontFamily: "Poppins_400Regular",
    flexShrink: 1,
  },

  /* ================= SCORE ================= */

  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderRadius: 18,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginTop: 16,
  },

  scoreLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  scoreIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginRight: 9,
  },

  scoreLabel: {
    color: "#14532D",
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
  },

  scoreDescription: {
    color: "#64748B",
    fontSize: 7.5,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },

  scoreCircle: {
    width: 59,
    height: 59,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingTop: 15,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },

  scoreValue: {
    color: "#15803D",
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
  },

  scoreTotal: {
    color: "#15803D",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },

  /* ================= DETAILS ================= */

  detailsContainer: {
    marginTop: 16,
  },

  detailsTitle: {
    color: "#334155",
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 9,
  },

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 12,
  },

  detailItem: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 5,
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
    marginLeft: 7,
  },

  detailLabel: {
    color: "#94A3B8",
    fontSize: 7,
    fontFamily: "Poppins_400Regular",
  },

  detailValue: {
    color: "#334155",
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 2,
  },

  /* ================= TIMELINE ================= */

  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 13,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  timelineIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  timelineLabel: {
    color: "#94A3B8",
    fontSize: 7,
    fontFamily: "Poppins_400Regular",
  },

  timelineText: {
    color: "#64748B",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
  },

  /* ================= RESPONSE ================= */

  responseActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  rejectButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  rejectText: {
    color: "#B91C1C",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },

  acceptButton: {
    flex: 1.25,
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#15803D",
    shadowColor: "#15803D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 3,
  },

  acceptText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
  },

  disabled: {
    opacity: 0.55,
  },

  /* ================= NEGOTIATION ================= */

  negotiationButton: {
    minHeight: 61,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    backgroundColor: "#15803D",
    marginTop: 15,
    shadowColor: "#15803D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },

  negotiationIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.17)",
  },

  negotiationTextContainer: {
    flex: 1,
    marginLeft: 9,
  },

  negotiationButtonText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
  },

  negotiationSubtext: {
    color: "#DCFCE7",
    fontSize: 7.5,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },

  /* ================= STATES ================= */

  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 70,
  },

  loadingIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    marginBottom: 18,
  },

  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 18,
  },

  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginBottom: 18,
  },

  stateTitle: {
    color: "#17221A",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    textAlign: "center",
  },

  stateText: {
    color: "#64748B",
    fontSize: 10,
    lineHeight: 17,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  /* ================= EMPTY ================= */

  emptyButton: {
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 21,
    backgroundColor: "#15803D",
    shadowColor: "#15803D",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
  },

  /* ================= ERROR ================= */

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
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
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