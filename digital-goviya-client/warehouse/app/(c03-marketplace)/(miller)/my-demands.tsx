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

import { demandService } from "@/services/c03-marketplace/demand.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";
import type {
  DemandStatus,
  MillerDemand,
} from "@/types/c03-marketplace/demand.types";
import { useLanguage } from "@/contexts/LanguageContext";

type DemandStatusFilter =
  | "all"
  | "active"
  | DemandStatus;

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
  | "price_high"
  | "price_low";

type ViewMode = "cards" | "compact";

/* ------------------------------------------------------------------ */
/*  THEME                                                             */
/*  Same base palette as before, extended with a few derived tones    */
/*  so the same colors can be reused with more depth across the UI.   */
/* ------------------------------------------------------------------ */
const CREAM = "#FBF8F1";
const CARD_BORDER = "#ECE6D6";
const INK = "#16241C";
const INK_MUTED = "#7A7364";

const SURFACE = "#FFFFFF";
const SURFACE_ALT = "#FAFAF7";
const SURFACE_TINT = "#FEF3C7";

const ACCENT = "#92400E";
const ACCENT_DARK = "#78350F";
const ACCENT_LIGHT = "#FDE68A";
const GOLD = "#F5C542";

const PADDY_FILTERS: Array<{
  value: PaddyFilter;
}> = [
  { value: "all" },
  { value: "nadu" },
  { value: "samba" },
  { value: "keeri samba" },
];

const SORT_OPTIONS: Array<{
  value: SortOption;
}> = [
  { value: "newest" },
  { value: "oldest" },
  { value: "quantity_high" },
  { value: "quantity_low" },
  { value: "price_high" },
  { value: "price_low" },
];

