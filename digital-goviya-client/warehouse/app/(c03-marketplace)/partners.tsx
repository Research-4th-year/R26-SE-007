
import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "@/components/c03-marketplace/themed-native";

import { useLanguage } from "@/contexts/LanguageContext";
import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";
import { partnerService } from "@/services/c03-marketplace/partner.service";
import { connectionService } from "@/services/c03-marketplace/connection.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";
import type { PartnerListItem } from "@/types/c03-marketplace/partner.types";
import type { MyConnectionItem } from "@/types/c03-marketplace/connection.types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PartnerTab = "connected" | "requests" | "trade";

type Theme = {
  primary: string;
  dark: string;
  soft: string;
  border: string;
  page: string;
  glow: string;
  gradientStart: string;
  gradientEnd: string;
};

const TAB_CONFIG: {
  key: PartnerTab;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    key: "connected",
    icon: "people-outline",
  },
  {
    key: "requests",
    icon: "mail-unread-outline",
  },
  {
    key: "trade",
    icon: "receipt-outline",
  },
];

export default function PartnersScreen() {
  const { user } = useMarketplaceAuth();
  const { t } = useLanguage();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [activeTab, setActiveTab] =
    useState<PartnerTab>("connected");

  const [connections, setConnections] = useState<MyConnectionItem[]>([]);
  const [requests, setRequests] = useState<MyConnectionItem[]>([]);
  const [tradePartners, setTradePartners] = useState<PartnerListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const [selectedOutgoingRequest, setSelectedOutgoingRequest] =
    useState<MyConnectionItem | null>(null);

  const [cancellingRequest, setCancellingRequest] = useState(false);

  const isFarmer = user?.role === "farmer";

  const theme = useMemo<Theme>(
    () =>
      isFarmer
        ? {
            primary: "#15803D",
            dark: "#14532D",
            soft: "#DCFCE7",
            border: "#BBF7D0",
            page: "#F5F8F5",
            glow: "rgba(21,128,61,0.16)",
            gradientStart: "#0A331D",
            gradientEnd: "#0B3B22",
          }
        : {
            primary: "#A16207",
            dark: "#78350F",
            soft: "#FEF3C7",
            border: "#FDE68A",
            page: "#FBF8F1",
            glow: "rgba(161,98,7,0.16)",
            gradientStart: "#78350F",
            gradientEnd: "#D97706",
          },
    [isFarmer]
  );

  // ---------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------

  const loadAll = useCallback(async (refresh = false) => {
    try {
      setErrorMessage(null);

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [acceptedResponse, requestResponse, tradeResponse] =
        await Promise.all([
          connectionService.getMyConnections("accepted"),
          connectionService.getMyConnections("pending"),
          partnerService.getMyPartners(),
        ]);

      setConnections(
        Array.isArray(acceptedResponse.data)
          ? acceptedResponse.data
          : []
      );

      setRequests(
        Array.isArray(requestResponse.data)
          ? requestResponse.data
          : []
      );

      setTradePartners(
        Array.isArray(tradeResponse.data)
          ? tradeResponse.data
          : []
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll])
  );

  async function respondToRequest(
    item: MyConnectionItem,
    decision: "accepted" | "rejected"
  ) {
    try {
      setActionId(item.connectionId);

      await connectionService.respond(
        item.connectionId,
        decision
      );

      if (decision === "accepted") {
        Alert.alert(
          t.c3partners.connectionAccepted,
          t.c3partners.connectionAcceptedMessage.replace(
            "{{name}}",
            item.partner.name
          )
        );
      }

      await loadAll();
    } catch (error) {
      Alert.alert(
        t.c3partners.unableToRespond,
        getApiErrorMessage(error)
      );
    } finally {
      setActionId(null);
    }
  }

  async function removeConnection(item: MyConnectionItem) {
    try {
      setActionId(item.connectionId);

      await connectionService.removeConnection(
        item.connectionId
      );

      Alert.alert(
        t.c3partners.connectionRemoved,
        t.c3partners.connectionRemovedMessage.replace(
          "{{name}}",
          item.partner.name
        )
      );

      await loadAll();
    } catch (error) {
      Alert.alert(
        t.c3partners.unableToRemove,
        getApiErrorMessage(error)
      );
    } finally {
      setActionId(null);
    }
  }

  function confirmRemoveConnection(item: MyConnectionItem) {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        t.c3partners.removeConnectionMessage.replace(
          "{{name}}",
          item.partner.name
        )
      );

      if (confirmed) {
        void removeConnection(item);
      }

      return;
    }

    Alert.alert(
      t.c3partners.removeConnectionTitle,
      t.c3partners.removeConnectionMessage.replace(
        "{{name}}",
        item.partner.name
      ),
      [
        {
          text: t.c3partners.keepConnection,
          style: "cancel",
        },
        {
          text: t.c3partners.remove,
          style: "destructive",
          onPress: () => void removeConnection(item),
        },
      ]
    );
  }

  async function cancelRequest() {
    if (!selectedOutgoingRequest) {
      return;
    }

    try {
      setCancellingRequest(true);

      await connectionService.cancelRequest(
        selectedOutgoingRequest.connectionId
      );

      const partnerName =
        selectedOutgoingRequest.partner.name;

      setSelectedOutgoingRequest(null);

      Alert.alert(
        t.c3partners.requestCancelled,
        t.c3partners.requestCancelledMessage.replace(
          "{{name}}",
          partnerName
        )
      );

      await loadAll();
    } catch (error) {
      console.log("CANCEL REQUEST FAILED:", error);
      Alert.alert(
        t.c3partners.unableToCancel,
        getApiErrorMessage(error)
      );
    } finally {
      setCancellingRequest(false);
    }
  }

  function openPartner(
    partnerType: "farmer" | "miller",
    partnerId: string
  ) {
    router.push({
      pathname:
        "/(c03-marketplace)/partner-detail" as any,
      params: {
        partnerType,
        partnerId,
      },
    });
  }

  function openPublicProfile(item: MyConnectionItem) {
    closeOutgoingSheet();

    router.push({
      pathname:
        "/(c03-marketplace)/public-profile" as any,
      params: {
        partnerType: item.partner.type,
        partnerId: item.partner.id,
      },
    });
  }

  const query = searchQuery.trim().toLowerCase();

  const visibleConnections = useMemo(
    () =>
      connections.filter((item) =>
        matchesSearch(item.partner, query)
      ),
    [connections, query]
  );

  const visibleRequests = useMemo(
    () =>
      requests.filter((item) =>
        matchesSearch(item.partner, query)
      ),
    [requests, query]
  );

  const visibleTrades = useMemo(
    () =>
      tradePartners.filter((item) =>
        matchesSearch(item.partner, query)
      ),
    [tradePartners, query]
  );

  const incomingCount = requests.filter(
    (item) => item.direction === "incoming"
  ).length;

  // ---------------------------------------------------------------------
  // Animations
  // ---------------------------------------------------------------------

  useEffect(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );
  }, [activeTab, query]);

  const tabLayouts = useRef<
    Record<string, { x: number; width: number }>
  >({}).current;

  const indicatorX = useRef(
    new Animated.Value(0)
  ).current;

  const indicatorWidth = useRef(
    new Animated.Value(0)
  ).current;

  const indicatorMeasured = useRef(false);

  function handleTabLayout(
    tab: PartnerTab,
    x: number,
    width: number
  ) {
    tabLayouts[tab] = { x, width };

    if (
      tab === activeTab &&
      !indicatorMeasured.current
    ) {
      indicatorMeasured.current = true;
      indicatorX.setValue(x);
      indicatorWidth.setValue(width);
    }
  }

  useEffect(() => {
    const layout = tabLayouts[activeTab];

    if (!layout) {
      return;
    }

    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: layout.x,
        useNativeDriver: false,
        friction: 9,
        tension: 90,
      }),
      Animated.spring(indicatorWidth, {
        toValue: layout.width,
        useNativeDriver: false,
        friction: 9,
        tension: 90,
      }),
    ]).start();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const screenOpacity = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    if (!loading) {
      screenOpacity.setValue(0);

      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const sheetY = useRef(
    new Animated.Value(420)
  ).current;

  const overlayOpacity = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    if (selectedOutgoingRequest) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(sheetY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 10,
          tension: 80,
        }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      sheetY.setValue(420);
    }
  }, [selectedOutgoingRequest]);

  function closeOutgoingSheet() {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(sheetY, {
        toValue: 420,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() =>
      setSelectedOutgoingRequest(null)
    );
  }

  // ---------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------

  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView
        style={[
          styles.screen,
          { backgroundColor: theme.page },
        ]}
      >
        <LoadingState theme={theme} />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
      {/* --------------------------------------------------------------- */}
      {/* Header                                                          */}
      {/* --------------------------------------------------------------- */}

      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.headerEyebrowRow}>
              <View
                style={[
                  styles.headerEyebrowDot,
                  { backgroundColor: theme.primary },
                ]}
              />

              <Text style={styles.headerEyebrow}>{t.c3partners.eyebrow}</Text>
            </View>

            <Text style={styles.headerTitle}>{t.c3partners.title}</Text>

            <Text style={styles.headerSubtitle}>
              {t.c3partners.subtitle}
            </Text>
          </View>

          <View
            style={[
              styles.headerRoleBadge,
              {
                backgroundColor: theme.soft,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name={isFarmer ? "leaf-outline" : "business-outline"}
              size={17}
              color={theme.primary}
            />

            <Text style={[styles.headerRoleText, { color: theme.primary }]}>
              {isFarmer ? t.c3partners.farmer : t.c3partners.miller}
            </Text>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity: screenOpacity }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadAll(true)}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* ------------------------------------------------------------- */}
        {/* Hero                                                          */}
        {/* ------------------------------------------------------------- */}

        <LinearGradient
          colors={
            isFarmer
              ? ["#0A331D", "#12522E", "#0B3B22"]
              : [theme.gradientStart, theme.gradientEnd]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={styles.heroCircleLarge} />

          <View pointerEvents="none" style={styles.heroCircleSmall} />

          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="people" size={26} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>{t.c3partners.trustedNetwork}</Text>

              <Text style={styles.heroTitle}>{t.c3partners.heroTitle}</Text>

              <Text style={styles.heroDescription}>
                {t.c3partners.heroDescription}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat
              label={t.c3partners.connected}
              value={connections.length}
              icon="people-outline"
            />

            <Stat
              label={t.c3partners.requests}
              value={requests.length}
              icon="mail-outline"
            />

            <Stat
              label={t.c3partners.incoming}
              value={incomingCount}
              icon="arrow-down-outline"
            />

            <Stat
              label={t.c3partners.tradePartners}
              value={tradePartners.length}
              icon="swap-horizontal-outline"
            />
          </View>
        </LinearGradient>

        {/* ------------------------------------------------------------- */}
        {/* Tabs                                                          */}
        {/* ------------------------------------------------------------- */}

        <View style={styles.tabWrapper}>
          <View style={styles.tabBar}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  backgroundColor: theme.dark,
                  left: indicatorX,
                  width: indicatorWidth,
                },
              ]}
            />

            {TAB_CONFIG.map(({ key, icon }) => {
              const selected = activeTab === key;

              const label =
                key === "connected"
                  ? t.c3partners.connected
                  : key === "requests"
                    ? t.c3partners.requests
                    : t.c3partners.trade;

              const badge =
                key === "connected"
                  ? connections.length
                  : key === "requests"
                    ? incomingCount
                    : tradePartners.length;

              return (
                <Pressable
                  key={key}
                  onLayout={(e) =>
                    handleTabLayout(
                      key,
                      e.nativeEvent.layout.x,
                      e.nativeEvent.layout.width,
                    )
                  }
                  onPress={() => setActiveTab(key)}
                  style={styles.tabButton}
                >
                  <Ionicons
                    name={icon}
                    size={17}
                    color={selected ? "#FFFFFF" : "#64748B"}
                  />

                  <Text
                    style={[styles.tabText, selected && styles.tabTextSelected]}
                  >
                    {label}
                  </Text>

                  {badge > 0 ? (
                    <View
                      style={[
                        styles.tabBadge,
                        selected && {
                          backgroundColor: "rgba(255,255,255,0.18)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabBadgeText,
                          selected && {
                            color: "#FFFFFF",
                          },
                        ]}
                      >
                        {badge > 99 ? "99+" : badge}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* Search                                                        */}
        {/* ------------------------------------------------------------- */}

        <View
          style={[
            styles.searchBox,
            searchFocused && {
              borderColor: theme.primary,
              shadowColor: theme.primary,
              shadowOpacity: 0.16,
              shadowRadius: 12,
              shadowOffset: {
                width: 0,
                height: 5,
              },
              elevation: 4,
            },
          ]}
        >
          <View
            style={[
              styles.searchIconContainer,
              searchFocused && {
                backgroundColor: theme.soft,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={17}
              color={searchFocused ? theme.primary : "#64748B"}
            />
          </View>

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={
              isFarmer
                ? t.c3partners.searchMiller
                : t.c3partners.searchFarmer
            }
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />

          {searchQuery ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={8}
              style={styles.searchClear}
            >
              <Ionicons name="close" size={14} color="#64748B" />
            </Pressable>
          ) : null}
        </View>

        {/* ------------------------------------------------------------- */}
        {/* Error                                                         */}
        {/* ------------------------------------------------------------- */}

        {errorMessage ? (
          <PressableScale
            onPress={() => void loadAll()}
            style={styles.errorCard}
          >
            <View style={styles.errorIcon}>
              <Ionicons name="warning-outline" size={20} color="#B91C1C" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>{t.c3partners.unableToLoad}</Text>

              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>

            <View style={styles.errorRefresh}>
              <Ionicons name="refresh-outline" size={17} color="#B91C1C" />
            </View>
          </PressableScale>
        ) : null}

        {/* ------------------------------------------------------------- */}
        {/* Content                                                       */}
        {/* ------------------------------------------------------------- */}

        {activeTab === "connected" ? (
          <ConnectedSection
            items={visibleConnections}
            actionId={actionId}
            theme={theme}
            onOpen={openPartner}
            onRemove={confirmRemoveConnection}
          />
        ) : null}

        {activeTab === "requests" ? (
          <RequestsSection
            items={visibleRequests}
            actionId={actionId}
            theme={theme}
            onRespond={respondToRequest}
            onOpen={openPartner}
            onOutgoingPress={setSelectedOutgoingRequest}
          />
        ) : null}

        {activeTab === "trade" ? (
          <TradeSection
            items={visibleTrades}
            theme={theme}
            onOpen={openPartner}
          />
        ) : null}
      </Animated.ScrollView>

      {/* --------------------------------------------------------------- */}
      {/* Pending Request Bottom Sheet                                    */}
      {/* --------------------------------------------------------------- */}

      <Modal
        visible={Boolean(selectedOutgoingRequest)}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeOutgoingSheet}
      >
        <Animated.View
          style={[styles.modalOverlay, { opacity: overlayOpacity }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeOutgoingSheet}
          />

          <Animated.View
            style={[
              styles.requestPopup,
              {
                transform: [{ translateY: sheetY }],
              },
            ]}
          >
            {selectedOutgoingRequest ? (
              <>
                <View style={styles.popupHandle} />

                <View style={styles.popupHeader}>
                  <View
                    style={[
                      styles.popupIcon,
                      {
                        backgroundColor: theme.soft,
                      },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={24}
                      color={theme.primary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.popupTitle}>
                      {t.c3partners.connectionRequest}
                    </Text>

                    <Text style={styles.popupSubtitle}>
                      {t.c3partners.waitingForResponse}
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeOutgoingSheet}
                    style={styles.popupClose}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={19} color="#64748B" />
                  </Pressable>
                </View>

                <View style={styles.popupPartnerCard}>
                  <PartnerIdentity
                    partner={selectedOutgoingRequest.partner}
                    theme={theme}
                  />
                </View>

                <View style={styles.popupInfo}>
                  <View style={styles.popupInfoIcon}>
                    <Ionicons
                      name="information-circle-outline"
                      size={17}
                      color="#64748B"
                    />
                  </View>

                  <Text style={styles.popupInfoText}>
                    {t.c3partners.requestSentOn.replace(
                      "{{date}}",
                      formatDate(
                        selectedOutgoingRequest.requestedAt,
                        t.c3partners.noDate,
                        t.c3partners.dateUnavailable
                      )
                    )}
                  </Text>
                </View>

                <PressableScale
                  onPress={() => openPublicProfile(selectedOutgoingRequest)}
                  style={[
                    styles.popupPrimaryButton,
                    {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <Ionicons name="person-outline" size={18} color="#FFFFFF" />

                  <Text style={styles.popupPrimaryText}>
                    {t.c3partners.viewProfile}
                  </Text>

                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </PressableScale>

                <PressableScale
                  disabled={cancellingRequest}
                  style={[
                    styles.popupCancelButton,
                    cancellingRequest && styles.disabledButton,
                  ]}
                  onPress={() => {
                    if (Platform.OS === "web") {
                      const confirmed = window.confirm(
                        t.c3partners.cancelRequestMessage.replace(
                          "{{name}}",
                          selectedOutgoingRequest?.partner.name
                        ),
                      );

                      if (confirmed) {
                        void cancelRequest();
                      }

                      return;
                    }

                    Alert.alert(
                      t.c3partners.cancelRequestTitle,
                      t.c3partners.cancelRequestMessage.replace(
                        "{{name}}",
                        selectedOutgoingRequest?.partner.name
                      ),
                      [
                        {
                          text: t.c3partners.keepRequest,
                          style: "cancel",
                        },
                        {
                          text: t.c3partners.cancelRequest,
                          style: "destructive",
                          onPress: () => void cancelRequest(),
                        },
                      ],
                    );
                  }}
                >
                  {cancellingRequest ? (
                    <ActivityIndicator size="small" color="#B91C1C" />
                  ) : (
                    <>
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#B91C1C"
                      />

                      <Text style={styles.popupCancelText}>
                        {t.c3partners.cancelRequestButton}
                      </Text>
                    </>
                  )}
                </PressableScale>
              </>
            ) : null}
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================================
// SECTIONS
// =====================================================================

function ConnectedSection({
  items,
  actionId,
  theme,
  onOpen,
  onRemove,
}: {
  items: MyConnectionItem[];
  actionId: string | null;
  theme: Theme;
  onOpen: (
    type: "farmer" | "miller",
    id: string
  ) => void;
  onRemove: (item: MyConnectionItem) => void;
}) {
  const { t } = useLanguage();

  return (
    <View>
      <SectionHeader
        title={t.c3partners.connectedPartners}
        subtitle={`${items.length} ${
          items.length === 1
            ? t.c3partners.connectionSingular
            : t.c3partners.connectionPlural
        }`}
        icon="people-outline"
        theme={theme}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title={t.c3partners.noConnections}
          text={t.c3partners.noConnectionsText}
          theme={theme}
        />
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <FadeInItem
              key={item.connectionId}
              index={index}
            >
              <View
                style={[
                  styles.connectionCard,
                  {
                    shadowColor: theme.glow,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardAccent,
                    {
                      backgroundColor:
                        theme.primary,
                    },
                  ]}
                />

                <PressableScale
                  onPress={() =>
                    onOpen(
                      item.partner.type,
                      item.partner.id
                    )
                  }
                >
                  <PartnerIdentity
                    partner={item.partner}
                    theme={theme}
                    showStatusDot
                  />

                  <View style={styles.badgeRow}>
                    <Badge
                      icon="checkmark-circle"
                      text={t.c3partners.connected}
                      background="#DCFCE7"
                      color="#166534"
                    />

                    <Badge
                      icon="call-outline"
                      text={t.c3partners.contactUnlocked}
                      background="#EFF6FF"
                      color="#1D4ED8"
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <View>
                      <Text
                        style={
                          styles.cardFooterLabel
                        }
                      >
                        {t.c3partners.connectionSince}
                      </Text>

                      <Text
                        style={
                          styles.cardFooterText
                        }
                      >
                        {formatDate(
                          item.respondedAt ||
                            item.requestedAt,
                          t.c3partners.noDate,
                          t.c3partners.dateUnavailable
                        )}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.openPill,
                        {
                          backgroundColor:
                            theme.soft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.openText,
                          {
                            color:
                              theme.primary,
                          },
                        ]}
                      >
                        {t.c3partners.viewProfile}
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={theme.primary}
                      />
                    </View>
                  </View>
                </PressableScale>

                <PressableScale
                  disabled={actionId === item.connectionId}
                  style={[
                    styles.removeConnectionButton,
                    actionId === item.connectionId &&
                      styles.disabledButton,
                  ]}
                  onPress={() => onRemove(item)}
                >
                  {actionId === item.connectionId ? (
                    <ActivityIndicator
                      size="small"
                      color="#B91C1C"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="person-remove-outline"
                        size={16}
                        color="#B91C1C"
                      />

                      <Text style={styles.removeConnectionText}>
                        {t.c3partners.removeConnection}
                      </Text>
                    </>
                  )}
                </PressableScale>
              </View>
            </FadeInItem>
          ))}
        </View>
      )}
    </View>
  );
}

function RequestsSection({
  items,
  actionId,
  theme,
  onRespond,
  onOpen,
  onOutgoingPress,
}: {
  items: MyConnectionItem[];
  actionId: string | null;
  theme: Theme;
  onRespond: (
    item: MyConnectionItem,
    decision: "accepted" | "rejected"
  ) => void;
  onOpen: (
    type: "farmer" | "miller",
    id: string
  ) => void;
  onOutgoingPress: (
    item: MyConnectionItem
  ) => void;
}) {
  const { t } = useLanguage();

  const incoming = items.filter(
    (item) => item.direction === "incoming"
  );

  const outgoing = items.filter(
    (item) => item.direction === "outgoing"
  );

  if (items.length === 0) {
    return (
      <>
        <SectionHeader
          title={t.c3partners.connectionRequests}
          subtitle={t.c3partners.requestsSubtitle}
          icon="mail-outline"
          theme={theme}
        />

        <EmptyState
          icon="mail-outline"
          title={t.c3partners.noPendingRequests}
          text={t.c3partners.noPendingRequestsText}
          theme={theme}
        />
      </>
    );
  }

  return (
    <View>
      {/* Incoming */}
      {incoming.length > 0 ? (
        <>
          <SectionHeader
            title={t.c3partners.incomingRequests}
            subtitle={`${incoming.length} ${t.c3partners.waitingForResponse}`}
            icon="arrow-down-outline"
            theme={theme}
          />

          <View style={styles.list}>
            {incoming.map((item, index) => {
              const busy =
                actionId === item.connectionId;

              return (
                <FadeInItem
                  key={item.connectionId}
                  index={index}
                >
                  <View
                    style={[
                      styles.requestCard,
                      {
                        shadowColor:
                          theme.glow,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardAccent,
                        {
                          backgroundColor:
                            "#F59E0B",
                        },
                      ]}
                    />

                    <Pressable
                      onPress={() =>
                        onOpen(
                          item.partner.type,
                          item.partner.id
                        )
                      }
                    >
                      <PartnerIdentity
                        partner={item.partner}
                        theme={theme}
                      />
                    </Pressable>

                    <View
                      style={styles.requestMessage}
                    >
                      <View
                        style={[
                          styles.requestMessageIcon,
                          {
                            backgroundColor:
                              theme.soft,
                          },
                        ]}
                      >
                        <Ionicons
                          name="person-add-outline"
                          size={15}
                          color={
                            theme.primary
                          }
                        />
                      </View>

                      <Text
                        style={
                          styles.requestMessageText
                        }
                      >
                        Wants to connect with you
                        as a marketplace partner.
                      </Text>
                    </View>

                    <View
                      style={
                        styles.requestActions
                      }
                    >
                      <Pressable
                        disabled={busy}
                        onPress={() =>
                          onRespond(
                            item,
                            "accepted"
                          )
                        }
                        style={({ pressed }) => [
                          styles.acceptButton,
                          {
                            backgroundColor:
                              theme.primary,
                          },
                          busy &&
                            styles.disabledButton,
                          pressed &&
                            !busy &&
                            styles.requestActionPressed,
                        ]}
                      >
                        {busy ? (
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                          />
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color="#FFFFFF"
                            />

                            <Text
                              style={
                                styles.acceptText
                              }
                            >
                              {t.c3partners.accept}
                            </Text>
                          </>
                        )}
                      </Pressable>

                      <Pressable
                        disabled={busy}
                        onPress={() =>
                          onRespond(
                            item,
                            "rejected"
                          )
                        }
                        style={({ pressed }) => [
                          styles.rejectButton,
                          busy &&
                            styles.disabledButton,
                          pressed &&
                            !busy &&
                            styles.requestActionPressed,
                        ]}
                      >
                        <Ionicons
                          name="close-outline"
                          size={18}
                          color="#B91C1C"
                        />

                        <Text
                          style={styles.rejectText}
                        >
                          {t.c3partners.reject}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </FadeInItem>
              );
            })}
          </View>
        </>
      ) : null}

      {/* Outgoing */}
      {outgoing.length > 0 ? (
        <>
          <SectionHeader
            title={t.c3partners.sentRequests}
            subtitle={`${outgoing.length} ${t.c3partners.waitingForResponse}`}
            icon="paper-plane-outline"
            theme={theme}
          />

          <View style={styles.list}>
            {outgoing.map((item, index) => (
              <FadeInItem
                key={item.connectionId}
                index={index}
              >
                <PressableScale
                  onPress={() =>
                    onOutgoingPress(item)
                  }
                  style={[
                    styles.connectionCard,
                    {
                      shadowColor:
                        theme.glow,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.cardAccent,
                      {
                        backgroundColor:
                          "#94A3B8",
                      },
                    ]}
                  />

                  <PartnerIdentity
                    partner={item.partner}
                    theme={theme}
                  />

                  <View style={styles.pendingBox}>
                    <View
                      style={styles.pendingIcon}
                    >
                      <Ionicons
                        name="time-outline"
                        size={17}
                        color="#64748B"
                      />
                    </View>

                    <View
                      style={{ flex: 1 }}
                    >
                      <Text
                        style={
                          styles.pendingTitle
                        }
                      >
                        {t.c3partners.requestSent}
                      </Text>

                      <Text
                        style={
                          styles.pendingText
                        }
                      >
                        {`${t.c3partners.waitingSince} ${formatDate(
                          item.requestedAt,
                          t.c3partners.noDate,
                          t.c3partners.dateUnavailable
                        )}`}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.pendingMore
                      }
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={17}
                        color="#64748B"
                      />
                    </View>
                  </View>
                </PressableScale>
              </FadeInItem>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function TradeSection({
  items,
  theme,
  onOpen,
}: {
  items: PartnerListItem[];
  theme: Theme;
  onOpen: (
    type: "farmer" | "miller",
    id: string
  ) => void;
}) {
  const { t } = useLanguage();

  return (
    <View>
      <SectionHeader
        title={t.c3partners.tradePartnersTitle}
        subtitle={t.c3partners.tradePartnersSubtitle}
        icon="swap-horizontal-outline"
        theme={theme}
      />

      {items.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={t.c3partners.noTradePartners}
          text={t.c3partners.noTradePartnersText}
          theme={theme}
        />
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <FadeInItem
              key={item.partner.id}
              index={index}
            >
              <PressableScale
                onPress={() =>
                  onOpen(
                    item.partner.type,
                    item.partner.id
                  )
                }
                style={[
                  styles.tradeCard,
                  {
                    shadowColor:
                      theme.glow,
                  },
                ]}
              >
                <View
                  style={[
                    styles.cardAccent,
                    {
                      backgroundColor:
                        theme.dark,
                    },
                  ]}
                />

                <PartnerIdentity
                  partner={item.partner}
                  theme={theme}
                />

                <View style={styles.badgeRow}>
                  {item.relationship?.connected ? (
                    <Badge
                      icon="people"
                      text={t.c3partners.connected}
                      background="#DCFCE7"
                      color="#166534"
                    />
                  ) : null}

                  {item.isFavorite ? (
                    <Badge
                      icon="star"
                      text={t.c3partners.favourite}
                      background="#FEF3C7"
                      color="#92400E"
                    />
                  ) : null}
                </View>

                <View style={styles.metrics}>
                  <Metric
                    label={t.c3partners.totalTrades}
                    value={String(
                      item.summary
                        .totalAgreements
                    )}
                    icon="repeat-outline"
                  />

                  <Metric
                    label={t.c3partners.quantity}
                    value={`${formatNumber(
                      item.summary
                        .totalQuantityKg
                    )} ${t.c3partners.kg}`}
                    icon="scale-outline"
                  />

                  <Metric
                    label={t.c3partners.avgPrice}
                    value={formatCurrency(
                      item.summary
                        .averageAgreedPrice
                    )}
                    icon="cash-outline"
                  />
                </View>

                <View style={styles.cardFooter}>
                  <View>
                    <Text
                      style={
                        styles.cardFooterLabel
                      }
                    >
                      {t.c3partners.lastTrade}
                    </Text>

                    <Text
                      style={
                        styles.cardFooterText
                      }
                    >
                      {formatDate(
                        item.summary
                          .lastTransactionAt,
                        t.c3partners.noDate,
                        t.c3partners.dateUnavailable
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.openPill,
                      {
                        backgroundColor:
                          theme.soft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.openText,
                        {
                          color:
                            theme.primary,
                        },
                      ]}
                    >
                      {t.c3partners.viewDetails}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={theme.primary}
                    />
                  </View>
                </View>
              </PressableScale>
            </FadeInItem>
          ))}
        </View>
      )}
    </View>
  );
}

// =====================================================================
// SHARED COMPONENTS
// =====================================================================

function PartnerIdentity({
  partner,
  theme,
  showStatusDot,
}: {
  partner: {
    type: "farmer" | "miller";
    name: string;
    district: string;
    location: string;
  };
  theme: Theme;
  showStatusDot?: boolean;
}) {
  const { t } = useLanguage();

  return (
    <View style={styles.partnerTop}>
      <View
        style={[
          styles.avatarRing,
          {
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor:
                theme.soft,
            },
          ]}
        >
          <Ionicons
            name={
              partner.type === "miller"
                ? "business-outline"
                : "leaf-outline"
            }
            size={22}
            color={theme.primary}
          />
        </View>

        {showStatusDot ? (
          <View
            style={[
              styles.statusDot,
              {
                borderColor: "#FFFFFF",
              },
            ]}
          />
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={styles.partnerName}
          numberOfLines={1}
        >
          {partner.name}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={13}
            color="#64748B"
          />

          <Text
            style={styles.partnerLocation}
            numberOfLines={1}
          >
            {translateDistrict(
              partner.district,
              t.c3districts,
              partner.district
            )}{" "}
            • {partner.location}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.typeChip,
          {
            backgroundColor:
              theme.soft,
            borderColor:
              theme.border,
          },
        ]}
      >
        <Ionicons
          name={
            partner.type === "miller"
              ? "business-outline"
              : "leaf-outline"
          }
          size={11}
          color={theme.primary}
        />

        <Text
          style={[
            styles.typeChipText,
            {
              color: theme.primary,
            },
          ]}
        >
          {partner.type === "miller"
            ? t.c3partners.miller
            : t.c3partners.farmer}
        </Text>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
  icon,
  theme,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  theme: Theme;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          {
            backgroundColor:
              theme.soft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={theme.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>
          {title}
        </Text>

        <Text
          style={styles.sectionSubtitle}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function Badge({
  icon,
  text,
  background,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  background: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor:
            background,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={12}
        color={color}
      />

      <Text
        style={[
          styles.badgeText,
          { color },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  text,
  theme,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  theme: Theme;
}) {
  return (
    <View style={styles.emptyState}>
      <FloatingIcon>
        <View
          style={[
            styles.emptyIconOuter,
            {
              backgroundColor:
                theme.soft,
              borderColor:
                theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor:
                  "#FFFFFF",
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={28}
              color={theme.primary}
            />
          </View>
        </View>
      </FloatingIcon>

      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text style={styles.emptyText}>
        {text}
      </Text>
    </View>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIcon}>
        <Ionicons
          name={icon}
          size={12}
          color="#FFFFFF"
        />
      </View>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text
        style={styles.statLabel}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricTop}>
        <Ionicons
          name={icon}
          size={12}
          color="#94A3B8"
        />

        <Text style={styles.metricLabel}>
          {label}
        </Text>
      </View>

      <Text
        style={styles.metricValue}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// =====================================================================
// ANIMATION HELPERS
// =====================================================================

function PressableScale({
  onPress,
  style,
  children,
  disabled,
}: {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const flattened =
    StyleSheet.flatten(style) || {};

  const {
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    alignSelf,
    width,
    minWidth,
    maxWidth,
    ...visualStyle
  } = flattened as Record<string, unknown>;

  const fillsRow =
    flex != null || width != null;

  const animateTo = (
    toValue: number
  ) =>
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 7,
      tension: 140,
    }).start();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() =>
        animateTo(0.975)
      }
      onPressOut={() =>
        animateTo(1)
      }
      style={{
        flex: flex as ViewStyle["flex"],
        flexGrow: flexGrow as ViewStyle["flexGrow"],
        flexShrink: flexShrink as ViewStyle["flexShrink"],
        flexBasis: flexBasis as ViewStyle["flexBasis"],
        alignSelf: alignSelf as ViewStyle["alignSelf"],
        width: width as ViewStyle["width"],
        minWidth:
          (minWidth as ViewStyle["minWidth"]) ??
          (fillsRow ? 0 : undefined),
        maxWidth: maxWidth as ViewStyle["maxWidth"],
      }}
    >
      <Animated.View
        style={[
          visualStyle,
          fillsRow ? { width: "100%" } : null,
          {
            transform: [
              { scale },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

function FadeInItem({
  index = 0,
  children,
}: {
  index?: number;
  children: React.ReactNode;
}) {
  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  const translateY = useRef(
    new Animated.Value(14)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay:
          Math.min(index, 8) * 55,
        easing: Easing.out(
          Easing.cubic
        ),
        useNativeDriver: true,
      }),

      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        delay:
          Math.min(index, 8) * 55,
        easing: Easing.out(
          Easing.cubic
        ),
        useNativeDriver: true,
      }),
    ]).start();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function FloatingIcon({
  children,
}: {
  children: React.ReactNode;
}) {
  const translateY = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -6,
          duration: 1400,
          easing: Easing.inOut(
            Easing.sin
          ),
          useNativeDriver: true,
        }),

        Animated.timing(translateY, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(
            Easing.sin
          ),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [translateY]);

  return (
    <Animated.View
      style={{
        transform: [
          { translateY },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function SkeletonBlock({
  style,
}: {
  style?: any;
}) {
  const pulse = useRef(
    new Animated.Value(0.35)
  ).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(
            Easing.ease
          ),
          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 750,
          easing: Easing.inOut(
            Easing.ease
          ),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        styles.skeletonBlock,
        style,
        { opacity: pulse },
      ]}
    />
  );
}

function LoadingState({
  theme,
}: {
  theme: Theme;
}) {
  const { t } = useLanguage();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={
        styles.loadingContent
      }
    >
      <View style={styles.loadingHeader}>
        <View style={{ flex: 1 }}>
          <SkeletonBlock
            style={{
              width: 105,
              height: 8,
              borderRadius: 5,
            }}
          />

          <SkeletonBlock
            style={{
              width: 100,
              height: 22,
              borderRadius: 7,
              marginTop: 9,
            }}
          />

          <SkeletonBlock
            style={{
              width: "75%",
              height: 9,
              borderRadius: 5,
              marginTop: 8,
            }}
          />
        </View>

        <SkeletonBlock
          style={{
            width: 72,
            height: 34,
            borderRadius: 12,
          }}
        />
      </View>

      <SkeletonBlock
        style={{
          height: 180,
          borderRadius: 24,
          marginTop: 20,
          marginBottom: 14,
        }}
      />

      <SkeletonBlock
        style={{
          height: 59,
          borderRadius: 17,
          marginBottom: 13,
        }}
      />

      <SkeletonBlock
        style={{
          height: 52,
          borderRadius: 16,
          marginBottom: 18,
        }}
      />

      {[0, 1, 2].map((i) => (
        <SkeletonBlock
          key={i}
          style={{
            height: 155,
            borderRadius: 21,
            marginBottom: 12,
          }}
        />
      ))}

      <View
        style={styles.loadingLabelRow}
      >
        <ActivityIndicator
          size="small"
          color={theme.primary}
        />

        <Text
          style={styles.loadingLabel}
        >
          {t.c3partners.loadingNetwork}
        </Text>
      </View>
    </ScrollView>
  );
}

// =====================================================================
// PURE HELPERS
// =====================================================================

function matchesSearch(
  partner: {
    name: string;
    district: string;
    location: string;
  },
  query: string
) {
  if (!query) {
    return true;
  }

  return [
    partner.name,
    partner.district,
    partner.location,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
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

  const districtMap: Record<string, string> = {
    Ampara: translations.Ampara,
    Badulla: translations.Badulla,
    Kandy: translations.Kandy,
    Monaragala: translations.Monaragala,
  };

  return districtMap[district.trim()] ?? district.trim();
}

function formatDate(
  value: string | null | undefined,
  noDate: string,
  dateUnavailable: string,
) {
  if (!value) {
    return noDate;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return dateUnavailable;
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

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    "en-LK",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatCurrency(value: number) {
  return `Rs. ${new Intl.NumberFormat(
    "en-LK",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value)}`;
}

// =====================================================================
// STYLES
// =====================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // -------------------------------------------------------------------
  // Header
  // -------------------------------------------------------------------

  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF2",
  },

  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  headerEyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  headerEyebrow: {
    color: "#94A3B8",
    fontFamily: "Poppins_700Bold",
    fontSize: 7,
    letterSpacing: 1.15,
  },

  headerTitle: {
    color: "#172033",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 22,
    lineHeight: 29,
    marginTop: 1,
  },

  headerSubtitle: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 2,
    maxWidth: "94%",
  },

  headerRoleBadge: {
    minWidth: 67,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  headerRoleText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 7,
  },

  // -------------------------------------------------------------------
  // Main content
  // -------------------------------------------------------------------

  content: {
    paddingHorizontal: 17,
    paddingTop: 16,
    paddingBottom: 130,
  },

  loadingContent: {
    padding: 17,
    paddingBottom: 100,
  },

  // -------------------------------------------------------------------
  // Hero
  // -------------------------------------------------------------------

  hero: {
    borderRadius: 24,
    padding: 17,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 4,
  },

  heroCircleLarge: {
    position: "absolute",
    width: 175,
    height: 175,
    borderRadius: 88,
    backgroundColor:
      "rgba(8, 72, 30, 0.36)",
    top: -75,
    right: -60,
  },

  heroCircleSmall: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor:
      "rgba(255,255,255,0.055)",
    bottom: -38,
    left: -25,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  heroIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.12)",
  },

  heroEyebrow: {
    color: "#FDE68A",
    fontFamily: "Poppins_700Bold",
    fontSize: 6.5,
    letterSpacing: 1.05,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },

  heroDescription: {
    color: "rgba(255,255,255,0.72)",
    fontFamily: "Poppins_400Regular",
    fontSize: 7.2,
    lineHeight: 12,
    marginTop: 2,
    maxWidth: "96%",
  },

  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 17,
  },

  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 3,
    borderRadius: 13,
    backgroundColor:
      "rgba(255,255,255,0.105)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.075)",
  },

  statIcon: {
    width: 21,
    height: 21,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.13)",
    marginBottom: 3,
  },

  statValue: {
    color: "#FFFFFF",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 14,
    lineHeight: 19,
  },

  statLabel: {
    color: "rgba(255,255,255,0.67)",
    fontFamily: "Poppins_500Medium",
    fontSize: 5.8,
    marginTop: 1,
    maxWidth: "100%",
  },

  // -------------------------------------------------------------------
  // Tabs
  // -------------------------------------------------------------------

  tabWrapper: {
    marginBottom: 12,
  },

  tabBar: {
    flexDirection: "row",
    gap: 5,
    padding: 5,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.045,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  tabIndicator: {
    position: "absolute",
    top: 5,
    bottom: 5,
    borderRadius: 13,
  },

  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    zIndex: 2,
  },

  tabText: {
    color: "#64748B",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 7,
  },

  tabTextSelected: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },

  tabBadge: {
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  tabBadgeText: {
    color: "#64748B",
    fontFamily: "Poppins_700Bold",
    fontSize: 6,
  },

  // -------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------

  searchBox: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingRight: 9,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 1,
  },

  searchIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  searchInput: {
    flex: 1,
    color: "#1F2937",
    fontFamily: "Poppins_500Medium",
    fontSize: 8.5,
    paddingVertical: 0,
  },

  searchClear: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  // -------------------------------------------------------------------
  // Section header
  // -------------------------------------------------------------------

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 11,
    marginTop: 3,
  },

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: "#172033",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 12.5,
    lineHeight: 18,
  },

  sectionSubtitle: {
    color: "#94A3B8",
    fontFamily: "Poppins_400Regular",
    fontSize: 7,
    marginTop: 0,
  },

  list: {
    gap: 11,
    marginBottom: 19,
  },

  // -------------------------------------------------------------------
  // Cards
  // -------------------------------------------------------------------

  connectionCard: {
    padding: 15,
    paddingLeft: 18,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowOpacity: 0.45,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },

  requestCard: {
    padding: 15,
    paddingLeft: 18,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowOpacity: 0.45,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },

  tradeCard: {
    padding: 15,
    paddingLeft: 18,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowOpacity: 0.45,
    shadowRadius: 13,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 2,
  },

  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },

  // -------------------------------------------------------------------
  // Partner identity
  // -------------------------------------------------------------------

  partnerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatarRing: {
    width: 55,
    height: 55,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  statusDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
  },

  partnerName: {
    color: "#172033",
    fontFamily: "Poppins_700Bold",
    fontSize: 11.5,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },

  partnerLocation: {
    flex: 1,
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 7.2,
  },

  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
  },

  typeChipText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 6,
    letterSpacing: 0.15,
  },

  // -------------------------------------------------------------------
  // Badges
  // -------------------------------------------------------------------

  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 11,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 6.4,
  },

  // -------------------------------------------------------------------
  // Card footer
  // -------------------------------------------------------------------

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  cardFooterLabel: {
    color: "#CBD5E1",
    fontFamily: "Poppins_700Bold",
    fontSize: 5.3,
    letterSpacing: 0.5,
  },

  cardFooterText: {
    color: "#64748B",
    fontFamily: "Poppins_500Medium",
    fontSize: 7,
    marginTop: 1,
  },

  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
  },

  openText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 6.7,
  },

  removeConnectionButton: {
    minHeight: 40,
    marginTop: 10,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  removeConnectionText: {
    color: "#B91C1C",
    fontFamily: "Poppins_700Bold",
    fontSize: 8,
  },

  // -------------------------------------------------------------------
  // Request message
  // -------------------------------------------------------------------

  requestMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  requestMessageIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  requestMessageText: {
    flex: 1,
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 7.2,
    lineHeight: 12,
  },

  requestActions: {
    gap: 8,
    marginTop: 11,
  },

  requestActionPressed: {
    opacity: 0.86,
  },

  rejectButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  rejectText: {
    color: "#B91C1C",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    textAlign: "center",
  },

  acceptButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  acceptText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    textAlign: "center",
  },

  // -------------------------------------------------------------------
  // Pending request
  // -------------------------------------------------------------------

  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },

  pendingIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },

  pendingTitle: {
    color: "#475569",
    fontFamily: "Poppins_700Bold",
    fontSize: 7.8,
  },

  pendingText: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 6.7,
    marginTop: 1,
  },

  pendingMore: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },

  // -------------------------------------------------------------------
  // Trade metrics
  // -------------------------------------------------------------------

  metrics: {
    flexDirection: "row",
    gap: 6,
    padding: 9,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  metric: {
    flex: 1,
    minWidth: 0,
  },

  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  metricLabel: {
    color: "#94A3B8",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 5.4,
  },

  metricValue: {
    color: "#172033",
    fontFamily: "Poppins_700Bold",
    fontSize: 7.7,
    marginTop: 3,
  },

  // -------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------

  emptyState: {
    alignItems: "center",
    paddingVertical: 46,
    paddingHorizontal: 25,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#0F172A",
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },

  emptyIconOuter: {
    width: 76,
    height: 76,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    color: "#172033",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 12.5,
    marginTop: 12,
  },

  emptyText: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 7.5,
    lineHeight: 13,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 285,
  },

  // -------------------------------------------------------------------
  // Error
  // -------------------------------------------------------------------

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 14,
  },

  errorIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },

  errorTitle: {
    color: "#991B1B",
    fontFamily: "Poppins_700Bold",
    fontSize: 8.3,
  },

  errorText: {
    color: "#B91C1C",
    fontFamily: "Poppins_400Regular",
    fontSize: 6.7,
    marginTop: 2,
  },

  errorRefresh: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
  },

  // -------------------------------------------------------------------
  // Modal / bottom sheet
  // -------------------------------------------------------------------

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor:
      "rgba(15,23,42,0.50)",
  },

  requestPopup: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    shadowColor: "#000000",
    shadowOpacity: 0.23,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    elevation: 20,
  },

  popupHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    marginBottom: 17,
  },

  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  popupIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  popupTitle: {
    color: "#172033",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 13.5,
  },

  popupSubtitle: {
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 7.2,
    marginTop: 1,
  },

  popupClose: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  popupPartnerCard: {
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 16,
  },

  popupInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    marginTop: 11,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  popupInfoIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },

  popupInfoText: {
    flex: 1,
    color: "#64748B",
    fontFamily: "Poppins_400Regular",
    fontSize: 7.2,
    lineHeight: 13,
  },

  popupPrimaryButton: {
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 15,
  },

  popupPrimaryText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 8.5,
  },

  popupCancelButton: {
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 8,
  },

  popupCancelText: {
    color: "#B91C1C",
    fontFamily: "Poppins_700Bold",
    fontSize: 8.5,
  },

  // -------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------

  loadingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingTop: 10,
  },

  loadingLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
  },

  loadingLabel: {
    color: "#64748B",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 7.5,
  },

  skeletonBlock: {
    backgroundColor: "#E2E8F0",
  },

  disabledButton: {
    opacity: 0.55,
  },
});

