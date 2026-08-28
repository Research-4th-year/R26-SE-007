import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";
import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

const BOT_SIZE = 64;
const SCREEN_MARGIN = 16;
const BOTTOM_SAFE_AREA = 95;

// ---------------------------------------------------------------------------
// Role themes — aligned with the amber/green palette used across the
// assistant chat screen and the login screen, so the bot reads as the same
// character everywhere in the app.
// ---------------------------------------------------------------------------
type BotTheme = {
  gradient: [string, string];
  primary: string;
  secondary: string;
  soft: string;
  border: string;
  label: string;
};

const FARMER_THEME: BotTheme = {
  gradient: ["#3FB663", "#1B7A3D"],
  primary: "#15803D",
  secondary: "#22C55E",
  soft: "#DCFCE7",
  border: "#BBF7D0",
  label: "Farmer AI",
};

const MILLER_THEME: BotTheme = {
  gradient: ["#DE9A2E", "#A85E0A"],
  primary: "#92400E",
  secondary: "#F2A93C",
  soft: "#FEF3C7",
  border: "#FDE68A",
  label: "Miller AI",
};

export function FloatingRagBot() {
  const { user } = useMarketplaceAuth();
  const pathname = usePathname();

  const screenSize = Dimensions.get("window");

  const isMiller = user?.role === "miller";

  const theme = useMemo(
    () => (isMiller ? MILLER_THEME : FARMER_THEME),
    [isMiller]
  );

  const position = useRef(
    new Animated.ValueXY({
      x:
        screenSize.width -
        BOT_SIZE -
        SCREEN_MARGIN,
      y:
        screenSize.height -
        BOT_SIZE -
        BOTTOM_SAFE_AREA,
    })
  ).current;

  const pulse = useRef(
    new Animated.Value(1)
  ).current;

  const pulseOpacity = useRef(
    new Animated.Value(0.5)
  ).current;

  const idleBob = useRef(
    new Animated.Value(0)
  ).current;

  const blink = useRef(
    new Animated.Value(1)
  ).current;

  const sparkleTwinkle = useRef(
    new Animated.Value(0)
  ).current;

  const entranceScale = useRef(
    new Animated.Value(0)
  ).current;

  const pressScale = useRef(
    new Animated.Value(1)
  ).current;

  const draggingRef = useRef(false);

  // Breathing glow ring.
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1.08,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.15,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.5,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse, pulseOpacity]);

  // Gentle idle float, independent of drag position.
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(idleBob, {
          toValue: -5,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idleBob, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [idleBob]);

  // Periodic blink for a bit of life.
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(blink, {
          toValue: 0.1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
        Animated.delay(180),
        Animated.timing(blink, {
          toValue: 0.1,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [blink]);

  // Sparkle badge twinkles side to side instead of a flat static icon.
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleTwinkle, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleTwinkle, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [sparkleTwinkle]);

  // Pop in on mount, and re-pop whenever the role theme changes so switching
  // between farmer and miller accounts feels like a deliberate handoff.
  useEffect(() => {
    entranceScale.setValue(0.7);

    Animated.spring(entranceScale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [entranceScale, theme]);

  const clampPosition = (
    x: number,
    y: number
  ) => {
    const maximumX =
      screenSize.width -
      BOT_SIZE -
      SCREEN_MARGIN;

    const maximumY =
      screenSize.height -
      BOT_SIZE -
      BOTTOM_SAFE_AREA;

    return {
      x: Math.max(
        SCREEN_MARGIN,
        Math.min(x, maximumX)
      ),

      y: Math.max(
        SCREEN_MARGIN,
        Math.min(y, maximumY)
      ),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () =>
        false,

      onMoveShouldSetPanResponder: (
        _event,
        gesture
      ) =>
        Math.abs(gesture.dx) > 4 ||
        Math.abs(gesture.dy) > 4,

      onPanResponderGrant: () => {
        draggingRef.current = true;

        position.stopAnimation(
          (currentPosition) => {
            position.setOffset({
              x: currentPosition.x,
              y: currentPosition.y,
            });

            position.setValue({
              x: 0,
              y: 0,
            });
          }
        );
      },

      onPanResponderMove:
        Animated.event(
          [
            null,
            {
              dx: position.x,
              dy: position.y,
            },
          ],
          {
            useNativeDriver: false,
          }
        ),

      onPanResponderRelease: (
        _event,
        gesture
      ) => {
        position.flattenOffset();

        position.stopAnimation(
          (currentPosition) => {
            const nextPosition =
              clampPosition(
                currentPosition.x,
                currentPosition.y
              );

            Animated.spring(
              position,
              {
                toValue: nextPosition,
                useNativeDriver: false,
                friction: 7,
                tension: 60,
              }
            ).start(() => {
              setTimeout(() => {
                draggingRef.current =
                  false;
              }, 80);
            });
          }
        );
      },

      onPanResponderTerminate: () => {
        position.flattenOffset();
        draggingRef.current = false;
      },
    })
  ).current;

  const openAssistant = () => {
    if (draggingRef.current) {
      return;
    }

    router.push(
      "/(c03-marketplace)/assistant"
    );
  };

  if (!user) {
    return null;
  }

  const isAssistantScreen =
  pathname === "/assistant" ||
  pathname.endsWith("/assistant");

const isAuthenticationScreen =
  pathname.includes("/login") ||
  pathname.includes("/register") ||
  pathname.includes("/forgot-password");

if (
  isAssistantScreen ||
  isAuthenticationScreen
) {
  return null;
}

  const sparkleRotation = sparkleTwinkle.interpolate({
    inputRange: [0, 1],
    outputRange: ["-12deg", "12deg"],
  });

  const sparkleScale = sparkleTwinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.15],
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.positionContainer,
        {
          transform: [
            {
              translateX: position.x,
            },
            {
              translateY: position.y,
            },
          ],
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${theme.label}`}
        onPress={openAssistant}
        onPressIn={() => {
          Animated.spring(pressScale, {
            toValue: 0.92,
            speed: 30,
            bounciness: 6,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(pressScale, {
            toValue: 1,
            speed: 20,
            bounciness: 8,
            useNativeDriver: true,
          }).start();
        }}
        style={styles.pressable}
      >
        <Animated.View
          style={{
            transform: [
              { translateY: idleBob },
              { scale: entranceScale },
              { scale: pressScale },
            ],
            alignItems: "center",
          }}
        >
          <Animated.View
            style={[
              styles.pulseRing,
              {
                backgroundColor:
                  theme.soft,

                borderColor:
                  theme.border,

                opacity: pulseOpacity,

                transform: [
                  {
                    scale: pulse,
                  },
                ],
              },
            ]}
          />

          <View style={styles.botBody}>
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.botBodyFill,
                { borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.botFace,
                  {
                    backgroundColor:
                      theme.soft,
                  },
                ]}
              >
                <View style={styles.eyeRow}>
                  <Animated.View
                    style={[
                      styles.eye,
                      {
                        backgroundColor:
                          theme.primary,
                        transform: [
                          { scaleY: blink },
                        ],
                      },
                    ]}
                  />

                  <Animated.View
                    style={[
                      styles.eye,
                      {
                        backgroundColor:
                          theme.primary,
                        transform: [
                          { scaleY: blink },
                        ],
                      },
                    ]}
                  />
                </View>

                <View
                  style={[
                    styles.smile,
                    {
                      borderColor:
                        theme.primary,
                    },
                  ]}
                />
              </View>

              <Animated.View
                style={[
                  styles.sparkleBadge,
                  {
                    backgroundColor:
                      theme.secondary,
                    transform: [
                      { rotate: sparkleRotation },
                      { scale: sparkleScale },
                    ],
                  },
                ]}
              >
                <Ionicons
                  name="sparkles"
                  size={12}
                  color="#FFFFFF"
                />
              </Animated.View>
            </LinearGradient>
          </View>

          <View
            style={[
              styles.labelBubble,
              {
                borderColor:
                  theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.labelText,
                {
                  color:
                    theme.primary,
                },
              ]}
            >
              Ask AI
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  positionContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    width: BOT_SIZE,
    zIndex: 9999,
    elevation: 20,
  },

  pressable: {
    width: BOT_SIZE,
    alignItems: "center",
  },

  pulseRing: {
    position: "absolute",
    top: -5,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
  },

  botBody: {
    width: BOT_SIZE,
    height: BOT_SIZE,
    borderRadius: 23,

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 8,
  },

  botBodyFill: {
    width: "100%",
    height: "100%",
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  botFace: {
    width: 43,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  eyeRow: {
    flexDirection: "row",
    gap: 9,
  },

  eye: {
    width: 5,
    height: 7,
    borderRadius: 3,
  },

  smile: {
    width: 15,
    height: 7,
    borderBottomWidth: 2,
    borderRadius: 8,
    marginTop: 4,
  },

  sparkleBadge: {
    position: "absolute",
    right: -3,
    top: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  labelBubble: {
    minWidth: 48,
    height: 23,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginTop: 5,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  labelText: {
    fontSize: 8.5,
    fontWeight: "800",
  },
});