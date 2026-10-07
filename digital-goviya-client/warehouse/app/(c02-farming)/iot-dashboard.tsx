import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../i18n";
import { Ionicons } from "@expo/vector-icons";
import { database } from "@/services/c02-farming/firebase";
import { ref, onValue, off } from "firebase/database";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Interfaces ───────────────────────────────────────────────────────────────
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

interface SensorConfig {
  key: keyof Omit<SensorData, "timestamp">;
  label: string;
  unit: string;
  icon: string;
  accent: string;
  min: number;
  max: number;
  idealMin: number;
  idealMax: number;
  description: string;
}

// ─── Sensor Configurations ───────────────────────────────────────────────────
const PRIMARY_SENSORS: SensorConfig[] = [
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: "thermometer-outline",
    accent: "#D97706",
    min: 0,
    max: 50,
    idealMin: 18,
    idealMax: 30,
    description: "Ambient air temperature surrounding the plant canopy.",
  },
  {
    key: "soilMoisture",
    label: "Soil Moisture",
    unit: "%",
    icon: "water-outline",
    accent: "#059669",
    min: 0,
    max: 100,
    idealMin: 30,
    idealMax: 70,
    description: "Volumetric water content in the plant root zone.",
  },
  {
    key: "humidity",
    label: "Humidity",
    unit: "%",
    icon: "cloudy-night-outline",
    accent: "#2563EB",
    min: 0,
    max: 100,
    idealMin: 40,
    idealMax: 70,
    description: "Relative moisture content of the surrounding air.",
  },
];

const SECONDARY_SENSORS: SensorConfig[] = [
  {
    key: "ph",
    label: "pH Level",
    unit: "pH",
    icon: "flask-outline",
    accent: "#7C3AED",
    min: 0,
    max: 14,
    idealMin: 5.5,
    idealMax: 7.5,
    description: "Soil acidity or alkalinity affecting nutrient availability.",
  },
  {
    key: "nitrogen",
    label: "Nitrogen (N)",
    unit: "mg/kg",
    icon: "leaf-outline",
    accent: "#16A34A",
    min: 0,
    max: 100,
    idealMin: 20,
    idealMax: 50,
    description: "Essential for foliage development and vegetative growth.",
  },
  {
    key: "phosphorus",
    label: "Phosphorus (P)",
    unit: "mg/kg",
    icon: "sunny-outline",
    accent: "#CA8A04",
    min: 0,
    max: 60,
    idealMin: 10,
    idealMax: 30,
    description: "Supports root expansion, flowering, and fruit development.",
  },
  {
    key: "potassium",
    label: "Potassium (K)",
    unit: "mg/kg",
    icon: "flash-outline",
    accent: "#E11D48",
    min: 0,
    max: 80,
    idealMin: 15,
    idealMax: 40,
    description: "Regulates water movement and overall plant stress tolerance.",
  },
];

function getStatus(config: SensorConfig, t: any, value?: number) {
  if (value === undefined) return { label: t.noData, color: "#64748B" };
  if (value < config.idealMin) return { label: t.low, color: "#D97706" };
  if (value > config.idealMax) return { label: t.high, color: "#DC2626" };
  return { label: t.optimal, color: "#16A34A" };
}

