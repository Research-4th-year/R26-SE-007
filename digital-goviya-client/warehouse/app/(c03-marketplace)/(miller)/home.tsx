import { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";

import { dashboardService } from "@/services/c03-marketplace/dashboard.service";

import type { MillerDashboardData } from "@/types/c03-marketplace/dashboard.types";

export default function MillerHomeScreen() {
  const { user } = useMarketplaceAuth();

  const [dashboard, setDashboard] = useState<MillerDashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const loadDashboard = useCallback(
    async (showRefreshIndicator = false): Promise<void> => {
      try {
        setErrorMessage(null);

        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await dashboardService.getMillerDashboard();

        setDashboard(response.data);
      } catch (error) {
        console.error("Miller dashboard loading failed:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load marketplace analytics.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  if (!fontsLoaded) {
    return null;
  }

  const summary = dashboard?.summary;

  const analytics = dashboard?.marketAnalytics;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadDashboard(true)}
            tintColor="#92400E"
            colors={["#92400E"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Good evening,</Text>

            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName ?? "Miller"}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#7A7364" />

              <Text style={styles.locationText}>
                {dashboard?.miller.district ?? user?.district ?? "Sri Lanka"}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.profileButtonPressed,
            ]}
            onPress={() => router.push("./profile")}
          >
            <Ionicons name="person-outline" size={21} color="#92400E" />
          </Pressable>
        </View>

        {/* Hero */}
        <LinearGradient
          colors={["#92400E", "#78350F", "#5B250B"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconRing}>
              <View style={styles.heroIcon}>
                <Ionicons name="business" size={24} color="#92400E" />
              </View>
            </View>

            <View style={styles.heroStatusBadge}>
              <View style={styles.heroStatusDot} />

              <Text style={styles.heroStatusText}>ACTIVE BUYER</Text>
            </View>
          </View>

          <View style={styles.heroEyebrowPill}>
            <Ionicons name="sparkles" size={11} color="#FDE68A" />

            <Text style={styles.heroEyebrow}>MILLER MARKETPLACE</Text>
          </View>

          <Text style={styles.heroTitle}>
            Find quality paddy from trusted farmers
          </Text>

          <Text style={styles.heroDescription}>
            Publish purchasing requirements, discover compatible harvests and
            use AI agents for fair negotiation.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("./create-demand")}
            style={({ pressed }) => [
              styles.primaryShadow,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={["#FDE68A", "#F5C542"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Ionicons name="add-circle-outline" size={19} color="#78350F" />

              <Text style={styles.primaryButtonText}>Create Paddy Demand</Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>

        {/* Analytics title */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Marketplace analytics</Text>

            <Text style={styles.sectionSubtitle}>
              Live overview of purchasing demand
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#92400E" />
          ) : (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>

        {/* Error */}
        {errorMessage ? (
          <Pressable
            style={styles.errorCard}
            onPress={() => void loadDashboard()}
          >
            <Ionicons name="warning-outline" size={21} color="#B91C1C" />

            <View style={styles.errorTextArea}>
              <Text style={styles.errorTitle}>Analytics unavailable</Text>

              <Text style={styles.errorMessage}>
                {errorMessage} Tap to retry.
              </Text>
            </View>
          </Pressable>
        ) : null}

        {/* Analytics */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsGrid}>
            <AnalyticsMetric
              icon="document-text-outline"
              label="Total demands"
              value={loading ? "—" : String(summary?.totalDemands ?? 0)}
            />

            <AnalyticsMetric
              icon="cube-outline"
              label="Required quantity"
              value={
                loading
                  ? "—"
                  : formatQuantity(analytics?.totalQuantityNeeded ?? 0)
              }
            />

            <AnalyticsMetric
              icon="cash-outline"
              label="Average offer"
              value={
                loading ? "—" : formatPrice(analytics?.averageOfferedPrice ?? 0)
              }
            />
          </View>

          <View style={styles.analyticsDivider} />

          <View style={styles.secondaryAnalytics}>
            <CompactMetric
              icon="radio-button-on-outline"
              label="Open"
              value={String(summary?.openDemands ?? 0)}
            />

            <CompactMetric
              icon="git-compare-outline"
              label="Ready"
              value={String(summary?.negotiationReadySelections ?? 0)}
            />

            <CompactMetric
              icon="chatbubbles-outline"
              label="Pending"
              value={String(summary?.pendingSelections ?? 0)}
            />
          </View>
        </View>

        {/* Demand insight */}
        <View style={styles.insightCard}>
          <View style={styles.insightIcon}>
            <Ionicons name="analytics-outline" size={23} color="#92400E" />
          </View>

          <View style={styles.insightText}>
            <Text style={styles.insightEyebrow}>PURCHASING OVERVIEW</Text>

            <Text style={styles.insightTitle}>
              {summary?.openDemands ?? 0} open demand
              {(summary?.openDemands ?? 0) === 1 ? "" : "s"}
            </Text>

            <Text style={styles.insightDescription}>
              Open demands are available for AI-based harvest matching.
            </Text>
          </View>

          <Ionicons name="trending-up-outline" size={22} color="#B45309" />
        </View>

        {/* Quick actions */}
        <Text style={styles.quickTitle}>Quick actions</Text>

        <View style={styles.actionGrid}>
          <ActionCard
            icon="add-circle-outline"
            title="Create Demand"
            subtitle="Publish paddy requirement"
            onPress={() => router.push("./create-demand")}
          />

          <ActionCard
            icon="document-text-outline"
            title="My Demands"
            subtitle="View active requirements"
            onPress={() => router.push("./my-demands")}
          />

          <ActionCard
            icon="leaf-outline"
            title="Matched Harvests"
            subtitle="Explore suitable sellers"
            onPress={() => {
              Alert.alert(
                "Matching",
                "The matched harvest screen will be connected next.",
              );
            }}
          />

          <ActionCard
            icon="chatbubble-ellipses-outline"
            title="AI Assistant"
            subtitle="Ask market questions"
            onPress={() => router.push("/(c03-marketplace)/assistant")}
          />
        </View>

        {/* Session */}
        <View style={styles.sessionBanner}>
          <View style={styles.sessionIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#92400E"
            />
          </View>

          <View style={styles.sessionText}>
            <Text style={styles.sessionTitle}>Miller session active</Text>

            <Text style={styles.sessionDescription} numberOfLines={1}>
              Signed in as {user?.email}
            </Text>
          </View>

          {summary?.unreadNotifications ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {summary.unreadNotifications}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface AnalyticsMetricProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function AnalyticsMetric({ icon, label, value }: AnalyticsMetricProps) {
  return (
    <View style={styles.analyticsMetric}>
      <View style={styles.analyticsIcon}>
        <Ionicons name={icon} size={18} color="#92400E" />
      </View>

      <Text style={styles.analyticsValue} numberOfLines={1}>
        {value}
      </Text>

      <Text style={styles.analyticsLabel}>{label}</Text>
    </View>
  );
}

function CompactMetric({ icon, label, value }: AnalyticsMetricProps) {
  return (
    <View style={styles.compactMetric}>
      <Ionicons name={icon} size={17} color="#92400E" />

      <View>
        <Text style={styles.compactValue}>{value}</Text>

        <Text style={styles.compactLabel}>{label}</Text>
      </View>
    </View>
  );
}

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function ActionCard({ icon, title, subtitle, onPress }: ActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={21} color="#92400E" />
      </View>

      <View style={styles.actionTextArea}>
        <Text style={styles.actionTitle}>{title}</Text>

        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color="#B7AF9C"
        style={styles.actionChevron}
      />
    </Pressable>
  );
}

function formatQuantity(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M kg`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K kg`;
  }

  return `${value} kg`;
}

function formatPrice(value: number): string {
  return value > 0 ? `Rs.${value.toFixed(2)}` : "Rs.0";
}

const CREAM = "#FBF8F1";
const CARD_BORDER = "#ECE6D6";
const INK = "#16241C";
const INK_MUTED = "#7A7364";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    padding: 20,
    paddingBottom: 36,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    color: INK_MUTED,
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
  },

  userName: {
    color: INK,
    fontSize: 21,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },

  locationText: {
    color: INK_MUTED,
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    elevation: 2,
  },

  profileButtonPressed: {
    opacity: 0.84,
  },

  heroCard: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 26,
  },

  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroIconRing: {
    width: 54,
    height: 54,
    borderRadius: 18,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  heroIcon: {
    flex: 1,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  heroStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  heroStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FDE68A",
  },

  heroStatusText: {
    color: "#FEF3C7",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
  },

  heroEyebrowPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },

  heroEyebrow: {
    color: "#FDE68A",
    fontSize: 9.5,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1.1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 30,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 8,
  },

  heroDescription: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 11.5,
    lineHeight: 18,
    fontFamily: "Poppins_500Medium",
    marginTop: 7,
  },

  primaryShadow: {
    marginTop: 19,
    borderRadius: 16,
  },

  primaryButton: {
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#78350F",
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
  },

  buttonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },

  sectionTitle: {
    color: INK,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  sectionSubtitle: {
    color: INK_MUTED,
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "#FFFBEB",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#92400E",
  },

  liveText: {
    color: "#92400E",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 13,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 14,
  },

  errorTextArea: {
    flex: 1,
  },

  errorTitle: {
    color: "#991B1B",
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
  },

  errorMessage: {
    color: "#B91C1C",
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  analyticsCard: {
    borderRadius: 22,
    padding: 15,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 24,
  },

  analyticsGrid: {
    flexDirection: "row",
    gap: 8,
  },

  analyticsMetric: {
    flex: 1,
    minHeight: 108,
    borderRadius: 17,
    padding: 11,
    backgroundColor: "#FFFFFF",
  },

  analyticsIcon: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    marginBottom: 9,
  },

  analyticsValue: {
    color: INK,
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },

  analyticsLabel: {
    color: INK_MUTED,
    fontSize: 8.5,
    lineHeight: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  analyticsDivider: {
    height: 1,
    backgroundColor: "#FDE68A",
    marginVertical: 14,
  },

  secondaryAnalytics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  compactMetric: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  compactValue: {
    color: "#78350F",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  compactLabel: {
    color: INK_MUTED,
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
  },

  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    marginBottom: 24,
  },

  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
  },

  insightText: {
    flex: 1,
  },

  insightEyebrow: {
    color: "#B45309",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.7,
  },

  insightTitle: {
    color: "#78350F",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    marginTop: 2,
  },

  insightDescription: {
    color: INK_MUTED,
    fontSize: 9,
    lineHeight: 14,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  quickTitle: {
    color: INK,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    marginBottom: 13,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  actionCard: {
    width: "47.8%",
    minHeight: 136,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 15,
  },

  actionCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    marginBottom: 12,
  },

  actionTextArea: {
    flex: 1,
  },

  actionTitle: {
    color: INK,
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },

  actionSubtitle: {
    color: INK_MUTED,
    fontSize: 9.5,
    lineHeight: 14,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
  },

  actionChevron: {
    position: "absolute",
    right: 13,
    top: 15,
  },

  sessionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 15,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 22,
  },

  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  sessionText: {
    flex: 1,
  },

  sessionTitle: {
    color: "#78350F",
    fontSize: 11.5,
    fontFamily: "Poppins_700Bold",
  },

  sessionDescription: {
    color: "#4B5563",
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  notificationBadge: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#92400E",
    paddingHorizontal: 6,
  },

  notificationText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
});