export default function MyDemandsScreen() {
  const { t } = useLanguage();

  const [demands, setDemands] =
    useState<MillerDemand[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState<DemandStatusFilter>("all");
  const [paddyFilter, setPaddyFilter] =
    useState<PaddyFilter>("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("newest");
  const [viewMode, setViewMode] =
    useState<ViewMode>("cards");
  const [filtersOpen, setFiltersOpen] =
    useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const fade =
    useRef(
      new Animated.Value(0)
    ).current;

  const rise =
    useRef(
      new Animated.Value(14)
    ).current;

  const loadDemands = useCallback(
    async (
      showRefreshIndicator = false
    ) => {
      try {
        setErrorMessage(null);

        if (showRefreshIndicator) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response =
          await demandService.getMyDemands();

        setDemands(
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
      void loadDemands();
    }, [loadDemands])
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
    return demands.reduce(
      (result, demand) => {
        result.total += 1;

        if (demand.status === "open") {
          result.open += 1;
        } else if (
          demand.status ===
            "negotiation_ready" ||
          demand.status === "negotiating"
        ) {
          result.negotiating += 1;
        } else if (
          demand.status ===
          "agreement_reached"
        ) {
          result.agreed += 1;
        }

        return result;
      },
      {
        total: 0,
        open: 0,
        negotiating: 0,
        agreed: 0,
      }
    );
  }, [demands]);

  const filteredDemands = useMemo(() => {
    const normalizedQuery =
      searchQuery.trim().toLowerCase();

    const result = demands.filter(
      (demand) => {
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active"
            ? demand.status === "negotiation_ready" ||
              demand.status === "negotiating"
            : demand.status === statusFilter);

        const matchesPaddy =
          paddyFilter === "all" ||
          demand.paddyType
            .trim()
            .toLowerCase() === paddyFilter;

        const searchableText = [
          demand.paddyType,
          demand.status,
          String(demand.quantityNeeded),
          String(demand.offeredPrice),
        ]
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
              Number(
                second.quantityNeeded
              ) -
              Number(
                first.quantityNeeded
              )
            );

          case "quantity_low":
            return (
              Number(
                first.quantityNeeded
              ) -
              Number(
                second.quantityNeeded
              )
            );

          case "price_high":
            return (
              Number(second.offeredPrice) -
              Number(first.offeredPrice)
            );

          case "price_low":
            return (
              Number(first.offeredPrice) -
              Number(second.offeredPrice)
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
    demands,
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
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={ACCENT_DARK}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            {t.c3myDemands.title}
          </Text>
          <View style={styles.headerSubtitleRow}>
            <View style={styles.headerSubtitleDot} />
            <Text style={styles.headerSubtitle}>
              {stats.total} {t.c3myDemands.published}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() =>
            router.push("./create-demand")
          }
          style={({ pressed }) => [
            styles.addShadow,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={[ACCENT_LIGHT, GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Ionicons
              name="add"
              size={22}
              color={ACCENT_DARK}
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
            demands.length === 0 &&
              styles.emptyContent,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() =>
                void loadDemands(true)
              }
              colors={[ACCENT]}
              tintColor={ACCENT}
            />
          }
        >
          {errorMessage ? (
            <ErrorState
              message={errorMessage}
              onRetry={() =>
                void loadDemands()
              }
            />
          ) : demands.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryHero}
              >
                <View
                  style={styles.summaryHeroDecoCircleOne}
                  pointerEvents="none"
                />
                <View
                  style={styles.summaryHeroDecoCircleTwo}
                  pointerEvents="none"
                />

                <View style={styles.summaryHeroTopRow}>
                  <View style={styles.summaryHeroIcon}>
                    <Ionicons
                      name="analytics-outline"
                      size={22}
                      color={SURFACE}
                    />
                  </View>

                  <View
                    style={
                      styles.summaryHeroTextArea
                    }
                  >
                    <Text
                      style={
                        styles.summaryHeroEyebrow
                      }
                    >
                      {t.c3myDemands.portfolioEyebrow}
                    </Text>
                    <Text
                      style={
                        styles.summaryHeroTitle
                      }
                    >
                      {t.c3myDemands.portfolioTitle}
                    </Text>
                  </View>
                </View>

                <View style={styles.statChipRow}>
                  <StatChip
                    label={t.c3myDemands.total}
                    value={stats.total}
                    icon="layers-outline"
                    selected={statusFilter === "all"}
                    onPress={() =>
                      setStatusFilter("all")
                    }
                  />
                  <StatChip
                    label={t.c3myDemands.open}
                    value={stats.open}
                    icon="radio-button-on-outline"
                    selected={statusFilter === "open"}
                    onPress={() =>
                      setStatusFilter("open")
                    }
                  />
                  <StatChip
                    label={t.c3myDemands.active}
                    value={stats.negotiating}
                    icon="pulse-outline"
                    selected={statusFilter === "active"}
                    onPress={() =>
                      setStatusFilter("active")
                    }
                  />
                  <StatChip
                    label={t.c3myDemands.agreed}
                    value={stats.agreed}
                    icon="checkmark-done-outline"
                    selected={
                      statusFilter ===
                      "agreement_reached"
                    }
                    onPress={() =>
                      setStatusFilter(
                        "agreement_reached"
                      )
                    }
                  />
                </View>
              </LinearGradient>

              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <View style={styles.searchIconWrap}>
                    <Ionicons
                      name="search-outline"
                      size={17}
                      color={ACCENT}
                    />
                  </View>

                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={t.c3myDemands.searchPlaceholder}
                    placeholderTextColor="#A8A091"
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
                        color="#A8A091"
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
                        ? SURFACE
                        : ACCENT
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
                <View
                  style={
                    styles.filterPanel
                  }
                >
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
                        {t.c3myDemands.refineResults}
                      </Text>
                      <Text
                        style={
                          styles.filterPanelSubtitle
                        }
                      >
                        {t.c3myDemands.varietyAndSorting}
                      </Text>
                    </View>

                    <Pressable
                      onPress={clearFilters}
                      style={styles.clearFiltersButton}
                    >
                      <Text
                        style={
                          styles.clearFiltersText
                        }
                      >
                        {t.c3myDemands.clearAll}
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    style={
                      styles.filterLabel
                    }
                  >
                    {t.c3myDemands.paddyVariety}
                  </Text>

                  <View
                    style={styles.wrapRow}
                  >
                    {PADDY_FILTERS.map(
                      (item) => {
                        const selected =
                          paddyFilter ===
                          item.value;

                        const label =
                          item.value === "all"
                            ? t.c3myDemands.allVarieties
                            : item.value === "nadu"
                            ? t.c3myDemands.nadu
                            : item.value === "samba"
                            ? t.c3myDemands.samba
                            : t.c3myDemands.keeriSamba;

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
                              {label}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>

                  <View style={styles.filterDivider} />

                  <Text
                    style={[
                      styles.filterLabel,
                      {
                        marginTop: 3,
                      },
                    ]}
                  >
                    {t.c3myDemands.sortBy}
                  </Text>

                  <View
                    style={styles.wrapRow}
                  >
                    {SORT_OPTIONS.map(
                      (item) => {
                        const selected =
                          sortOption ===
                          item.value;

                        const label =
                          item.value === "newest"
                            ? t.c3myDemands.newest
                            : item.value === "oldest"
                            ? t.c3myDemands.oldest
                            : item.value === "quantity_high"
                            ? t.c3myDemands.highestQuantity
                            : item.value === "quantity_low"
                            ? t.c3myDemands.lowestQuantity
                            : item.value === "price_high"
                            ? t.c3myDemands.highestPrice
                            : t.c3myDemands.lowestPrice;

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
                              {label}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                </View>
              ) : null}

              <View
                style={
                  styles.resultsToolbar
                }
              >
                <View style={styles.resultsToolbarLeft}>
                  <View style={styles.sectionAccentBar} />
                  <View>
                    <Text
                      style={
                        styles.sectionTitle
                      }
                    >
                      {t.c3myDemands.demands}
                    </Text>
                    <Text
                      style={
                        styles.resultMeta
                      }
                    >
                      {filteredDemands.length} {t.c3myDemands.of}{" "}
                      {demands.length} {t.c3myDemands.shown}
                    </Text>
                  </View>
                </View>

                <View
                  style={styles.viewToggle}
                >
                  <Pressable
                    accessibilityLabel={
                      t.c3myDemands.cardView
                    }
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
                        viewMode ===
                        "cards"
                          ? SURFACE
                          : INK_MUTED
                      }
                    />
                  </Pressable>

                  <Pressable
                    accessibilityLabel={
                      t.c3myDemands.compactListView
                    }
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
                        viewMode ===
                        "compact"
                          ? SURFACE
                          : INK_MUTED
                      }
                    />
                  </Pressable>
                </View>
              </View>

              {filteredDemands.length ===
              0 ? (
                <FilteredEmptyState
                  onClear={clearFilters}
                />
              ) : (
                <View style={styles.list}>
                  {filteredDemands.map(
                    (demand) =>
                      viewMode ===
                      "compact" ? (
                        <CompactDemandCard
                          key={demand._id}
                          demand={demand}
                        />
                      ) : (
                        <DemandCard
                          key={demand._id}
                          demand={demand}
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

function StatChip({
  label,
  value,
  icon,
  selected = false,
  onPress,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { t } = useLanguage();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t.c3myDemands.filterDemandsBy} ${label}`}
      style={({ pressed }) => [
        styles.statChip,
        selected && styles.statChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={12}
        color={
          selected
            ? "#FFFFFF"
            : "rgba(255,255,255,0.75)"
        }
        style={styles.statChipIcon}
      />
      <Text
        style={[
          styles.statChipValue,
          selected && styles.statChipValueSelected,
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statChipLabel,
          selected && styles.statChipLabelSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DemandCard({
  demand,
}: {
  demand: MillerDemand;
}) {
  const { t } = useLanguage();
  const visual = getStatusStyle(demand.status);

  return (
    <View style={styles.demandCard}>
      <View
        style={[
          styles.demandCardAccentBar,
          { backgroundColor: visual.text },
        ]}
      />

      <View style={styles.cardHeader}>
        <LinearGradient
          colors={[SURFACE_TINT, ACCENT_LIGHT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paddyIcon}
        >
          <Ionicons
            name="leaf-outline"
            size={21}
            color={ACCENT}
          />
        </LinearGradient>

        <View
          style={styles.cardTitleArea}
        >
          <Text style={styles.paddyTitle}>
            {translatePaddyType(demand.paddyType, t)}
          </Text>
          <View style={styles.createdDateRow}>
            <Ionicons
              name="time-outline"
              size={10}
              color="#B7AF9C"
            />
            <Text
              style={styles.createdDate}
            >
              {formatDate(
                demand.createdAt,
                t.c3myDemands.dateUnavailable,
              )}
            </Text>
          </View>
        </View>

        <DemandStatusBadge
          status={demand.status}
        />
      </View>

      <View
        style={styles.metricContainer}
      >
        <View style={styles.metric}>
          <View style={styles.metricIcon}>
            <Ionicons
              name="cube-outline"
              size={17}
              color={ACCENT_DARK}
            />
          </View>

          <View>
            <Text
              style={styles.metricLabel}
            >
              {t.c3myDemands.quantityNeeded}
            </Text>
            <Text
              style={styles.metricValue}
            >
              {formatNumber(
                demand.quantityNeeded
              )}{" "}
              {t.c3myDemands.kg}
            </Text>
          </View>
        </View>

        <View
          style={styles.metricDivider}
        />

        <View style={styles.metric}>
          <View
            style={[
              styles.metricIcon,
              styles.priceMetricIcon,
            ]}
          >
            <Ionicons
              name="cash-outline"
              size={17}
              color={ACCENT}
            />
          </View>

          <View>
            <Text
              style={styles.metricLabel}
            >
              {t.c3myDemands.offeredPrice}
            </Text>
            <Text
              style={
                styles.priceMetricValue
              }
            >
              {formatCurrency(
                demand.offeredPrice
              )}
              /{t.c3myDemands.kg}
            </Text>
          </View>
        </View>
      </View>

      {demand.status === "open" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t.c3myDemands.findMatchingFarmersA11y} ${translatePaddyType(
            demand.paddyType,
            t,
          )}`}
          onPress={() =>
            router.push({
              pathname:
                "/(c03-marketplace)/(miller)/matched-farmers",
              params: {
                demandId: demand._id,
              },
            })
          }
          style={({ pressed }) => [
            styles.findFarmersButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <LinearGradient
            colors={[ACCENT, ACCENT_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={
              styles.findFarmersButtonGradient
            }
          >
            <View
              style={
                styles.findFarmersButtonIcon
              }
            >
              <Ionicons
                name="sparkles"
                size={17}
                color={ACCENT_LIGHT}
              />
            </View>

            <View
              style={
                styles.findFarmersButtonTextArea
              }
            >
              <Text
                style={
                  styles.findFarmersButtonText
                }
              >
                {t.c3myDemands.findMatchingFarmers}
              </Text>
              <Text
                style={
                  styles.findFarmersButtonSubtext
                }
              >
                {t.c3myDemands.findMatchingFarmersSubtext}
              </Text>
            </View>

            <View style={styles.findFarmersButtonArrow}>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={SURFACE}
              />
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}

      <View style={styles.cardFooter}>
        <View
          style={[
            styles.activityDot,
            {
              backgroundColor: visual.text,
            },
          ]}
        />

        <Text
          style={styles.activityText}
        >
          {getDemandActivityText(
            demand.status,
            t,
          )}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={15}
          color="#D8CFB8"
        />
      </View>
    </View>
  );
}

function CompactDemandCard({
  demand,
}: {
  demand: MillerDemand;
}) {
  const { t } = useLanguage();
  const visual = getStatusStyle(demand.status);

  return (
    <View style={styles.compactCard}>
      <View
        style={[
          styles.compactAccentBar,
          { backgroundColor: visual.text },
        ]}
      />

      <View style={styles.compactIcon}>
        <Ionicons
          name="leaf-outline"
          size={21}
          color={ACCENT}
        />
      </View>

      <View style={styles.compactBody}>
        <View style={styles.compactTop}>
          <Text
            style={styles.compactTitle}
          >
            {translatePaddyType(
              demand.paddyType,
              t,
            )}
          </Text>

          <DemandStatusBadge
            status={demand.status}
            compact
          />
        </View>

        <Text
          style={styles.compactSubtitle}
        >
          {formatNumber(
            demand.quantityNeeded
          )}{" "}
          {t.c3myDemands.kg} •{" "}
          {formatCurrency(
            demand.offeredPrice
          )}
          /{t.c3myDemands.kg}
        </Text>

        <Text
          style={styles.compactActivity}
        >
          {getDemandActivityText(
            demand.status,
            t,
          )}
        </Text>
      </View>

      {demand.status === "open" ? (
        <Pressable
          onPress={() =>
            router.push({
              pathname:
                "/(c03-marketplace)/(miller)/matched-farmers",
              params: {
                demandId: demand._id,
              },
            })
          }
          style={
            styles.compactAction
          }
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={SURFACE}
          />
        </Pressable>
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#B7AF9C"
        />
      )}
    </View>
  );
}

function DemandStatusBadge({
  status,
  compact = false,
}: {
  status: DemandStatus;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const visual =
    getStatusStyle(status);

  return (
    <View
      style={[
        styles.statusBadge,
        {
          backgroundColor:
            visual.background,
          borderColor: visual.border,
        },
        compact &&
          styles.statusBadgeCompact,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          {
            backgroundColor:
              visual.text,
          },
        ]}
      />
      <Text
        style={[
          styles.statusText,
          {
            color: visual.text,
          },
        ]}
      >
        {getStatusLabel(status, t)}
      </Text>
    </View>
  );
}

function LoadingState() {
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerState}>
        <LinearGradient
          colors={[SURFACE_TINT, ACCENT_LIGHT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingIcon}
        >
          <ActivityIndicator
            size="large"
            color={ACCENT}
          />
        </LinearGradient>

        <Text style={styles.stateTitle}>
          {t.c3myDemands.loadingTitle}
        </Text>
        <Text
          style={styles.stateDescription}
        >
          {t.c3myDemands.loadingDescription}
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
  const { t } = useLanguage();

  return (
    <View style={styles.centerState}>
      <View style={styles.errorIcon}>
        <Ionicons
          name="cloud-offline-outline"
          size={31}
          color="#B91C1C"
        />
      </View>

      <Text style={styles.stateTitle}>
        {t.c3myDemands.unableToLoad}
      </Text>
      <Text
        style={styles.stateDescription}
      >
        {message}
      </Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retryButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="refresh"
          size={17}
          color={SURFACE}
        />
        <Text style={styles.retryText}>
          {t.c3myDemands.tryAgain}
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  const { t } = useLanguage();

  return (
    <View style={styles.centerState}>
      <LinearGradient
        colors={[SURFACE_TINT, ACCENT_LIGHT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIcon}
      >
        <Ionicons
          name="document-text-outline"
          size={37}
          color={ACCENT}
        />
      </LinearGradient>

      <Text style={styles.stateTitle}>
        {t.c3myDemands.noDemands}
      </Text>

      <Text
        style={styles.stateDescription}
      >
        {t.c3myDemands.noDemandsDescription}
      </Text>

      <Pressable
        onPress={() =>
          router.push("./create-demand")
        }
        style={({ pressed }) => [
          styles.emptyButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="add-circle-outline"
          size={19}
          color={ACCENT_DARK}
        />
        <Text
          style={styles.emptyButtonText}
        >
          {t.c3myDemands.createFirstDemand}
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
  const { t } = useLanguage();

  return (
    <View style={styles.filteredEmpty}>
      <View
        style={styles.filteredEmptyIcon}
      >
        <Ionicons
          name="search-outline"
          size={27}
          color={ACCENT}
        />
      </View>

      <Text
        style={styles.filteredEmptyTitle}
      >
        {t.c3myDemands.noMatchingDemands}
      </Text>
      <Text
        style={styles.filteredEmptyText}
      >
        {t.c3myDemands.noMatchingDemandsDescription}
      </Text>

      <Pressable
        onPress={onClear}
        style={({ pressed }) => [
          styles.clearButton,
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={styles.clearButtonText}
        >
          {t.c3myDemands.clearFilters}
        </Text>
      </Pressable>
    </View>
  );
}

function getStatusStyle(
  status: DemandStatus
): {
  background: string;
  text: string;
  border: string;
} {
  switch (status) {
    case "open":
      return {
        background: "#FEF3C7",
        text: "#92400E",
        border: "#FDE68A",
      };
    case "negotiation_ready":
      return {
        background: "#DBEAFE",
        text: "#1D4ED8",
        border: "#BFDBFE",
      };
    case "negotiating":
      return {
        background: "#FDE68A",
        text: "#78350F",
        border: "#F5C542",
      };
    case "agreement_reached":
      return {
        background: "#D1FAE5",
        text: "#065F46",
        border: "#A7F3D0",
      };
    case "negotiation_failed":
    case "rejected":
      return {
        background: "#FEE2E2",
        text: "#B91C1C",
        border: "#FECACA",
      };
    case "cancelled":
    default:
      return {
        background: "#F1EEE4",
        text: "#7A7364",
        border: "#ECE6D6",
      };
  }
}

function getDemandActivityText(
  status: DemandStatus,
  t: any,
): string {
  switch (status) {
    case "open":
      return t.c3myDemands.activityOpen;
    case "negotiation_ready":
      return t.c3myDemands.activityNegotiationReady;
    case "negotiating":
      return t.c3myDemands.activityNegotiating;
    case "agreement_reached":
      return t.c3myDemands.activityAgreementReached;
    case "negotiation_failed":
      return t.c3myDemands.activityNegotiationFailed;
    case "rejected":
      return t.c3myDemands.activityRejected;
    case "cancelled":
      return t.c3myDemands.activityCancelled;
    default:
      return t.c3myDemands.activityDefault;
  }
}

function getStatusLabel(
  status: DemandStatus,
  t: any,
): string {
  switch (status) {
    case "open":
      return t.c3myDemands.statusOpen;
    case "negotiation_ready":
      return t.c3myDemands.statusNegotiationReady;
    case "negotiating":
      return t.c3myDemands.statusNegotiating;
    case "agreement_reached":
      return t.c3myDemands.statusAgreementReached;
    case "negotiation_failed":
      return t.c3myDemands.statusNegotiationFailed;
    case "rejected":
      return t.c3myDemands.statusRejected;
    case "cancelled":
      return t.c3myDemands.statusCancelled;
    default:
      return formatLabel(status);
  }
}

function translatePaddyType(value: string, t: any): string {
  const normalized = value.trim().toLowerCase();

  if (normalized === "nadu") {
    return t.c3paddyTypes.Nadu;
  }

  if (normalized === "samba") {
    return t.c3paddyTypes.Samba;
  }

  if (normalized === "keeri samba" || normalized === "keerisamba") {
    return t.c3paddyTypes.KeeriSamba;
  }

  return formatLabel(value);
}

function formatLabel(
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
  value: string,
  fallback: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
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
    backgroundColor: CREAM,
  },
  animatedFlex: {
    flex: 1,
  },
  navigationHeader: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    zIndex: 10,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  headerText: {
    flex: 1,
    marginHorizontal: 14,
  },
  headerTitle: {
    color: INK,
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.2,
  },
  headerSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },
  headerSubtitleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  headerSubtitle: {
    color: INK_MUTED,
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  addShadow: {
    borderRadius: 14,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  addButton: {
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
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
    overflow: "hidden",
    position: "relative",
    shadowColor: ACCENT_DARK,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  summaryHeroDecoCircleOne: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -40,
  },
  summaryHeroDecoCircleTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -35,
    left: -25,
  },
  summaryHeroTopRow: {
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
      "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  summaryHeroTextArea: {
    flex: 1,
  },
  summaryHeroEyebrow: {
    color: ACCENT_LIGHT,
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 1.4,
  },
  summaryHeroTitle: {
    color: SURFACE,
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    marginTop: 4,
  },
  statChipRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 18,
  },
  statChip: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  statChipSelected: {
    backgroundColor: "rgba(255,255,255,0.26)",
    borderColor: "rgba(255,255,255,0.55)",
  },
  statChipIcon: {
    marginBottom: 4,
  },
  statChipValue: {
    color: SURFACE,
    fontSize: 16,
    fontFamily: "Poppins_800ExtraBold",
  },
  statChipValueSelected: {
    color: SURFACE,
  },
  statChipLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 8,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 2,
  },
  statChipLabelSelected: {
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
    paddingHorizontal: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE_TINT,
  },
  searchInput: {
    flex: 1,
    color: INK,
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
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
    backgroundColor: GOLD,
    borderWidth: 2,
    borderColor: SURFACE,
  },
  filterCountText: {
    color: ACCENT_DARK,
    fontSize: 7,
    fontFamily: "Poppins_800ExtraBold",
  },
  filterPanel: {
    borderRadius: 22,
    padding: 17,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: ACCENT_LIGHT,
    marginBottom: 18,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  filterPanelTitle: {
    color: INK,
    fontSize: 13,
    fontFamily: "Poppins_800ExtraBold",
  },
  filterPanelSubtitle: {
    color: "#A8A091",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  clearFiltersButton: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: SURFACE_TINT,
  },
  clearFiltersText: {
    color: ACCENT,
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
  filterLabel: {
    color: "#6B6253",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterDivider: {
    height: 1,
    backgroundColor: "#F1EEE4",
    marginVertical: 15,
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
    backgroundColor: SURFACE_ALT,
    borderWidth: 1,
    borderColor: "#ECE6D6",
  },
  optionChipSelected: {
    backgroundColor: "#FEF3C7",
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  optionChipText: {
    color: INK_MUTED,
    fontSize: 8.5,
    fontFamily: "Poppins_600SemiBold",
  },
  optionChipTextSelected: {
    color: ACCENT_DARK,
    fontFamily: "Poppins_700Bold",
  },
  resultsToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 13,
  },
  resultsToolbarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  sectionAccentBar: {
    width: 4,
    height: 26,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  sectionTitle: {
    color: INK,
    fontSize: 15.5,
    fontFamily: "Poppins_700Bold",
  },
  resultMeta: {
    color: "#A8A091",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#EFEADA",
  },
  viewToggleButton: {
    width: 34,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  viewToggleButtonActive: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  list: {
    gap: 13,
  },
  demandCard: {
    borderRadius: 22,
    padding: 16,
    paddingLeft: 20,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
    overflow: "hidden",
    position: "relative",
  },
  demandCardAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  paddyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitleArea: {
    flex: 1,
    marginLeft: 12,
  },
  paddyTitle: {
    color: INK,
    fontSize: 14.5,
    fontFamily: "Poppins_700Bold",
  },
  createdDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  createdDate: {
    color: "#B7AF9C",
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
  },
  statusBadge: {
    maxWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
  },
  statusBadgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },
  metricContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 13,
    backgroundColor: SURFACE_ALT,
    borderWidth: 1,
    borderColor: "#F1EEE4",
    marginTop: 15,
  },
  metric: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  metricDivider: {
    width: 1,
    height: 38,
    backgroundColor: CARD_BORDER,
    marginHorizontal: 11,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEADA",
  },
  priceMetricIcon: {
    backgroundColor: "#FEF3C7",
  },
  metricLabel: {
    color: INK_MUTED,
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
  },
  metricValue: {
    color: INK,
    fontSize: 11.5,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },
  priceMetricValue: {
    color: ACCENT,
    fontSize: 11.5,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },
  findFarmersButton: {
    borderRadius: 17,
    overflow: "hidden",
    marginTop: 14,
    shadowColor: ACCENT_DARK,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  findFarmersButtonGradient: {
    minHeight: 54,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  findFarmersButtonIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.14)",
  },
  findFarmersButtonTextArea: {
    flex: 1,
  },
  findFarmersButtonText: {
    color: SURFACE,
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
  },
  findFarmersButtonSubtext: {
    color:
      "rgba(255,255,255,0.65)",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
  },
  findFarmersButtonArrow: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: "#F1EEE4",
    paddingTop: 12,
    marginTop: 14,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityText: {
    flex: 1,
    color: INK_MUTED,
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  compactCard: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 20,
    padding: 14,
    paddingLeft: 18,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    overflow: "hidden",
    position: "relative",
  },
  compactAccentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  compactIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
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
    color: INK,
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
  },
  compactSubtitle: {
    color: INK_MUTED,
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
  },
  compactActivity: {
    color: "#A16207",
    fontSize: 8,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 4,
  },
  compactAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  emptyIcon: {
    width: 92,
    height: 92,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  stateTitle: {
    color: INK,
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
  },
  stateDescription: {
    color: INK_MUTED,
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
    backgroundColor: ACCENT,
    marginTop: 17,
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  retryText: {
    color: SURFACE,
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
    backgroundColor: ACCENT_LIGHT,
    marginTop: 18,
    shadowColor: GOLD,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyButtonText: {
    color: ACCENT_DARK,
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
  },
  filteredEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
    paddingHorizontal: 25,
    borderRadius: 22,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  filteredEmptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
  },
  filteredEmptyTitle: {
    color: INK,
    fontSize: 14,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 13,
  },
  filteredEmptyText: {
    color: INK_MUTED,
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
    textAlign: "center",
  },
  clearButton: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 9,
    backgroundColor: "#FEF3C7",
    marginTop: 13,
  },
  clearButtonText: {
    color: ACCENT_DARK,
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.98 }],
  },
});