import { Ionicons } from "@/components/c03-marketplace/themed-native";
import {
  router,
  useFocusEffect,
} from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";

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

import { useLanguage } from "@/contexts/LanguageContext";

interface FarmerSummary {
  _id: string;
  farmerName: string;
  district: string;
  location: string;
}

type RequestTypeFilter = "received" | "sent";

/* ------------------------------------------------------------------ */
/*  Small animation helpers — purely presentational, no logic changes  */
/* ------------------------------------------------------------------ */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale(target = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}

function useEntrance(delay = 0) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };
}

export default function ReceivedMatchRequestsScreen() {
  const { t } = useLanguage();

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

  const [requestType, setRequestType] =
    useState<RequestTypeFilter>("received");

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

  const receivedCount = useMemo(
    () =>
      sortedSelections.filter(
        (selection) =>
          selection.initiatedBy === "farmer"
      ).length,
    [sortedSelections]
  );

  const sentCount =
    sortedSelections.length - receivedCount;

  const filteredSelections = useMemo(
    () =>
      sortedSelections.filter((selection) =>
        requestType === "received"
          ? selection.initiatedBy === "farmer"
          : selection.initiatedBy !== "farmer"
      ),
    [sortedSelections, requestType]
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
          ? t.c3receivedMatchRequests.matchAccepted
          : t.c3receivedMatchRequests.matchRejected,
        response.message
      );
    } catch (error) {
      Alert.alert(
        t.c3receivedMatchRequests.updateErrorTitle,
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
      <Header />

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
            tintColor="#B45309"
            colors={["#B45309"]}
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
            <SummaryStrip
              pendingCount={pendingCount}
              readyCount={readyCount}
              totalCount={sortedSelections.length}
            />

            <RequestTypeToggle
              value={requestType}
              onChange={setRequestType}
              receivedCount={receivedCount}
              sentCount={sentCount}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t.c3receivedMatchRequests.activityTitle}
              </Text>

              <View style={styles.refreshHintRow}>
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={12}
                  color="#B5AB92"
                />
                <Text style={styles.refreshHint}>
                  {t.c3receivedMatchRequests.pullToRefresh}
                </Text>
              </View>
            </View>

            {filteredSelections.length === 0 ? (
              <FilteredEmptyState type={requestType} />
            ) : (
              <View style={styles.requestList}>
                {filteredSelections.map(
                  (selection, index) => (
                    <MillerRequestCard
                      key={selection._id}
                      selection={selection}
                      index={index}
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
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

function Header() {
  const { t } = useLanguage();
  const { scale, onPressIn, onPressOut } =
    usePressScale(0.9);

  const iconEntrance = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    Animated.spring(iconEntrance, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: 10,
    }).start();
  }, [iconEntrance]);

  return (
    <View style={styles.header}>
      <AnimatedPressable
        onPress={() => router.back()}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.headerButton,
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons
          name="arrow-back"
          size={21}
          color="#3F2A14"
        />
      </AnimatedPressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>
          {t.c3receivedMatchRequests.title}
        </Text>

        <Text style={styles.headerSubtitle}>
          {t.c3receivedMatchRequests.subtitle}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.headerIcon,
          {
            transform: [
              { scale: iconEntrance },
              {
                rotate: iconEntrance.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-40deg", "0deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons
          name="leaf-outline"
          size={20}
          color="#92400E"
        />
      </Animated.View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Summary strip                                                      */
/* ------------------------------------------------------------------ */

function SummaryStrip({
  pendingCount,
  readyCount,
  totalCount,
}: {
  pendingCount: number;
  readyCount: number;
  totalCount: number;
}) {
  const { t } = useLanguage();
  const entrance = useEntrance(40);

  return (
    <Animated.View
      style={[styles.summaryCard, entrance]}
    >
      <SummaryMetric
        label={t.c3receivedMatchRequests.pending}
        value={pendingCount}
        icon="time-outline"
        tint="#B45309"
      />

      <View style={styles.summaryDivider} />

      <SummaryMetric
        label={t.c3receivedMatchRequests.ready}
        value={readyCount}
        icon="checkmark-circle-outline"
        tint="#166534"
      />

      <View style={styles.summaryDivider} />

      <SummaryMetric
        label={t.c3receivedMatchRequests.total}
        value={totalCount}
        icon="documents-outline"
        tint="#78350F"
      />
    </Animated.View>
  );
}

function SummaryMetric({
  label,
  value,
  icon,
  tint,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
}) {
  const [display, setDisplay] = useState(0);
  const counter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    counter.setValue(0);

    const listenerId = counter.addListener(
      ({ value: current }) => {
        setDisplay(Math.round(current));
      }
    );

    Animated.timing(counter, {
      toValue: value,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => counter.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <View style={styles.summaryMetric}>
      <View
        style={[
          styles.summaryIconChip,
          { backgroundColor: `${tint}14` },
        ]}
      >
        <Ionicons name={icon} size={17} color={tint} />
      </View>

      <Text style={[styles.summaryValue, { color: tint }]}>
        {display}
      </Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Received / Sent segmented filter                                   */
/*  One rounded rectangle, split into two clickable halves.            */
/* ------------------------------------------------------------------ */

function RequestTypeToggle({
  value,
  onChange,
  receivedCount,
  sentCount,
}: {
  value: RequestTypeFilter;
  onChange: (value: RequestTypeFilter) => void;
  receivedCount: number;
  sentCount: number;
}) {
  const { t } = useLanguage();
  const entrance = useEntrance(80);

  const receivedActive = value === "received";
  const sentActive = value === "sent";

  return (
    <Animated.View
      style={[styles.typeToggle, entrance]}
    >
      <Pressable
        onPress={() => onChange("received")}
        accessibilityRole="button"
        accessibilityLabel={t.c3receivedMatchRequests.showReceived}
        style={[
          styles.typeToggleHalf,
          receivedActive &&
            styles.typeToggleHalfActive,
        ]}
      >
        <Ionicons
          name="arrow-down-outline"
          size={14}
          color={
            receivedActive
              ? "#FFFFFF"
              : "#92400E"
          }
        />

        <Text
          style={[
            styles.typeToggleText,
            receivedActive &&
              styles.typeToggleTextActive,
          ]}
        >
          {t.c3receivedMatchRequests.received}
        </Text>

        <View
          style={[
            styles.typeToggleCount,
            receivedActive &&
              styles.typeToggleCountActive,
          ]}
        >
          <Text
            style={[
              styles.typeToggleCountText,
              receivedActive &&
                styles.typeToggleCountTextActive,
            ]}
          >
            {receivedCount}
          </Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onChange("sent")}
        accessibilityRole="button"
        accessibilityLabel={t.c3receivedMatchRequests.showSent}
        style={[
          styles.typeToggleHalf,
          sentActive &&
            styles.typeToggleHalfActive,
        ]}
      >
        <Ionicons
          name="arrow-up-outline"
          size={14}
          color={
            sentActive
              ? "#FFFFFF"
              : "#64748B"
          }
        />

        <Text
          style={[
            styles.typeToggleText,
            sentActive &&
              styles.typeToggleTextActive,
          ]}
        >
          {t.c3receivedMatchRequests.sent}
        </Text>

        <View
          style={[
            styles.typeToggleCount,
            sentActive &&
              styles.typeToggleCountActive,
          ]}
        >
          <Text
            style={[
              styles.typeToggleCountText,
              sentActive &&
                styles.typeToggleCountTextActive,
            ]}
          >
            {sentCount}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Request card — "trade slip" ticket styling                         */
/* ------------------------------------------------------------------ */

function MillerRequestCard({
  selection,
  index,
  processing,
  onAccept,
  onReject,
}: {
  selection: MatchSelection;
  index: number;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const { t } = useLanguage();
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
    getStatusDisplay(selection.status, t);

  const isIncoming =
    selection.initiatedBy === "farmer";

  const isPendingIncoming =
    isIncoming &&
    selection.status === "pending";

  const entrance = useEntrance(
    Math.min(index, 6) * 70
  );

  const reject = usePressScale(0.97);
  const accept = usePressScale(0.97);
  const negotiate = usePressScale(0.97);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isPendingIncoming) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [pulse, isPendingIncoming]);

  return (
    <Animated.View
      style={[styles.requestCard, entrance]}
    >
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
              ? "#92400E"
              : "#64748B"
          }
        />

        <Text
          style={[
            styles.directionText,
            {
              color: isIncoming
                ? "#92400E"
                : "#64748B",
            },
          ]}
        >
          {isIncoming
            ? t.c3receivedMatchRequests.farmerRequest
            : t.c3receivedMatchRequests.sentRequest}
        </Text>
      </View>

      <View style={styles.requestTopRow}>
        <View style={styles.farmerIcon}>
          <Ionicons name="person-outline" size={22} color="#92400E" />
        </View>

        <View style={styles.requestTitleArea}>
          <Text style={styles.farmerName}>
            {farmer?.farmerName ?? t.c3receivedMatchRequests.farmer}
          </Text>

          <Text style={styles.locationText}>
            {farmer
              ? `${farmer.location}, ${translateDistrict(
                  farmer.district,
                  t.c3districts,
                  farmer.district,
                )}`
              : t.c3receivedMatchRequests.locationUnavailable}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: status.background },
          ]}
        >
          {isPendingIncoming ? (
            <Animated.View
              style={[
                styles.statusDot,
                {
                  backgroundColor: status.color,
                  opacity: pulse,
                },
              ]}
            />
          ) : null}

          <Text
            style={[styles.statusText, { color: status.color }]}
          >
            {status.label}
          </Text>
        </View>
      </View>

      {/* die-cut ticket divider — the card's one signature detail */}
      <View style={styles.ticketDivider}>
        <View style={styles.ticketNotchLeft} />
        <View style={styles.ticketDashLine} />
        <View style={styles.ticketNotchRight} />
      </View>

      <MatchScoreBar score={selection.matchingScore} />

      <View style={styles.harvestPanel}>
        <View style={styles.harvestHeader}>
          <View style={styles.harvestIcon}>
            <Ionicons name="leaf" size={19} color="#15803D" />
          </View>

          <View>
            <Text style={styles.harvestEyebrow}>
              {t.c3receivedMatchRequests.farmerHarvest}
            </Text>

            <Text style={styles.harvestTitle}>
              {translatePaddyType(harvest?.paddyType ?? "", t)}
            </Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <DetailItem
            label={t.c3receivedMatchRequests.quantity}
            value={harvest ? `${formatNumber(harvest.quantity)} ${t.c3receivedMatchRequests.kg}` : "-"}
          />

          <DetailItem
            label={t.c3receivedMatchRequests.expected}
            value={harvest ? `Rs.${harvest.expectedPrice.toFixed(2)}` : "-"}
          />

          <DetailItem
            label={t.c3receivedMatchRequests.aiPrice}
            value={harvest ? `Rs.${harvest.aiPredictedPrice.toFixed(2)}` : "-"}
            emphasized
          />

          <DetailItem
            label={t.c3receivedMatchRequests.yourOffer}
            value={demand ? `Rs.${demand.offeredPrice.toFixed(2)}` : "-"}
            emphasized
          />
        </View>
      </View>

      <View style={styles.dateRow}>
        <Ionicons name="time-outline" size={15} color="#8A8371" />

        <Text style={styles.dateText}>
          {isIncoming ? t.c3receivedMatchRequests.received : t.c3receivedMatchRequests.sent}{" "}
          {formatDate(selection.createdAt)}
        </Text>
      </View>

      {isPendingIncoming ? (
        <View style={styles.actionRow}>
          <AnimatedPressable
            disabled={processing}
            onPress={onReject}
            onPressIn={reject.onPressIn}
            onPressOut={reject.onPressOut}
            style={[
              styles.rejectButton,
              { transform: [{ scale: reject.scale }] },
              processing && styles.disabled,
            ]}
          >
            <Ionicons name="close-circle-outline" size={18} color="#B91C1C" />
            <Text style={styles.rejectText}>
              {t.c3receivedMatchRequests.reject}
            </Text>
          </AnimatedPressable>

          <AnimatedPressable
            disabled={processing}
            onPress={onAccept}
            onPressIn={accept.onPressIn}
            onPressOut={accept.onPressOut}
            style={[
              styles.acceptButton,
              { transform: [{ scale: accept.scale }] },
              processing && styles.disabled,
            ]}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.acceptText}>
                  {t.c3receivedMatchRequests.accept}
                </Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      ) : null}

      {selection.status === "negotiation_ready" ? (
        <AnimatedPressable
          onPress={() => {
            if (!harvest || !demand) {
              return;
            }

            router.push({
              pathname: "/(c03-marketplace)/negotiation-start",

              params: {
                selectionId: selection._id,

                paddyType: harvest.paddyType,

                quantity: String(
                  Math.min(harvest.quantity, demand.quantityNeeded),
                ),

                farmerExpectedPrice: String(harvest.expectedPrice),

                millerOffer: String(demand.offeredPrice),

                flReferencePrice: String(harvest.aiPredictedPrice),

                matchingScore: String(selection.matchingScore),
              },
            });
          }}
          onPressIn={negotiate.onPressIn}
          onPressOut={negotiate.onPressOut}
          style={[
            styles.negotiationButton,
            { transform: [{ scale: negotiate.scale }] },
          ]}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text style={styles.negotiationButtonText}>
            {t.c3receivedMatchRequests.startAiNegotiation}
          </Text>
        </AnimatedPressable>
      ) : null}
    </Animated.View>
  );
}

function MatchScoreBar({ score }: { score: number }) {
  const { t } = useLanguage();
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listenerId = anim.addListener(({ value }) => {
      setDisplay(Math.round(value));
    });

    Animated.timing(anim, {
      toValue: score,
      duration: 700,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => anim.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.matchScoreCard}>
      <View style={styles.matchScoreTopRow}>
        <View>
          <Text style={styles.matchScoreLabel}>
            {t.c3receivedMatchRequests.aiMatchScore}
          </Text>
          <Text style={styles.matchScoreDescription}>
            {t.c3receivedMatchRequests.scoreDescription}
          </Text>
        </View>

        <Text style={styles.matchScoreValue}>{display}%</Text>
      </View>

      <View style={styles.matchScoreTrack}>
        <Animated.View
          style={[styles.matchScoreFill, { width }]}
        />
      </View>
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

/* ------------------------------------------------------------------ */
/*  Loading / empty / error states                                     */
/* ------------------------------------------------------------------ */

function LoadingState() {
  const { t } = useLanguage();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <SafeAreaView style={styles.screen}>
      <Header />

      <View style={styles.content}>
        <Animated.View style={[styles.skeletonSummary, { opacity }]} />

        {[0, 1, 2].map((row) => (
          <Animated.View
            key={row}
            style={[styles.skeletonCard, { opacity }]}
          >
            <View style={styles.skeletonAvatarRow}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonLines}>
                <View style={styles.skeletonLineWide} />
                <View style={styles.skeletonLineNarrow} />
              </View>
            </View>
            <View style={styles.skeletonBlock} />
          </Animated.View>
        ))}

        <View style={styles.loadingCaption}>
          <ActivityIndicator size="small" color="#B45309" />
          <Text style={styles.loadingCaptionText}>
            {t.c3receivedMatchRequests.loadingText}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function EmptyState() {
  const { t } = useLanguage();
  const entrance = useEntrance(0);

  return (
    <Animated.View style={[styles.centerState, entrance]}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="leaf-outline"
          size={39}
          color="#92400E"
        />
      </View>

      <Text style={styles.stateTitle}>
        {t.c3receivedMatchRequests.emptyTitle}
      </Text>

      <Text style={styles.stateText}>
        {t.c3receivedMatchRequests.emptyText}
      </Text>
    </Animated.View>
  );
}

function FilteredEmptyState({
  type,
}: {
  type: RequestTypeFilter;
}) {
  const { t } = useLanguage();
  const entrance = useEntrance(0);

  return (
    <Animated.View
      style={[styles.filteredEmpty, entrance]}
    >
      <View style={styles.filteredEmptyIcon}>
        <Ionicons
          name={
            type === "received"
              ? "arrow-down-outline"
              : "arrow-up-outline"
          }
          size={26}
          color="#92400E"
        />
      </View>

      <Text style={styles.filteredEmptyTitle}>
        {type === "received"
          ? t.c3receivedMatchRequests.noReceivedRequests
          : t.c3receivedMatchRequests.noSentRequests}
      </Text>

      <Text style={styles.filteredEmptyText}>
        {type === "received"
          ? t.c3receivedMatchRequests.noReceivedRequestsText
          : t.c3receivedMatchRequests.noSentRequestsText}
      </Text>
    </Animated.View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const { t } = useLanguage();
  const retry = usePressScale(0.96);
  const entrance = useEntrance(0);

  return (
    <Animated.View style={[styles.centerState, entrance]}>
      <View style={styles.errorIcon}>
        <Ionicons
          name="warning-outline"
          size={38}
          color="#B91C1C"
        />
      </View>

      <Text style={styles.stateTitle}>
        {t.c3receivedMatchRequests.errorTitle}
      </Text>

      <Text style={styles.stateText}>
        {message}
      </Text>

      <AnimatedPressable
        onPress={onRetry}
        onPressIn={retry.onPressIn}
        onPressOut={retry.onPressOut}
        style={[
          styles.retryButton,
          { transform: [{ scale: retry.scale }] },
        ]}
      >
        <Ionicons
          name="refresh"
          size={18}
          color="#FFFFFF"
        />

        <Text style={styles.retryText}>
          {t.c3receivedMatchRequests.tryAgain}
        </Text>
      </AnimatedPressable>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/*  Data helpers — unchanged logic                                     */
/* ------------------------------------------------------------------ */

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
  status: MatchSelection["status"],
  t: any,
) {
  switch (status) {
    case "pending":
      return {
        label: t.c3receivedMatchRequests.statusNewRequest,
        color: "#B45309",
        background: "#FEF3C7",
      };

    case "negotiation_ready":
      return {
        label: t.c3receivedMatchRequests.statusNegotiationReady,
        color: "#166534",
        background: "#DCFCE7",
      };

    case "rejected":
      return {
        label: t.c3receivedMatchRequests.statusRejected,
        color: "#B91C1C",
        background: "#FEE2E2",
      };

    case "cancelled":
      return {
        label: t.c3receivedMatchRequests.statusCancelled,
        color: "#475569",
        background: "#E2E8F0",
      };
  }
}

function translatePaddyType(value: string, t: any): string {
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

  return formatLabel(value || "-");
}

function translateDistrict(
  district: string | undefined,
  translations: {
    Ampara: string;
    Badulla: string;
    Kandy: string;
    Monaragala: string;
  },
  fallback: string,
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

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */

const CREAM = "#FAF6EC";
const BORDER = "#ECE3D0";

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
    color: "#231708",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },

  headerSubtitle: {
    color: "#8A8371",
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
    paddingBottom: 120,
  },

  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    padding: 15,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 16,
  },

  summaryMetric: {
    flex: 1,
    alignItems: "center",
  },

  summaryIconChip: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryValue: {
    fontSize: 19,
    fontWeight: "900",
    marginTop: 7,
  },

  summaryLabel: {
    color: "#8A8371",
    fontSize: 8.5,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  summaryDivider: {
    width: 1,
    height: 49,
    backgroundColor: "#FDE68A",
  },

  /* Received / Sent segmented toggle */

  typeToggle: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    backgroundColor: "#F5F1E8",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 23,
  },

  typeToggleHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    borderRadius: 12,
  },

  typeToggleHalfActive: {
    backgroundColor: "#92400E",
    shadowColor: "#92400E",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  typeToggleText: {
    color: "#5C4A2E",
    fontSize: 11,
    fontWeight: "800",
  },

  typeToggleTextActive: {
    color: "#FFFFFF",
  },

  typeToggleCount: {
    minWidth: 20,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(146,64,14,0.12)",
  },

  typeToggleCountActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },

  typeToggleCountText: {
    color: "#92400E",
    fontSize: 9,
    fontWeight: "800",
  },

  typeToggleCountTextActive: {
    color: "#FFFFFF",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: "#231708",
    fontSize: 15,
    fontWeight: "800",
  },

  refreshHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  refreshHint: {
    color: "#B5AB92",
    fontSize: 9,
  },

  requestList: {
    gap: 16,
  },

  requestCard: {
    borderRadius: 24,
    paddingTop: 17,
    paddingHorizontal: 17,
    paddingBottom: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#3F2A14",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    overflow: "visible",
  },

  directionBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 11,
  },

  incomingBadge: {
    backgroundColor: "#FEF3C7",
  },

  outgoingBadge: {
    backgroundColor: "#F1F5F9",
  },

  directionText: {
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.5,
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
    color: "#231708",
    fontSize: 14,
    fontWeight: "800",
  },

  locationText: {
    color: "#8A8371",
    fontSize: 9.5,
    marginTop: 2,
  },

  statusBadge: {
    maxWidth: 130,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
  },

  ticketDivider: {
    height: 1,
    marginTop: 16,
    marginHorizontal: -17,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },

  ticketNotchLeft: {
    position: "absolute",
    left: -9,
    top: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CREAM,
  },

  ticketNotchRight: {
    position: "absolute",
    right: -9,
    top: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CREAM,
  },

  ticketDashLine: {
    flex: 1,
    marginHorizontal: 20,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#E4D9BE",
  },

  matchScoreCard: {
    borderRadius: 16,
    padding: 13,
    backgroundColor: "#FFFBEB",
    marginTop: 16,
  },

  matchScoreTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  matchScoreLabel: {
    color: "#78350F",
    fontSize: 11,
    fontWeight: "800",
  },

  matchScoreDescription: {
    color: "#8A8371",
    fontSize: 8.5,
    marginTop: 3,
  },

  matchScoreValue: {
    color: "#B45309",
    fontSize: 22,
    fontWeight: "900",
  },

  matchScoreTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FDE68A",
    marginTop: 10,
    overflow: "hidden",
  },

  matchScoreFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#B45309",
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
    color: "#231708",
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
    color: "#9CA3AF",
    fontSize: 8,
  },

  detailValue: {
    color: "#334155",
    fontSize: 10.5,
    fontWeight: "800",
    marginTop: 3,
  },

  detailValueEmphasized: {
    color: "#B45309",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 13,
  },

  dateText: {
    color: "#8A8371",
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
    backgroundColor: "#B45309",
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
    color: "#231708",
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

  disabled: {
    opacity: 0.55,
  },

  /* Filtered (Received/Sent) empty state */

  filteredEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 46,
    paddingHorizontal: 26,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
  },

  filteredEmptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
  },

  filteredEmptyTitle: {
    color: "#231708",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 13,
  },

  filteredEmptyText: {
    color: "#8A8371",
    fontSize: 10,
    marginTop: 5,
    textAlign: "center",
    lineHeight: 15,
  },

  /* Skeleton loading state */

  skeletonSummary: {
    height: 79,
    borderRadius: 22,
    backgroundColor: "#F1E9D6",
    marginBottom: 23,
  },

  skeletonCard: {
    borderRadius: 24,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },

  skeletonAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  skeletonAvatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "#F1E9D6",
  },

  skeletonLines: {
    marginLeft: 11,
    flex: 1,
    gap: 8,
  },

  skeletonLineWide: {
    height: 12,
    width: "55%",
    borderRadius: 6,
    backgroundColor: "#F1E9D6",
  },

  skeletonLineNarrow: {
    height: 10,
    width: "35%",
    borderRadius: 5,
    backgroundColor: "#F1E9D6",
  },

  skeletonBlock: {
    height: 90,
    borderRadius: 16,
    backgroundColor: "#F6F1E4",
    marginTop: 16,
  },

  loadingCaption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },

  loadingCaptionText: {
    color: "#8A8371",
    fontSize: 11,
  },
});