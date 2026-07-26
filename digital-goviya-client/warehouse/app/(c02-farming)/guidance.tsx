import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

export default function FarmerGuidanceScreen() {
  return (
    <ScrollView style={styles.screen}>
      <View style={styles.headerContainer}>
        <Ionicons name="book" size={48} color={COLORS.primary} />
        <Text style={styles.title}>Farming Guidance</Text>
        <Text style={styles.subtitle}>Best practices and recommendations</Text>
      </View>

      <View style={styles.content}>
        {/* Crop Information Placeholder */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="leaf-outline" size={24} color={COLORS.success} />
            <Text style={styles.cardTitle}>Crop Information</Text>
          </View>
          <Text style={styles.cardText}>
            Detailed crop varieties, seasonal growth patterns, and soil requirements will be displayed here.
          </Text>
        </View>

        {/* Farming Tips Placeholder */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb-outline" size={24} color={COLORS.warning} />
            <Text style={styles.cardTitle}>Farming Tips</Text>
          </View>
          <Text style={styles.cardText}>
            Timely reminders for watering, pest control, and optimal harvesting periods.
          </Text>
        </View>

        {/* Weather-based Advice Placeholder */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="partly-sunny-outline" size={24} color={COLORS.info} />
            <Text style={styles.cardTitle}>Weather-based Advice</Text>
          </View>
          <Text style={styles.cardText}>
            Current weather patterns and how they affect your scheduled farming activities.
          </Text>
        </View>

        {/* AI Recommendations Placeholder */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={24} color={COLORS.primary} />
            <Text style={styles.cardTitle}>AI Recommendations</Text>
          </View>
          <Text style={styles.cardText}>
            Machine learning generated insights tailored to your specific farm data.
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  headerContainer: {
    padding: 24,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bottomSpacer: { height: 32 },
});
