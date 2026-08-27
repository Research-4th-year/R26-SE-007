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
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  negotiationService,
} from "@/services/c03-marketplace/negotiation.service";

import {
  contactRequestService,
} from "@/services/c03-marketplace/contact-request.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  Negotiation,
  NegotiationHistoryItem,
} from "@/types/c03-marketplace/negotiation.types";

import type {
  ContactRequestState,
} from "@/types/c03-marketplace/contact-request.types";

/* ------------------------------------------------------------------ */
/* Animation helpers                                                   */
/* ------------------------------------------------------------------ */

const AnimatedPressable =
  Animated.createAnimatedComponent(Pressable);

function usePressScale(target = 0.96) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

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

  return {
    scale,
    onPressIn,
    onPressOut,
  };
}

function useEntrance(delay = 0) {
  const progress = useRef(
    new Animated.Value(0)
  ).current;

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
        translateY:
          progress.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 0],
          }),
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Main screen                                                         */
/* ------------------------------------------------------------------ */

export default function NegotiationResultScreen() {
  const { user } =
    useMarketplaceAuth();

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

  const [
    contactState,
    setContactState,
  ] = useState<ContactRequestState | null>(
    null
  );

  const [
    contactLoading,
    setContactLoading,
  ] = useState(false);

  const [
    contactProcessing,
    setContactProcessing,
  ] = useState(false);

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
            primary: "#A16207",
            dark: "#713F12",
            soft: "#FEF3C7",
            border: "#FDE68A",
            background: "#FAF9F6",
          }
        : {
            primary: "#15803D",
            dark: "#14532D",
            soft: "#DCFCE7",
            border: "#BBF7D0",
            background: "#F7FAF8",
          },
    [isMiller]
  );

  /* ---------------------------------------------------------------- */
  /* Load negotiation                                                 */
  /* ---------------------------------------------------------------- */

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
          await negotiationService.getNegotiation(
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

  /* ---------------------------------------------------------------- */
  /* Contact state                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (
      !negotiation ||
      negotiation.status !== "agreed"
    ) {
      setContactState(null);
      return;
    }

    const loadContactState =
      async () => {
        try {
          setContactLoading(true);

          const response =
            await contactRequestService.getForNegotiation(
              negotiation._id
            );

          setContactState(
            response.data
          );
        } catch (error) {
          console.error(
            "Load contact state failed:",
            error
          );
        } finally {
          setContactLoading(false);
        }
      };

    void loadContactState();
  }, [negotiation]);

  /* ---------------------------------------------------------------- */
  /* Create contact request                                           */
  /* ---------------------------------------------------------------- */

  const handleCreateContactRequest =
    async () => {
      if (
        !negotiation ||
        contactProcessing
      ) {
        return;
      }

      try {
        setContactProcessing(true);

        await contactRequestService.create({
          negotiationId:
            negotiation._id,
        });

        const refreshed =
          await contactRequestService.getForNegotiation(
            negotiation._id
          );

        setContactState(
          refreshed.data
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error)
        );
      } finally {
        setContactProcessing(false);
      }
    };

  /* ---------------------------------------------------------------- */
  /* Respond to contact request                                      */
  /* ---------------------------------------------------------------- */

  const handleContactResponse =
    async (
      decision:
        | "accepted"
        | "rejected"
    ) => {
      if (
        !contactState?.request ||
        contactProcessing
      ) {
        return;
      }

      try {
        setContactProcessing(true);

        const response =
          await contactRequestService.respond(
            contactState.request._id,
            decision
          );

        setContactState({
          ...contactState,
          request:
            response.data.request,
          contactUnlocked:
            response.data.contactUnlocked,
          canRespond: false,
          canRequest: false,
          contact:
            response.data.contact ??
            null,
          exists: true,
        });
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error)
        );
      } finally {
        setContactProcessing(false);
      }
    };

  /* ---------------------------------------------------------------- */
  /* Loading                                                          */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <LoadingState theme={theme} />
    );
  }

  /* ---------------------------------------------------------------- */
  /* Error                                                            */
  /* ---------------------------------------------------------------- */

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
      <Header
        theme={theme}
        negotiation={negotiation}
      />

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
          {/* -------------------------------------------------------- */}
          {/* Result                                                    */}
          {/* -------------------------------------------------------- */}

          <ResultHero
            agreed={agreed}
            negotiation={negotiation}
            theme={theme}
          />

          {/* -------------------------------------------------------- */}
          {/* Quick summary                                             */}
          {/* -------------------------------------------------------- */}

          <SectionHeader
            icon="stats-chart-outline"
            title="Negotiation Summary"
            subtitle="Key results from the AI negotiation"
            theme={theme}
          />

          <View
            style={styles.metricsGrid}
          >
            <MetricCard
              index={0}
              icon="repeat-outline"
              label="ROUNDS"
              value={String(
                negotiation.roundsCompleted
              )}
              accent={theme.primary}
              soft={theme.soft}
            />

            <MetricCard
              index={1}
              icon="analytics-outline"
              label="FL REFERENCE"
              value={`Rs.${negotiation.flReferencePrice.toFixed(
                2
              )}`}
              accent={theme.primary}
              soft={theme.soft}
            />

            <MetricCard
              index={2}
              icon="shield-checkmark-outline"
              label="FAIRNESS"
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

          {/* -------------------------------------------------------- */}
          {/* Fairness                                                   */}
          {/* -------------------------------------------------------- */}

          {agreed &&
          negotiation.priceDifferenceFromReference !==
            null ? (
            <FairnessCard
              theme={theme}
              value={Math.abs(
                negotiation.priceDifferenceFromReference
              )}
            />
          ) : null}

          {/* -------------------------------------------------------- */}
          {/* Contact                                                    */}
          {/* -------------------------------------------------------- */}

          {agreed ? (
            <>
              <SectionHeader
                icon="lock-open-outline"
                title="Secure Contact"
                subtitle="Connect after agreement"
                theme={theme}
              />

              <ContactAccessCard
                theme={theme}
                role={user?.role}
                state={contactState}
                loading={contactLoading}
                processing={
                  contactProcessing
                }
                onRequest={() =>
                  void handleCreateContactRequest()
                }
                onAccept={() =>
                  void handleContactResponse(
                    "accepted"
                  )
                }
                onReject={() =>
                  void handleContactResponse(
                    "rejected"
                  )
                }
              />
            </>
          ) : null}

          {/* -------------------------------------------------------- */}
          {/* Conversation                                               */}
          {/* -------------------------------------------------------- */}

          <SectionHeader
            icon="chatbubbles-outline"
            title="Agent Conversation"
            subtitle="How the farmer and miller agents negotiated"
            theme={theme}
          />

          <View
            style={styles.timeline}
          >
            {negotiation.history.map(
              (item, index) => (
                <HistoryCard
                  key={`${item.round_number}-${item.agent}-${index}`}
                  item={item}
                  index={index}
                  accent={
                    item.agent === "farmer"
                      ? "#15803D"
                      : "#A16207"
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

          {/* -------------------------------------------------------- */}
          {/* Bottom action                                              */}
          {/* -------------------------------------------------------- */}

          <DoneButton
            theme={theme}
            role={user?.role}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Theme                                                              */
/* ------------------------------------------------------------------ */

interface ResultTheme {
  primary: string;
  dark: string;
  soft: string;
  border: string;
  background: string;
}

/* ------------------------------------------------------------------ */
/* Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon,
  title,
  subtitle,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  theme: ResultTheme;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          {
            backgroundColor:
              theme.soft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={theme.primary}
        />
      </View>

      <View
        style={styles.sectionHeaderText}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: theme.dark,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={styles.sectionSubtitle}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                             */
/* ------------------------------------------------------------------ */

function Header({
  theme,
  negotiation,
}: {
  theme: ResultTheme;
  negotiation: Negotiation;
}) {
  const { user } =
    useMarketplaceAuth();

  const press =
    usePressScale(0.9);

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
        onPressIn={
          press.onPressIn
        }
        onPressOut={
          press.onPressOut
        }
        style={[
          styles.headerButton,
          {
            transform: [
              {
                scale: press.scale,
              },
            ],
          },
        ]}
      >
        <Ionicons
          name="chevron-back"
          size={21}
          color="#1F2937"
        />
      </AnimatedPressable>

      <View
        style={styles.headerText}
      >
        <Text
          style={styles.headerTitle}
        >
          Negotiation Result
        </Text>

        <Text
          style={styles.headerSubtitle}
          numberOfLines={1}
        >
          {negotiation.negotiationId}
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
  );
}

/* ------------------------------------------------------------------ */
/* Loading                                                            */
/* ------------------------------------------------------------------ */

function LoadingState({
  theme,
}: {
  theme: ResultTheme;
}) {
  const pulse =
    useRef(
      new Animated.Value(1)
    ).current;

  useEffect(() => {
    const loop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            pulse,
            {
              toValue: 1.12,
              duration: 800,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
          Animated.timing(
            pulse,
            {
              toValue: 1,
              duration: 800,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
        ])
      );

    loop.start();

    return () => loop.stop();
  }, [pulse]);

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
      <View
        style={styles.centerState}
      >
        <Animated.View
          style={[
            styles.loadingRing,
            {
              backgroundColor:
                theme.soft,
              transform: [
                {
                  scale: pulse,
                },
              ],
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme.primary}
          />
        </Animated.View>

        <Text
          style={styles.stateTitle}
        >
          Loading negotiation result
        </Text>

        <Text
          style={styles.stateText}
        >
          Preparing your negotiation summary...
        </Text>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Error                                                              */
/* ------------------------------------------------------------------ */

function ErrorState({
  theme,
  message,
}: {
  theme: ResultTheme;
  message: string | null;
}) {
  const entrance =
    useEntrance(0);

  const press =
    usePressScale(0.96);

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
      <Animated.View
        style={[
          styles.centerState,
          entrance,
        ]}
      >
        <View
          style={styles.errorIcon}
        >
          <Ionicons
            name="warning-outline"
            size={42}
            color="#B91C1C"
          />
        </View>

        <Text
          style={styles.stateTitle}
        >
          Result unavailable
        </Text>

        <Text
          style={styles.stateText}
        >
          {message}
        </Text>

        <AnimatedPressable
          onPress={() =>
            router.back()
          }
          onPressIn={
            press.onPressIn
          }
          onPressOut={
            press.onPressOut
          }
          style={[
            styles.simpleButton,
            {
              backgroundColor:
                theme.primary,
            },
            {
              transform: [
                {
                  scale:
                    press.scale,
                },
              ],
            },
          ]}
        >
          <Text
            style={
              styles.simpleButtonText
            }
          >
            Go Back
          </Text>
        </AnimatedPressable>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Result hero                                                        */
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
  const iconScale =
    useRef(
      new Animated.Value(0)
    ).current;

  const ring =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    Animated.spring(
      iconScale,
      {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: agreed
          ? 16
          : 8,
      }
    ).start();

    if (agreed) {
      Animated.loop(
        Animated.timing(
          ring,
          {
            toValue: 1,
            duration: 1400,
            easing:
              Easing.out(
                Easing.ease
              ),
            useNativeDriver: true,
          }
        ),
        {
          iterations: 3,
        }
      ).start();
    }
  }, []);

  const ringScale =
    ring.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.6],
    });

  const ringOpacity =
    ring.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0],
    });

  return (
    <View
      style={[
        styles.resultHero,
        {
          backgroundColor:
            agreed
              ? theme.dark
              : "#7F1D1D",
        },
      ]}
    >
      <View
        style={styles.resultIcon}
      >
        {agreed ? (
          <Animated.View
            style={[
              styles.resultRing,
              {
                opacity:
                  ringOpacity,
                transform: [
                  {
                    scale:
                      ringScale,
                  },
                ],
              },
            ]}
          />
        ) : null}

        <Animated.View
          style={{
            transform: [
              {
                scale:
                  iconScale,
              },
            ],
          }}
        >
          <Ionicons
            name={
              agreed
                ? "checkmark-circle"
                : "close-circle"
            }
            size={54}
            color={
              agreed
                ? "#4ADE80"
                : "#FCA5A5"
            }
          />
        </Animated.View>
      </View>

      <View
        style={[
          styles.statusPill,
          {
            backgroundColor:
              agreed
                ? "rgba(74,222,128,0.14)"
                : "rgba(252,165,165,0.14)",
          },
        ]}
      >
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                agreed
                  ? "#4ADE80"
                  : "#FCA5A5",
            },
          ]}
        />

        <Text
          style={[
            styles.resultEyebrow,
            {
              color: agreed
                ? "#BBF7D0"
                : "#FECACA",
            },
          ]}
        >
          {agreed
            ? "AGREEMENT REACHED"
            : "NO AGREEMENT"}
        </Text>
      </View>

      <Text
        style={styles.resultPrice}
      >
        {agreed &&
        negotiation.agreedPrice !==
          null
          ? `Rs.${negotiation.agreedPrice.toFixed(
              2
            )}/kg`
          : "Negotiation closed"}
      </Text>

      <Text
        style={styles.resultDescription}
      >
        {negotiation.finalReason}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Metric card                                                        */
