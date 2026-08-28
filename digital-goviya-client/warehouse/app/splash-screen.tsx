import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions, Image,  } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const WELCOME_ROUTE = "/welcome";

const LOGO = require("../assets/logo.png");

const { width } = Dimensions.get("window");

const LOADING_MESSAGES = [
  "Preparing your fields…",
  "Checking today's market…",
  "Loading market prices…",
  "Getting everything ready…",
];

const STALK_COUNT = 9;
const STALK_HEIGHT = 110;

function GrowingPaddyField({ growth }: { growth: Animated.Value }) {
  return (
    <View style={styles.fieldRow}>
      {Array.from({ length: STALK_COUNT }).map((_, i) => {
        const delay = i * 0.09;
        const inputRange = [Math.min(delay, 0.85), Math.min(delay + 0.35, 1)];
        const targetHeight = STALK_HEIGHT - (i % 3) * 14;

        const stalkHeight = growth.interpolate({
          inputRange,
          outputRange: [0, targetHeight],
          extrapolate: "clamp",
        });
        const grainScale = growth.interpolate({
          inputRange: [inputRange[1] * 0.9, inputRange[1]],
          outputRange: [0, 1],
          extrapolate: "clamp",
        });
        const grainOpacity = growth.interpolate({
          inputRange: [inputRange[1] * 0.9, inputRange[1]],
          outputRange: [0, 1],
          extrapolate: "clamp",
        });

        return (
          <View key={i} style={styles.stalkColumn}>
            <Animated.View
              style={[
                styles.grainHead,
                { opacity: grainOpacity, transform: [{ scale: grainScale }] },
              ]}
            />
            <Animated.View style={[styles.stalk, { height: stalkHeight }]} />
          </View>
        );
      })}
    </View>
  );
}

export default function SplashScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const [messageIndex, setMessageIndex] = useState(0);

  const sunRise = useRef(new Animated.Value(0)).current;
  const growth = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(1)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(14)).current;
  const dotsFade = useRef(new Animated.Value(0)).current;
  const grain1 = useRef(new Animated.Value(0)).current;
  const grain2 = useRef(new Animated.Value(0)).current;
  const grain3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.timing(sunRise, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(growth, {
      toValue: 1,
      duration: 1300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.delay(250),
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5.5, useNativeDriver: true }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 650,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textRise, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(dotsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringPulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const bounce = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 320,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 320,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(640 - delay),
        ])
      );
    bounce(grain1, 0).start();
    bounce(grain2, 140).start();
    bounce(grain3, 280).start();

    const captionTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 900);

    const navTimer = setTimeout(() => {
      router.replace(WELCOME_ROUTE as any);
    }, 3200);

    return () => {
      clearInterval(captionTimer);
      clearTimeout(navTimer);
    };
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const sunTranslate = sunRise.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  const sunOpacity = sunRise;
  const logoRotateDeg = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-18deg", "0deg"],
  });

  const grainStyle = (val: Animated.Value) => ({
    transform: [
      {
        translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
      },
    ],
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
  });

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0A331D", "#12522E", "#0B3B22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.sunGlow,
          { opacity: sunOpacity, transform: [{ translateY: sunTranslate }] },
        ]}
      />

      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.logoRing,
              {
                transform: [{ scale: Animated.multiply(logoScale, ringPulse) }, { rotate: logoRotateDeg }],
              },
            ]}
          >
            <View style={styles.logoCircle}>
              <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>
          </Animated.View>

          <Animated.View
            style={{ opacity: textFade, transform: [{ translateY: textRise }], alignItems: "center" }}
          >
            <Text style={styles.title}>Digital Goviya</Text>
            <Text style={styles.slogan}>Smart Paddy Management System</Text>
          </Animated.View>

          <Animated.View style={[styles.grainRow, { opacity: dotsFade }]}>
            <Animated.View style={[styles.grainDot, grainStyle(grain1)]} />
            <Animated.View style={[styles.grainDot, grainStyle(grain2)]} />
            <Animated.View style={[styles.grainDot, grainStyle(grain3)]} />
          </Animated.View>

          <Animated.Text style={[styles.caption, { opacity: dotsFade }]}>
            {LOADING_MESSAGES[messageIndex]}
          </Animated.Text>
        </View>

        <View style={styles.fieldWrap}>
          <GrowingPaddyField growth={growth} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B3B22" },
  safe: { flex: 1, justifyContent: "space-between" },

  sunGlow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#F5C542",
    opacity: 0.18,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 24,
  },

  logoRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 5,
    backgroundColor: "rgba(245,197,66,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 7,
  },
  logoImage: { width: "100%", height: "100%" },

  title: {
    color: "white",
    fontSize: 26,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  slogan: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
    textAlign: "center",
  },

  grainRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },
  grainDot: {
    width: 8,
    height: 11,
    borderRadius: 5,
    backgroundColor: "#F5C542",
  },
  caption: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },

  fieldWrap: {
    height: 140,
    justifyContent: "flex-end",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    paddingHorizontal: 12,
    height: STALK_HEIGHT + 20,
  },
  stalkColumn: {
    alignItems: "center",
  },
  stalk: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#F5C542",
  },
  grainHead: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#FDE68A",
    marginBottom: 2,
  },
});