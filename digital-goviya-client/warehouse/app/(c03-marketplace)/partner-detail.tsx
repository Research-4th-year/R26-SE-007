import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";
import { partnerService } from "@/services/c03-marketplace/partner.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";
import type {
  PartnerDetailData,
  PartnerType,
} from "@/types/c03-marketplace/partner.types";

export default function PartnerDetailScreen() {
  const params = useLocalSearchParams<{
    partnerType?: string;
    partnerId?: string;
  }>();

  const { user } = useMarketplaceAuth();
  const [data, setData] = useState<PartnerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFarmer = user?.role === "farmer";

  const theme = useMemo(
    () =>
      isFarmer
        ? {
            primary: "#15803D",
            dark: "#14532D",
            soft: "#DCFCE7",
            page: "#F8FAF8",
            border: "#BBF7D0",
          }
        : {
            primary: "#92400E",
            dark: "#78350F",
            soft: "#FEF3C7",
            page: "#FBF8F1",
            border: "#FDE68A",
          },
    [isFarmer]
  );

  const partnerType = params.partnerType as PartnerType | undefined;
  const partnerId = params.partnerId;

  useEffect(() => {
    const load = async () => {
      if (!partnerType || !partnerId) {
        setErrorMessage("Partner information is missing.");
        setLoading(false);
        return;
      }

      try {
        setErrorMessage(null);
        setLoading(true);
        const response = await partnerService.getPartnerDetails(
          partnerType,
          partnerId
        );
        setData(response.data);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [partnerType, partnerId]);

  const toggleFavorite = async () => {
    if (!data || !partnerType || !partnerId || favoriteLoading) {
      return;
    }

    try {
      setFavoriteLoading(true);

      if (data.isFavorite) {
        await partnerService.removeFavorite(partnerType, partnerId);
      } else {
        await partnerService.addFavorite(partnerType, partnerId);
      }

      setData((current) =>
        current ? { ...current, isFavorite: !current.isFavorite } : current
      );
    } catch (error) {
      console.error("Favourite update failed:", error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const callPartner = async () => {
    const phone = data?.contact?.phone;
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
  };

  const openWhatsApp = async () => {
    const phone = data?.contact?.phone;
    if (!phone) return;
    await Linking.openURL(`https://wa.me/${normalizeSriLankanPhone(phone)}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.stateTitle}>Loading partner</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !data) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
        <View style={styles.centerState}>
          <Ionicons name="warning-outline" size={36} color="#B91C1C" />
          <Text style={styles.stateTitle}>Unable to load partner</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButtonLarge, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.backButtonText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { partner, summary } = data;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={21} color="#1F2937" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Partner Details</Text>
          <Text style={styles.headerSubtitle}>Trading history and contact access</Text>
        </View>

        <Pressable
          disabled={favoriteLoading}
          onPress={() => void toggleFavorite()}
          style={[
            styles.favoriteButton,
            {
              backgroundColor: data.isFavorite ? theme.soft : "#FFFFFF",
              borderColor: data.isFavorite ? theme.border : "#E5E7EB",
            },
          ]}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons
              name={data.isFavorite ? "star" : "star-outline"}
              size={20}
              color={data.isFavorite ? "#D97706" : "#64748B"}
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[theme.dark, theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHero}
        >
          <View style={styles.heroAvatar}>
            <Ionicons
              name={partner.type === "miller" ? "business" : "leaf"}
              size={31}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.partnerName}>{partner.name}</Text>
          <Text style={styles.heroLocation}>
            {partner.district} • {partner.location}
          </Text>

          <View style={styles.heroBadges}>
            {data.isFavorite ? (
              <HeroBadge icon="star" label="Favourite partner" />
            ) : null}
            <HeroBadge
              icon={data.contactUnlocked ? "checkmark-circle" : "lock-closed"}
              label={data.contactUnlocked ? "Contact unlocked" : "Contact protected"}
            />
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Trading summary</Text>

        <View style={styles.summaryGrid}>
          <SummaryCard
            icon="receipt-outline"
            label="Agreements"
            value={String(summary.totalAgreements)}
            theme={theme}
          />
          <SummaryCard
            icon="cube-outline"
            label="Quantity"
            value={`${formatNumber(summary.totalQuantityKg)} kg`}
            theme={theme}
          />
          <SummaryCard
            icon="cash-outline"
            label="Average price"
            value={formatCurrency(summary.averageAgreedPrice)}
            theme={theme}
          />
          <SummaryCard
            icon="trending-up-outline"
            label="Latest price"
            value={formatCurrency(summary.latestAgreedPrice)}
            theme={theme}
          />
        </View>

        {typeof summary.totalTradeValue === "number" ? (
          <View style={styles.tradeValueCard}>
            <View style={[styles.tradeValueIcon, { backgroundColor: theme.soft }]}>
              <Ionicons name="wallet-outline" size={21} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tradeValueLabel}>Total trade value</Text>
              <Text style={styles.tradeValueValue}>
                {formatCurrency(summary.totalTradeValue)}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Partner information</Text>

        <View style={styles.infoCard}>
          <InfoRow icon="location-outline" label="District" value={partner.district} theme={theme} />
          <InfoRow icon="navigate-outline" label="Location" value={partner.location} theme={theme} />

          {partner.type === "miller" ? (
            <>
              <InfoRow
                icon="business-outline"
                label="Rice mill"
                value={partner.millName ?? partner.name}
                theme={theme}
              />
              <InfoRow
                icon="document-text-outline"
                label="Registration"
                value={partner.businessRegistrationNumber || "Not provided"}
                theme={theme}
              />
              <InfoRow
                icon="scale-outline"
                label="Capacity"
                value={`${formatNumber(partner.purchasingCapacityKg ?? 0)} kg`}
                theme={theme}
                isLast
              />
            </>
          ) : (
            <>
              <InfoRow
                icon="business-outline"
                label="Farm"
                value={partner.farmName || "Not provided"}
                theme={theme}
              />
              <InfoRow
                icon="resize-outline"
                label="Farm size"
                value={`${formatNumber(partner.farmSizeAcres ?? 0)} acres`}
                theme={theme}
              />
              <InfoRow
                icon="leaf-outline"
                label="Main variety"
                value={partner.mainPaddyVariety || "Not provided"}
                theme={theme}
                isLast
              />
            </>
          )}
        </View>

        <Text style={styles.sectionTitle}>Contact access</Text>

        {data.contactUnlocked && data.contact ? (
          <View style={styles.contactCard}>
            <Text style={styles.contactTitle}>Contact unlocked</Text>
            <Text style={styles.contactNumber}>{data.contact.phone}</Text>

            <View style={styles.contactActions}>
              <Pressable
                onPress={() => void callPartner()}
                style={[styles.contactAction, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.contactActionText}>Call</Text>
              </Pressable>

              <Pressable
                onPress={() => void openWhatsApp()}
                style={[styles.contactAction, styles.whatsappAction]}
              >
                <Ionicons name="logo-whatsapp" size={19} color="#FFFFFF" />
                <Text style={styles.contactActionText}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.lockedContact}>
            <Ionicons name="lock-closed-outline" size={24} color="#64748B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.lockedTitle}>Contact remains private</Text>
              <Text style={styles.lockedText}>
                Phone and WhatsApp become available only after an accepted contact request.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Transaction history</Text>
          <Text style={styles.historySubtitle}>
            {data.transactions.length} successful agreement
            {data.transactions.length === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.historyList}>
          {data.transactions.map((transaction) => (
            <View key={transaction.negotiationMongoId} style={styles.historyCard}>
              <View style={styles.historyTop}>
                <View style={[styles.historyIcon, { backgroundColor: theme.soft }]}>
                  <Ionicons name="leaf-outline" size={20} color={theme.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.historyPaddy}>{formatLabel(transaction.paddyType)}</Text>
                  <Text style={styles.historyDate}>{formatDate(transaction.createdAt)}</Text>
                </View>

                <View style={styles.agreedBadge}>
                  <Text style={styles.agreedBadgeText}>AGREED</Text>
                </View>
              </View>

              <View style={styles.historyMetrics}>
                <HistoryMetric label="Quantity" value={`${formatNumber(transaction.quantityKg)} kg`} />
                <HistoryMetric label="Price" value={formatCurrency(transaction.agreedPrice)} />
                <HistoryMetric label="Value" value={formatCurrency(transaction.totalValue)} />
              </View>

              <View style={styles.historyFooter}>
                <Text style={styles.roundText}>
                  {transaction.roundsCompleted} AI round{transaction.roundsCompleted === 1 ? "" : "s"}
                </Text>

                {typeof transaction.fairnessScore === "number" ? (
                  <Text style={[styles.fairnessText, { color: theme.primary }]}> 
                    Fairness {formatFairness(transaction.fairnessScore)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroBadge({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.heroBadge}>
      <Ionicons name={icon} size={12} color="#FFFFFF" />
      <Text style={styles.heroBadgeText}>{label}</Text>
    </View>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: { primary: string; soft: string };
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={19} color={theme.primary} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  theme,
  isLast = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  theme: { primary: string; soft: string };
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.historyMetricLabel}>{label}</Text>
      <Text style={styles.historyMetricValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function normalizeSriLankanPhone(phone: string) {
  let value = phone.replace(/\D/g, "");
  if (value.startsWith("0")) value = `94${value.slice(1)}`;
  if (!value.startsWith("94")) value = `94${value}`;
  return value;
}

function formatCurrency(value: number) {
  return `Rs.${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-LK", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function formatLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatFairness(value: number) {
  return value <= 1 ? `${Math.round(value * 100)}%` : `${Math.round(value)}%`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  headerTitle: { color: "#1F2937", fontSize: 18, fontWeight: "900" },
  headerSubtitle: { color: "#64748B", fontSize: 9, marginTop: 2 },
  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  content: { padding: 18, paddingBottom: 125 },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 30,
  },
  stateTitle: { color: "#1F2937", fontSize: 16, fontWeight: "900", textAlign: "center" },
  stateText: { color: "#64748B", fontSize: 9.5, textAlign: "center" },
  backButtonLarge: { borderRadius: 13, paddingHorizontal: 18, paddingVertical: 11, marginTop: 5 },
  backButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  profileHero: { alignItems: "center", borderRadius: 25, padding: 22, marginBottom: 22 },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  partnerName: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", marginTop: 13, textAlign: "center" },
  heroLocation: { color: "rgba(255,255,255,0.72)", fontSize: 9, marginTop: 6 },
  heroBadges: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 13 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  heroBadgeText: { color: "#FFFFFF", fontSize: 7.5, fontWeight: "800" },
  sectionTitle: { color: "#1F2937", fontSize: 14.5, fontWeight: "900", marginBottom: 11 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 17 },
  summaryCard: {
    width: "48.4%",
    minHeight: 110,
    borderRadius: 18,
    padding: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  summaryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  summaryLabel: { color: "#94A3B8", fontSize: 8, fontWeight: "700", marginTop: 9 },
  summaryValue: { color: "#1F2937", fontSize: 12, fontWeight: "900", marginTop: 3 },
  tradeValueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 21,
  },
  tradeValueIcon: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  tradeValueLabel: { color: "#64748B", fontSize: 8.5, fontWeight: "700" },
  tradeValueValue: { color: "#1F2937", fontSize: 15, fontWeight: "900", marginTop: 3 },
  infoCard: {
    borderRadius: 19,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 21,
  },
  infoRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIcon: { width: 37, height: 37, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  infoLabel: { color: "#94A3B8", fontSize: 8, fontWeight: "700" },
  infoValue: { color: "#1F2937", fontSize: 10.5, fontWeight: "800", marginTop: 3 },
  contactCard: {
    borderRadius: 19,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 22,
  },
  contactTitle: { color: "#166534", fontSize: 11, fontWeight: "900" },
  contactNumber: { color: "#1F2937", fontSize: 13, fontWeight: "900", marginTop: 4 },
  contactActions: { flexDirection: "row", gap: 9, marginTop: 14 },
  contactAction: {
    flex: 1,
    minHeight: 45,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  whatsappAction: { backgroundColor: "#16A34A" },
  contactActionText: { color: "#FFFFFF", fontSize: 9.5, fontWeight: "900" },
  lockedContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 18,
    padding: 15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 22,
  },
  lockedTitle: { color: "#475569", fontSize: 10.5, fontWeight: "900" },
  lockedText: { color: "#64748B", fontSize: 8.5, lineHeight: 14, marginTop: 3 },
  historyHeader: { marginTop: 1, marginBottom: 10 },
  historySubtitle: { color: "#94A3B8", fontSize: 8.5, marginTop: -6 },
  historyList: { gap: 11 },
  historyCard: {
    borderRadius: 19,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  historyTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyIcon: { width: 41, height: 41, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  historyPaddy: { color: "#1F2937", fontSize: 11.5, fontWeight: "900" },
  historyDate: { color: "#94A3B8", fontSize: 8, marginTop: 2 },
  agreedBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#DCFCE7" },
  agreedBadgeText: { color: "#166534", fontSize: 7, fontWeight: "900" },
  historyMetrics: { flexDirection: "row", gap: 8, marginTop: 13, padding: 11, borderRadius: 13, backgroundColor: "#F8FAFC" },
  historyMetricLabel: { color: "#94A3B8", fontSize: 7, fontWeight: "700" },
  historyMetricValue: { color: "#1F2937", fontSize: 8.5, fontWeight: "900", marginTop: 3 },
  historyFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 },
  roundText: { color: "#64748B", fontSize: 8, fontWeight: "700" },
  fairnessText: { fontSize: 8, fontWeight: "900" },
});