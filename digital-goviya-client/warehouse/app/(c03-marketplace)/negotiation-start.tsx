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
  Alert,
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

const NEGOTIATION_STAGES = [
  {
    title: "Initializing secure AI agents",
    detail: "Creating protected Farmer and Miller agent sessions.",
    icon: "shield-checkmark-outline" as const,
  },
  {
    title: "Loading market intelligence",
    detail: "Reading the FL reference price and matching confidence.",
    icon: "analytics-outline" as const,
  },
  {
    title: "Farmer AI is planning",
    detail: "Evaluating the asking price and a safe concession strategy.",
    icon: "leaf-outline" as const,
  },
  {
    title: "Miller AI is evaluating",
    detail: "Comparing offers while protecting the private buying limit.",
    icon: "business-outline" as const,
  },
  {
    title: "Agents are exchanging offers",
    detail: "Checking counter-offers against negotiation guardrails.",
    icon: "swap-horizontal-outline" as const,
  },
  {
    title: "Measuring fairness",
    detail: "Comparing the emerging price with the FL market reference.",
    icon: "scale-outline" as const,
  },
  {
    title: "Finalizing the outcome",
    detail: "Validating the agreement and preparing the result.",
    icon: "sparkles-outline" as const,
  },
];

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

export default function NegotiationStartScreen() {
  const { user } = useMarketplaceAuth();

  const rawParams =
    useLocalSearchParams();

  const selectionId =
    readString(rawParams.selectionId);

  const paddyType =
    readString(rawParams.paddyType);

  const quantity =
    toNumber(rawParams.quantity);

  const farmerExpectedPrice =
    toNumber(
      rawParams.farmerExpectedPrice
    );

  const millerOffer =
    toNumber(rawParams.millerOffer);

  const flReferencePrice =
    toNumber(
      rawParams.flReferencePrice
    );

  const matchingScore =
    toNumber(rawParams.matchingScore);

  const [starting, setStarting] =
    useState(false);

  const [activeStage, setActiveStage] =
    useState(0);

  const [completed, setCompleted] =
    useState(false);

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
    if (!starting || completed) {
      return;
    }

    const timer = setInterval(() => {
      setActiveStage((current) =>
        Math.min(
          current + 1,
          NEGOTIATION_STAGES.length - 1
        )
      );
    }, 1700);

    return () => clearInterval(timer);
  }, [starting, completed]);

  const handleStart = async () => {
    if (!selectionId || starting) {
      return;
    }

    try {
      setStarting(true);
      setCompleted(false);
      setActiveStage(0);

      await negotiationService
        .checkHealth();

      const response =
        await negotiationService
          .startNegotiation({
            selectionId,
          });

      setActiveStage(
        NEGOTIATION_STAGES.length - 1
      );
      setCompleted(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 1200)
      );

      router.replace({
        pathname:
          "/(c03-marketplace)/negotiation-result",

        params: {
          negotiationId:
            response.data.negotiationId,
        },
      });
    } catch (error) {
      console.error(
        "Negotiation start failed:",
        error
      );

      setStarting(false);
      setCompleted(false);

      Alert.alert(
        "Unable to start negotiation",
        getApiErrorMessage(error)
      );
    }
  };

  const headerPress = usePressScale(0.9);

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
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => router.back()}
          onPressIn={headerPress.onPressIn}
          onPressOut={headerPress.onPressOut}
          style={[
            styles.headerButton,
            { transform: [{ scale: headerPress.scale }] },
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#1F2937"
          />
        </AnimatedPressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            AI Negotiation
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Autonomous Farmer and Miller agents
          </Text>
        </View>

        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor:
                theme.soft,
            },
          ]}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={theme.primary}
          />
        </View>
      </View>

      {starting ? (
        <NegotiationLiveView
          activeStage={activeStage}
          completed={completed}
          theme={theme}
          paddyType={paddyType}
          quantity={quantity}
          flReferencePrice={flReferencePrice}
          matchingScore={matchingScore}
        />
      ) : (
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <IdleHero theme={theme} />

        <Text style={styles.sectionTitle}>
          Negotiation summary
        </Text>

        <View style={styles.summaryCard}>
          <SummaryRow
            index={0}
            icon="leaf-outline"
            label="Paddy variety"
            value={formatLabel(
              paddyType || "-"
            )}
            accent={theme.primary}
            soft={theme.soft}
          />

          <SummaryRow
            index={1}
            icon="cube-outline"
            label="Negotiation quantity"
            value={`${formatNumber(
              quantity
            )} kg`}
            accent={theme.primary}
            soft={theme.soft}
          />

          <SummaryRow
            index={2}
            icon="person-outline"
            label="Farmer asking price"
            value={formatPrice(
              farmerExpectedPrice
            )}
            accent={theme.primary}
            soft={theme.soft}
          />

          <SummaryRow
            index={3}
            icon="business-outline"
            label="Miller opening offer"
            value={formatPrice(
              millerOffer
            )}
            accent={theme.primary}
            soft={theme.soft}
          />

          <SummaryRow
            index={4}
            icon="analytics-outline"
            label="FL market reference"
            value={formatPrice(
              flReferencePrice
            )}
            accent={theme.primary}
            soft={theme.soft}
          />

          <SummaryRow
            index={5}
            icon="git-compare-outline"
            label="Matching score"
            value={`${matchingScore.toFixed(
              0
            )}%`}
            accent={theme.primary}
            soft={theme.soft}
            last
          />
        </View>

        <PrivacyCard theme={theme} />

        <View style={styles.processCard}>
          <Text style={styles.processTitle}>
            What happens next?
          </Text>

          <ProcessStep
            index={0}
            number="1"
            title="Agents review the market"
            description="The FL reference price and match score guide the negotiation."
            accent={theme.primary}
            soft={theme.soft}
          />

          <ProcessStep
            index={1}
            number="2"
            title="Agents exchange offers"
            description="Each agent accepts, counters or rejects according to its private constraints."
            accent={theme.primary}
            soft={theme.soft}
          />

          <ProcessStep
            index={2}
            number="3"
            title="Fairness is evaluated"
            description="The result is compared with the FL market reference."
            accent={theme.primary}
            soft={theme.soft}
            last
          />
        </View>

        <StartButton
          disabled={starting || !selectionId}
          starting={starting}
          theme={theme}
          onPress={() => void handleStart()}
        />

        <Text style={styles.waitingNote}>
          Negotiation may take a few moments
          while the local AI agents generate
          and validate their decisions.
        </Text>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Idle (pre-start) view pieces                                       */
/* ------------------------------------------------------------------ */

function IdleHero({ theme }: { theme: LiveTheme }) {
  const entrance = useEntrance(0);

  const breathe = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breatheLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.07,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    breatheLoop.start();
    spinLoop.start();

    return () => {
      breatheLoop.stop();
      spinLoop.stop();
    };
  }, [breathe, spin]);

  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.heroCard,
        { backgroundColor: theme.dark },
        entrance,
      ]}
    >
      <View style={styles.agentRow}>
        <Animated.View
          style={{ transform: [{ scale: breathe }] }}
        >
          <AgentAvatar
            icon="leaf"
            label="Farmer Agent"
            background="#DCFCE7"
            color="#15803D"
          />
        </Animated.View>

        <View style={styles.connectionArea}>
          <Animated.View
            style={{ transform: [{ rotate: spinDeg }] }}
          >
            <Ionicons
              name="sync"
              size={24}
              color="#FDE68A"
            />
          </Animated.View>

          <Text style={styles.connectionText}>
            AI TO AI
          </Text>
        </View>

        <Animated.View
          style={{ transform: [{ scale: breathe }] }}
        >
          <AgentAvatar
            icon="business"
            label="Miller Agent"
            background="#FEF3C7"
            color="#92400E"
          />
        </Animated.View>
      </View>

      <Text style={styles.heroTitle}>
        Ready to negotiate fairly
      </Text>

      <Text style={styles.heroDescription}>
        Both autonomous agents will exchange offers
        while protecting each participant’s private
        price limit.
      </Text>
    </Animated.View>
  );
}

