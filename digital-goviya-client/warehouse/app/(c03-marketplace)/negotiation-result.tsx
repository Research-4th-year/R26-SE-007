import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useLocalSearchParams,
} from "expo-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  negotiationService,
} from "@/services/c03-marketplace/negotiation.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  Negotiation,
  NegotiationHistoryItem,
} from "@/types/c03-marketplace/negotiation.types";

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

export default function NegotiationResultScreen() {
  const { user } = useMarketplaceAuth();

  const params =
    useLocalSearchParams();

  const negotiationId =
    readString(
      params.negotiationId
    );

  const [negotiation, setNegotiation] =
    useState<Negotiation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const fade = useRef(
    new Animated.Value(0)
  ).current;

  const rise = useRef(
    new Animated.Value(18)
  ).current;

  const isMiller =
    user?.role === "miller";

  const theme = useMemo(
    () =>
      isMiller
        ? {
            primary: "#92400E",
            dark: "#78350F",
            soft: "#FEF3C7",
            border: "#FDE68A",
            background: "#FBF8F1",
          }
        : {
            primary: "#15803D",
            dark: "#14532D",
            soft: "#DCFCE7",
            border: "#BBF7D0",
            background: "#F8FAF8",
          },
    [isMiller]
  );

  useEffect(() => {
    const load = async () => {
      if (!negotiationId) {
        setErrorMessage(
          "Negotiation ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        const response =
          await negotiationService
            .getNegotiation(
              negotiationId
            );

        setNegotiation(
          response.data
        );

        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),

          Animated.timing(rise, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]).start();
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [
    negotiationId,
    fade,
    rise,
  ]);

  if (loading) {
    return <LoadingState theme={theme} />;
  }

  if (
    errorMessage ||
    !negotiation
  ) {
    return (
      <ErrorState
        theme={theme}
        message={errorMessage}
      />
    );
  }

  const agreed =
    negotiation.status === "agreed";

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor:
            theme.background,
        },
      ]}
    >
      <Header theme={theme} negotiation={negotiation} />

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Animated.View
          style={{
            opacity: fade,
            transform: [
              {
                translateY: rise,
              },
            ],
          }}
        >
          <ResultHero
            agreed={agreed}
            negotiation={negotiation}
            theme={theme}
          />

          <View style={styles.metricsGrid}>
            <MetricCard
              index={0}
              icon="repeat-outline"
              label="Rounds"
              value={String(
                negotiation.roundsCompleted
              )}
              accent={theme.primary}
              soft={theme.soft}
            />

            <MetricCard
              index={1}
              icon="analytics-outline"
              label="FL reference"
              value={`Rs.${negotiation.flReferencePrice.toFixed(
                2
              )}`}
              accent={theme.primary}
              soft={theme.soft}
            />

            <MetricCard
              index={2}
              icon="shield-checkmark-outline"
              label="Fairness"
              value={
                negotiation.fairnessScore !==
                null
                  ? `${negotiation.fairnessScore.toFixed(
                      1
                    )}%`
                  : "N/A"
              }
              accent={theme.primary}
              soft={theme.soft}
            />
          </View>

          {agreed &&
          negotiation.priceDifferenceFromReference !==
            null ? (
            <FairnessCard
              theme={theme}
              value={Math.abs(
                negotiation
                  .priceDifferenceFromReference
              )}
            />
          ) : null}

          <Text
            style={styles.sectionTitle}
          >
            Agent conversation
          </Text>

          <View style={styles.timeline}>
            {negotiation.history.map(
              (item, index) => (
                <HistoryCard
                  key={`${item.round_number}-${item.agent}-${index}`}
                  item={item}
                  index={index}
                  accent={
                    item.agent === "farmer"
                      ? "#15803D"
                      : "#92400E"
                  }
                  soft={
                    item.agent === "farmer"
                      ? "#DCFCE7"
                      : "#FEF3C7"
                  }
                />
              )
            )}
          </View>

          <DoneButton theme={theme} role={user?.role} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Header / states                                                    */
/* ------------------------------------------------------------------ */

interface ResultTheme {
  primary: string;
  dark: string;
  soft: string;
  border: string;
  background: string;
}

