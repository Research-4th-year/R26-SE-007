import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { database } from "@/services/c02-farming/firebase";
import { ref, onValue, off } from "firebase/database";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────
interface SensorData {
  humidity: number;
  soilMoisture: number;
  temperature: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  ec: number;
  timestamp: string;
}

interface SensorCardConfig {
  key: keyof Omit<SensorData, "timestamp">;
  label: string;
  unit: string;
  icon: string;
  accent: string;
  gradientColors: [string, string];
  min?: number;
  max?: number;
  idealMin?: number;
  idealMax?: number;
  description?: string;
}

// ─── Sensor card configs ──────────────────────────────────────────────────────
const SENSOR_CARDS: SensorCardConfig[] = [
  {
    key: "temperature", label: "Temperature", unit: "°C",
    icon: "thermometer", accent: "#F59E0B",
    gradientColors: ["rgba(245,158,11,0.18)", "rgba(245,158,11,0.05)"],
    min: 0, max: 50, idealMin: 18, idealMax: 30,
    description: "Ambient air temperature around the crop canopy. Extreme highs stress plants and speed up water loss; extreme lows slow growth.",
  },
  {
    key: "humidity", label: "Humidity", unit: "%",
    icon: "water", accent: "#3B82F6",
    gradientColors: ["rgba(59,130,246,0.18)", "rgba(59,130,246,0.05)"],
    min: 0, max: 100, idealMin: 40, idealMax: 70,
    description: "Relative moisture in the surrounding air. Too low can cause wilting; too high raises the risk of fungal disease.",
  },
  {
    key: "soilMoisture", label: "Soil Moisture", unit: "%",
    icon: "earth", accent: "#10B981",
    gradientColors: ["rgba(16,185,129,0.18)", "rgba(16,185,129,0.05)"],
    min: 0, max: 100, idealMin: 30, idealMax: 70,
    description: "Water content held in the root zone. Keeping this in range avoids both drought stress and waterlogged roots.",
  },
  {
    key: "ph", label: "pH Level", unit: "",
    icon: "flask", accent: "#8B5CF6",
    gradientColors: ["rgba(139,92,246,0.18)", "rgba(139,92,246,0.05)"],
    min: 0, max: 14, idealMin: 5.5, idealMax: 7.5,
    description: "Soil acidity or alkalinity. Most crops absorb nutrients best in a mildly acidic to neutral range.",
  },
  {
    key: "nitrogen", label: "Nitrogen (N)", unit: "mg/kg",
    icon: "leaf", accent: "#22C55E",
    gradientColors: ["rgba(34,197,94,0.18)", "rgba(34,197,94,0.05)"],
    min: 0, max: 100, idealMin: 20, idealMax: 50,
    description: "Drives leaf and stem growth. Low nitrogen shows up as pale, yellowing leaves and stunted growth.",
  },
  {
    key: "phosphorus", label: "Phosphorus (P)", unit: "mg/kg",
    icon: "sunny", accent: "#EAB308",
    gradientColors: ["rgba(234,179,8,0.18)", "rgba(234,179,8,0.05)"],
    min: 0, max: 60, idealMin: 10, idealMax: 30,
    description: "Supports root development, flowering and fruiting. Deficiency often slows maturity.",
  },
  {
    key: "potassium", label: "Potassium (K)", unit: "mg/kg",
    icon: "flash", accent: "#F43F5E",
    gradientColors: ["rgba(244,63,94,0.18)", "rgba(244,63,94,0.05)"],
    min: 0, max: 80, idealMin: 15, idealMax: 40,
    description: "Regulates water balance and disease resistance in the plant. Deficiency weakens stems and lowers yield quality.",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getStatus(config: SensorCardConfig, value: number | undefined) {
  if (value === undefined || config.idealMin === undefined || config.idealMax === undefined) {
    return { label: "No data", color: "#9CA3AF" };
  }
  if (value < config.idealMin) return { label: "Low", color: "#F59E0B" };
  if (value > config.idealMax) return { label: "High", color: "#EF4444" };
  return { label: "Optimal", color: "#22C55E" };
}

// ─── Sensor Detail Modal ──────────────────────────────────────────────────────
function SensorDetailModal({
  visible,
  onClose,
  config,
  value,
  timestamp,
}: {
  visible: boolean;
  onClose: () => void;
  config: SensorCardConfig | null;
  value: number | undefined;
  timestamp: string | undefined;
}) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!config) return null;

  const status = getStatus(config, value);
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const clamped = value !== undefined ? Math.min(max, Math.max(min, value)) : min;
  const pct = ((clamped - min) / (max - min)) * 100;
  const idealStartPct = config.idealMin !== undefined ? ((config.idealMin - min) / (max - min)) * 100 : 0;
  const idealEndPct = config.idealMax !== undefined ? ((config.idealMax - min) / (max - min)) * 100 : 100;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />

      <View style={modalStyles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            modalStyles.sheet,
            { opacity: slideAnim, transform: [{ translateY }] },
          ]}
        >
          <LinearGradient
            colors={["#123B24", "#0C2A19"]}
            style={modalStyles.sheetGradient}
          >
            <View style={modalStyles.sheetHeader}>
              <View style={[modalStyles.sheetIcon, { backgroundColor: config.accent }]}>
                <Ionicons name={config.icon as any} size={20} color="white" />
              </View>
              <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} hitSlop={10}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            <Text style={modalStyles.sheetLabel}>{config.label}</Text>

            <View style={modalStyles.valueRow}>
              <Text style={modalStyles.sheetValue}>
                {value !== undefined ? (typeof value === "number" ? value.toFixed(1) : value) : "—"}
              </Text>
              {!!config.unit && <Text style={modalStyles.sheetUnit}>{config.unit}</Text>}
              <View style={[modalStyles.statusPill, { backgroundColor: `${status.color}26`, borderColor: `${status.color}55` }]}>
                <View style={[modalStyles.statusDot, { backgroundColor: status.color }]} />
                <Text style={[modalStyles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>

            {/* Range bar with ideal band */}
            <View style={modalStyles.rangeWrap}>
              <View style={modalStyles.rangeTrack}>
                <View
                  style={[
                    modalStyles.idealBand,
                    { left: `${idealStartPct}%`, width: `${Math.max(0, idealEndPct - idealStartPct)}%` },
                  ]}
                />
                <View style={[modalStyles.rangeMarker, { left: `${Math.min(97, Math.max(0, pct))}%`, backgroundColor: config.accent }]} />
              </View>
              <View style={modalStyles.rangeLabels}>
                <Text style={modalStyles.rangeLabelText}>{min}</Text>
                <Text style={modalStyles.rangeLabelText}>{max}</Text>
              </View>
            </View>

            {config.description && (
              <Text style={modalStyles.sheetDescription}>{config.description}</Text>
            )}

            <View style={modalStyles.sheetFooter}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.45)" />
              <Text style={modalStyles.sheetFooterText}>
                Last updated {timestamp ? timestamp : "unknown"}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Animated Sensor Card ─────────────────────────────────────────────────────
function SensorCard({
  config,
  value,
  index,
  onPress,
}: {
  config: SensorCardConfig;
  value: number | undefined;
  index: number;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
        delay: index * 80,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const status = getStatus(config, value);

  const progress =
    value !== undefined && config.max !== undefined
      ? Math.min(100, Math.max(0, ((value - (config.min || 0)) / (config.max - (config.min || 0))) * 100))
      : 0;

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.96, friction: 8, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <Animated.View
      style={[
        styles.sensorCard,
        { width: CARD_WIDTH, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
      >
        <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
          <LinearGradient
            colors={config.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sensorCardGradient}
          >
            <View style={styles.sensorCardTop}>
              <View style={[styles.sensorIconCircle, { backgroundColor: config.accent }]}>
                <Ionicons name={config.icon as any} size={17} color="white" />
              </View>
              <View style={[styles.statusChip, { backgroundColor: `${status.color}22` }]}>
                <View style={[styles.statusChipDot, { backgroundColor: status.color }]} />
              </View>
            </View>

            <Text style={styles.sensorLabel}>{config.label}</Text>

            <Text style={styles.sensorValue}>
              {value !== undefined ? (
                <>
                  {typeof value === "number" ? value.toFixed(1) : value}
                  <Text style={styles.sensorUnit}> {config.unit}</Text>
                </>
              ) : (
                "—"
              )}
            </Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progress}%`, backgroundColor: config.accent },
                ]}
              />
            </View>

            <View style={styles.tapHintRow}>
              <Text style={styles.tapHintText}>Details</Text>
              <Ionicons name="chevron-forward" size={11} color="rgba(255,255,255,0.4)" />
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Device Status Card ───────────────────────────────────────────────────────
function DeviceStatusCard({
  timestamp,
  isOnline,
}: {
  timestamp: string | undefined;
  isOnline: boolean;
}) {
  return (
    <View style={[styles.sensorCard, { width: CARD_WIDTH }]}>
      <LinearGradient
        colors={isOnline ? ["rgba(34,197,94,0.18)", "rgba(34,197,94,0.05)"] : ["rgba(239,68,68,0.18)", "rgba(239,68,68,0.05)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.sensorCardGradient, { flex: 1, justifyContent: "space-between" }]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={[styles.sensorIconCircle, { backgroundColor: isOnline ? "#22C55E" : "#EF4444" }]}>
            <Ionicons name="hardware-chip" size={18} color="white" />
          </View>
          <View style={[styles.liveDotSmall, { backgroundColor: isOnline ? "#22C55E" : "#EF4444", marginTop: 8 }]} />
        </View>
        <View style={{ marginTop: 10 }}>
          <Text style={styles.sensorLabel}>ESP32 Board</Text>
          <Text style={[styles.sensorValue, { fontSize: 18, color: isOnline ? "#BBF7D0" : "#FECACA" }]}>
            {isOnline ? "Online" : "Offline"}
          </Text>
          <Text style={styles.sensorUnit} numberOfLines={1}>
            {timestamp ? timestamp.split(' ')[1] || timestamp : "No Data"}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Temperature Dial Card ────────────────────────────────────────────────────
function TemperatureDialCard({
  value,
  config,
  onPress,
}: {
  value: number | undefined;
  config: SensorCardConfig;
  onPress: () => void;
}) {
  const size = CARD_WIDTH - 32; // minus padding
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const angle = 270; // 3/4 circle
  const arcLength = (circumference * angle) / 360;

  const min = config.min || 0;
  const max = config.max || 50;
  const val = value !== undefined ? Math.min(max, Math.max(min, value)) : 0;
  const progress = value !== undefined ? ((val - min) / (max - min)) * 100 : 0;
  const strokeDashoffset = arcLength - (arcLength * progress) / 100;

  return (
    <Pressable style={[styles.sensorCard, { width: CARD_WIDTH }]} onPress={onPress}>
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.sensorCardGradient, { alignItems: "center", justifyContent: "center", flex: 1 }]}
      >
        <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.sensorLabel}>{config.label}</Text>
          <Ionicons name={config.icon as any} size={14} color={config.accent} />
        </View>

        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }}>
          <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '135deg' }] }}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={config.accent}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={[styles.sensorValue, { marginBottom: -4, fontSize: 26 }]}>
              {value !== undefined ? (typeof value === "number" ? value.toFixed(1) : value) : "—"}
            </Text>
            <Text style={[styles.sensorUnit, { fontSize: 12 }]}>{config.unit}</Text>
          </View>
        </View>
        <View style={styles.tapHintRow}>
          <Text style={styles.tapHintText}>Details</Text>
          <Ionicons name="chevron-forward" size={11} color="rgba(255,255,255,0.4)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function IoTDashboardScreen() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorCardConfig | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Determine online status based on timestamp freshness (< 5 minutes ago)
  const isOnline = (() => {
    if (!sensorData?.timestamp) return false;
    try {
      const dataTime = new Date(sensorData.timestamp).getTime();
      const now = Date.now();
      return now - dataTime < 5 * 60 * 1000; // 5 minutes
    } catch {
      return false;
    }
  })();

  // Pulse animation for online indicator
  useEffect(() => {
    if (isOnline) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isOnline]);

  // Firebase Realtime Database listener
  useEffect(() => {
    const sensorRef = ref(database, "sensor");

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSensorData(data as SensorData);
          setError(null);
        } else {
          setError("No sensor data available.");
        }
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Firebase read error:", err);
        setError("Failed to connect to sensor. Check your connection.");
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => off(sensorRef);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    // The onValue listener will automatically deliver fresh data
    setTimeout(() => setRefreshing(false), 1500);
  };

  const openSensorDetail = (config: SensorCardConfig) => {
    setSelectedSensor(config);
    setModalVisible(true);
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#0A331D", "#12522E", "#0B3B22"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#F5C542" />
        <Text style={styles.loadingText}>Connecting to sensors…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0A331D", "#12522E", "#0B3B22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroBg}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.headerTitle}>IoT Dashboard</Text>
          <Text style={styles.headerSubtitle}>Live Farm Monitoring</Text>
        </View>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={[styles.liveIndicator, { backgroundColor: isOnline ? "#22C55E" : "#EF4444" }]}>
            <View style={[styles.liveDotInner, { backgroundColor: isOnline ? "#BBF7D0" : "#FECACA" }]} />
          </View>
        </Animated.View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5C542" />
        }
      >
        {/* Top Row: Device Status & Temperature Dial */}
        <View style={[styles.cardsGrid, { marginBottom: 16 }]}>
          <DeviceStatusCard timestamp={sensorData?.timestamp} isOnline={isOnline} />
          <TemperatureDialCard
            value={sensorData?.temperature}
            config={SENSOR_CARDS.find(c => c.key === 'temperature')!}
            onPress={() => openSensorDetail(SENSOR_CARDS.find(c => c.key === 'temperature')!)}
          />
        </View>

        {/* Error state */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="warning" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Section title */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="stats-chart" size={15} color="rgba(255,255,255,0.85)" />
            <Text style={styles.sectionTitle}>Other Sensors</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        {/* Other Sensor cards grid */}
        <View style={styles.cardsGrid}>
          {SENSOR_CARDS.filter(c => c.key !== 'temperature').map((config, index) => (
            <SensorCard
              key={config.key}
              config={config}
              value={sensorData?.[config.key]}
              index={index}
              onPress={() => openSensorDetail(config)}
            />
          ))}
        </View>

        {/* NPK summary card */}
        {sensorData && (
          <View style={styles.npkCard}>
            <Text style={styles.npkTitle}>
              <Ionicons name="analytics" size={16} color="#0A331D" /> Soil Nutrient Summary
            </Text>
            <View style={styles.npkRow}>
              <NPKBar label="N" value={sensorData.nitrogen} max={100} color="#22C55E" />
              <NPKBar label="P" value={sensorData.phosphorus} max={60} color="#EAB308" />
              <NPKBar label="K" value={sensorData.potassium} max={80} color="#F43F5E" />
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <SensorDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        config={selectedSensor}
        value={selectedSensor ? sensorData?.[selectedSensor.key] : undefined}
        timestamp={sensorData?.timestamp}
      />
    </View>
  );
}

// ─── NPK Bar component ───────────────────────────────────────────────────────
function NPKBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View style={styles.npkBarContainer}>
      <Text style={[styles.npkLabel, { color }]}>{label}</Text>
      <View style={styles.npkBarTrack}>
        <View style={[styles.npkBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.npkValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A331D" },
  heroBg: { ...StyleSheet.absoluteFill },
  loadingText: {
    color: "rgba(255,255,255,0.7)", marginTop: 12,
    fontFamily: "Poppins_500Medium", fontSize: 14,
  },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold", fontSize: 18, color: "white",
  },
  headerSubtitle: {
    fontFamily: "Poppins_500Medium", fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 1,
  },
  liveIndicator: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center",
  },
  liveDotInner: {
    width: 10, height: 10, borderRadius: 5,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 8 },

  // Error – glass
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(239,68,68,0.15)", padding: 14, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
  },
  errorText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#FCA5A5", flex: 1 },

  // Section header
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold", fontSize: 16, color: "white",
  },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(239,68,68,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.25)",
  },
  liveDotSmall: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444",
  },
  liveBadgeText: {
    fontFamily: "Poppins_700Bold", fontSize: 10, color: "#FCA5A5", letterSpacing: 0.8,
  },

  // Cards grid
  cardsGrid: {
    flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between",
  },

  // Individual sensor card – glass
  sensorCard: { marginBottom: 14, borderRadius: 18, ...cardShadow },
  sensorCardGradient: {
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  sensorCardTop: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 10,
  },
  sensorIconCircle: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  statusChip: {
    width: 20, height: 20, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  statusChipDot: {
    width: 7, height: 7, borderRadius: 3.5,
  },
  sensorLabel: {
    fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  sensorValue: {
    fontFamily: "Poppins_800ExtraBold", fontSize: 22, color: "white",
    marginBottom: 8,
  },
  sensorUnit: {
    fontFamily: "Poppins_500Medium", fontSize: 12, color: "rgba(255,255,255,0.5)",
  },
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 2 },
  tapHintRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: 2, marginTop: 10,
  },
  tapHintText: {
    fontFamily: "Poppins_500Medium", fontSize: 10, color: "rgba(255,255,255,0.4)",
  },

  // NPK Summary – glass
  npkCard: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 20, marginTop: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", ...cardShadow,
  },
  npkTitle: {
    fontFamily: "Poppins_700Bold", fontSize: 14, color: "white", marginBottom: 16,
  },
  npkRow: { gap: 12 },
  npkBarContainer: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  npkLabel: {
    fontFamily: "Poppins_800ExtraBold", fontSize: 16, width: 22, textAlign: "center",
  },
  npkBarTrack: {
    flex: 1, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  npkBarFill: { height: "100%", borderRadius: 5 },
  npkValue: {
    fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.8)", width: 40,
    textAlign: "right",
  },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const modalStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,20,12,0.72)" },
  centerWrap: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 24,
  },
  sheet: {
    width: "100%", maxWidth: 400, borderRadius: 24, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24 },
      android: { elevation: 10 },
      default: {},
    }),
  },
  sheetGradient: { padding: 22 },
  sheetHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14,
  },
  sheetIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center", alignItems: "center",
  },
  sheetLabel: {
    fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4,
  },
  valueRow: {
    flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", gap: 8, marginBottom: 18,
  },
  sheetValue: {
    fontFamily: "Poppins_800ExtraBold", fontSize: 34, color: "white",
  },
  sheetUnit: {
    fontFamily: "Poppins_500Medium", fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 6,
  },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  rangeWrap: { marginBottom: 16 },
  rangeTrack: {
    height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "visible", justifyContent: "center",
  },
  idealBand: {
    position: "absolute", top: 0, bottom: 0, borderRadius: 4,
    backgroundColor: "rgba(34,197,94,0.35)",
  },
  rangeMarker: {
    position: "absolute", width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: "white", top: -3,
  },
  rangeLabels: {
    flexDirection: "row", justifyContent: "space-between", marginTop: 6,
  },
  rangeLabelText: {
    fontFamily: "Poppins_500Medium", fontSize: 10, color: "rgba(255,255,255,0.4)",
  },
  sheetDescription: {
    fontFamily: "Poppins_500Medium", fontSize: 13, lineHeight: 19, color: "rgba(255,255,255,0.75)",
    marginBottom: 16,
  },
  sheetFooter: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", paddingTop: 12,
  },
  sheetFooterText: {
    fontFamily: "Poppins_500Medium", fontSize: 11, color: "rgba(255,255,255,0.45)",
  },
});