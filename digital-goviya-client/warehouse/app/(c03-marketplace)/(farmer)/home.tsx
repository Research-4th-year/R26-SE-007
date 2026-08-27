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

import type { FarmerDashboardData } from "@/types/c03-marketplace/dashboard.types";

import { useLanguage } from "@/contexts/LanguageContext";

export default function FarmerHomeScreen() {
  const { t, language } = useLanguage();

  const { user } = useMarketplaceAuth();

  const [dashboard, setDashboard] = useState<FarmerDashboardData | null>(null);

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

        const response = await dashboardService.getFarmerDashboard();

        setDashboard(response.data);
      } catch (error) {
        console.error("Farmer dashboard loading failed:", error);

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
            tintColor="#15803D"
            colors={["#15803D"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>{t.c3farmerHome.greeting}</Text>

            <Text style={styles.userName} numberOfLines={1}>
              {user?.fullName ?? "Farmer"}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#6B7280" />

              <Text style={styles.locationText}>
                {translateDistrict(
                  dashboard?.farmer.district ?? user?.district,
                  t.c3districts,
                  t.c3farmerHome.sriLanka,
                )}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.c3farmerHome.openNotifications}
              style={({ pressed }) => [
                styles.notificationButton,
                pressed && styles.profileButtonPressed,
              ]}
              onPress={() => router.push("/(c03-marketplace)/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={21}
                color="#15803D"
              />

              {summary?.unreadNotifications ? (
                <View style={styles.headerNotificationBadge}>
                  <Text style={styles.headerNotificationBadgeText}>
                    {summary.unreadNotifications > 99
                      ? "99+"
                      : summary.unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.c3farmerHome.openProfile}
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.profileButtonPressed,
              ]}
              onPress={() => router.push("./profile")}
            >
              <Ionicons name="person-outline" size={21} color="#15803D" />
            </Pressable>
          </View>
        </View>

        {/* Hero */}
        <LinearGradient
          colors={["#0A331D", "#12522E", "#0B3B22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconRing}>
              <View style={styles.heroIcon}>
                <Ionicons name="leaf" size={24} color="#15803D" />
              </View>
            </View>

            <View style={styles.heroStatusBadge}>
              <View style={styles.heroStatusDot} />

              <Text style={styles.heroStatusText}>
                {t.c3farmerHome.aiMarketplace}
              </Text>
            </View>
          </View>

          <View style={styles.heroEyebrowPill}>
            <Ionicons name="sparkles" size={11} color="#F5C542" />

            <Text style={styles.heroEyebrow}>
              {t.c3farmerHome.farmerMarketplace}
            </Text>
          </View>

          <Text style={styles.heroTitle}>{t.c3farmerHome.heroTitle}</Text>

          <Text style={styles.heroDescription}>
            {t.c3farmerHome.heroDescription}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("./add-harvest")}
            style={({ pressed }) => [
              styles.primaryShadow,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={["#F5C542", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Ionicons name="add-circle-outline" size={19} color="#0B3B22" />

              <Text style={styles.primaryButtonText}>
                {t.c3farmerHome.addNewHarvest}
              </Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>

        {/* Analytics header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {t.c3farmerHome.marketplaceAnalytics}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {t.c3farmerHome.liveOverview}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#15803D" />
          ) : (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>{t.c3farmerHome.live}</Text>
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
              <Text style={styles.errorTitle}>
                {t.c3farmerHome.analyticsUnavailable}
              </Text>

              <Text style={styles.errorMessage}>
                {errorMessage} {t.c3farmerHome.tapToRetry}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {/* Main analytics */}
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsGrid}>
            <AnalyticsMetric
              icon="leaf-outline"
              label={t.c3farmerHome.totalHarvests}
              value={loading ? "—" : String(summary?.totalHarvests ?? 0)}
            />

            <AnalyticsMetric
              icon="cube-outline"
              label={t.c3farmerHome.totalQuantity}
              value={
                loading ? "—" : formatQuantity(analytics?.totalQuantity ?? 0)
              }
            />

            <AnalyticsMetric
              icon="sparkles-outline"
              label={t.c3farmerHome.averageAiPrice}
              value={
                loading
                  ? "—"
                  : formatPrice(analytics?.averageAiPredictedPrice ?? 0)
              }
            />
          </View>

          <View style={styles.analyticsDivider} />

          <View style={styles.secondaryAnalytics}>
            <CompactMetric
              icon="checkmark-circle-outline"
              label={t.c3farmerHome.available}
              value={String(summary?.availableHarvests ?? 0)}
            />

            <CompactMetric
              icon="git-compare-outline"
              label={t.c3farmerHome.matched}
              value={String(summary?.matchedHarvests ?? 0)}
            />

            <CompactMetric
              icon="stats-chart-outline"
              label={t.c3farmerHome.averageScore}
              value={`${Math.round(analytics?.averageHarvestScore ?? 0)}/100`}
            />
          </View>
        </View>

        {/* Latest recommendation */}
        {dashboard?.latestAiRecommendation ? (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationIcon}>
              <Ionicons name="bulb-outline" size={23} color="#B45309" />
            </View>

            <View style={styles.recommendationTextArea}>
              <Text style={styles.recommendationEyebrow}>
                {t.c3farmerHome.latestAiInsight}
              </Text>

              <Text style={styles.recommendationTitle}>
                {translatePaddyType(
                  dashboard.latestAiRecommendation.paddyType,
                  language,
                )}
              </Text>

              <Text style={styles.recommendationMessage} numberOfLines={3}>
                {language === "si"
                  ? dashboard.latestAiRecommendation.recommendation?.sinhala ||
                    dashboard.latestAiRecommendation.recommendation?.english ||
                    t.c3farmerHome.reviewLatestAi
                  : dashboard.latestAiRecommendation.recommendation?.english ||
                    dashboard.latestAiRecommendation.recommendation?.sinhala ||
                    t.c3farmerHome.reviewLatestAi}
              </Text>
            </View>

            <Ionicons name="sparkles" size={20} color="#D97706" />
          </View>
        ) : null}

        {/* Quick actions */}
        <Text style={styles.quickTitle}>{t.c3farmerHome.quickActions}</Text>

        <View style={styles.actionGrid}>
          <ActionCard
            icon="add-circle-outline"
            title={t.c3farmerHome.addHarvest}
            subtitle={t.c3farmerHome.addHarvestSubtitle}
            onPress={() => router.push("./add-harvest")}
          />

          <ActionCard
            icon="pricetag-outline"
            title={t.c3farmerHome.myHarvests}
            subtitle={t.c3farmerHome.myHarvestsSubtitle}
            onPress={() => router.push("./my-harvests")}
          />

          <ActionCard
            icon="people-outline"
            title={t.c3farmerHome.matchRequests}
            subtitle={t.c3farmerHome.matchRequestsSubtitle}
            onPress={() => router.push("./my-match-requests")}
          />

          <ActionCard
            icon="chatbubble-ellipses-outline"
            title={t.c3farmerHome.aiAssistant}
            subtitle={t.c3farmerHome.aiAssistantSubtitle}
            onPress={() => router.push("/(c03-marketplace)/assistant")}
          />
        </View>

        {/* Session */}
        <View style={styles.sessionBanner}>
          <View style={styles.sessionIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#15803D"
            />
          </View>

          <View style={styles.sessionText}>
            <Text style={styles.sessionTitle}>
              {t.c3farmerHome.farmerSessionActive}
            </Text>

            <Text style={styles.sessionDescription} numberOfLines={1}>
              {t.c3farmerHome.signedInAs} {user?.fullName ?? "Farmer"}
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
        <Ionicons name={icon} size={18} color="#15803D" />
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
      <Ionicons name={icon} size={17} color="#15803D" />

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
        <Ionicons name={icon} size={21} color="#15803D" />
      </View>

      <View style={styles.actionTextArea}>
        <Text style={styles.actionTitle}>{title}</Text>

        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color="#94A3B8"
        style={styles.actionChevron}
      />
    </Pressable>
  );
}

function translateDistrict(
  district: string | undefined,
  translations: {
    Ampara: string;
    Badulla: string;
    Kandy: string;
    Monaragala: string;
  },
  fallback: string,
): string {
  if (!district) {
    return fallback;
  }

  const normalizedDistrict = district.trim();

  const districtMap: Record<string, string> = {
    Ampara: translations.Ampara,
    Badulla: translations.Badulla,
    Kandy: translations.Kandy,
    Monaragala: translations.Monaragala,
  };

  return districtMap[normalizedDistrict] ?? normalizedDistrict;
}

function translatePaddyType(
  paddyType: string | undefined,
  language: string,
): string {
  if (!paddyType) {
    return "";
  }

  const normalizedPaddyType = paddyType.trim().toLowerCase();

  if (language !== "si") {
    return formatLabel(paddyType);
  }

  const paddyTypeMap: Record<string, string> = {
    samba: "සම්බා",
    "samba ": "සම්බා",
    nadu: "නාඩු",
    "nadu ": "නාඩු",
    keerisamba: "කීරි සම්බා",
    "keeri samba": "කීරි සම්බා",
  };

  return paddyTypeMap[normalizedPaddyType] ?? paddyType;
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

function formatLabel(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },

  content: {
    padding: 20,
    paddingBottom: 120,
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
    color: "#6B7280",
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
  },

  userName: {
    color: "#1F2937",
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
    color: "#6B7280",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
  },

  headerNotificationBadge: {
    position: "absolute",
    top: -4,
    right: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  headerNotificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontWeight: "900",
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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
    backgroundColor: "#4ADE80",
  },

  heroStatusText: {
    color: "#DCFCE7",
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
    color: "#0B3B22",
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
    color: "#1F2937",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  sectionSubtitle: {
    color: "#7A7364",
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
    backgroundColor: "#ECFDF5",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#15803D",
  },

  liveText: {
    color: "#15803D",
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
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
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
    backgroundColor: "#DCFCE7",
    marginBottom: 9,
  },

  analyticsValue: {
    color: "#16241C",
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },

  analyticsLabel: {
    color: "#7A7364",
    fontSize: 8.5,
    lineHeight: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  analyticsDivider: {
    height: 1,
    backgroundColor: "#BBF7D0",
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
    color: "#14532D",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  compactLabel: {
    color: "#6B7280",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
  },

  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 20,
    padding: 15,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 24,
  },

  recommendationIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  recommendationTextArea: {
    flex: 1,
  },

  recommendationEyebrow: {
    color: "#B45309",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
  },

  recommendationTitle: {
    color: "#78350F",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },

  recommendationMessage: {
    color: "#92400E",
    fontSize: 9.5,
    lineHeight: 15,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  quickTitle: {
    color: "#1F2937",
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
    borderColor: "#EEF0ED",
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
    backgroundColor: "#DCFCE7",
    marginBottom: 12,
  },

  actionTextArea: {
    flex: 1,
  },

  actionTitle: {
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
  },

  actionSubtitle: {
    color: "#6B7280",
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
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
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
    color: "#14532D",
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
    backgroundColor: "#15803D",
    paddingHorizontal: 6,
  },

  notificationText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
});