function Header({
  theme,
  negotiation,
}: {
  theme: ResultTheme;
  negotiation: Negotiation;
}) {
  const { user } = useMarketplaceAuth();
  const press = usePressScale(0.9);

  return (
    <View style={styles.header}>
      <AnimatedPressable
        onPress={() =>
          router.replace(
            user?.role === "miller"
              ? "/(c03-marketplace)/(miller)/home"
              : "/(c03-marketplace)/(farmer)/home"
          )
        }
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[
          styles.headerButton,
          { transform: [{ scale: press.scale }] },
        ]}
      >
        <Ionicons
          name="close"
          size={21}
          color="#1F2937"
        />
      </AnimatedPressable>

      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>
          Negotiation Result
        </Text>

        <Text style={styles.headerSubtitle}>
          {negotiation.negotiationId}
        </Text>
      </View>

      <View
        style={[
          styles.headerIcon,
          { backgroundColor: theme.soft },
        ]}
      >
        <Ionicons
          name="sparkles"
          size={20}
          color={theme.primary}
        />
      </View>
    </View>
  );
}

function LoadingState({ theme }: { theme: ResultTheme }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [pulse]);

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: theme.background },
      ]}
    >
      <View style={styles.centerState}>
        <Animated.View
          style={[
            styles.loadingRing,
            {
              backgroundColor: theme.soft,
              transform: [{ scale: pulse }],
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme.primary}
          />
        </Animated.View>

        <Text style={styles.stateTitle}>
          Loading negotiation result
        </Text>
      </View>
    </SafeAreaView>
  );
}

function ErrorState({
  theme,
  message,
}: {
  theme: ResultTheme;
  message: string | null;
}) {
  const entrance = useEntrance(0);
  const press = usePressScale(0.96);

  return (
    <SafeAreaView
      style={[
        styles.screen,
        { backgroundColor: theme.background },
      ]}
    >
      <Animated.View
        style={[styles.centerState, entrance]}
      >
        <Ionicons
          name="warning-outline"
          size={45}
          color="#B91C1C"
        />

        <Text style={styles.stateTitle}>
          Result unavailable
        </Text>

        <Text style={styles.stateText}>
          {message}
        </Text>

        <AnimatedPressable
          onPress={() => router.back()}
          onPressIn={press.onPressIn}
          onPressOut={press.onPressOut}
          style={[
            styles.simpleButton,
            { backgroundColor: theme.primary },
            { transform: [{ scale: press.scale }] },
          ]}
        >
          <Text style={styles.simpleButtonText}>
            Go Back
          </Text>
        </AnimatedPressable>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Result pieces                                                      */
/* ------------------------------------------------------------------ */

function ResultHero({
  agreed,
  negotiation,
  theme,
}: {
  agreed: boolean;
  negotiation: Negotiation;
  theme: ResultTheme;
}) {
  const iconScale = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(iconScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: agreed ? 16 : 8,
    }).start();

    if (agreed) {
      Animated.loop(
        Animated.timing(ring, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        { iterations: 3 }
      ).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.6],
  });

  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View
      style={[
        styles.resultHero,
        { backgroundColor: agreed ? theme.dark : "#7F1D1D" },
      ]}
    >
      <View style={styles.resultIcon}>
        {agreed ? (
          <Animated.View
            style={[
              styles.resultRing,
              {
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
        ) : null}

        <Animated.View
          style={{ transform: [{ scale: iconScale }] }}
        >
          <Ionicons
            name={agreed ? "checkmark-circle" : "close-circle"}
            size={47}
            color={agreed ? "#4ADE80" : "#FCA5A5"}
          />
        </Animated.View>
      </View>

      <Text style={styles.resultEyebrow}>
        {agreed ? "AGREEMENT REACHED" : "NO AGREEMENT"}
      </Text>

      <Text style={styles.resultPrice}>
        {agreed && negotiation.agreedPrice !== null
          ? `Rs.${negotiation.agreedPrice.toFixed(2)}/kg`
          : "Negotiation closed"}
      </Text>

      <Text style={styles.resultDescription}>
        {negotiation.finalReason}
      </Text>
    </View>
  );
}

function MetricCard({
  index,
  icon,
  label,
  value,
  accent,
  soft,
}: {
  index: number;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
  soft: string;
}) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        delay: 120 + index * 90,
        speed: 16,
        bounciness: 9,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay: 120 + index * 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.metricCard,
        { opacity, transform: [{ scale }] },
      ]}
    >
      <View
        style={[
          styles.metricIcon,
          { backgroundColor: soft },
        ]}
      >
        <Ionicons name={icon} size={18} color={accent} />
      </View>

      <Text style={styles.metricValue}>{value}</Text>

      <Text style={styles.metricLabel}>{label}</Text>
    </Animated.View>
  );
}

