import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

export default function FertilizerGuidanceScreen() {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Fertilizer Analysis</Text>
        <Text style={styles.subtitle}>AI-driven recommendations for your soil</Text>
      </View>

      <View style={styles.content}>
        {/* NPK Values */}
        <Text style={styles.sectionTitle}>Soil Nutrients (NPK)</Text>
        <View style={styles.row}>
          <View style={[styles.statCard, { borderTopColor: COLORS.info, borderTopWidth: 4 }]}>
            <Text style={styles.statLabel}>Nitrogen (N)</Text>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statUnit}>mg/kg</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.warning, borderTopWidth: 4 }]}>
            <Text style={styles.statLabel}>Phosphorus (P)</Text>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statUnit}>mg/kg</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: COLORS.primary, borderTopWidth: 4 }]}>
            <Text style={styles.statLabel}>Potassium (K)</Text>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statUnit}>mg/kg</Text>
          </View>
        </View>

        {/* Environmental Data */}
        <Text style={styles.sectionTitle}>Environmental Data</Text>
        <View style={styles.envCard}>
          <View style={styles.envRow}>
            <View style={styles.envItem}>
              <Ionicons name="water-outline" size={24} color={COLORS.info} />
              <View style={styles.envText}>
                <Text style={styles.envLabel}>Moisture</Text>
                <Text style={styles.envValue}>-- %</Text>
              </View>
            </View>
            <View style={styles.envItem}>
              <Ionicons name="thermometer-outline" size={24} color={COLORS.danger} />
              <View style={styles.envText}>
                <Text style={styles.envLabel}>Temperature</Text>
                <Text style={styles.envValue}>-- °C</Text>
              </View>
            </View>
          </View>
          <View style={styles.envRow}>
            <View style={styles.envItem}>
              <Ionicons name="flask-outline" size={24} color={COLORS.warning} />
              <View style={styles.envText}>
                <Text style={styles.envLabel}>pH Level</Text>
                <Text style={styles.envValue}>--</Text>
              </View>
            </View>
            <View style={styles.envItem}>
              <Ionicons name="rainy-outline" size={24} color={COLORS.primary} />
              <View style={styles.envText}>
                <Text style={styles.envLabel}>Rainfall</Text>
                <Text style={styles.envValue}>-- mm</Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI Recommendation */}
        <Text style={styles.sectionTitle}>Recommendation</Text>
        <View style={styles.recommendationCard}>
          <Ionicons name="sparkles" size={32} color={COLORS.warning} />
          <Text style={styles.recommendationTitle}>Pending Analysis</Text>
          <Text style={styles.recommendationText}>
            Please enter your soil and environmental data to receive an AI-powered fertilizer recommendation.
          </Text>
          
          <TouchableOpacity style={styles.analyzeButton}>
            <Text style={styles.analyzeButtonText}>Run Analysis</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  header: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  statUnit: {
    fontSize: 10,
    color: COLORS.textFaint,
    marginTop: 4,
  },
  envCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  envRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  envItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  envText: {
    marginLeft: 12,
  },
  envLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  envValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  recommendationCard: {
    backgroundColor: COLORS.warningBg,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.warning + "40",
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.warningText,
    marginTop: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: COLORS.warningText,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  analyzeButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomSpacer: { height: 32 },
});
