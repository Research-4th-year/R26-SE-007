import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

interface CultivationPlanProps {
  plan: any;
  fieldArea: number;
  district: string;
  season: string;
  onRestart: () => void;
}

export const CultivationPlanDashboard: React.FC<CultivationPlanProps> = ({
  plan,
  fieldArea,
  district,
  season,
  onRestart,
}) => {
  if (!plan) return null;

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>Cultivation Dashboard: {plan.variety.name}</Text>
        <Text style={styles.subtitle}>
          Customized for {fieldArea} Hectares in {district} during {season}
        </Text>
      </View>

      {/* Harvest & Financial Forecast */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { borderTopColor: "#1e88e5" }]}>
          <Ionicons name="trending-up-outline" size={24} color="#1e88e5" />
          <Text style={styles.metricLabel}>Expected Yield</Text>
          <Text style={styles.metricValue}>{plan.harvest_estimation.expected_yield_tons} Tons</Text>
        </View>
        <View style={[styles.metricCard, { borderTopColor: "#43a047" }]}>
          <Ionicons name="cash-outline" size={24} color="#43a047" />
          <Text style={styles.metricLabel}>Est. Income</Text>
          <Text style={styles.metricValue}>
            LKR {plan.harvest_estimation.expected_income_lkr.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.metricCard, { borderTopColor: "#ff9800" }]}>
          <Ionicons name="calendar-outline" size={24} color="#ff9800" />
          <Text style={styles.metricLabel}>Maturity</Text>
          <Text style={styles.metricValue}>{plan.harvest_estimation.estimated_harvest_days} Days</Text>
        </View>
        <View style={[styles.metricCard, { borderTopColor: "#9c27b0" }]}>
          <Ionicons name="hardware-chip-outline" size={24} color="#9c27b0" />
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>{plan.harvest_estimation.confidence_pct}%</Text>
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="leaf-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Weekly Cultivation Timeline</Text>
        </View>
        <View style={styles.timelineContainer}>
          {plan.timeline.map((t: any, idx: number) => (
            <View key={idx} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineWeek}>{t.week}</Text>
                <Text style={styles.timelinePhase}>{t.phase}</Text>
                <Text style={styles.timelineAction}>{t.action}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Fertilizer Schedule */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flask-outline" size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Fertilizer Allocation</Text>
        </View>
        {plan.fertilizer_schedule.map((f: any, idx: number) => (
          <View key={idx} style={styles.fertItem}>
            <View style={styles.fertInfo}>
              <Text style={styles.fertWeek}>{f.week} - {f.fertilizer}</Text>
              <Text style={styles.fertPurpose}>{f.purpose}</Text>
            </View>
            <View style={styles.fertBadge}>
              <Text style={styles.fertBadgeText}>{f.amount}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Disease Guide */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="warning-outline" size={20} color={COLORS.warning} />
          <Text style={styles.cardTitle}>Disease Guide</Text>
        </View>
        {plan.diseases.map((d: any, idx: number) => (
          <View key={idx} style={styles.diseaseItem}>
            <Text style={styles.diseaseName}>{d.name}</Text>
            <Text style={styles.diseaseText}>
              <Text style={styles.bold}>Symptoms:</Text> {d.symptoms}
            </Text>
            <Text style={styles.diseaseText}>
              <Text style={styles.bold}>Fungicide:</Text> {d.recommended_fungicide}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    width: "48%",
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    borderTopWidth: 4,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  timelineContainer: {
    paddingLeft: 12,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
    position: "absolute",
    left: -6,
    top: 4,
    zIndex: 1,
  },
  timelineContent: {
    marginLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: 16,
    paddingBottom: 8,
  },
  timelineWeek: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.primary,
    backgroundColor: COLORS.primary + "1A",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  timelinePhase: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  timelineAction: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  fertItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.bgScreen,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  fertInfo: {
    flex: 1,
    paddingRight: 8,
  },
  fertWeek: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  fertPurpose: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  fertBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fertBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  diseaseItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  diseaseName: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.dangerText,
    marginBottom: 4,
  },
  diseaseText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  bold: {
    fontWeight: "bold",
  },
});
