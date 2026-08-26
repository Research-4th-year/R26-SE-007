import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  RefreshControl,
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
  gradientColors: [string, string];
  iconBg: string;
  min?: number;
  max?: number;
}

// ─── Sensor card configs ──────────────────────────────────────────────────────
const SENSOR_CARDS: SensorCardConfig[] = [
  {
    key: "temperature", label: "Temperature", unit: "°C",
    icon: "thermometer", gradientColors: ["rgba(245,158,11,0.15)", "rgba(245,158,11,0.08)"],
    iconBg: "#F59E0B", min: 0, max: 50,
  },
  {
    key: "humidity", label: "Humidity", unit: "%",
    icon: "water", gradientColors: ["rgba(59,130,246,0.15)", "rgba(59,130,246,0.08)"],
    iconBg: "#3B82F6", min: 0, max: 100,
  },
  {
    key: "soilMoisture", label: "Soil Moisture", unit: "%",
    icon: "earth", gradientColors: ["rgba(16,185,129,0.15)", "rgba(16,185,129,0.08)"],
    iconBg: "#10B981", min: 0, max: 100,
  },
  {
    key: "ph", label: "pH Level", unit: "",
    icon: "flask", gradientColors: ["rgba(139,92,246,0.15)", "rgba(139,92,246,0.08)"],
    iconBg: "#8B5CF6", min: 0, max: 14,
  },
  {
    key: "nitrogen", label: "Nitrogen (N)", unit: "mg/kg",
    icon: "leaf", gradientColors: ["rgba(34,197,94,0.15)", "rgba(34,197,94,0.08)"],
    iconBg: "#22C55E", min: 0, max: 100,
  },
  {
    key: "phosphorus", label: "Phosphorus (P)", unit: "mg/kg",
    icon: "sunny", gradientColors: ["rgba(234,179,8,0.15)", "rgba(234,179,8,0.08)"],
    iconBg: "#EAB308", min: 0, max: 60,
  },
  {
    key: "potassium", label: "Potassium (K)", unit: "mg/kg",
    icon: "flash", gradientColors: ["rgba(244,63,94,0.15)", "rgba(244,63,94,0.08)"],
    iconBg: "#F43F5E", min: 0, max: 80,
  },
];

// ─── Animated Sensor Card ─────────────────────────────────────────────────────
function SensorCard({
  config,
  value,
  index,
}: {
  config: SensorCardConfig;
  value: number | undefined;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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

  // Progress bar percentage
  const progress =
    value !== undefined && config.max !== undefined
      ? Math.min(100, Math.max(0, ((value - (config.min || 0)) / (config.max - (config.min || 0))) * 100))
      : 0;

  return (
    <Animated.View
      style={[
        styles.sensorCard,
        { width: CARD_WIDTH, opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.sensorCardGradient}
      >
        {/* Icon */}
        <View style={[styles.sensorIconCircle, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon as any} size={18} color="white" />
        </View>

        {/* Label */}
        <Text style={styles.sensorLabel}>{config.label}</Text>

        {/* Value */}
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

        {/* Mini progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              { width: `${progress}%`, backgroundColor: config.iconBg },
            ]}
          />
        </View>
      </LinearGradient>
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
        colors={isOnline ? ["rgba(34,197,94,0.15)", "rgba(34,197,94,0.08)"] : ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.08)"]}
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
  config
}: {
  value: number | undefined;
  config: SensorCardConfig;
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
    <View style={[styles.sensorCard, { width: CARD_WIDTH }]}>
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.sensorCardGradient, { alignItems: "center", justifyContent: "center", flex: 1 }]}
      >
        <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={styles.sensorLabel}>{config.label}</Text>
          <Ionicons name={config.icon as any} size={14} color={config.iconBg} />
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
              stroke={config.iconBg}
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
      </LinearGradient>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function IoTDashboardScreen() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
        <Text style={styles.headerTitle}>IoT Dashboard</Text>
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
          <Text style={styles.sectionTitle}>Other Sensors</Text>
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

  // Device banner – glass
  deviceBanner: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 18,
    marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  deviceRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 14,
  },
  deviceLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#22C55E", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 4,
  },
  deviceName: {
    fontFamily: "Poppins_700Bold", fontSize: 15, color: "white",
  },
  deviceSubtext: {
    fontFamily: "Poppins_500Medium", fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1,
  },

  // Pills – glass
  pillRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  pillText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },

  // Sync
  syncRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  syncText: { fontFamily: "Poppins_500Medium", fontSize: 11, color: "rgba(255,255,255,0.5)" },

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
    fontFamily: "Poppins_700Bold", fontSize: 17, color: "white",
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
  sensorCard: { marginBottom: 14 },
  sensorCardGradient: {
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  sensorIconCircle: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginBottom: 10,
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

  // NPK Summary – glass
  npkCard: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, padding: 20, marginTop: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
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
