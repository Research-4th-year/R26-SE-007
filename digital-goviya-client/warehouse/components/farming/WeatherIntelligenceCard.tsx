import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

interface WeatherData {
  source: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  windDirection: string;
}

interface DiseaseRisks {
  rice_blast_pct: number;
  brown_spot_pct: number;
  bacterial_blight_pct: number;
}

interface WeatherIntelligenceCardProps {
  weatherInfo: {
    weather: WeatherData;
    disease_risks: DiseaseRisks;
  } | null;
  district: string;
}

const getSourceInfo = (source: string) => {
  switch (source) {
    case "IOT_DEVICE":
      return {
        label: "IoT Device Connected",
        desc: "Real-time field measurements",
        icon: "hardware-chip-outline" as const,
        color: COLORS.success,
        bg: COLORS.successBg,
      };
    case "WEATHER_API":
      return {
        label: "WeatherAPI Backup Mode",
        desc: "Estimated weather for district",
        icon: "globe-outline" as const,
        color: COLORS.primary,
        bg: "#E0F2FE", // Light blue
      };
    default:
      return {
        label: "Offline Cache Mode",
        desc: "Last successfully saved data",
        icon: "server-outline" as const,
        color: COLORS.warning,
        bg: COLORS.warningBg,
      };
  }
};

const getRiskColor = (pct: number) => {
  if (pct > 70) return COLORS.dangerText;
  if (pct > 40) return COLORS.warning;
  return COLORS.success;
};

export const WeatherIntelligenceCard: React.FC<WeatherIntelligenceCardProps> = ({
  weatherInfo,
  district,
}) => {
  if (!weatherInfo) return null;

  const { weather, disease_risks } = weatherInfo;
  const sourceInfo = getSourceInfo(weather.source);

  return (
    <View style={styles.card}>
      <Text style={styles.headerTitle}>{district} Weather Intelligence</Text>
      <Text style={styles.headerDesc}>Real-time crop-climate tracking</Text>

      {/* Source Status */}
      <View
        style={[
          styles.sourceContainer,
          { backgroundColor: sourceInfo.bg, borderColor: sourceInfo.color },
        ]}
      >
        <Ionicons name={sourceInfo.icon} size={24} color={sourceInfo.color} />
        <View style={styles.sourceTextContainer}>
          <Text style={[styles.sourceLabel, { color: sourceInfo.color }]}>
            {sourceInfo.label}
          </Text>
          <Text style={styles.sourceDesc}>{sourceInfo.desc}</Text>
        </View>
      </View>

      {/* Weather Grid */}
      <View style={styles.weatherGrid}>
        <View style={styles.weatherItem}>
          <Text style={styles.weatherLabel}>Temperature</Text>
          <Text style={styles.weatherValue}>{weather.temperature}°C</Text>
        </View>
        <View style={styles.weatherItem}>
          <Text style={styles.weatherLabel}>Humidity</Text>
          <Text style={styles.weatherValue}>{weather.humidity}%</Text>
        </View>
        <View style={styles.weatherItem}>
          <Text style={styles.weatherLabel}>Rainfall</Text>
          <Text style={styles.weatherValue}>{weather.rainfall} mm</Text>
        </View>
        <View style={styles.weatherItem}>
          <Text style={styles.weatherLabel}>Wind Speed</Text>
          <Text style={styles.weatherValue}>
            {weather.windSpeed} km/h {weather.windDirection}
          </Text>
        </View>
      </View>

      {/* Disease Risks */}
      <View style={styles.riskContainer}>
        <View style={styles.riskHeaderRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
          <Text style={styles.riskTitle}>Environmental Disease Risk Forecast</Text>
        </View>

        {[
          { label: "Rice Blast Risk", val: disease_risks.rice_blast_pct },
          { label: "Brown Spot Risk", val: disease_risks.brown_spot_pct },
          { label: "Bacterial Leaf Blight Risk", val: disease_risks.bacterial_blight_pct },
        ].map((risk, idx) => (
          <View key={idx} style={styles.riskRow}>
            <View style={styles.riskLabelRow}>
              <Text style={styles.riskLabel}>{risk.label}</Text>
              <Text style={[styles.riskValue, { color: getRiskColor(risk.val) }]}>
                {risk.val}%
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${risk.val}%`, backgroundColor: getRiskColor(risk.val) },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 6,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  headerDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sourceTextContainer: {
    marginLeft: 12,
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  sourceDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  weatherGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weatherItem: {
    width: "48%",
    backgroundColor: COLORS.bgScreen,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  weatherLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  riskContainer: {
    backgroundColor: COLORS.bgScreen,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  riskHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 6,
  },
  riskRow: {
    marginBottom: 10,
  },
  riskLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  riskLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  riskValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