function FairnessCard({
  theme,
  value,
}: {
  theme: ResultTheme;
  value: number;
}) {
  const entrance = useEntrance(360);

  return (
    <Animated.View
      style={[
        styles.fairnessCard,
        {
          backgroundColor: theme.soft,
          borderColor: theme.border,
        },
        entrance,
      ]}
    >
      <Ionicons
        name="scale-outline"
        size={24}
        color={theme.primary}
      />

      <View style={styles.fairnessText}>
        <Text
          style={[
            styles.fairnessTitle,
            { color: theme.dark },
          ]}
        >
          Market alignment
        </Text>

        <Text style={styles.fairnessDescription}>
          The final price differs from the FL market
          reference by Rs.{value.toFixed(2)}.
        </Text>
      </View>
    </Animated.View>
  );
}

function HistoryCard({
  item,
  index,
  accent,
  soft,
}: {
  item: NegotiationHistoryItem;
  index: number;
  accent: string;
  soft: string;
}) {
  const fromLeft = item.agent === "farmer";

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay: 420 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [fromLeft ? -22 : 22, 0],
  });

  return (
    <Animated.View
      style={[
        styles.historyCard,
        {
          opacity: progress,
          transform: [{ translateX }],
        },
      ]}
    >
      <View
        style={[
          styles.historyIcon,
          { backgroundColor: soft },
        ]}
      >
        <Ionicons
          name={
            item.agent === "farmer"
              ? "leaf-outline"
              : "business-outline"
          }
          size={18}
          color={accent}
        />
      </View>

      <View style={styles.historyBody}>
        <View style={styles.historyTopRow}>
          <Text
            style={[
              styles.historyAgent,
              { color: accent },
            ]}
          >
            {item.agent === "farmer"
              ? "Farmer Agent"
              : "Miller Agent"}
          </Text>

          <Text style={styles.historyRound}>
            Round {item.round_number}
          </Text>
        </View>

        <View style={styles.historyDecision}>
          <View
            style={[
              styles.actionBadge,
              { backgroundColor: soft },
            ]}
          >
            <Text
              style={[
                styles.actionText,
                { color: accent },
              ]}
            >
              {formatLabel(item.action)}
            </Text>
          </View>

          {item.price !== null ? (
            <Text style={styles.historyPrice}>
              Rs.{item.price.toFixed(2)}
            </Text>
          ) : null}
        </View>

        <Text style={styles.historyReason}>
          {item.reason}
        </Text>
      </View>
    </Animated.View>
  );
}

function DoneButton({
  theme,
  role,
}: {
  theme: ResultTheme;
  role: string | undefined;
}) {
  const press = usePressScale(0.97);

  return (
    <AnimatedPressable
      onPress={() =>
        router.replace(
          role === "miller"
            ? "/(c03-marketplace)/(miller)/home"
            : "/(c03-marketplace)/(farmer)/home"
        )
      }
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        styles.doneButton,
        { backgroundColor: theme.primary },
        { transform: [{ scale: press.scale }] },
      ]}
    >
      <Ionicons name="home-outline" size={19} color="#FFFFFF" />

      <Text style={styles.doneButtonText}>
        Return to Dashboard
      </Text>
    </AnimatedPressable>
  );
}

function readString(
  value: string | string[] | undefined
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
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
    fontSize: 8.5,
    marginTop: 2,
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    padding: 17,
    paddingBottom: 42,
  },

  resultHero: {
    alignItems: "center",
    borderRadius: 25,
    padding: 23,
  },

  resultIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.12)",
  },

  resultRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#4ADE80",
  },

  resultEyebrow: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 13,
  },

  resultPrice: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 6,
  },

  resultDescription: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
  },

  metricsGrid: {
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
  },

  metricCard: {
    flex: 1,
    minHeight: 105,
    borderRadius: 18,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8,
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 8,
    marginTop: 3,
  },

  fairnessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginTop: 16,
  },

  fairnessText: {
    flex: 1,
  },

  fairnessTitle: {
    fontSize: 11,
    fontWeight: "800",
  },

  fairnessDescription: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 12,
  },

  timeline: {
    gap: 12,
  },

  historyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  historyIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  historyBody: {
    flex: 1,
  },

  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  historyAgent: {
    fontSize: 10.5,
    fontWeight: "900",
  },

  historyRound: {
    color: "#94A3B8",
    fontSize: 8,
  },

  historyDecision: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 7,
  },

  actionBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  actionText: {
    fontSize: 7.5,
    fontWeight: "900",
  },

  historyPrice: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "900",
  },

  historyReason: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 7,
  },

  doneButton: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
  },

  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "900",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingRing: {
    width: 96,
    height: 96,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  stateTitle: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 15,
    textAlign: "center",
  },

  stateText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },

  simpleButton: {
    minHeight: 47,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    marginTop: 18,
  },

  simpleButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});