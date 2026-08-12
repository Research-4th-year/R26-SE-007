import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";
import { partnerService } from "@/services/c03-marketplace/partner.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";
import type { PartnerListItem } from "@/types/c03-marketplace/partner.types";

type PartnerFilter = "all" | "favorites" | "contact";
type SortOption = "recent" | "agreements" | "quantity" | "price";

export default function PartnersScreen() {
  const { user } = useMarketplaceAuth();
  const [partners, setPartners] = useState<PartnerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<PartnerFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("recent");
  const [sortOpen, setSortOpen] = useState(false);

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

  const loadPartners = useCallback(async (showRefresh = false) => {
    try {
      setErrorMessage(null);
      showRefresh ? setRefreshing(true) : setLoading(true);

      const response = await partnerService.getMyPartners();
      setPartners(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPartners();
    }, [loadPartners])
  );

  const stats = useMemo(
    () => ({
      total: partners.length,
      favorites: partners.filter((item) => item.isFavorite).length,
      contact: partners.filter((item) => item.contactUnlocked).length,
      trades: partners.reduce(
        (total, item) => total + item.summary.totalAgreements,
        0
      ),
    }),
    [partners]
  );

  const visiblePartners = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = partners.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "favorites" && item.isFavorite) ||
        (filter === "contact" && item.contactUnlocked);

      const searchable = [
        item.partner.name,
        item.partner.district,
        item.partner.location,
        ...item.summary.paddyTypes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!query || searchable.includes(query));
    });

    return [...result].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }

      switch (sortOption) {
        case "agreements":
          return b.summary.totalAgreements - a.summary.totalAgreements;
        case "quantity":
          return b.summary.totalQuantityKg - a.summary.totalQuantityKg;
        case "price":
          return b.summary.averageAgreedPrice - a.summary.averageAgreedPrice;
        case "recent":
        default:
          return (
            new Date(b.summary.lastTransactionAt).getTime() -
            new Date(a.summary.lastTransactionAt).getTime()
          );
      }
    });
  }, [partners, searchQuery, filter, sortOption]);

  const toggleFavorite = async (item: PartnerListItem) => {
    try {
      if (item.isFavorite) {
        await partnerService.removeFavorite(item.partner.type, item.partner.id);
      } else {
        await partnerService.addFavorite(item.partner.type, item.partner.id);
      }

      setPartners((current) =>
        current.map((partner) =>
          partner.partner.id === item.partner.id
            ? { ...partner, isFavorite: !partner.isFavorite }
            : partner
        )
      );
    } catch (error) {
      console.error("Favourite update failed:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.stateTitle}>Loading partners</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={21} color="#1F2937" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Trading Partners</Text>
          <Text style={styles.headerSubtitle}>
            {isFarmer ? "Millers you've traded with" : "Farmers you've traded with"}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadPartners(true)}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {errorMessage ? (
          <Pressable style={styles.errorCard} onPress={() => void loadPartners()}>
            <Ionicons name="warning-outline" size={24} color="#B91C1C" />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Unable to load partners</Text>
              <Text style={styles.errorText}>{errorMessage} Tap to retry.</Text>
            </View>
          </Pressable>
        ) : partners.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.soft }]}>
              <Ionicons
                name={isFarmer ? "business-outline" : "leaf-outline"}
                size={36}
                color={theme.primary}
              />
            </View>
            <Text style={styles.stateTitle}>No trading partners yet</Text>
            <Text style={styles.emptyText}>
              Partners appear here automatically after a successful AI negotiation.
            </Text>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={[theme.dark, theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroTop}>
                <View style={styles.heroIcon}>
                  <Ionicons name="people" size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroEyebrow}>TRUSTED NETWORK</Text>
                  <Text style={styles.heroTitle}>Your marketplace relationships</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <Stat label="Partners" value={stats.total} />
                <Stat label="Favourites" value={stats.favorites} />
                <Stat label="Contact" value={stats.contact} />
                <Stat label="Trades" value={stats.trades} />
              </View>
            </LinearGradient>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color="#64748B" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={isFarmer ? "Search miller or district..." : "Search farmer or district..."}
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => setSortOpen((value) => !value)}
                style={[
                  styles.sortButton,
                  { backgroundColor: theme.soft, borderColor: theme.border },
                ]}
              >
                <Ionicons name="swap-vertical-outline" size={19} color={theme.primary} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: "All", value: "all" as const },
                { label: "Favourites", value: "favorites" as const },
                { label: "Contact unlocked", value: "contact" as const },
              ].map((item) => {
                const selected = filter === item.value;
                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setFilter(item.value)}
                    style={[
                      styles.filterChip,
                      selected && { backgroundColor: theme.dark, borderColor: theme.dark },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {sortOpen ? (
              <View style={styles.sortPanel}>
                <Text style={styles.sortTitle}>Sort partners</Text>
                {[
                  ["Most recent", "recent"],
                  ["Most trades", "agreements"],
                  ["Highest quantity", "quantity"],
                  ["Highest average price", "price"],
                ].map(([label, value]) => (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setSortOption(value as SortOption);
                      setSortOpen(false);
                    }}
                    style={[
                      styles.sortOption,
                      sortOption === value && { backgroundColor: theme.soft },
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortOption === value && { color: theme.primary, fontWeight: "900" },
                      ]}
                    >
                      {label}
                    </Text>
                    {sortOption === value ? (
                      <Ionicons name="checkmark" size={17} color={theme.primary} />
                    ) : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>Partners</Text>
              <Text style={styles.resultsCount}>{visiblePartners.length} shown</Text>
            </View>

            {visiblePartners.length === 0 ? (
              <View style={styles.filteredEmpty}>
                <Ionicons name="search-outline" size={30} color={theme.primary} />
                <Text style={styles.filteredEmptyTitle}>No partners match</Text>
                <Text style={styles.filteredEmptyText}>Try another search or filter.</Text>
              </View>
            ) : (
              <View style={styles.partnerList}>
                {visiblePartners.map((item) => (
                  <PartnerCard
                    key={item.partner.id}
                    item={item}
                    theme={theme}
                    onFavorite={() => void toggleFavorite(item)}
                    onOpen={() =>
                      router.push({
                        pathname: "/(c03-marketplace)/partner-detail" as any,
                        params: {
                          partnerType: item.partner.type,
                          partnerId: item.partner.id,
                        },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PartnerCard({
  item,
  theme,
  onFavorite,
  onOpen,
}: {
  item: PartnerListItem;
  theme: { primary: string; dark: string; soft: string; page: string; border: string };
  onFavorite: () => void;
  onOpen: () => void;
}) {
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.partnerCard, pressed && styles.pressed]}
    >
      <View style={styles.partnerTop}>
        <View style={[styles.avatar, { backgroundColor: theme.soft }]}>
          <Ionicons
            name={item.partner.type === "miller" ? "business-outline" : "leaf-outline"}
            size={24}
            color={theme.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.partnerName} numberOfLines={1}>
            {item.partner.name}
          </Text>
          <Text style={styles.partnerLocation} numberOfLines={1}>
            {item.partner.district} • {item.partner.location}
          </Text>
        </View>

        <Pressable
          onPress={(event) => {
            event.stopPropagation?.();
            onFavorite();
          }}
          style={[styles.favoriteButton, item.isFavorite && { backgroundColor: theme.soft }]}
        >
          <Ionicons
            name={item.isFavorite ? "star" : "star-outline"}
            size={19}
            color={item.isFavorite ? "#D97706" : "#94A3B8"}
          />
        </Pressable>
      </View>

      <View style={styles.badgeRow}>
        {item.isFavorite ? (
          <Badge icon="star" label="Favourite" color="#92400E" background="#FEF3C7" />
        ) : null}
        <Badge
          icon={item.contactUnlocked ? "call-outline" : "lock-closed-outline"}
          label={item.contactUnlocked ? "Contact unlocked" : "Contact protected"}
          color={item.contactUnlocked ? "#166534" : "#64748B"}
          background={item.contactUnlocked ? "#DCFCE7" : "#F1F5F9"}
        />
      </View>

      <View style={styles.metrics}>
        <Metric label="Trades" value={String(item.summary.totalAgreements)} />
        <Metric label="Quantity" value={`${formatNumber(item.summary.totalQuantityKg)} kg`} />
        <Metric label="Avg. price" value={formatCurrency(item.summary.averageAgreedPrice)} />
      </View>

      <View style={styles.cardFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.lastTradeLabel}>Last trade</Text>
          <Text style={styles.lastTradeValue}>{formatDate(item.summary.lastTransactionAt)}</Text>
        </View>
        <Text style={[styles.viewText, { color: theme.primary }]}>View history</Text>
        <Ionicons name="chevron-forward" size={17} color={theme.primary} />
      </View>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Badge({
  icon,
  label,
  color,
  background,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  background: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(value);
}

function formatCurrency(value: number) {
  return `Rs.${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  headerTitle: { color: "#1F2937", fontSize: 19, fontWeight: "900" },
  headerSubtitle: { color: "#64748B", fontSize: 9.5, marginTop: 2 },
  content: { padding: 18, paddingBottom: 120 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  stateTitle: { color: "#1F2937", fontSize: 16, fontWeight: "900", textAlign: "center" },
  hero: { borderRadius: 24, padding: 18, marginBottom: 17 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroEyebrow: { color: "#FDE68A", fontSize: 8.5, fontWeight: "900", letterSpacing: 1.1 },
  heroTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 6, marginTop: 15 },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statValue: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 7.5, fontWeight: "700", marginTop: 2 },
  searchRow: { flexDirection: "row", gap: 9 },
  searchBox: {
    flex: 1,
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 15,
    paddingHorizontal: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, color: "#1F2937", fontSize: 10.5, paddingVertical: 0 },
  sortButton: {
    width: 49,
    height: 49,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  filterRow: { gap: 8, paddingVertical: 12 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipText: { color: "#64748B", fontSize: 8.5, fontWeight: "800" },
  filterChipTextSelected: { color: "#FFFFFF" },
  sortPanel: {
    borderRadius: 17,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 15,
  },
  sortTitle: { color: "#1F2937", fontSize: 11, fontWeight: "900", marginBottom: 7 },
  sortOption: {
    minHeight: 39,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 11,
  },
  sortOptionText: { color: "#64748B", fontSize: 9, fontWeight: "700" },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  sectionTitle: { color: "#1F2937", fontSize: 15, fontWeight: "900" },
  resultsCount: { color: "#94A3B8", fontSize: 8.5, fontWeight: "700" },
  partnerList: { gap: 12 },
  partnerCard: {
    borderRadius: 21,
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  partnerTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  partnerName: { color: "#1F2937", fontSize: 13.5, fontWeight: "900" },
  partnerLocation: { color: "#64748B", fontSize: 8.5, marginTop: 4 },
  favoriteButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 11 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeText: { fontSize: 7.5, fontWeight: "800" },
  metrics: {
    flexDirection: "row",
    gap: 7,
    marginTop: 13,
    padding: 11,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  metricLabel: { color: "#94A3B8", fontSize: 7.5, fontWeight: "700" },
  metricValue: { color: "#1F2937", fontSize: 9.5, fontWeight: "900", marginTop: 3 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  lastTradeLabel: { color: "#94A3B8", fontSize: 7.5 },
  lastTradeValue: { color: "#475569", fontSize: 9, fontWeight: "800", marginTop: 2 },
  viewText: { fontSize: 8.5, fontWeight: "900" },
  errorCard: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorTitle: { color: "#991B1B", fontSize: 11, fontWeight: "900" },
  errorText: { color: "#B91C1C", fontSize: 8.5, marginTop: 2 },
  emptyState: { alignItems: "center", paddingVertical: 75, paddingHorizontal: 28 },
  emptyIcon: { width: 82, height: 82, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#64748B", fontSize: 9.5, lineHeight: 16, textAlign: "center", marginTop: 7 },
  filteredEmpty: {
    alignItems: "center",
    paddingVertical: 43,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filteredEmptyTitle: { color: "#1F2937", fontSize: 13, fontWeight: "900", marginTop: 10 },
  filteredEmptyText: { color: "#64748B", fontSize: 8.5, marginTop: 4 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
});