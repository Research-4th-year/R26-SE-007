import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { getLatestData } from "@/services/farming/api";
import { SensorCard } from "@/components/farming/SensorCard";

const FEATURES = [
  {
    id: "guidance",
    title: "Farmer Guidance",
    desc: "Crop information, farming tips, and weather advice",
    icon: "book",
    color: COLORS.primary,
    route: "/(c02-farming)/guidance",
  },
  {
    id: "scan",
    title: "Scan Leaf Disease",
    desc: "AI-based leaf disease detection via camera",
    icon: "camera",
    color: COLORS.info,
    route: "/(c02-farming)/scan",
  },
  {
    id: "fertilizer",
    title: "Fertilizer Guidance",
    desc: "Soil information and AI model fertilizer analysis",
    icon: "flask",
    color: COLORS.warning,
    route: "/(c02-farming)/fertilizer",
  },
  {
    id: "settings",
    title: "Settings",
    desc: "App preferences, language, and theme",
    icon: "settings",
    color: COLORS.textMuted,
    route: "/(c02-farming)/settings",
  },
];

export default function FarmingHomeScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const result = await getLatestData();
      setData(result);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.screen}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerGreeting}>Smart Farming Hub</Text>
        <Text style={styles.headerTitle}>Welcome to Digital Goviya</Text>
      </View>

      <View style={styles.content}>
        {/* Sensor Overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Real-time Field Data</Text>
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sensorRow}>
          <SensorCard 
            label="Temperature" 
            value={data?.sensors?.temperature ?? "--"} 
            unit="°C" 
            icon="thermometer-outline" 
            color={COLORS.danger} 
          />
          <SensorCard 
            label="Humidity" 
            value={data?.sensors?.humidity ?? "--"} 
            unit="%" 
            icon="water-outline" 
            color={COLORS.info} 
          />
        </View>
        <View style={styles.sensorRow}>
          <SensorCard 
            label="Soil Moisture" 
            value={data?.sensors?.soil_moisture ?? "--"} 
            unit="%" 
            icon="leaf-outline" 
            color={COLORS.success} 
          />
          <SensorCard 
            label="Rainfall" 
            value={data?.sensors?.rain ?? "--"} 
            unit="mm" 
            icon="rainy-outline" 
            color={COLORS.primaryLight} 
          />
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>What would you like to do?</Text>
        <View style={styles.cardContainer}>
          {FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.card}
              onPress={() => router.push(feature.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: feature.color + "20" }]}>
                <Ionicons name={feature.icon as any} size={32} color={feature.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{feature.title}</Text>
                <Text style={styles.cardDesc}>{feature.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.bgScreen,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerGreeting: { color: COLORS.primaryLight, fontSize: 14, marginBottom: 4 },
  headerTitle: { color: COLORS.white, fontSize: 24, fontWeight: "bold" },
  content: { padding: 16, marginTop: 8 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
  },
  sensorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardContainer: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  bottomSpacer: { height: 32 },
});
