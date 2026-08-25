import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const HOME_ROUTE = "/(c04-analytics)/home";

type ForecastPoint = {
  week: number;
  date: string;
  predicted_price: number;
};

type ForecastResponse = {
  district: string;
  start_date: string;
  weeks: number;
  forecast: ForecastPoint[];
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

export default function WeeklyBreakdownScreen() {
  const { data } = useLocalSearchParams<{
    data: string;
  }>();

  const result: ForecastResponse | null = data
    ? JSON.parse(data)
    : null;

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  /*
   * Main screen animation
   */
  const fade = useRef(
    new Animated.Value(0)
  ).current;

  const rise = useRef(
    new Animated.Value(16)
  ).current;

  /*
   * Weekly cards animation.
   *
   * Each card gets its own Animated.Value so the cards
   * can appear one after another.
   */
  const cardAnimations = useRef(
    new Map<
      number,
      {
        opacity: Animated.Value;
        translateY: Animated.Value;
      }
    >()
  ).current;

  const getCardAnimation = (week: number) => {
    if (!cardAnimations.has(week)) {
      cardAnimations.set(week, {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(12),
      });
    }

    return cardAnimations.get(week)!;
  };

  useEffect(() => {
    if (!fontsLoaded || !result) return;

    /*
     * Main screen fade + slide animation
     */
    fade.setValue(0);
    rise.setValue(16);

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

    /*
     * Reset all card animations
     */
    result.forecast.forEach((item) => {
      const animation = getCardAnimation(item.week);

      animation.opacity.setValue(0);
      animation.translateY.setValue(12);
    });

    /*
     * Staggered card animation
     */
    const cardAnimationsSequence =
      result.forecast.map((item, index) => {
        const animation = getCardAnimation(
          item.week
        );

        return Animated.parallel([
          Animated.timing(animation.opacity, {
            toValue: 1,
            duration: 350,
            delay: index * 90,
            useNativeDriver: true,
          }),

          Animated.timing(animation.translateY, {
            toValue: 0,
            duration: 350,
            delay: index * 90,
            useNativeDriver: true,
          }),
        ]);
      });

    Animated.parallel(
      cardAnimationsSequence
    ).start();

    return () => {
      cardAnimationsSequence.forEach(
        (animation) => animation.stop()
      );
    };
  }, [fontsLoaded, result]);

  if (!fontsLoaded || !result) return null;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[
          "#0A331D",
          "#12522E",
          "#0B3B22",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroBg}
      />

      <SafeAreaView style={styles.safe}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <View style={styles.eyebrowPill}>
            <Ionicons
              name="list"
              size={11}
              color="#F5C542"
            />

            <Text style={styles.eyebrow}>
              WEEKLY BREAKDOWN
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {result.weeks}-Week Forecast Detail
          </Text>

          <Text style={styles.heroSub}>
            {result.district}
          </Text>
        </View>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: fade,
              transform: [
                {
                  translateY: rise,
                },
              ],
            },
          ]}
        >
          <View style={styles.sheetHandle} />

          <FlatList
            data={result.forecast}
            keyExtractor={(item) =>
              String(item.week)
            }
            contentContainerStyle={
              styles.listContent
            }
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const prev =
                index > 0
                  ? result.forecast[index - 1]
                      .predicted_price
                  : null;

              const delta =
                prev !== null
                  ? item.predicted_price - prev
                  : null;

              const deltaUp =
                delta !== null &&
                delta > 0.01;

              const deltaDown =
                delta !== null &&
                delta < -0.01;

              const animation =
                getCardAnimation(item.week);

              return (
                <Animated.View
                  style={{
                    opacity: animation.opacity,
                    transform: [
                      {
                        translateY:
                          animation.translateY,
                      },
                    ],
                  }}
                >
                  <View style={styles.weekCard}>
                    <View
                      style={styles.weekBadge}
                    >
                      <Text
                        style={
                          styles.weekBadgeText
                        }
                      >
                        {item.week}
                      </Text>
                    </View>

                    <View
                      style={styles.weekInfo}
                    >
                      <Text
                        style={styles.weekLabel}
                      >
                        Week {item.week}
                      </Text>

                      <Text
                        style={styles.weekDate}
                      >
                        {formatDate(item.date)}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.weekPriceCol
                      }
                    >
                      <Text
                        style={styles.weekPrice}
                      >
                        {item.predicted_price.toFixed(
                          2
                        )}

                        <Text
                          style={
                            styles.weekPriceUnit
                          }
                        >
                          {" "}
                          LKR/kg
                        </Text>
                      </Text>

                      {delta !== null && (
                        <View
                          style={
                            styles.deltaRow
                          }
                        >
                          <Ionicons
                            name={
                              deltaUp
                                ? "arrow-up"
                                : deltaDown
                                ? "arrow-down"
                                : "remove"
                            }
                            size={11}
                            color={
                              deltaUp
                                ? "#15803D"
                                : deltaDown
                                ? "#DC2626"
                                : "#9CA3AF"
                            }
                          />

                          <Text
                            style={[
                              styles.deltaText,
                              {
                                color: deltaUp
                                  ? "#15803D"
                                  : deltaDown
                                  ? "#DC2626"
                                  : "#9CA3AF",
                              },
                            ]}
                          >
                            {Math.abs(
                              delta
                            ).toFixed(2)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            }}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.doneBtn}
                activeOpacity={0.85}
                onPress={() =>
                  router.push(
                    HOME_ROUTE as any
                  )
                }
              >
                <Text
                  style={styles.doneBtnText}
                >
                  Back to Home
                </Text>

                <Ionicons
                  name="home-outline"
                  size={16}
                  color="#0B3B22"
                />
              </TouchableOpacity>
            }
          />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B3B22",
  },

  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },

  safe: {
    flex: 1,
  },

  hero: {
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },

  backBtn: {
    alignSelf: "flex-start",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },

  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor:
      "rgba(245,197,66,0.25)",
  },

  eyebrow: {
    color:
      "rgba(253,230,138,0.85)",
    fontSize: 9.5,
    fontFamily:
      "Poppins_600SemiBold",
    letterSpacing: 1.4,
  },

  heroTitle: {
    color: "white",
    fontSize: 19.5,
    fontFamily:
      "Poppins_800ExtraBold",
    textAlign: "center",
  },

  heroSub: {
    color:
      "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily:
      "Poppins_500Medium",
  },

  sheet: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    elevation: 10,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },

  listContent: {
    paddingBottom: 24,
  },

  weekCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },

  weekBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },

  weekBadgeText: {
    fontSize: 14,
    fontFamily:
      "Poppins_800ExtraBold",
    color: "#15803D",
  },

  weekInfo: {
    flex: 1,
  },

  weekLabel: {
    fontSize: 13.5,
    fontFamily:
      "Poppins_700Bold",
    color: "#1F2937",
  },

  weekDate: {
    fontSize: 11.5,
    fontFamily:
      "Poppins_500Medium",
    color: "#9CA3AF",
    marginTop: 1,
  },

  weekPriceCol: {
    alignItems: "flex-end",
  },

  weekPrice: {
    fontSize: 15,
    fontFamily:
      "Poppins_800ExtraBold",
    color: "#0B3B22",
  },

  weekPriceUnit: {
    fontSize: 10,
    fontFamily:
      "Poppins_500Medium",
    color: "#9CA3AF",
  },

  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 3,
  },

  deltaText: {
    fontSize: 10.5,
    fontFamily:
      "Poppins_600SemiBold",
  },

  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: "#F5C542",
    marginTop: 6,
  },

  doneBtnText: {
    fontSize: 14.5,
    fontFamily:
      "Poppins_700Bold",
    color: "#0B3B22",
  },
});