function PrivacyCard({ theme }: { theme: LiveTheme }) {
  const entrance = useEntrance(260);

  return (
    <Animated.View
      style={[
        styles.privacyCard,
        {
          backgroundColor: theme.soft,
          borderColor: theme.border,
        },
        entrance,
      ]}
    >
      <View
        style={[
          styles.privacyIcon,
          { backgroundColor: "#FFFFFF" },
        ]}
      >
        <Ionicons
          name="shield-checkmark-outline"
          size={23}
          color={theme.primary}
        />
      </View>

      <View style={styles.privacyText}>
        <Text
          style={[
            styles.privacyTitle,
            { color: theme.dark },
          ]}
        >
          Private constraints protected
        </Text>

        <Text style={styles.privacyDescription}>
          Minimum and maximum reservation prices are
          securely used by the agents but are never
          displayed or disclosed to the other participant.
        </Text>
      </View>
    </Animated.View>
  );
}

function StartButton({
  disabled,
  starting,
  theme,
  onPress,
}: {
  disabled: boolean;
  starting: boolean;
  theme: LiveTheme;
  onPress: () => void;
}) {
  const press = usePressScale(0.97);
  const entrance = useEntrance(420);

  const glow = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1.015,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [disabled, glow]);

  return (
    <Animated.View style={entrance}>
      <AnimatedPressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[
          styles.startButton,
          { backgroundColor: theme.primary },
          {
            transform: [
              { scale: press.scale },
              { scale: disabled ? 1 : glow },
            ],
          },
          disabled && styles.disabled,
        ]}
      >
        {starting ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.startButtonText}>
              AI agents are negotiating...
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="sparkles" size={19} color="#FFFFFF" />
            <Text style={styles.startButtonText}>
              Start AI Negotiation
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