/* ------------------------------------------------------------------ */

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
  const scale =
    useRef(
      new Animated.Value(0.85)
    ).current;

  const opacity =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        delay:
          120 + index * 90,
        speed: 16,
        bounciness: 9,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay:
          120 + index * 90,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    index,
    scale,
    opacity,
  ]);

  return (
    <Animated.View
      style={[
        styles.metricCard,
        {
          opacity,
          transform: [
            {
              scale,
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.metricIcon,
          {
            backgroundColor:
              soft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={accent}
        />
      </View>

      <Text
        style={styles.metricValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text
        style={styles.metricLabel}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Fairness card                                                      */
/* ------------------------------------------------------------------ */

function FairnessCard({
  theme,
  value,
}: {
  theme: ResultTheme;
  value: number;
}) {
  const entrance =
    useEntrance(360);

  return (
    <Animated.View
      style={[
        styles.fairnessCard,
        {
          backgroundColor:
            theme.soft,
          borderColor:
            theme.border,
        },
        entrance,
      ]}
    >
      <View
        style={[
          styles.fairnessIcon,
          {
            backgroundColor:
              "rgba(255,255,255,0.65)",
          },
        ]}
      >
        <Ionicons
          name="scale-outline"
          size={23}
          color={theme.primary}
        />
      </View>

      <View
        style={styles.fairnessText}
      >
        <Text
          style={[
            styles.fairnessTitle,
            {
              color: theme.dark,
            },
          ]}
        >
          Market alignment
        </Text>

        <Text
          style={
            styles.fairnessDescription
          }
        >
          The final price differs from the
          FL market reference by{" "}
          <Text
            style={
              styles.inlineStrong
            }
          >
            Rs.{value.toFixed(2)}
          </Text>
          .
        </Text>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* History card                                                       */
/* ------------------------------------------------------------------ */

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
  const fromLeft =
    item.agent === "farmer";

  const progress =
    useRef(
      new Animated.Value(0)
    ).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      delay:
        420 + index * 90,
      easing:
        Easing.out(
          Easing.cubic
        ),
      useNativeDriver: true,
    }).start();
  }, [
    progress,
    index,
  ]);

  const translateX =
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [
        fromLeft ? -22 : 22,
        0,
      ],
    });

  return (
    <Animated.View
      style={[
        styles.historyCard,
        {
          opacity: progress,
          transform: [
            {
              translateX,
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.historyConnector,
          {
            backgroundColor:
              soft,
          },
        ]}
      >
        <View
          style={[
            styles.historyIcon,
            {
              backgroundColor:
                soft,
            },
          ]}
        >
          <Ionicons
            name={
              item.agent ===
              "farmer"
                ? "leaf-outline"
                : "business-outline"
            }
            size={18}
            color={accent}
          />
        </View>
      </View>

      <View
        style={styles.historyBody}
      >
        <View
          style={
            styles.historyTopRow
          }
        >
          <View>
            <Text
              style={[
                styles.historyAgent,
                {
                  color:
                    accent,
                },
              ]}
            >
              {item.agent ===
              "farmer"
                ? "Farmer Agent"
                : "Miller Agent"}
            </Text>

            <Text
              style={
                styles.historyRole
              }
            >
              AI Negotiation Agent
            </Text>
          </View>

          <View
            style={
              styles.roundPill
            }
          >
            <Text
              style={
                styles.historyRound
              }
            >
              ROUND{" "}
              {item.round_number}
            </Text>
          </View>
        </View>

        <View
          style={
            styles.historyDecision
          }
        >
          <View
            style={[
              styles.actionBadge,
              {
                backgroundColor:
                  soft,
              },
            ]}
          >
            <Text
              style={[
                styles.actionText,
                {
                  color:
                    accent,
                },
              ]}
            >
              {formatLabel(
                item.action
              )}
            </Text>
          </View>

          {item.price !==
          null ? (
            <Text
              style={
                styles.historyPrice
              }
            >
              Rs.
              {item.price.toFixed(
                2
              )}
            </Text>
          ) : null}
        </View>

        <Text
          style={
            styles.historyReason
          }
        >
          {item.reason}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* Contact access                                                     */
/* ------------------------------------------------------------------ */

function ContactAccessCard({
  theme,
  role,
  state,
  loading,
  processing,
  onRequest,
  onAccept,
  onReject,
}: {
  theme: ResultTheme;
  role: string | undefined;
  state: ContactRequestState | null;
  loading: boolean;
  processing: boolean;
  onRequest: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const entrance =
    useEntrance(390);

  const otherParty =
    role === "miller"
      ? state?.contact?.farmer
      : state?.contact?.miller;

  const otherPartyLabel =
    role === "miller"
      ? "Farmer"
      : "Miller";

  const requesterIsMe =
    state?.request?.requestedBy ===
    role;

  const openPhone = async () => {
    if (!otherParty?.phone) {
      return;
    }

    await Linking.openURL(
      `tel:${otherParty.phone}`
    );
  };

  const openWhatsApp =
    async () => {
      if (!otherParty?.phone) {
        return;
      }

      const normalized =
        normalizeSriLankanPhone(
          otherParty.phone
        );

      const message =
        "Hello, I am contacting you regarding our agreed paddy marketplace negotiation.";

      await Linking.openURL(
        `https://wa.me/${normalized}?text=${encodeURIComponent(
          message
        )}`
      );
    };

  /* -------------------------------------------------------------- */
  /* Loading                                                         */
  /* -------------------------------------------------------------- */

  if (loading) {
    return (
      <Animated.View
        style={[
          styles.contactCard,
          {
            borderColor:
              theme.border,
          },
          entrance,
        ]}
      >
        <View
          style={[
            styles.contactIcon,
            {
              backgroundColor:
                theme.soft,
            },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={
              theme.primary
            }
          />
        </View>

        <View
          style={styles.contactBody}
        >
          <Text
            style={[
              styles.contactTitle,
              {
                color:
                  theme.dark,
              },
            ]}
          >
            Checking contact access
          </Text>

          <Text
            style={
              styles.contactDescription
            }
          >
            Secure contact permissions are being verified.
          </Text>
        </View>
      </Animated.View>
    );
  }

  if (!state) {
    return null;
  }

  /* -------------------------------------------------------------- */
  /* Contact unlocked                                                */
  /* -------------------------------------------------------------- */

  if (
    state.contactUnlocked &&
    otherParty
  ) {
    return (
      <Animated.View
        style={[
          styles.contactCard,
          styles.contactUnlockedCard,
          {
            borderColor:
              theme.border,
          },
          entrance,
        ]}
      >
        <View
          style={
            styles.contactTopRow
          }
        >
          <View
            style={[
              styles.contactIcon,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <Ionicons
              name="lock-open-outline"
              size={23}
              color={
                theme.primary
              }
            />
          </View>

          <View
            style={
              styles.contactBody
            }
          >
            <View
              style={
                styles.unlockedBadge
              }
            >
              <Ionicons
                name="checkmark-circle"
                size={13}
                color={
                  theme.primary
                }
              />

              <Text
                style={[
                  styles.contactEyebrow,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                CONTACT UNLOCKED
              </Text>
            </View>

            <Text
              style={[
                styles.contactTitle,
                {
                  color:
                    theme.dark,
                },
              ]}
            >
              {otherPartyLabel} contact is available
            </Text>

            <Text
              style={
                styles.contactDescription
              }
            >
              Both participants approved contact exchange after the successful AI negotiation.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.contactIdentity
          }
        >
          <View
            style={[
              styles.contactAvatar,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <Ionicons
              name={
                role === "miller"
                  ? "leaf-outline"
                  : "business-outline"
              }
              size={21}
              color={
                theme.primary
              }
            />
          </View>

          <View
            style={
              styles.contactIdentityText
            }
          >
            <Text
              style={
                styles.contactName
              }
            >
              {role ===
              "miller"
                ? otherParty.farmerName ||
                  otherParty.name
                : otherParty.millName ||
                  otherParty.name}
            </Text>

            <Text
              style={
                styles.contactLocation
              }
            >
              {otherParty.location},{" "}
              {otherParty.district}
            </Text>
          </View>

          <View
            style={
              styles.verifiedBadge
            }
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={
                theme.primary
              }
            />
          </View>
        </View>

        <View
          style={
            styles.contactActions
          }
        >
          <Pressable
            onPress={() =>
              void openPhone()
            }
            style={({
              pressed,
            }) => [
              styles.contactActionButton,
              {
                backgroundColor:
                  theme.primary,
              },
              pressed &&
                styles.contactActionPressed,
            ]}
          >
            <Ionicons
              name="call-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.contactActionText
              }
            >
              Call
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              void openWhatsApp()
            }
            style={({
              pressed,
            }) => [
              styles.contactActionButton,
              styles.whatsAppButton,
              pressed &&
                styles.contactActionPressed,
            ]}
          >
            <Ionicons
              name="logo-whatsapp"
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.contactActionText
              }
            >
              WhatsApp
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  /* -------------------------------------------------------------- */
  /* Rejected                                                        */
  /* -------------------------------------------------------------- */

  if (
    state.exists &&
    state.request?.status ===
      "rejected"
  ) {
    return (
      <Animated.View
        style={[
          styles.contactCard,
          styles.contactRejectedCard,
          entrance,
        ]}
      >
        <View
          style={
            styles.contactTopRow
          }
        >
          <View
            style={
              styles.contactRejectedIcon
            }
          >
            <Ionicons
              name="close-circle-outline"
              size={23}
              color="#B91C1C"
            />
          </View>

          <View
            style={
              styles.contactBody
            }
          >
            <Text
              style={
                styles.contactRejectedTitle
              }
            >
              Contact request declined
            </Text>

            <Text
              style={
                styles.contactDescription
              }
            >
              Contact details remain private because the other participant did not approve the request.
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  /* -------------------------------------------------------------- */
  /* Incoming request                                                */
  /* -------------------------------------------------------------- */

  if (
    state.exists &&
    state.request?.status ===
      "pending" &&
    state.canRespond
  ) {
    return (
      <Animated.View
        style={[
          styles.contactCard,
          {
            borderColor:
              theme.border,
          },
          entrance,
        ]}
      >
        <View
          style={
            styles.contactTopRow
          }
        >
          <View
            style={[
              styles.contactIcon,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <Ionicons
              name="mail-unread-outline"
              size={23}
              color={
                theme.primary
              }
            />
          </View>

          <View
            style={
              styles.contactBody
            }
          >
            <View
              style={
                styles.contactRequestBadge
              }
            >
              <View
                style={
                  styles.requestDot
                }
              />

              <Text
                style={[
                  styles.contactEyebrow,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                NEW REQUEST
              </Text>
            </View>

            <Text
              style={[
                styles.contactTitle,
                {
                  color:
                    theme.dark,
                },
              ]}
            >
              The other participant wants to connect
            </Text>

            <Text
              style={
                styles.contactDescription
              }
            >
              Accept to unlock phone and WhatsApp contact for both sides.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.contactResponseActions
          }
        >
          <Pressable
            disabled={processing}
            onPress={onReject}
            style={({
              pressed,
            }) => [
              styles.contactRejectButton,
              pressed &&
                styles.contactActionPressed,
              processing &&
                styles.contactDisabled,
            ]}
          >
            <Ionicons
              name="close-outline"
              size={19}
              color="#B91C1C"
            />

            <Text
              style={
                styles.contactRejectText
              }
            >
              Reject
            </Text>
          </Pressable>

          <Pressable
            disabled={processing}
            onPress={onAccept}
            style={({
              pressed,
            }) => [
              styles.contactAcceptButton,
              {
                backgroundColor:
                  theme.primary,
              },
              pressed &&
                styles.contactActionPressed,
              processing &&
                styles.contactDisabled,
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
                  name="checkmark-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.contactAcceptText
                  }
                >
                  Accept Access
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  /* -------------------------------------------------------------- */
  /* Request pending                                                 */
  /* -------------------------------------------------------------- */

  if (
    state.exists &&
    state.request?.status ===
      "pending" &&
    requesterIsMe
  ) {
    return (
      <Animated.View
        style={[
          styles.contactCard,
          {
            borderColor:
              theme.border,
          },
          entrance,
        ]}
      >
        <View
          style={
            styles.contactTopRow
          }
        >
          <View
            style={[
              styles.contactIcon,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={23}
              color={
                theme.primary
              }
            />
          </View>

          <View
            style={
              styles.contactBody
            }
          >
            <Text
              style={[
                styles.contactEyebrow,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              REQUEST PENDING
            </Text>

            <Text
              style={[
                styles.contactTitle,
                {
                  color:
                    theme.dark,
                },
              ]}
            >
              Waiting for approval
            </Text>

            <Text
              style={
                styles.contactDescription
              }
            >
              Your contact request was sent successfully. Phone and WhatsApp remain protected until the other participant accepts.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.contactPendingStatus,
            {
              backgroundColor:
                theme.soft,
            },
          ]}
        >
          <ActivityIndicator
            size="small"
            color={
              theme.primary
            }
          />

          <Text
            style={[
              styles.contactPendingText,
              {
                color:
                  theme.dark,
              },
            ]}
          >
            Awaiting response
          </Text>
        </View>
      </Animated.View>
    );
  }

  /* -------------------------------------------------------------- */
  /* Request available                                               */
  /* -------------------------------------------------------------- */

  if (state.canRequest) {
    return (
      <Animated.View
        style={[
          styles.contactCard,
          {
            borderColor:
              theme.border,
          },
          entrance,
        ]}
      >
        <View
          style={
            styles.contactTopRow
          }
        >
          <View
            style={[
              styles.contactIcon,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={23}
              color={
                theme.primary
              }
            />
          </View>

          <View
            style={
              styles.contactBody
            }
          >
            <Text
              style={[
                styles.contactEyebrow,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              SECURE CONTACT ACCESS
            </Text>

            <Text
              style={[
                styles.contactTitle,
                {
                  color:
                    theme.dark,
                },
              ]}
            >
              Continue the conversation
            </Text>

            <Text
              style={
                styles.contactDescription
              }
            >
              The AI agents reached an agreement. Request permission to securely exchange phone and WhatsApp contact details.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.contactPrivacyNote
          }
        >
          <Ionicons
            name="lock-closed-outline"
            size={16}
            color="#64748B"
          />

          <Text
            style={
              styles.contactPrivacyText
            }
          >
            Contact information stays private until the other participant approves.
          </Text>
        </View>

        <Pressable
          disabled={processing}
          onPress={onRequest}
          style={({
            pressed,
          }) => [
            styles.requestContactButton,
            {
              backgroundColor:
                theme.primary,
            },
            pressed &&
              styles.contactActionPressed,
            processing &&
              styles.contactDisabled,
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
                name="chatbubble-ellipses-outline"
                size={19}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.requestContactText
                }
              >
                Request Contact Access
              </Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color="#FFFFFF"
              />
            </>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Done button                                                        */
/* ------------------------------------------------------------------ */

function DoneButton({
  theme,
  role,
}: {
  theme: ResultTheme;
  role: string | undefined;
}) {
  const press =
    usePressScale(0.97);

  return (
    <AnimatedPressable
      onPress={() =>
        router.replace(
          role === "miller"
            ? "/(c03-marketplace)/(miller)/home"
            : "/(c03-marketplace)/(farmer)/home"
        )
      }
      onPressIn={
        press.onPressIn
      }
      onPressOut={
        press.onPressOut
      }
      style={[
        styles.doneButton,
        {
          backgroundColor:
            theme.primary,
        },
        {
          transform: [
            {
              scale:
                press.scale,
            },
          ],
        },
      ]}
    >
      <Ionicons
        name="home-outline"
        size={19}
        color="#FFFFFF"
      />

      <Text
        style={
          styles.doneButtonText
        }
      >
        Return to Dashboard
      </Text>

      <Ionicons
        name="arrow-forward"
        size={17}
        color="#FFFFFF"
      />
    </AnimatedPressable>
  );
}

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

function readString(
  value:
    | string
    | string[]
    | undefined
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

function normalizeSriLankanPhone(
  phone: string
): string {
  const digits =
    phone.replace(
      /\D/g,
      ""
    );

  if (
    digits.startsWith("94")
  ) {
    return digits;
  }

  if (
    digits.startsWith("0")
  ) {
    return `94${digits.slice(
      1
    )}`;
  }

  return digits;
}

function formatLabel(
  value: string
): string {
  return value
    .split(/[\s_-]+/)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase() +
        part
          .slice(1)
          .toLowerCase()
    )
    .join(" ");
}

/* ------------------------------------------------------------------ */
/* Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  /* -------------------------------------------------------------- */
  /* Header                                                          */
  /* -------------------------------------------------------------- */

  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    backgroundColor: "#F5F7F6",
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: "#111827",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 17,
    letterSpacing: -0.35,
  },

  headerSubtitle: {
    color: "#94A3B8",
    fontFamily: "Poppins_500Medium",
    fontSize: 7.5,
    marginTop: 1,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  /* -------------------------------------------------------------- */
  /* Content                                                         */
  /* -------------------------------------------------------------- */

  content: {
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 110,
  },

  /* -------------------------------------------------------------- */
  /* Result hero                                                     */
  /* -------------------------------------------------------------- */

  resultHero: {
    alignItems: "center",
    borderRadius: 27,
    paddingHorizontal: 22,
    paddingVertical: 25,
    overflow: "hidden",
  },

  resultIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.11)",
  },

  resultRing: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#4ADE80",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 14,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },

  resultEyebrow: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 8,
    letterSpacing: 1.15,
  },

  resultPrice: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 28,
    letterSpacing: -0.8,
    marginTop: 7,
  },

  resultDescription: {
    color:
      "rgba(255,255,255,0.72)",
    fontFamily: "Poppins_400Regular",
    fontSize: 9.5,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 310,
  },

  /* -------------------------------------------------------------- */
  /* Section header                                                  */
  /* -------------------------------------------------------------- */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 25,
    marginBottom: 12,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 14,
    letterSpacing: -0.25,
  },

  sectionSubtitle: {
    color: "#94A3B8",
    fontFamily: "Poppins_400Regular",
    fontSize: 8,
    marginTop: 1,
  },

  /* -------------------------------------------------------------- */
  /* Metrics                                                         */
  /* -------------------------------------------------------------- */

  metricsGrid: {
    flexDirection: "row",
    gap: 9,
  },

  metricCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 19,
    padding: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.025,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  metricValue: {
    color: "#111827",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 12.5,
    marginTop: 9,
  },

  metricLabel: {
    color: "#94A3B8",
    fontFamily: "Poppins_700Bold",
    fontSize: 6.5,
    letterSpacing: 0.55,
    marginTop: 2,
  },

  /* -------------------------------------------------------------- */
  /* Fairness                                                        */
  /* -------------------------------------------------------------- */

  fairnessCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 19,
    padding: 14,
    borderWidth: 1,
    marginTop: 15,
  },

  fairnessIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  fairnessText: {
    flex: 1,
  },

  fairnessTitle: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 11,
  },

  fairnessDescription: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 2,
  },

  inlineStrong: {
    fontFamily: "Poppins_700Bold",
    color: "#475569",
  },

  /* -------------------------------------------------------------- */
  /* Contact card                                                    */
  /* -------------------------------------------------------------- */

  contactCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginTop: 0,
    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  contactUnlockedCard: {
    backgroundColor: "#FFFFFF",
  },

  contactRejectedCard: {
    backgroundColor: "#FFF7F7",
    borderColor: "#FECACA",
  },

  contactTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  contactIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  contactRejectedIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },

  contactBody: {
    flex: 1,
  },

  contactEyebrow: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 7.5,
    letterSpacing: 0.9,
  },

  contactTitle: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 12.5,
    marginTop: 2,
  },

  contactRejectedTitle: {
    color: "#991B1B",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 12.5,
  },

  contactDescription: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 8.5,
    lineHeight: 14.5,
    marginTop: 4,
  },

  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },

  contactRequestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },

  requestDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: "#F59E0B",
  },

  /* -------------------------------------------------------------- */
  /* Contact identity                                                */
  /* -------------------------------------------------------------- */

  contactIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#F8FAFC",
    marginTop: 15,
  },

  contactAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  contactIdentityText: {
    flex: 1,
  },

  contactName: {
    color: "#1F2937",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 11.5,
  },

  contactLocation: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 8,
    marginTop: 2,
  },

  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  /* -------------------------------------------------------------- */
  /* Contact buttons                                                 */
  /* -------------------------------------------------------------- */

  contactActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 13,
  },

  contactActionButton: {
    flex: 1,
    minHeight: 49,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  whatsAppButton: {
    backgroundColor: "#16A34A",
  },

  contactActionText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 9.5,
  },

  contactActionPressed: {
    opacity: 0.84,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  contactDisabled: {
    opacity: 0.55,
  },

  /* -------------------------------------------------------------- */
  /* Privacy                                                         */
  /* -------------------------------------------------------------- */

  contactPrivacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderRadius: 14,
    padding: 11,
    backgroundColor: "#F8FAFC",
    marginTop: 14,
  },

  contactPrivacyText: {
    flex: 1,
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 8,
    lineHeight: 13.5,
  },

  requestContactButton: {
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 13,
  },

  requestContactText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 9.5,
  },

  /* -------------------------------------------------------------- */
  /* Pending                                                         */
  /* -------------------------------------------------------------- */

  contactPendingStatus: {
    minHeight: 44,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },

  contactPendingText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 8.5,
  },

  /* -------------------------------------------------------------- */
  /* Response                                                        */
  /* -------------------------------------------------------------- */

  contactResponseActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },

  contactRejectButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  contactRejectText: {
    color: "#B91C1C",
    fontFamily: "Poppins_700Bold",
    fontSize: 9.5,
  },

  contactAcceptButton: {
    flex: 1.25,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  contactAcceptText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 9.5,
  },

  /* -------------------------------------------------------------- */
  /* Timeline                                                        */
  /* -------------------------------------------------------------- */

  timeline: {
    gap: 11,
  },

  historyCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 19,
    padding: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.025,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 1,
  },

  historyConnector: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  historyAgent: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 10,
  },

  historyRole: {
    color: "#A1A1AA",
    fontFamily: "Poppins_400Regular",
    fontSize: 6.8,
    marginTop: 1,
  },

  roundPill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: "#F8FAFC",
  },

  historyRound: {
    color: "#94A3B8",
    fontFamily: "Poppins_700Bold",
    fontSize: 6.5,
    letterSpacing: 0.35,
  },

  historyDecision: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },

  actionBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  actionText: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 7,
  },

  historyPrice: {
    color: "#1F2937",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 11.5,
  },

  historyReason: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 8.5,
    lineHeight: 14.5,
    marginTop: 7,
  },

  /* -------------------------------------------------------------- */
  /* Bottom button                                                   */
  /* -------------------------------------------------------------- */

  doneButton: {
    minHeight: 53,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  doneButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 10.5,
  },

  /* -------------------------------------------------------------- */
  /* States                                                          */
  /* -------------------------------------------------------------- */

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
  },

  errorIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },

  stateTitle: {
    color: "#111827",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 17,
    letterSpacing: -0.3,
    marginTop: 16,
    textAlign: "center",
  },

  stateText: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 9.5,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 300,
  },

  simpleButton: {
    minHeight: 47,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginTop: 18,
  },

  simpleButtonText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 10,
  },
});