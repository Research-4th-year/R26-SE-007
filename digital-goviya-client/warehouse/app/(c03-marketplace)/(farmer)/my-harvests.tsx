import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { harvestService } from "@/services/c03-marketplace/harvest.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";
import type { Harvest } from "@/types/c03-marketplace/harvest.types";

type HarvestStatusFilter =
  | "all"
  | "available"
  | "matched"
  | "sold"
  | "cancelled";

type PaddyFilter =
  | "all"
  | "nadu"
  | "samba"
  | "keeri samba";

type SortOption =
  | "newest"
  | "oldest"
  | "quantity_high"
  | "quantity_low"
  | "score_high";

type ViewMode = "cards" | "compact";

const PADDY_FILTERS: Array<{
  label: string;
  value: PaddyFilter;
}> = [
  { label: "All varieties", value: "all" },
  { label: "Nadu", value: "nadu" },
  { label: "Samba", value: "samba" },
  { label: "Keeri Samba", value: "keeri samba" },
];

const SORT_OPTIONS: Array<{
  label: string;
  value: SortOption;
}> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Highest quantity", value: "quantity_high" },
  { label: "Lowest quantity", value: "quantity_low" },
  { label: "Highest AI score", value: "score_high" },
];

export default function MyHarvestsScreen() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<HarvestStatusFilter>("all");
  const [paddyFilter, setPaddyFilter] =
    useState<PaddyFilter>("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("newest");
  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  const loadHarvests = useCallback(
    async (showRefreshIndicator = false) => {
      try {
        setErrorMessage(null);

        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await harvestService.getMyHarvests();

        setHarvests(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (error) {
        setErrorMessage(
          getApiErrorMessage(error)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void loadHarvests();
    }, [loadHarvests])
  );

  useEffect(() => {
    if (!fontsLoaded || loading) {
      return;
    }

    fade.setValue(0);
    rise.setValue(14);

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded, loading, fade, rise]);

  const stats = useMemo(() => {
    return harvests.reduce(
      (result, harvest) => {
        result.total += 1;

        if (harvest.status === "available") {
          result.available += 1;
        } else if (harvest.status === "matched") {
          result.matched += 1;
        } else if (harvest.status === "sold") {
          result.sold += 1;
        }

        return result;
      },
      {
        total: 0,
        available: 0,
        matched: 0,
        sold: 0,
      }
    );
  }, [harvests]);

  const filteredHarvests = useMemo(() => {
    const normalizedQuery =
      searchQuery.trim().toLowerCase();

    const result = harvests.filter(
      (harvest) => {
        const matchesStatus =
          statusFilter === "all" ||
          harvest.status === statusFilter;

        const matchesPaddy =
          paddyFilter === "all" ||
          harvest.paddyType
            .trim()
            .toLowerCase() === paddyFilter;

        const searchableText = [
          harvest.paddyType,
          harvest.season,
          harvest.status,
          harvest.marketStatus,
          harvest.priceLevel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !normalizedQuery ||
          searchableText.includes(
            normalizedQuery
          );

        return (
          matchesStatus &&
          matchesPaddy &&
          matchesSearch
        );
      }
    );

    return [...result].sort(
      (first, second) => {
        switch (sortOption) {
          case "oldest":
            return (
              new Date(first.createdAt).getTime() -
              new Date(second.createdAt).getTime()
            );

          case "quantity_high":
            return (
              Number(second.quantity) -
              Number(first.quantity)
            );

          case "quantity_low":
            return (
              Number(first.quantity) -
              Number(second.quantity)
            );

          case "score_high":
            return (
              Number(second.harvestScore ?? 0) -
              Number(first.harvestScore ?? 0)
            );

          case "newest":
          default:
            return (
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime()
            );
        }
      }
    );
  }, [
    harvests,
    searchQuery,
    statusFilter,
    paddyFilter,
    sortOption,
  ]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (paddyFilter !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaddyFilter("all");
    setSortOption("newest");
  };

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.navigationHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#1F2937"
          />
        </Pressable>

        <View style={styles.navigationTitleArea}>
          <Text style={styles.navigationTitle}>
            My Harvests
          </Text>
          <Text style={styles.navigationSubtitle}>
            {stats.total} submitted
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add harvest"
          onPress={() =>
            router.push("./add-harvest")
          }
          style={({ pressed }) => [
            styles.addHeaderButtonShadow,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={["#22C55E", "#15803D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addHeaderButton}
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.animatedFlex,
          {
            opacity: fade,
            transform: [{ translateY: rise }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            harvests.length === 0 &&
              styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                void loadHarvests(true)
              }
              tintColor="#15803D"
              colors={["#15803D"]}
            />
          }
        >
          {errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={() =>
                void loadHarvests()
              }
            />
          ) : harvests.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <LinearGradient
                colors={["#166534", "#14532D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryHero}
              >
                <View style={styles.summaryHeroTop}>
                  <View style={styles.summaryHeroIcon}>
                    <Ionicons
                      name="leaf"
                      size={23}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryEyebrow}>
                      HARVEST PORTFOLIO
                    </Text>
                    <Text style={styles.summaryHeroTitle}>
                      Track every listing in one place
                    </Text>
                  </View>
                </View>

                <View style={styles.statRow}>
                  <SummaryStat
                    label="Total"
                    value={stats.total}
                    selected={statusFilter === "all"}
                    onPress={() =>
                      setStatusFilter("all")
                    }
                  />
                  <SummaryStat
                    label="Available"
                    value={stats.available}
                    selected={
                      statusFilter === "available"
                    }
                    onPress={() =>
                      setStatusFilter("available")
                    }
                  />
                  <SummaryStat
                    label="Matched"
                    value={stats.matched}
                    selected={
                      statusFilter === "matched"
                    }
                    onPress={() =>
                      setStatusFilter("matched")
                    }
                  />
                  <SummaryStat
                    label="Sold"
                    value={stats.sold}
                    selected={statusFilter === "sold"}
                    onPress={() =>
                      setStatusFilter("sold")
                    }
                  />
                </View>
              </LinearGradient>

              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Ionicons
                    name="search-outline"
                    size={19}
                    color="#64748B"
                  />

                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search paddy, season, status..."
                    placeholderTextColor="#9CA3AF"
                    style={styles.searchInput}
                    autoCapitalize="none"
                    returnKeyType="search"
                  />

                  {searchQuery.length > 0 ? (
                    <Pressable
                      onPress={() =>
                        setSearchQuery("")
                      }
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color="#94A3B8"
                      />
                    </Pressable>
                  ) : null}
                </View>

                <Pressable
                  onPress={() =>
                    setFiltersOpen(
                      (current) => !current
                    )
                  }
                  style={[
                    styles.filterButton,
                    (filtersOpen ||
                      activeFilterCount > 0) &&
                      styles.filterButtonActive,
                  ]}
                >
                  <Ionicons
                    name="options-outline"
                    size={19}
                    color={
                      filtersOpen ||
                      activeFilterCount > 0
                        ? "#FFFFFF"
                        : "#15803D"
                    }
                  />

                  {activeFilterCount > 0 ? (
                    <View
                      style={
                        styles.filterCountBadge
                      }
                    >
                      <Text
                        style={
                          styles.filterCountText
                        }
                      >
                        {activeFilterCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>

              {filtersOpen ? (
                <View style={styles.filterPanel}>
                  <View
                    style={
                      styles.filterPanelHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.filterPanelTitle
                        }
                      >
                        Refine results
                      </Text>
                      <Text
                        style={
                          styles.filterPanelSubtitle
                        }
                      >
                        Variety and sorting options
                      </Text>
                    </View>

                    <Pressable
                      onPress={clearFilters}
                    >
                      <Text
                        style={
                          styles.clearFiltersText
                        }
                      >
                        Clear all
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.filterLabel}>
                    Paddy variety
                  </Text>

                  <View style={styles.wrapRow}>
                    {PADDY_FILTERS.map((item) => {
                      const selected =
                        paddyFilter === item.value;

                      return (
                        <Pressable
                          key={item.value}
                          onPress={() =>
                            setPaddyFilter(
                              item.value
                            )
                          }
                          style={[
                            styles.optionChip,
                            selected &&
                              styles.optionChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              selected &&
                                styles.optionChipTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text
                    style={[
                      styles.filterLabel,
                      { marginTop: 17 },
                    ]}
                  >
                    Sort by
                  </Text>

                  <View style={styles.wrapRow}>
                    {SORT_OPTIONS.map((item) => {
                      const selected =
                        sortOption === item.value;

                      return (
                        <Pressable
                          key={item.value}
                          onPress={() =>
                            setSortOption(
                              item.value
                            )
                          }
                          style={[
                            styles.optionChip,
                            selected &&
                              styles.optionChipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              selected &&
                                styles.optionChipTextSelected,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              <View style={styles.resultsToolbar}>
                <View>
                  <Text style={styles.sectionTitle}>
                    Harvests
                  </Text>
                  <Text style={styles.resultMeta}>
                    {filteredHarvests.length} of{" "}
                    {harvests.length} shown
                  </Text>
                </View>

                <View style={styles.viewToggle}>
                  <Pressable
                    accessibilityLabel="Card view"
                    onPress={() =>
                      setViewMode("cards")
                    }
                    style={[
                      styles.viewToggleButton,
                      viewMode === "cards" &&
                        styles.viewToggleButtonActive,
                    ]}
                  >
                    <Ionicons
                      name="albums-outline"
                      size={17}
                      color={
                        viewMode === "cards"
                          ? "#FFFFFF"
                          : "#64748B"
                      }
                    />
                  </Pressable>

                  <Pressable
                    accessibilityLabel="Compact list view"
                    onPress={() =>
                      setViewMode("compact")
                    }
                    style={[
                      styles.viewToggleButton,
                      viewMode === "compact" &&
                        styles.viewToggleButtonActive,
                    ]}
                  >
                    <Ionicons
                      name="list-outline"
                      size={18}
                      color={
                        viewMode === "compact"
                          ? "#FFFFFF"
                          : "#64748B"
                      }
                    />
                  </Pressable>
                </View>
              </View>

              {filteredHarvests.length === 0 ? (
                <FilteredEmptyState
                  onClear={clearFilters}
                />
              ) : (
                <View style={styles.harvestList}>
                  {filteredHarvests.map(
                    (harvest) =>
                      viewMode === "compact" ? (
                        <CompactHarvestCard
                          key={harvest._id}
                          harvest={harvest}
                        />
                      ) : (
                        <HarvestCard
                          key={harvest._id}
                          harvest={harvest}
                        />
                      )
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function SummaryStat({
  label,
  value,
  selected = false,
  onPress,
}: {
  label: string;
  value: number;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filter harvests by ${label}`}
      style={({ pressed }) => [
        styles.summaryStat,
        selected && styles.summaryStatSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.summaryStatValue,
          selected && styles.summaryStatValueSelected,
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.summaryStatLabel,
          selected && styles.summaryStatLabelSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HarvestCard({
  harvest,
}: {
  harvest: Harvest;
}) {
  const predictedPrice =
    harvest.aiPredictedPrice;

  const priceDifference =
    typeof predictedPrice === "number"
      ? predictedPrice -
        harvest.expectedPrice
      : null;

  const openDetails = () =>
    navigateToHarvestResult(harvest);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.harvestCard,
        pressed && styles.cardPressed,
      ]}
      onPress={openDetails}
    >
      <View style={styles.cardTopRow}>
        <View style={styles.paddyIcon}>
          <Ionicons
            name="leaf-outline"
            size={22}
            color="#15803D"
          />
        </View>

        <View style={styles.cardTitleArea}>
          <Text style={styles.paddyName}>
            {formatPaddyType(
              harvest.paddyType
            )}
          </Text>
          <Text style={styles.harvestDate}>
            {formatDate(harvest.createdAt)}
          </Text>
        </View>

        <HarvestStatusBadge
          status={harvest.status}
        />
      </View>

      <View style={styles.marketBadgeRow}>
        <StatusBadge
          status={
            formatStatus(
              harvest.marketStatus
            ) ?? "Market review"
          }
        />
      </View>

      <View style={styles.detailsGrid}>
        <MetricItem
          label="Quantity"
          value={`${formatNumber(
            harvest.quantity
          )} kg`}
          icon="cube-outline"
        />
        <MetricItem
          label="Season"
          value={formatSeason(
            harvest.season
          )}
          icon="calendar-outline"
        />
        <MetricItem
          label="Expected"
          value={formatCurrency(
            harvest.expectedPrice
          )}
          icon="cash-outline"
        />
        <MetricItem
          label="AI price"
          value={
            typeof predictedPrice === "number"
              ? formatCurrency(
                  predictedPrice
                )
              : "Pending"
          }
          icon="sparkles-outline"
          emphasized
        />
      </View>

      {typeof priceDifference ===
      "number" ? (
        <View style={styles.insightRow}>
          <Ionicons
            name={
              priceDifference >= 0
                ? "trending-up-outline"
                : "trending-down-outline"
            }
            size={18}
            color={
              priceDifference >= 0
                ? "#15803D"
                : "#B45309"
            }
          />

          <Text
            style={[
              styles.insightText,
              priceDifference < 0 &&
                styles.insightWarning,
            ]}
          >
            {priceDifference >= 0
              ? "+"
              : ""}
            {formatCurrency(
              priceDifference
            )}{" "}
            compared with your expected price
          </Text>
        </View>
      ) : null}

      <View style={styles.scoreSection}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>
            Harvest score
          </Text>
          <Text style={styles.scoreValue}>
            {Math.round(
              harvest.harvestScore ?? 0
            )}
            /100
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <LinearGradient
            colors={["#4ADE80", "#15803D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  Math.max(
                    harvest.harvestScore ?? 0,
                    0
                  ),
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={openDetails}
          style={styles.secondaryAction}
        >
          <Ionicons
            name="analytics-outline"
            size={17}
            color="#15803D"
          />
          <Text
            style={
              styles.secondaryActionText
            }
          >
            AI Details
          </Text>
        </Pressable>

        {harvest.status ===
        "available" ? (
          <Pressable
            onPress={(event) => {
              event.stopPropagation?.();

              router.push({
                pathname:
                  "/(c03-marketplace)/(farmer)/matched-millers",
                params: {
                  harvestId:
                    harvest._id,
                },
              });
            }}
            style={styles.primaryAction}
          >
            <Ionicons
              name="people-outline"
              size={17}
              color="#FFFFFF"
            />
            <Text
              style={
                styles.primaryActionText
              }
            >
              Find Millers
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={openDetails}
            style={styles.primaryAction}
          >
            <Text
              style={
                styles.primaryActionText
              }
            >
              View Details
            </Text>
            <Ionicons
              name="arrow-forward"
              size={16}
              color="#FFFFFF"
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function CompactHarvestCard({
  harvest,
}: {
  harvest: Harvest;
}) {
  return (
    <Pressable
      onPress={() =>
        navigateToHarvestResult(harvest)
      }
      style={({ pressed }) => [
        styles.compactCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.compactIcon}>
        <Ionicons
          name="leaf-outline"
          size={21}
          color="#15803D"
        />
      </View>

      <View style={styles.compactBody}>
        <View style={styles.compactTop}>
          <Text style={styles.compactTitle}>
            {formatPaddyType(
              harvest.paddyType
            )}
          </Text>

          <HarvestStatusBadge
            status={harvest.status}
            compact
          />
        </View>

        <Text style={styles.compactSubtitle}>
          {formatSeason(
            harvest.season
          )}{" "}
          •{" "}
          {formatNumber(
            harvest.quantity
          )}{" "}
          kg
        </Text>

        <View style={styles.compactPriceRow}>
          <Text style={styles.compactPriceLabel}>
            AI{" "}
            <Text style={styles.compactPrice}>
              {formatCurrency(
                harvest.aiPredictedPrice
              )}
            </Text>
          </Text>

          <Text style={styles.compactScore}>
            Score{" "}
            {Math.round(
              harvest.harvestScore ?? 0
            )}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color="#94A3B8"
      />
    </Pressable>
  );
}

function HarvestStatusBadge({
  status,
  compact = false,
}: {
  status: Harvest["status"];
  compact?: boolean;
}) {
  const visual =
    getHarvestStatusStyle(status);

  return (
    <View
      style={[
        styles.harvestStatusBadge,
        {
          backgroundColor:
            visual.background,
        },
        compact &&
          styles.harvestStatusBadgeCompact,
      ]}
    >
      <View
        style={[
          styles.harvestStatusDot,
          {
            backgroundColor:
              visual.text,
          },
        ]}
      />
      <Text
        style={[
          styles.harvestStatusText,
          {
            color: visual.text,
          },
        ]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
}

function MetricItem({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.metricItem}>
      <View style={styles.metricLabelRow}>
        <Ionicons
          name={icon}
          size={14}
          color={
            emphasized
              ? "#15803D"
              : "#64748B"
          }
        />
        <Text style={styles.metricLabel}>
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.metricValue,
          emphasized &&
            styles.metricValueEmphasized,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalizedStatus =
    status.toLowerCase();

  const isPositive =
    normalizedStatus.includes("good") ||
    normalizedStatus.includes("fair") ||
    normalizedStatus.includes("high") ||
    normalizedStatus.includes("ready");

  return (
    <View
      style={[
        styles.statusBadge,
        isPositive
          ? styles.statusPositive
          : styles.statusNeutral,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor: isPositive
              ? "#16A34A"
              : "#D97706",
          },
        ]}
      />
      <Text
        style={[
          styles.statusText,
          isPositive
            ? styles.statusPositiveText
            : styles.statusNeutralText,
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

function LoadingState() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerState}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator
            size="large"
            color="#15803D"
          />
        </View>
        <Text style={styles.stateTitle}>
          Loading harvests
        </Text>
        <Text
          style={styles.stateDescription}
        >
          Retrieving your latest marketplace
          data.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons
          name="cloud-offline-outline"
          size={32}
          color="#B91C1C"
        />
      </View>

      <Text style={styles.stateTitle}>
        Unable to load harvests
      </Text>

      <Text style={styles.stateDescription}>
        {message}
      </Text>

      <Pressable
        onPress={onRetry}
        style={styles.retryButton}
      >
        <Ionicons
          name="refresh"
          size={18}
          color="#FFFFFF"
        />
        <Text style={styles.retryButtonText}>
          Try again
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.centerState}>
      <View style={styles.emptyIllustration}>
        <Ionicons
          name="leaf-outline"
          size={38}
          color="#15803D"
        />
      </View>

      <Text style={styles.stateTitle}>
        No harvests yet
      </Text>

      <Text style={styles.stateDescription}>
        Add your first paddy harvest to
        receive an AI-generated price
        recommendation.
      </Text>

      <Pressable
        onPress={() =>
          router.push("./add-harvest")
        }
        style={styles.emptyButton}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.emptyButtonText}>
          Add First Harvest
        </Text>
      </Pressable>
    </View>
  );
}

function FilteredEmptyState({
  onClear,
}: {
  onClear: () => void;
}) {
  return (
    <View style={styles.filteredEmpty}>
      <View style={styles.filteredEmptyIcon}>
        <Ionicons
          name="search-outline"
          size={27}
          color="#15803D"
        />
      </View>

      <Text style={styles.filteredEmptyTitle}>
        No matching harvests
      </Text>

      <Text style={styles.filteredEmptyText}>
        Try changing your search or filter
        options.
      </Text>

      <Pressable
        onPress={onClear}
        style={styles.clearButton}
      >
        <Text style={styles.clearButtonText}>
          Clear filters
        </Text>
      </Pressable>
    </View>
  );
}

function navigateToHarvestResult(
  harvest: Harvest
) {
  router.push({
    pathname:
      "/(c03-marketplace)/(farmer)/harvest-result",
    params: {
      harvestId: harvest._id,
      paddyType: harvest.paddyType,
      season: harvest.season,
      quantity: String(harvest.quantity),
      expectedPrice: String(
        harvest.expectedPrice
      ),
      aiPredictedPrice: String(
        harvest.aiPredictedPrice
      ),
      priceDifference: String(
        harvest.priceDifference
      ),
      priceLevel: harvest.priceLevel,
      harvestScore: String(
        harvest.harvestScore
      ),
      marketStatus:
        harvest.marketStatus,
      recommendedAction:
        harvest.recommendedAction,
      recommendationEnglish:
        harvest.recommendation?.english ??
        "",
      recommendationSinhala:
        harvest.recommendation?.sinhala ??
        "",
      createdAt: harvest.createdAt,
    },
  });
}

function getHarvestStatusStyle(
  status: Harvest["status"]
) {
  switch (status) {
    case "available":
      return {
        background: "#DCFCE7",
        text: "#166534",
      };
    case "matched":
      return {
        background: "#DBEAFE",
        text: "#1D4ED8",
      };
    case "sold":
      return {
        background: "#D1FAE5",
        text: "#047857",
      };
    case "cancelled":
    default:
      return {
        background: "#F1F5F9",
        text: "#64748B",
      };
  }
}

function formatPaddyType(
  value: string
): string {
  return value
    .trim()
    .split(/[\s_-]+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(" ");
}

function formatSeason(
  value: string
): string {
  return value
    ? value.charAt(0).toUpperCase() +
        value.slice(1).toLowerCase()
    : "Not specified";
}

function formatStatus(
  value?: string
): string | null {
  if (!value) {
    return null;
  }

  return value
    .trim()
    .split(/[\s_-]+/)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase()
    )
    .join(" ");
}

function formatNumber(
  value: number
): string {
  return new Intl.NumberFormat("en-LK", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCurrency(
  value: number
): string {
  return `LKR ${new Intl.NumberFormat(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value)}`;
}

function formatDate(
  value: string
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },
  animatedFlex: {
    flex: 1,
  },
  navigationHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0ED",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  navigationTitleArea: {
    flex: 1,
    marginHorizontal: 14,
  },
  navigationTitle: {
    color: "#1F2937",
    fontSize: 19,
    fontFamily: "Poppins_800ExtraBold",
  },
  navigationSubtitle: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  addHeaderButtonShadow: {
    borderRadius: 14,
    shadowColor: "#15803D",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 4,
  },
  addHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 18,
    paddingBottom: 120,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  summaryHero: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  summaryHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryHeroIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.13)",
  },
  summaryEyebrow: {
    color: "#BBF7D0",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1.1,
  },
  summaryHeroTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    marginTop: 4,
  },
  statRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 16,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    borderRadius: 13,
    paddingVertical: 9,
    backgroundColor:
      "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  summaryStatSelected: {
    backgroundColor:
      "rgba(255,255,255,0.26)",
    borderColor:
      "rgba(255,255,255,0.55)",
  },
  summaryStatValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Poppins_800ExtraBold",
  },
  summaryStatValueSelected: {
    color: "#FFFFFF",
  },
  summaryStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 8,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 2,
  },
  summaryStatLabelSelected: {
    color: "rgba(255,255,255,0.95)",
  },
  searchRow: {
    flexDirection: "row",
    gap: 9,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    color: "#1F2937",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    paddingVertical: 0,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#15803D",
    borderColor: "#15803D",
  },
  filterCountBadge: {
    position: "absolute",
    right: -4,
    top: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDE68A",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  filterCountText: {
    color: "#78350F",
    fontSize: 7,
    fontFamily: "Poppins_800ExtraBold",
  },
  filterPanel: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCFCE7",
    marginBottom: 18,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  filterPanelTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontFamily: "Poppins_800ExtraBold",
  },
  filterPanelSubtitle: {
    color: "#94A3B8",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  clearFiltersText: {
    color: "#15803D",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
  filterLabel: {
    color: "#475569",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  optionChip: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionChipSelected: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  optionChipText: {
    color: "#64748B",
    fontSize: 8.5,
    fontFamily: "Poppins_600SemiBold",
  },
  optionChipTextSelected: {
    color: "#166534",
    fontFamily: "Poppins_700Bold",
  },
  resultsToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontFamily: "Poppins_800ExtraBold",
  },
  resultMeta: {
    color: "#94A3B8",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#EEF2F7",
  },
  viewToggleButton: {
    width: 34,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleButtonActive: {
    backgroundColor: "#15803D",
  },
  harvestList: {
    gap: 13,
  },
  harvestCard: {
    borderRadius: 22,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF0ED",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  paddyIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },
  cardTitleArea: {
    flex: 1,
    marginLeft: 12,
  },
  paddyName: {
    color: "#1F2937",
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },
  harvestDate: {
    color: "#9CA3AF",
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },
  harvestStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  harvestStatusBadgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  harvestStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  harvestStatusText: {
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },
  marketBadgeRow: {
    flexDirection: "row",
    marginTop: 11,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusPositive: {
    backgroundColor: "#DCFCE7",
  },
  statusNeutral: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },
  statusPositiveText: {
    color: "#166534",
  },
  statusNeutralText: {
    color: "#92400E",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    padding: 13,
    rowGap: 14,
  },
  metricItem: {
    width: "50%",
    paddingRight: 8,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
  },
  metricValue: {
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 4,
  },
  metricValueEmphasized: {
    color: "#15803D",
  },
  insightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 13,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 13,
    backgroundColor: "#F0FDF4",
  },
  insightText: {
    flex: 1,
    color: "#166534",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    lineHeight: 14,
  },
  insightWarning: {
    color: "#92400E",
  },
  scoreSection: {
    marginTop: 14,
  },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  scoreLabel: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
  },
  scoreValue: {
    color: "#15803D",
    fontSize: 10,
    fontFamily: "Poppins_800ExtraBold",
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  secondaryAction: {
    flex: 1,
    minHeight: 43,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  secondaryActionText: {
    color: "#15803D",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
  primaryAction: {
    flex: 1.25,
    minHeight: 43,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#15803D",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
  compactCard: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  compactIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },
  compactBody: {
    flex: 1,
  },
  compactTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  compactTitle: {
    flex: 1,
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
  },
  compactSubtitle: {
    color: "#64748B",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
  },
  compactPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  compactPriceLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
  },
  compactPrice: {
    color: "#15803D",
    fontFamily: "Poppins_700Bold",
  },
  compactScore: {
    color: "#475569",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 27,
    paddingVertical: 55,
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    marginBottom: 18,
  },
  errorIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    marginBottom: 18,
  },
  emptyIllustration: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    marginBottom: 18,
  },
  stateTitle: {
    color: "#1F2937",
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
  },
  stateDescription: {
    color: "#6B7280",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 290,
  },
  retryButton: {
    minHeight: 45,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 18,
    backgroundColor: "#15803D",
    marginTop: 17,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
  },
  emptyButton: {
    minHeight: 47,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 18,
    backgroundColor: "#15803D",
    marginTop: 18,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
  },
  filteredEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filteredEmptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
  },
  filteredEmptyTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 13,
  },
  filteredEmptyText: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
    textAlign: "center",
  },
  clearButton: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: "#DCFCE7",
    marginTop: 13,
  },
  clearButtonText: {
    color: "#166534",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});