// ─── Main Screen Component ───────────────────────────────────────────────────
export default function IoTDashboardScreen() {
  const { language } = useLanguage();
  const t = translations[language].c02Farming.iotDashboard;
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedSensor, setSelectedSensor] = useState<SensorConfig | null>(null);
  const [espModalVisible, setEspModalVisible] = useState(false);

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
          setError("No sensor telemetry found.");
        }
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error("Firebase error:", err);
        setError("Failed to fetch sensor data.");
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => off(sensorRef);
  }, []);

  const isOnline = (() => {
    if (!sensorData?.timestamp) return false;
    try {
      return Date.now() - new Date(sensorData.timestamp).getTime() < 5 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>{t.connecting}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? "#16A34A" : "#DC2626" }]} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 1. ESP32 Main Hero Box (Largest) */}
        <Pressable style={styles.espHeroCard} onPress={() => setEspModalVisible(true)}>
          <View style={styles.espTopRow}>
            <View style={[styles.espIconBox, { backgroundColor: isOnline ? "#DCFCE7" : "#FEE2E2" }]}>
              <Ionicons name="hardware-chip-outline" size={24} color={isOnline ? "#16A34A" : "#DC2626"} />
            </View>
            <View style={[styles.badge, { backgroundColor: isOnline ? "#DCFCE7" : "#FEE2E2" }]}>
              <View style={[styles.badgeDot, { backgroundColor: isOnline ? "#16A34A" : "#DC2626" }]} />
              <Text style={[styles.badgeText, { color: isOnline ? "#15803D" : "#B91C1C" }]}>
                {isOnline ? t.online : t.offline}
              </Text>
            </View>
          </View>

          <View style={styles.espBody}>
            <Text style={styles.espTitle}>{t.espTitle}</Text>
            <Text style={styles.espSubtitle}>
              {sensorData?.timestamp ? `Sync Time: ${sensorData.timestamp}` : t.noTelemetry}
            </Text>
          </View>

          <View style={styles.espFooter}>
            <Text style={styles.espActionText}>{t.tapToView}</Text>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </View>
        </Pressable>

        {/* Section: Main Sensors (Temperature, Soil Moisture, Humidity) */}
        <Text style={styles.sectionTitle}>{t.mainMetrics}</Text>
        <View style={styles.primaryGrid}>
          {PRIMARY_SENSORS.map((config) => {
            const val = sensorData?.[config.key];
            const status = getStatus(config, t, val);
            return (
              <Pressable key={config.key} style={styles.primaryCard} onPress={() => setSelectedSensor(config)}>
                <View style={styles.primaryHeader}>
                  <View style={[styles.iconBox, { backgroundColor: `${config.accent}15` }]}>
                    <Ionicons name={config.icon as any} size={20} color={config.accent} />
                  </View>
                  <View style={[styles.statusTag, { backgroundColor: `${status.color}15` }]}>
                    <Text style={[styles.statusTagText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <Text style={styles.primaryLabel}>{(t as any)[config.key]}</Text>
                <Text style={styles.primaryValue}>
                  {val !== undefined ? val.toFixed(1) : "—"}
                  <Text style={styles.primaryUnit}> {config.unit}</Text>
                </Text>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${val !== undefined ? Math.min(100, Math.max(0, ((val - config.min) / (config.max - config.min)) * 100)) : 0}%`,
                        backgroundColor: config.accent,
                      },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Section: Small Sensor Metrics (NPK, pH) */}
        {/* <Text style={styles.sectionTitle}>{t.soilNutrients}</Text>
        <View style={styles.secondaryGrid}>
          {SECONDARY_SENSORS.map((config) => {
            const val = sensorData?.[config.key];
            return (
              <Pressable key={config.key} style={styles.secondaryCard} onPress={() => setSelectedSensor(config)}>
                <View style={styles.secondaryHeader}>
                  <Ionicons name={config.icon as any} size={15} color={config.accent} />
                  <Text style={styles.secondaryLabel} numberOfLines={1}>
                    {(t as any)[config.key]}
                  </Text>
                </View>
                <Text style={styles.secondaryValue}>
                  {val !== undefined ? val.toFixed(1) : "—"}
                  <Text style={styles.secondaryUnit}> {config.unit}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View> */}
      </ScrollView>

      {/* ── Modal: ESP32 Hardware Details ── */}
      <Modal visible={espModalVisible} transparent animationType="slide" onRequestClose={() => setEspModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEspModalVisible(false)}>
          <Pressable style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="hardware-chip-outline" size={22} color="#059669" />
                <Text style={styles.modalTitle}>{t.boardInfo}</Text>
              </View>
              <TouchableOpacity onPress={() => setEspModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>{t.connStatus}</Text>
              <Text style={[styles.infoVal, { color: isOnline ? "#16A34A" : "#DC2626" }]}>
                {isOnline ? t.active : t.disconnected}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>{t.chipset}</Text>
              <Text style={styles.infoVal}>ESP32 Dual-Core</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>{t.firmware}</Text>
              <Text style={styles.infoVal}>v2.4.1-build</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>{t.dbProtocol}</Text>
              <Text style={styles.infoVal}>Firebase Realtime DB</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>{t.lastTrans}</Text>
              <Text style={styles.infoVal}>{sensorData?.timestamp || t.na}</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Modal: Individual Sensor Metric ── */}
      <Modal visible={!!selectedSensor} transparent animationType="fade" onRequestClose={() => setSelectedSensor(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedSensor(null)}>
          {selectedSensor && (
            <Pressable style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${selectedSensor.accent}15` }]}>
                  <Ionicons name={selectedSensor.icon as any} size={20} color={selectedSensor.accent} />
                </View>
                <TouchableOpacity onPress={() => setSelectedSensor(null)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSensorTitle}>{(t as any)[selectedSensor.key]}</Text>
              <Text style={styles.modalSensorValue}>
                {sensorData?.[selectedSensor.key] !== undefined ? sensorData[selectedSensor.key].toFixed(1) : "—"} {selectedSensor.unit}
              </Text>

              <Text style={styles.modalSensorDesc}>{(t as any)[selectedSensor.key === "temperature" ? "tempDesc" : selectedSensor.key === "soilMoisture" ? "soilDesc" : selectedSensor.key === "humidity" ? "humDesc" : selectedSensor.key === "ph" ? "phDesc" : selectedSensor.key === "nitrogen" ? "nDesc" : selectedSensor.key === "phosphorus" ? "pDesc" : "kDesc"]}</Text>

              <View style={styles.idealRangeBox}>
                <Text style={styles.idealRangeText}>
                  {t.idealTarget} {selectedSensor.idealMin} {selectedSensor.unit} – {selectedSensor.idealMax} {selectedSensor.unit}
                </Text>
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#64748B", marginTop: 12, fontSize: 13 },
  container: { flex: 1, paddingHorizontal: 16 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleWrap: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  headerSubtitle: { fontSize: 11, color: "#64748B", marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  // Error Banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 8,
  },
  errorText: { color: "#991B1B", fontSize: 12 },

  // ESP Hero Card
  espHeroCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  espTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  espIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  badge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  espBody: { marginVertical: 12 },
  espTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  espSubtitle: { fontSize: 12, color: "#64748B", marginTop: 2 },
  espFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 10 },
  espActionText: { fontSize: 11, color: "#64748B", fontWeight: "500" },

  // Section titles
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 12 },

  // Primary Sensor Cards (Temp, Moisture, Humidity)
  primaryGrid: { gap: 12, marginBottom: 20 },
  primaryCard: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  primaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusTagText: { fontSize: 10, fontWeight: "700" },
  primaryLabel: { fontSize: 12, color: "#64748B", marginTop: 8 },
  primaryValue: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginVertical: 2 },
  primaryUnit: { fontSize: 13, color: "#64748B", fontWeight: "400" },
  progressTrack: { height: 4, backgroundColor: "#E2E8F0", borderRadius: 2, marginTop: 8, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 2 },

  // Secondary Grid (Small NPK & pH cards)
  secondaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  secondaryCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  secondaryHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  secondaryLabel: { fontSize: 11, color: "#64748B", fontWeight: "500" },
  secondaryValue: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginTop: 4 },
  secondaryUnit: { fontSize: 11, color: "#64748B", fontWeight: "400" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.4)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },

  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  infoKey: { color: "#64748B", fontSize: 12 },
  infoVal: { color: "#0F172A", fontSize: 12, fontWeight: "600" },

  modalSensorTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 4 },
  modalSensorValue: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  modalSensorDesc: { fontSize: 12, color: "#64748B", lineHeight: 18, marginBottom: 16 },
  idealRangeBox: { backgroundColor: "#F0FDF4", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#DCFCE7" },
  idealRangeText: { fontSize: 12, color: "#16A34A", fontWeight: "600", textAlign: "center" },
});