interface LiveTheme {
  primary: string;
  dark: string;
  soft: string;
  border: string;
  background: string;
}

function NegotiationLiveView({
  activeStage,
  completed,
  theme,
  paddyType,
  quantity,
  flReferencePrice,
  matchingScore,
}: {
  activeStage: number;
  completed: boolean;
  theme: LiveTheme;
  paddyType: string;
  quantity: number;
  flReferencePrice: number;
  matchingScore: number;
}) {
  const pulse = useRef(
    new Animated.Value(1)
  ).current;

  const rotate = useRef(
    new Animated.Value(0)
  ).current;

  const thoughtFade = useRef(
    new Animated.Value(1)
  ).current;

  const thoughtScale = useRef(
    new Animated.Value(0.97)
  ).current;

  const dotAnims = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3),
  ]).current;

  const progressAnim = useRef(
    new Animated.Value(0)
  ).current;

  const [progressDisplay, setProgressDisplay] =
    useState(0);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateAnimation = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const dotLoop = Animated.loop(
      Animated.stagger(
        180,
        dotAnims.map((dot) =>
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 380,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 380,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      )
    );

    pulseAnimation.start();
    rotateAnimation.start();
    dotLoop.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      dotLoop.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse, rotate]);

  useEffect(() => {
    thoughtFade.setValue(0);
    thoughtScale.setValue(0.97);

    Animated.parallel([
      Animated.timing(thoughtFade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(thoughtScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }),
    ]).start();
  }, [activeStage, thoughtFade, thoughtScale]);

  const progress = completed
    ? 100
    : Math.max(
        12,
        Math.round(
          ((activeStage + 1) /
            (NEGOTIATION_STAGES.length + 1)) *
            100
        )
      );

  useEffect(() => {
    const listenerId = progressAnim.addListener(
      ({ value }) => {
        setProgressDisplay(Math.round(value));
      }
    );

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => progressAnim.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const stage =
    NEGOTIATION_STAGES[activeStage];

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <ScrollView
      contentContainerStyle={styles.liveContent}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.liveHero,
          { backgroundColor: theme.dark },
        ]}
      >
        <View style={styles.liveAgentsRow}>
          <Animated.View
            style={[
              styles.liveAgentOrb,
              styles.farmerAgentOrb,
              { transform: [{ scale: pulse }] },
            ]}
          >
            <Ionicons
              name="leaf"
              size={27}
              color="#15803D"
            />
          </Animated.View>

          <View style={styles.liveConnection}>
            <Animated.View
              style={{ transform: [{ rotate: spin }] }}
            >
              <Ionicons
                name="sync"
                size={28}
                color="#FDE68A"
              />
            </Animated.View>

            <View style={styles.signalDots}>
              {dotAnims.map((dot, dotIndex) => (
                <Animated.View
                  key={dotIndex}
                  style={[
                    styles.signalDot,
                    { opacity: dot },
                  ]}
                />
              ))}
            </View>
          </View>

          <Animated.View
            style={[
              styles.liveAgentOrb,
              styles.millerAgentOrb,
              { transform: [{ scale: pulse }] },
            ]}
          >
            <Ionicons
              name="business"
              size={27}
              color="#92400E"
            />
          </Animated.View>
        </View>

        <Text style={styles.liveEyebrow}>
          {completed
            ? "NEGOTIATION COMPLETE"
            : "LIVE AI NEGOTIATION"}
        </Text>

        <Text style={styles.liveHeroTitle}>
          {completed
            ? "Outcome prepared"
            : "Two agents are working for a fair deal"}
        </Text>

        <Text style={styles.liveHeroDescription}>
          {completed
            ? "The result has been validated and is ready to review."
            : "Private limits remain protected while both agents evaluate offers and market fairness."}
        </Text>
      </View>

      <View style={styles.liveProgressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressLabel}>
              Negotiation progress
            </Text>
            <Text style={styles.progressSubLabel}>
              Secure multi-agent processing
            </Text>
          </View>

          <Text
            style={[
              styles.progressPercent,
              { color: theme.primary },
            ]}
          >
            {progressDisplay}%
          </Text>
        </View>

        <View style={styles.liveProgressTrack}>
          <Animated.View
            style={[
              styles.liveProgressFill,
              {
                width: progressWidth,
                backgroundColor: theme.primary,
              },
            ]}
          />
        </View>

        <Animated.View
          style={[
            styles.currentThoughtCard,
            {
              opacity: thoughtFade,
              borderColor: theme.border,
              backgroundColor: theme.soft,
              transform: [{ scale: thoughtScale }],
            },
          ]}
        >
          <View style={styles.currentThoughtIcon}>
            <Ionicons
              name={
                completed
                  ? "checkmark-circle"
                  : stage.icon
              }
              size={23}
              color={theme.primary}
            />
          </View>

          <View style={styles.currentThoughtText}>
            <Text
              style={[
                styles.currentThoughtTitle,
                { color: theme.dark },
              ]}
            >
              {completed
                ? "Agreement analysis completed"
                : stage.title}
            </Text>

            <Text style={styles.currentThoughtDescription}>
              {completed
                ? "Opening the detailed agent conversation and fairness report."
                : stage.detail}
            </Text>
          </View>

          {!completed ? (
            <ActivityIndicator
              size="small"
              color={theme.primary}
            />
          ) : null}
        </Animated.View>
      </View>

      <View style={styles.liveSnapshotCard}>
        <View style={styles.snapshotHeader}>
          <Text style={styles.snapshotTitle}>
            Market context loaded
          </Text>
          <View
            style={[
              styles.secureBadge,
              { backgroundColor: theme.soft },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={12}
              color={theme.primary}
            />
            <Text
              style={[
                styles.secureBadgeText,
                { color: theme.primary },
              ]}
            >
              PRIVATE
            </Text>
          </View>
        </View>

        <View style={styles.snapshotGrid}>
          <LiveMetric
            index={0}
            icon="leaf-outline"
            label="Paddy"
            value={formatLabel(paddyType || "-")}
            accent={theme.primary}
            soft={theme.soft}
          />
          <LiveMetric
            index={1}
            icon="cube-outline"
            label="Quantity"
            value={`${formatNumber(quantity)} kg`}
            accent={theme.primary}
            soft={theme.soft}
          />
          <LiveMetric
            index={2}
            icon="analytics-outline"
            label="FL reference"
            value={formatPrice(flReferencePrice)}
            accent={theme.primary}
            soft={theme.soft}
          />
          <LiveMetric
            index={3}
            icon="git-compare-outline"
            label="Match score"
            value={`${matchingScore.toFixed(0)}%`}
            accent={theme.primary}
            soft={theme.soft}
          />
        </View>
      </View>

      <View style={styles.liveTimelineCard}>
        <Text style={styles.liveTimelineTitle}>
          AI analysis timeline
        </Text>

        {NEGOTIATION_STAGES.map((item, index) => (
          <TimelineRow
            key={item.title}
            item={item}
            index={index}
            isLast={index === NEGOTIATION_STAGES.length - 1}
            finished={completed || index < activeStage}
            active={!completed && index === activeStage}
            theme={theme}
          />
        ))}
      </View>

      <LiveNotice theme={theme} />
    </ScrollView>
  );
}

