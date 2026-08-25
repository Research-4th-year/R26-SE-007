import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  ClipPath,
  Rect,
} from "react-native-svg";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const APP_LOGO = require("@/assets/logo2.png");

const API_BASE = "http://127.0.0.1:8000";
const WEEKLY_BREAKDOWN_ROUTE =
  "/(c04-analytics)/price-forecasting/weekly-breakdown";

const { width: screenWidth } = Dimensions.get("window");
const CHART_WIDTH = screenWidth - 40;
const CHART_HEIGHT = 190;

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

function shortDate(dateStr: string) {
  const d = new Date(dateStr);

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function ForecastLineChart({
  points,
}: {
  points: ForecastPoint[];
}) {
  const prices = points.map((p) => p.predicted_price);

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const padY = 24;
  const padX = 14;

  const innerW = CHART_WIDTH - padX * 2;
  const innerH = CHART_HEIGHT - padY * 2;

  const coords = points.map((p, i) => {
    const x =
      padX +
      (i / Math.max(points.length - 1, 1)) * innerW;

    const y =
      padY +
      innerH -
      ((p.predicted_price - min) / range) * innerH;

    return {
      x,
      y,
      p,
    };
  });

  const linePath = coords
    .map(
      (c, i) =>
        `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`
    )
    .join(" ");

  const areaPath =
    `M ${coords[0].x} ${padY + innerH} ` +
    coords.map((c) => `L ${c.x} ${c.y}`).join(" ") +
    ` L ${coords[coords.length - 1].x} ${
      padY + innerH
    } Z`;

  // Controls the line drawing progress.
  const lineProgress = useRef(
    new Animated.Value(0)
  ).current;

  // Controls the area fill appearance.
  const areaOpacity = useRef(
    new Animated.Value(0)
  ).current;

  // Controls the chart point appearance.
  const pointProgress = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    // Reset animations whenever forecast points change.
    lineProgress.setValue(0);
    areaOpacity.setValue(0);
    pointProgress.setValue(0);

    const animation = Animated.sequence([
      // First draw the line.
      Animated.timing(lineProgress, {
        toValue: 1,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),

      // Then reveal the chart area.
      Animated.timing(areaOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),

      // Finally reveal the points.
      Animated.timing(pointProgress, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [points]);

  
  const lineLength = Math.max(
    CHART_WIDTH * 1.5,
    300
  );

  const animatedStrokeDashoffset =
    lineProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [lineLength, 0],
    });

  const animatedAreaOpacity =
    areaOpacity.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

  const animatedPointRadius =
    pointProgress.interpolate({
      inputRange: [0, 0.7, 1],
      outputRange: [0, 3, 4],
    });

  const animatedPointOpacity =
    pointProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.4, 1],
    });

  return (
    <Svg
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
    >
      <Defs>
        <SvgGradient
          id="areaFill"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <Stop
            offset="0"
            stopColor="#F5C542"
            stopOpacity="0.35"
          />
          <Stop
            offset="1"
            stopColor="#F5C542"
            stopOpacity="0"
          />
        </SvgGradient>

        {/* Clip area so the graph stays inside the chart. */}
        <ClipPath id="chartClip">
          <Rect
            x={0}
            y={0}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
          />
        </ClipPath>
      </Defs>

      {/* Baseline grid */}
      <Line
        x1={padX}
        y1={padY + innerH}
        x2={CHART_WIDTH - padX}
        y2={padY + innerH}
        stroke="#E5E7EB"
        strokeWidth={1}
      />

      {/* Animated area fill */}
      <AnimatedG opacity={animatedAreaOpacity}>
        <Path
          d={areaPath}
          fill="url(#areaFill)"
        />
      </AnimatedG>

      {/* Animated forecast line */}
      <AnimatedPath
        d={linePath}
        stroke="#D97706"
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${lineLength} ${lineLength}`}
        strokeDashoffset={animatedStrokeDashoffset}
      />

      {/* Animated forecast points */}
      {coords.map((c, i) => (
        <AnimatedCircle
          key={i}
          cx={c.x}
          cy={c.y}
          r={animatedPointRadius}
          opacity={animatedPointOpacity}
          fill="#D97706"
          stroke="white"
          strokeWidth={1.5}
        />
      ))}
    </Svg>
  );
}

const AnimatedCircle =
  Animated.createAnimatedComponent(Circle);

const AnimatedPath =
  Animated.createAnimatedComponent(Path);

const AnimatedG =
  Animated.createAnimatedComponent(View as any);


function LogoLoadingState({
  label,
}: {
  label: string;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.08,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.centerState}>
      <View style={styles.logoLoadingWrap}>
        <Animated.View
          style={[
            styles.logoRing,
            { transform: [{ rotate }] },
          ]}
        />

        <Animated.Image
          source={APP_LOGO}
          resizeMode="contain"
          style={[
            styles.logoImage,
            { transform: [{ scale: pulse }] },
          ]}
        />
      </View>

      <Text style={styles.centerStateTitle}>
        Crunching the numbers…
      </Text>

      <Text style={styles.centerStateText}>
        {label}
      </Text>
    </View>
  );
}


export default function ForecastResultScreen() {
  const {
    district,
    date,
    weeks,
  } = useLocalSearchParams<{
    district: string;
    date: string;
    weeks: string;
  }>();

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [result, setResult] =
    useState<ForecastResponse | null>(null);

  const fade = useRef(
    new Animated.Value(0)
  ).current;

  const rise = useRef(
    new Animated.Value(16)
  ).current;

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}/forecast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            district,
            date,
            weeks: Number(weeks),
          }),
        }
      );

      if (!res.ok) {
        throw new Error(
          `Server responded with ${res.status}`
        );
      }

      const data: ForecastResponse =
        await res.json();

      setResult(data);
    } catch (e: any) {
      setError(
        e?.message === "Network request failed"
          ? "Couldn't reach the forecast server. Check your connection and try again."
          : "Something went wrong while generating your forecast."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [district, date, weeks]);

  useEffect(() => {
    if (!fontsLoaded || loading) return;

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
  }, [fontsLoaded, loading]);

  if (!fontsLoaded) return null;

  let highest = 0;
  let lowest = 0;
  let average = 0;
  let insight = "";

  if (result) {
    const prices = result.forecast.map(
      (f) => f.predicted_price
    );

    highest = Math.max(...prices);
    lowest = Math.min(...prices);

    average =
      prices.reduce(
        (a, b) => a + b,
        0
      ) / prices.length;

    const first = prices[0];
    const last =
      prices[prices.length - 1];

    const pctChange =
      ((last - first) / first) * 100;

    if (Math.abs(pctChange) < 2) {
      insight =
        "Prices are expected to remain relatively stable over the selected period.";
    } else if (pctChange > 0) {
      insight = `Prices are projected to rise gradually, up roughly ${pctChange.toFixed(
        1
      )}% by the end of this period.`;
    } else {
      insight = `Prices are projected to ease gradually, down roughly ${Math.abs(
        pctChange
      ).toFixed(
        1
      )}% by the end of this period.`;
    }
  }

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
              name="trending-up"
              size={11}
              color="#F5C542"
            />

            <Text style={styles.eyebrow}>
              FORECAST RESULT
            </Text>
          </View>

          <Text style={styles.heroTitle}>
            {weeks}-Week Price Forecast
          </Text>

          <Text style={styles.heroSub}>
            {district} · Starting {date}
          </Text>
        </View>

        {/* Sheet */}
        <Animated.View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {loading && (
            <LogoLoadingState
              label="Generating your forecast…"
            />
          )}

          {!loading && error && (
            <View style={styles.centerState}>
              <View style={styles.errorIconBox}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={30}
                  color="#DC2626"
                />
              </View>

              <Text style={styles.errorTitle}>
                Forecast failed
              </Text>

              <Text style={styles.centerStateText}>
                {error}
              </Text>

              <TouchableOpacity
                style={styles.retryBtn}
                onPress={fetchForecast}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="refresh"
                  size={16}
                  color="#15803D"
                />

                <Text style={styles.retryText}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading &&
            !error &&
            result && (
              <Animated.View
                style={{
                  opacity: fade,
                  transform: [
                    { translateY: rise },
                  ],
                  flex: 1,
                }}
              >
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={
                    styles.scrollContent
                  }
                  showsVerticalScrollIndicator={
                    false
                  }
                >
                  {/* Chart card */}
                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text
                        style={styles.chartTitle}
                      >
                        Predicted Price Trend
                      </Text>

                      <View
                        style={
                          styles.paddyTypePill
                        }
                      >
                        <Ionicons
                          name="leaf"
                          size={10}
                          color="#B45309"
                        />

                        <Text
                          style={
                            styles.paddyTypePillText
                          }
                        >
                          Long Grain White
                        </Text>
                      </View>
                    </View>

                    {/* ONLY THE CHART IS ANIMATED */}
                    <ForecastLineChart
                      points={result.forecast}
                    />

                    <View
                      style={styles.chartAxisRow}
                    >
                      <Text
                        style={
                          styles.chartAxisLabel
                        }
                      >
                        {shortDate(
                          result.forecast[0]
                            .date
                        )}
                      </Text>

                      <Text
                        style={
                          styles.chartAxisLabel
                        }
                      >
                        {shortDate(
                          result.forecast[
                            result.forecast
                              .length - 1
                          ].date
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Summary stats */}
                  <View style={styles.statsRow}>
                    <StatCard
                      label="Highest"
                      value={highest}
                      tone="#15803D"
                      bg="#DCFCE7"
                    />

                    <StatCard
                      label="Lowest"
                      value={lowest}
                      tone="#DC2626"
                      bg="#FEE2E2"
                    />

                    <StatCard
                      label="Average"
                      value={average}
                      tone="#B45309"
                      bg="#FEF3C7"
                    />
                  </View>

                  {/* Insight */}
                  <View style={styles.infoCard}>
                    <View
                      style={
                        styles.infoCardHeader
                      }
                    >
                      <View
                        style={[
                          styles.infoIconBox,
                          {
                            backgroundColor:
                              "#E0F2FE",
                          },
                        ]}
                      >
                        <Ionicons
                          name="bulb"
                          size={16}
                          color="#0369A1"
                        />
                      </View>

                      <Text
                        style={
                          styles.infoCardTitle
                        }
                      >
                        Forecast Insight
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.infoCardText
                      }
                    >
                      {insight}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.detailBtn}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname:
                          WEEKLY_BREAKDOWN_ROUTE as any,
                        params: {
                          data: JSON.stringify(
                            result
                          ),
                        },
                      })
                    }
                  >
                    <Text
                      style={
                        styles.detailBtnText
                      }
                    >
                      View Weekly Breakdown
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={17}
                      color="#0B3B22"
                    />
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  label,
  value,
  tone,
  bg,
}: {
  label: string;
  value: number;
  tone: string;
  bg: string;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: bg },
      ]}
    >
      <Text
        style={[
          styles.statLabel,
          { color: tone },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.statValue,
          { color: tone },
        ]}
      >
        {value.toFixed(2)}
      </Text>

      <Text
        style={[
          styles.statUnit,
          { color: tone },
        ]}
      >
        LKR/kg
      </Text>
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

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
    height: 220,
  },

  safe: {
    flex: 1,
  },

  hero: {
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 9,
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
    marginBottom: 4,
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
    fontSize: 21,
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
    textAlign: "center",
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

  scrollContent: {
    paddingBottom: 28,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 30,
    paddingTop: 50,
  },

  logoLoadingWrap: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  logoRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#DCFCE7",
    borderTopColor: "#15803D",
  },

  logoImage: {
    width: 54,
    height: 54,
  },

  centerStateTitle: {
    fontSize: 14.5,
    fontFamily:
      "Poppins_700Bold",
    color: "#1F2937",
    marginTop: 4,
  },

  centerStateText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    fontFamily:
      "Poppins_500Medium",
    lineHeight: 19,
  },

  errorIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  errorTitle: {
    fontSize: 15,
    fontFamily:
      "Poppins_700Bold",
    color: "#1F2937",
  },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  retryText: {
    fontSize: 13,
    fontFamily:
      "Poppins_700Bold",
    color: "#15803D",
  },

  chartCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  chartTitle: {
    fontSize: 13.5,
    fontFamily:
      "Poppins_700Bold",
    color: "#1F2937",
  },

  paddyTypePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  paddyTypePillText: {
    fontSize: 9.5,
    fontFamily:
      "Poppins_700Bold",
    color: "#B45309",
  },

  chartAxisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  chartAxisLabel: {
    fontSize: 10.5,
    color: "#9CA3AF",
    fontFamily:
      "Poppins_500Medium",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },

  statLabel: {
    fontSize: 9.5,
    fontFamily:
      "Poppins_600SemiBold",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    opacity: 0.85,
  },

  statValue: {
    fontSize: 17,
    fontFamily:
      "Poppins_800ExtraBold",
  },

  statUnit: {
    fontSize: 9.5,
    fontFamily:
      "Poppins_500Medium",
    opacity: 0.8,
  },

  infoCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F1F1EF",
  },

  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  infoIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCardTitle: {
    fontSize: 13.5,
    fontFamily:
      "Poppins_700Bold",
    color: "#1F2937",
  },

  infoCardText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: "#4B5563",
    fontFamily:
      "Poppins_500Medium",
  },

  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    backgroundColor: "#FEF3C7",
    marginTop: 4,
  },

  detailBtnText: {
    fontSize: 14.5,
    fontFamily:
      "Poppins_700Bold",
    color: "#92400E",
  },
});