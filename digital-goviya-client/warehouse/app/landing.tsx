import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COMPONENTS = [
  {
    id: "warehouse",
    title: "Warehouse Management",
    desc: "PMB paddy warehouse coordination & blockchain audit",
    icon: "business",
    color: "#15803D",
    bg: "#DCFCE7",
    route: "/(c01-warehouse)/(auth)/login",
    ready: true,
  },
  {
    id: "farming",
    title: "Digital Farming",
    desc: "Smart farming assistance and crop management",
    icon: "leaf",
    color: "#0369A1",
    bg: "#E0F2FE",
    route: "/(c02-farming)",
    ready: true,
  },
  {
    id: "marketplace",
    title: "Marketplace",
    desc: "Agricultural produce trading platform",
    icon: "storefront",
    color: "#B45309",
    bg: "#FEF3C7",
    route: "/(c03-marketplace)",
    ready: false,
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    desc: "Data insights and government reporting",
    icon: "bar-chart",
    color: "#7C3AED",
    bg: "#EDE9FE",
    route: "/(c04-analytics)",
    ready: false,
  },
];

export default function LandingScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.emoji}>🌾</Text>
        <Text style={styles.title}>Digital Goviya</Text>
        <Text style={styles.sub}>Smart Agricultural Management System</Text>
      </View>
      <View style={styles.grid}>
        {COMPONENTS.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.card, !c.ready && styles.cardDisabled]}
            onPress={() => c.ready && router.push(c.route as any)}
            disabled={!c.ready}
            activeOpacity={c.ready ? 0.7 : 1}
          >
            <View style={[styles.iconBox, { backgroundColor: c.bg }]}>
              <Ionicons name={c.icon as any} size={28} color={c.color} />
            </View>
            <View style={styles.cardText}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                {!c.ready && (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Soon</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDesc}>{c.desc}</Text>
            </View>
            {c.ready && (
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.footer}>
        Digital Goviya v1.0 · SLIIT Research 2026
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#15803D",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emoji: { fontSize: 48, marginBottom: 8 },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  sub: { color: "#BBF7D0", fontSize: 14, marginTop: 4, textAlign: "center" },
  grid: { flex: 1, padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDisabled: { opacity: 0.5 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1 },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1F2937" },
  cardDesc: { fontSize: 12, color: "#6B7280", lineHeight: 16 },
  soonBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  soonText: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  footer: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 11,
    paddingBottom: 16,
  },
});