function TimelineRow({
  item,
  index,
  isLast,
  finished,
  active,
  theme,
}: {
  item: (typeof NEGOTIATION_STAGES)[number];
  index: number;
  isLast: boolean;
  finished: boolean;
  active: boolean;
  theme: LiveTheme;
}) {
  const entrance = useEntrance(index * 60);

  const nodeScale = useRef(new Animated.Value(1)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const wasFinished = useRef(finished);

  useEffect(() => {
    if (finished && !wasFinished.current) {
      Animated.sequence([
        Animated.spring(nodeScale, {
          toValue: 1.35,
          useNativeDriver: true,
          speed: 30,
          bounciness: 12,
        }),
        Animated.spring(nodeScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 6,
        }),
      ]).start();
    }

    wasFinished.current = finished;
  }, [finished, nodeScale]);

  useEffect(() => {
    if (!active) {
      ring.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(ring, {
        toValue: 1,
        duration: 1300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );

    loop.start();

    return () => loop.stop();
  }, [active, ring]);

  const ringScale = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.9],
  });

  const ringOpacity = ring.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  return (
    <Animated.View
      style={[styles.liveTimelineRow, entrance]}
    >
      <View style={styles.liveTimelineRail}>
        <View style={styles.liveTimelineNodeWrap}>
          {active ? (
            <Animated.View
              style={[
                styles.liveTimelineRing,
                {
                  borderColor: theme.primary,
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
          ) : null}

          <Animated.View
            style={[
              styles.liveTimelineNode,
              (finished || active) && {
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              },
              { transform: [{ scale: nodeScale }] },
            ]}
          >
            {finished ? (
              <Ionicons
                name="checkmark"
                size={12}
                color="#FFFFFF"
              />
            ) : active ? (
              <View style={styles.activeNodeDot} />
            ) : null}
          </Animated.View>
        </View>

        {!isLast ? (
          <View
            style={[
              styles.liveTimelineLine,
              finished && {
                backgroundColor: theme.primary,
              },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.liveTimelineText}>
        <Text
          style={[
            styles.liveTimelineItemTitle,
            active && { color: theme.primary },
            !finished && !active &&
              styles.pendingTimelineText,
          ]}
        >
          {item.title}
        </Text>
        <Text style={styles.liveTimelineItemDetail}>
          {finished
            ? "Completed securely"
            : active
              ? item.detail
              : "Waiting for the previous analysis"}
        </Text>
      </View>
    </Animated.View>
  );
}

function LiveNotice({ theme }: { theme: LiveTheme }) {
  const entrance = useEntrance(120);

  return (
    <Animated.View
      style={[
        styles.liveNotice,
        {
          borderColor: theme.border,
          backgroundColor: theme.soft,
        },
        entrance,
      ]}
    >
      <Ionicons
        name="shield-checkmark-outline"
        size={21}
        color={theme.primary}
      />
      <Text style={styles.liveNoticeText}>
        Stay on this screen while the local AI agents finish.
        Your private reservation prices are never shown to the
        other participant.
      </Text>
    </Animated.View>
  );
}

function LiveMetric({
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
  const entrance = useEntrance(index * 70);

  return (
    <Animated.View style={[styles.liveMetric, entrance]}>
      <View
        style={[
          styles.liveMetricIcon,
          { backgroundColor: soft },
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
          color={accent}
        />
      </View>
      <Text style={styles.liveMetricLabel}>{label}</Text>
      <Text
        style={styles.liveMetricValue}
        numberOfLines={1}
      >
        {value}
      </Text>
    </Animated.View>
  );
}

function AgentAvatar({
  icon,
  label,
  background,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  background: string;
  color: string;
}) {
  return (
    <View style={styles.agent}>
      <View
        style={[
          styles.agentIcon,
          {
            backgroundColor:
              background,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={25}
          color={color}
        />
      </View>

      <Text style={styles.agentLabel}>
        {label}
      </Text>
    </View>
  );
}

function SummaryRow({
  index,
  icon,
  label,
  value,
  accent,
  soft,
  last = false,
}: {
  index: number;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent: string;
  soft: string;
  last?: boolean;
}) {
  const entrance = useEntrance(index * 60);

  return (
    <Animated.View
      style={[
        styles.summaryRow,
        last && styles.summaryRowLast,
        entrance,
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor: soft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={accent}
        />
      </View>

      <View style={styles.summaryText}>
        <Text style={styles.summaryLabel}>
          {label}
        </Text>

        <Text style={styles.summaryValue}>
          {value}
        </Text>
      </View>
    </Animated.View>
  );
}

function ProcessStep({
  index,
  number,
  title,
  description,
  accent,
  soft,
  last = false,
}: {
  index: number;
  number: string;
  title: string;
  description: string;
  accent: string;
  soft: string;
  last?: boolean;
}) {
  const entrance = useEntrance(300 + index * 90);

  return (
    <Animated.View style={[styles.processRow, entrance]}>
      <View style={styles.processLineArea}>
        <View
          style={[
            styles.processNumber,
            {
              backgroundColor: soft,
            },
          ]}
        >
          <Text
            style={[
              styles.processNumberText,
              {
                color: accent,
              },
            ]}
          >
            {number}
          </Text>
        </View>

        {!last ? (
          <View
            style={styles.processLine}
          />
        ) : null}
      </View>

      <View style={styles.processText}>
        <Text style={styles.processStepTitle}>
          {title}
        </Text>

        <Text
          style={
            styles.processDescription
          }
        >
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

function readString(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function toNumber(
  value: string | string[] | undefined
): number {
  const parsed = Number(
    readString(value)
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatPrice(
  value: number
): string {
  return `Rs.${value.toFixed(2)}/kg`;
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-LK"
  ).format(value);
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
    fontSize: 9.5,
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
    paddingBottom: 120,
  },

  heroCard: {
    borderRadius: 25,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },

  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  agent: {
    flex: 1,
    alignItems: "center",
  },

  agentIcon: {
    width: 57,
    height: 57,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  agentLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 7,
  },

  connectionArea: {
    alignItems: "center",
    paddingHorizontal: 8,
  },

  connectionText: {
    color: "#FDE68A",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 3,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 19,
  },

  heroDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10.5,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },

  summaryCard: {
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  summaryRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  summaryRowLast: {
    borderBottomWidth: 0,
  },

  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryText: {
    flex: 1,
  },

  summaryLabel: {
    color: "#94A3B8",
    fontSize: 8.5,
  },

  summaryValue: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  privacyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    borderRadius: 19,
    padding: 14,
    borderWidth: 1,
    marginTop: 18,
  },

  privacyIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  privacyText: {
    flex: 1,
  },

  privacyTitle: {
    fontSize: 11,
    fontWeight: "800",
  },

  privacyDescription: {
    color: "#64748B",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 3,
  },

  processCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 18,
  },

  processTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 14,
  },

  processRow: {
    flexDirection: "row",
    minHeight: 71,
  },

  processLineArea: {
    width: 35,
    alignItems: "center",
  },

  processNumber: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  processNumberText: {
    fontSize: 10,
    fontWeight: "900",
  },

  processLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },

  processText: {
    flex: 1,
    paddingLeft: 8,
    paddingBottom: 15,
  },

  processStepTitle: {
    color: "#334155",
    fontSize: 10.5,
    fontWeight: "800",
  },

  processDescription: {
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },

  startButton: {
    minHeight: 54,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 16,
    marginTop: 21,
  },

  startButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  waitingNote: {
    color: "#94A3B8",
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 18,
  },

  liveContent: {
    padding: 17,
    paddingBottom: 40,
    gap: 16,
  },

  liveHero: {
    borderRadius: 26,
    padding: 22,
    alignItems: "center",
    overflow: "hidden",
  },

  liveAgentsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  liveAgentOrb: {
    width: 68,
    height: 68,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.55)",
  },

  farmerAgentOrb: {
    backgroundColor: "#DCFCE7",
  },

  millerAgentOrb: {
    backgroundColor: "#FEF3C7",
  },

  liveConnection: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
  },

  signalDots: {
    flexDirection: "row",
    gap: 5,
    marginTop: 8,
  },

  signalDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FDE68A",
  },

  liveEyebrow: {
    color: "#FDE68A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 18,
  },

  liveHeroTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 7,
  },

  liveHeroDescription: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
    paddingHorizontal: 6,
  },

  liveProgressCard: {
    borderRadius: 21,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressLabel: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "900",
  },

  progressSubLabel: {
    color: "#94A3B8",
    fontSize: 8.5,
    marginTop: 2,
  },

  progressPercent: {
    fontSize: 19,
    fontWeight: "900",
  },

  liveProgressTrack: {
    height: 9,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginTop: 14,
  },

  liveProgressFill: {
    height: "100%",
    borderRadius: 999,
  },

  currentThoughtCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    marginTop: 15,
  },

  currentThoughtIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  currentThoughtText: {
    flex: 1,
  },

  currentThoughtTitle: {
    fontSize: 10.5,
    fontWeight: "900",
  },

  currentThoughtDescription: {
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },

  liveSnapshotCard: {
    borderRadius: 21,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  snapshotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  snapshotTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "900",
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  secureBadgeText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  snapshotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  liveMetric: {
    width: "48%",
    minHeight: 94,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#F8FAFC",
  },

  liveMetricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  liveMetricLabel: {
    color: "#94A3B8",
    fontSize: 8,
    marginTop: 8,
  },

  liveMetricValue: {
    color: "#1F2937",
    fontSize: 10.5,
    fontWeight: "900",
    marginTop: 3,
  },

  liveTimelineCard: {
    borderRadius: 21,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  liveTimelineTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 15,
  },

  liveTimelineRow: {
    flexDirection: "row",
    minHeight: 64,
  },

  liveTimelineRail: {
    width: 28,
    alignItems: "center",
  },

  liveTimelineNodeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  liveTimelineRing: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },

  liveTimelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },

  activeNodeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  liveTimelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },

  liveTimelineText: {
    flex: 1,
    paddingLeft: 9,
    paddingBottom: 14,
  },

  liveTimelineItemTitle: {
    color: "#334155",
    fontSize: 10.5,
    fontWeight: "800",
  },

  pendingTimelineText: {
    color: "#94A3B8",
  },

  liveTimelineItemDetail: {
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },

  liveNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 17,
    padding: 13,
    borderWidth: 1,
  },

  liveNoticeText: {
    flex: 1,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
  },

  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.52,
  },
});