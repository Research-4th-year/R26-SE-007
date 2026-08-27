import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { useLanguage } from "@/contexts/LanguageContext";
import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";
import { partnerService } from "@/services/c03-marketplace/partner.service";
import { harvestService } from "@/services/c03-marketplace/harvest.service";
import { demandService } from "@/services/c03-marketplace/demand.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  PartnerDetailData,
  PartnerDemandOpportunity,
  PartnerHarvestOpportunity,
  PartnerType,
} from "@/types/c03-marketplace/partner.types";
import type { Harvest } from "@/types/c03-marketplace/harvest.types";
import type { MillerDemand } from "@/types/c03-marketplace/demand.types";

export default function PartnerDetailScreen() {
  const params = useLocalSearchParams<{
    partnerType?: string;
    partnerId?: string;
  }>();

  const { user } = useMarketplaceAuth();
  const { t } = useLanguage();

  const [data, setData] = useState<PartnerDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [opportunityModalVisible, setOpportunityModalVisible] = useState(false);
  const [selectedPartnerDemand, setSelectedPartnerDemand] =
    useState<PartnerDemandOpportunity | null>(null);
  const [selectedPartnerHarvest, setSelectedPartnerHarvest] =
    useState<PartnerHarvestOpportunity | null>(null);

  const [myHarvests, setMyHarvests] = useState<Harvest[]>([]);
  const [myDemands, setMyDemands] = useState<MillerDemand[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    null
  );

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  // Entrance animation — presentation only, mirrors the other marketplace screens.
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentRise = useRef(new Animated.Value(14)).current;

  const isFarmer = user?.role === "farmer";

  const theme = useMemo<Theme>(
    () =>
      isFarmer
        ? {
            primary: "#15803D",
            dark: "#14532D",
            soft: "#DCFCE7",
            border: "#BBF7D0",
            page: "#F8FAF8",
            cardBorder: "#E5E7EB",
          }
        : {
            primary: "#92400E",
            dark: "#78350F",
            soft: "#FEF3C7",
            border: "#FDE68A",
            page: "#FBF8F1",
            cardBorder: "#ECE6D6",
          },
    [isFarmer]
  );

  const partnerType = params.partnerType as PartnerType | undefined;
  const partnerId = params.partnerId;

  const loadPartner = useCallback(async () => {
    if (!partnerType || !partnerId) {
      setErrorMessage(t.c3partnerDetail.partnerMissing);
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
  }, [partnerType, partnerId, t]);

  useFocusEffect(
    useCallback(() => {
      void loadPartner();
    }, [loadPartner])
  );

  useEffect(() => {
    if (!fontsLoaded || loading) return;
    contentFade.setValue(0);
    contentRise.setValue(14);
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(contentRise, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded, loading]);

  async function toggleFavorite() {
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
  }

  async function callPartner() {
    const phone = data?.contact?.phone;
    if (!phone) return;
    await Linking.openURL(`tel:${phone}`);
  }

  async function openWhatsApp() {
    const phone = data?.contact?.phone;
    if (!phone) return;
    await Linking.openURL(
      `https://wa.me/${normalizeSriLankanPhone(phone)}`
    );
  }

  async function openDemandMatching(demand: PartnerDemandOpportunity) {
    try {
      setSelectedPartnerDemand(demand);
      setSelectedPartnerHarvest(null);
      setSelectedResourceId(null);
      setMyHarvests([]);
      setOpportunityModalVisible(true);
      setResourcesLoading(true);

      const response = await harvestService.getMyHarvests();

      const availableHarvests = Array.isArray(response.data)
        ? response.data.filter(
            (harvest) =>
              harvest.status === "available" &&
              harvest.paddyType.trim().toLowerCase() ===
                demand.paddyType.trim().toLowerCase()
          )
        : [];

      setMyHarvests(availableHarvests);
    } catch (error) {
      setOpportunityModalVisible(false);
      Alert.alert(t.c3partnerDetail.unableToLoadHarvests, getApiErrorMessage(error));
    } finally {
      setResourcesLoading(false);
    }
  }

  async function openHarvestMatching(harvest: PartnerHarvestOpportunity) {
    try {
      setSelectedPartnerHarvest(harvest);
      setSelectedPartnerDemand(null);
      setSelectedResourceId(null);
      setMyDemands([]);
      setOpportunityModalVisible(true);
      setResourcesLoading(true);

      const response = await demandService.getMyDemands();

      const openDemands = Array.isArray(response.data)
        ? response.data.filter(
            (demand) =>
              demand.status === "open" &&
              demand.paddyType.trim().toLowerCase() ===
                harvest.paddyType.trim().toLowerCase()
          )
        : [];

      setMyDemands(openDemands);
    } catch (error) {
      setOpportunityModalVisible(false);
      Alert.alert(t.c3partnerDetail.unableToLoadDemands, getApiErrorMessage(error));
    } finally {
      setResourcesLoading(false);
    }
  }

  function closeOpportunityModal() {
    setOpportunityModalVisible(false);
    setSelectedPartnerDemand(null);
    setSelectedPartnerHarvest(null);
    setSelectedResourceId(null);
  }

  function continueToMatching() {
    if (!selectedResourceId) return;

    const resourceId = selectedResourceId;
    const connectedPartnerId = partnerId;
    const connectedDemandId = selectedPartnerDemand?._id;
    const connectedHarvestId = selectedPartnerHarvest?._id;

    closeOpportunityModal();

    if (user?.role === "farmer") {
      router.push({
        pathname: "/(c03-marketplace)/(farmer)/matched-millers" as any,
        params: {
          harvestId: resourceId,
          ...(connectedPartnerId
            ? { focusMillerId: connectedPartnerId }
            : {}),
          ...(connectedDemandId
            ? { focusDemandId: connectedDemandId }
            : {}),
        },
      });
      return;
    }

    router.push({
      pathname: "/(c03-marketplace)/(miller)/matched-farmers" as any,
      params: {
        demandId: resourceId,
        ...(connectedPartnerId
          ? { focusFarmerId: connectedPartnerId }
          : {}),
        ...(connectedHarvestId
          ? { focusHarvestId: connectedHarvestId }
          : {}),
      },
    });
  }

  function createMissingResource() {
    closeOpportunityModal();

    if (user?.role === "farmer") {
      router.push("/(c03-marketplace)/(farmer)/add-harvest" as any);
      return;
    }

    router.push("/(c03-marketplace)/(miller)/create-demand" as any);
  }

  if (!fontsLoaded) return null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.stateTitle}>{t.c3partnerDetail.loadingTitle}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage || !data) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
        <View style={styles.centerState}>
          <Ionicons name="warning-outline" size={36} color="#B91C1C" />

          <Text style={styles.stateTitle}>{t.c3partnerDetail.unableToLoad}</Text>

          <Text style={styles.errorDescription}>{errorMessage}</Text>

          <Pressable
            style={[styles.backButtonLarge, { backgroundColor: theme.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>{t.c3partnerDetail.goBack}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { partner, relationship, summary, opportunities } = data;

  const connected = relationship.connected;
  const hasTrades = relationship.hasTraded;

  const opportunityCount =
    partner.type === "miller"
      ? opportunities.demands.length
      : opportunities.harvests.length;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: "#FFFFFF", borderBottomColor: theme.cardBorder },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerButton,
            { borderColor: theme.cardBorder },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={20} color="#1F2937" />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t.c3partnerDetail.title}</Text>

          <Text style={styles.headerSubtitle}>
            {t.c3partnerDetail.subtitle}
          </Text>
        </View>

        <Pressable
          disabled={favoriteLoading}
          onPress={() => void toggleFavorite()}
          style={({ pressed }) => [
            styles.favoriteButton,
            {
              backgroundColor: data.isFavorite ? theme.soft : "#FFFFFF",
              borderColor: data.isFavorite ? theme.border : theme.cardBorder,
            },
            pressed && styles.pressed,
          ]}
        >
          {favoriteLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons
              name={data.isFavorite ? "star" : "star-outline"}
              size={19}
              color={data.isFavorite ? "#D97706" : "#64748B"}
            />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{ opacity: contentFade, transform: [{ translateY: contentRise }] }}
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
                size={30}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.partnerName}>{partner.name}</Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={13}
                color="rgba(255,255,255,0.75)"
              />

              <Text style={styles.heroLocation}>
                {translateDistrict(
                  partner.district,
                  t.c3districts,
                  t.c3partnerDetail.notProvided
                )}{" "}
                • {partner.location}
              </Text>
            </View>

            <View style={styles.heroBadges}>
              {connected ? (
                <HeroBadge icon="people" label={t.c3partnerDetail.connected} />
              ) : null}
              {hasTrades ? (
                <HeroBadge icon="receipt" label={t.c3partnerDetail.tradePartner} />
              ) : null}
              {data.isFavorite ? (
                <HeroBadge icon="star" label={t.c3partnerDetail.favourite} />
              ) : null}
            </View>
          </LinearGradient>

          <View style={[styles.relationshipCard, { borderColor: theme.cardBorder }]}>
            <View style={[styles.relationshipIcon, { backgroundColor: theme.soft }]}>
              <Ionicons
                name={connected ? "shield-checkmark-outline" : "receipt-outline"}
                size={21}
                color={theme.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.relationshipTitle}>
                {connected
                  ? t.c3partnerDetail.trustedConnection
                  : t.c3partnerDetail.tradingRelationship}
              </Text>

              <Text style={styles.relationshipText}>
                {connected
                  ? t.c3partnerDetail.connectedDescription
                  : t.c3partnerDetail.tradedDescription}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Partner information</Text>

          <View style={[styles.infoCard, { borderColor: theme.cardBorder }]}>
            <InfoRow
              icon="location-outline"
              label={t.c3partnerDetail.district}
              value={translateDistrict(
                partner.district,
                t.c3districts,
                t.c3partnerDetail.notProvided
              )}
              theme={theme}
            />

            <InfoRow
              icon="navigate-outline"
              label={t.c3partnerDetail.location}
              value={partner.location}
              theme={theme}
            />

            {partner.type === "miller" ? (
              <>
                <InfoRow
                  icon="business-outline"
                  label={t.c3partnerDetail.riceMill}
                  value={partner.millName ?? partner.name}
                  theme={theme}
                />

                <InfoRow
                  icon="person-outline"
                  label={t.c3partnerDetail.representative}
                  value={partner.personName || t.c3partnerDetail.notProvided}
                  theme={theme}
                />

                <InfoRow
                  icon="document-text-outline"
                  label={t.c3partnerDetail.registration}
                  value={
                    partner.businessRegistrationNumber ||
                    t.c3partnerDetail.notProvided
                  }
                  theme={theme}
                  isLast
                />
              </>
            ) : (
              <>
                <InfoRow
                  icon="business-outline"
                  label={t.c3partnerDetail.farm}
                  value={partner.farmName || t.c3partnerDetail.notProvided}
                  theme={theme}
                />

                <InfoRow
                  icon="resize-outline"
                  label={t.c3partnerDetail.farmSize}
                  value={`${formatNumber(partner.farmSizeAcres ?? 0)} ${t.c3partnerDetail.acres}`}
                  theme={theme}
                />

                <InfoRow
                  icon="leaf-outline"
                  label={t.c3partnerDetail.mainVariety}
                  value={
                    partner.mainPaddyVariety
                      ? translatePaddyType(partner.mainPaddyVariety, t)
                      : t.c3partnerDetail.notProvided
                  }
                  theme={theme}
                  isLast
                />
              </>
            )}
          </View>

          <Text style={styles.sectionTitle}>{t.c3partnerDetail.contact}</Text>

          {data.contactUnlocked && data.contact ? (
            <View style={[styles.contactCard, { borderColor: theme.border }]}>
              <View style={styles.contactTop}>
                <View style={[styles.contactIcon, { backgroundColor: theme.soft }]}>
                  <Ionicons name="call-outline" size={19} color={theme.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>{t.c3partnerDetail.contactUnlocked}</Text>

                  <Text style={styles.contactName}>{data.contact.fullName}</Text>

                  <Text style={[styles.contactNumber, { color: theme.dark }]}>
                    {data.contact.phone}
                  </Text>
                </View>
              </View>

              <View style={styles.contactActions}>
                <Pressable
                  onPress={() => void callPartner()}
                  style={({ pressed }) => [
                    styles.contactAction,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.contactActionText}>{t.c3partnerDetail.call}</Text>
                </Pressable>

                <Pressable
                  onPress={() => void openWhatsApp()}
                  style={({ pressed }) => [
                    styles.contactAction,
                    styles.whatsappAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" />
                  <Text style={styles.contactActionText}>{t.c3partnerDetail.whatsapp}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.lockedCard, { borderColor: theme.cardBorder }]}>
              <Ionicons name="lock-closed-outline" size={21} color="#64748B" />

              <View style={{ flex: 1 }}>
                <Text style={styles.lockedTitle}>{t.c3partnerDetail.contactProtected}</Text>

                <Text style={styles.lockedText}>
                  {t.c3partnerDetail.contactProtectedText}
                </Text>
              </View>
            </View>
          )}

          {connected ? (
            <>
              <View style={styles.opportunityHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {partner.type === "miller"
                      ? t.c3partnerDetail.activeDemands
                      : t.c3partnerDetail.availableHarvests}
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Current opportunities from this partner
                  </Text>
                </View>

                <View style={[styles.countBadge, { backgroundColor: theme.soft }]}>
                  <Text style={[styles.countBadgeText, { color: theme.primary }]}>
                    {opportunityCount}
                  </Text>
                </View>
              </View>

              {partner.type === "miller" ? (
                <DemandOpportunities
                  demands={opportunities.demands}
                  theme={theme}
                  onMatch={openDemandMatching}
                />
              ) : (
                <HarvestOpportunities
                  harvests={opportunities.harvests}
                  theme={theme}
                  onMatch={openHarvestMatching}
                />
              )}
            </>
          ) : null}

          {hasTrades ? (
            <>
              <Text style={styles.sectionTitle}>{t.c3partnerDetail.tradingSummary}</Text>

              <View style={styles.summaryGrid}>
                <SummaryCard
                  icon="receipt-outline"
                  label={t.c3partnerDetail.agreements}
                  value={String(summary.totalAgreements)}
                  theme={theme}
                />

                <SummaryCard
                  icon="cube-outline"
                  label={t.c3partnerDetail.quantity}
                  value={`${formatNumber(summary.totalQuantityKg)} ${t.c3partnerDetail.kg}`}
                  theme={theme}
                />

                <SummaryCard
                  icon="cash-outline"
                  label={t.c3partnerDetail.averagePrice}
                  value={formatCurrency(summary.averageAgreedPrice)}
                  theme={theme}
                />

                <SummaryCard
                  icon="trending-up-outline"
                  label={t.c3partnerDetail.latestPrice}
                  value={formatCurrency(summary.latestAgreedPrice)}
                  theme={theme}
                />
              </View>

              {typeof summary.totalTradeValue === "number" ? (
                <View style={[styles.tradeValueCard, { borderColor: theme.cardBorder }]}>
                  <View style={[styles.tradeValueIcon, { backgroundColor: theme.soft }]}>
                    <Ionicons name="wallet-outline" size={19} color={theme.primary} />
                  </View>

                  <View>
                    <Text style={styles.tradeValueLabel}>{t.c3partnerDetail.totalTradeValue}</Text>

                    <Text style={styles.tradeValue}>
                      {formatCurrency(summary.totalTradeValue)}
                    </Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.historyHeader}>
                <View>
                  <Text style={styles.sectionTitle}>{t.c3partnerDetail.transactionHistory}</Text>

                  <Text style={styles.sectionSubtitle}>
                    {data.transactions.length}{" "}
                    {data.transactions.length === 1
                      ? t.c3partnerDetail.successfulAgreement
                      : t.c3partnerDetail.successfulAgreements}
                  </Text>
                </View>
              </View>

              <View style={styles.historyList}>
                {data.transactions.map((transaction) => (
                  <View
                    key={transaction.negotiationMongoId}
                    style={[styles.historyCard, { borderColor: theme.cardBorder }]}
                  >
                    <View style={styles.historyTop}>
                      <View style={[styles.historyIcon, { backgroundColor: theme.soft }]}>
                        <Ionicons
                          name="receipt-outline"
                          size={18}
                          color={theme.primary}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle}>
                          {translatePaddyType(transaction.paddyType, t)}
                        </Text>

                        <Text style={styles.historyDate}>
                          {formatDate(
                            transaction.createdAt,
                            t.c3partnerDetail.noDate,
                            t.c3partnerDetail.dateUnavailable
                          )}
                        </Text>
                      </View>

                      <Text style={[styles.historyPrice, { color: theme.primary }]}>
                        {formatCurrency(transaction.agreedPrice)}
                      </Text>
                    </View>

                    <View style={styles.historyMetrics}>
                      <SmallMetric
                        label={t.c3partnerDetail.quantity}
                        value={`${formatNumber(transaction.quantityKg)} ${t.c3partnerDetail.kg}`}
                      />

                      <SmallMetric
                        label={t.c3partnerDetail.rounds}
                        value={String(transaction.roundsCompleted)}
                      />

                      <SmallMetric
                        label={t.c3partnerDetail.value}
                        value={formatCurrency(transaction.totalValue)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={[styles.noTradeCard, { borderColor: theme.cardBorder }]}>
              <Ionicons name="sparkles-outline" size={23} color={theme.primary} />

              <View style={{ flex: 1 }}>
                <Text style={styles.noTradeTitle}>{t.c3partnerDetail.noCompletedTrades}</Text>

                <Text style={styles.noTradeText}>
                  {t.c3partnerDetail.noCompletedTradesText}
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={opportunityModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeOpportunityModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeOpportunityModal}>
          <Pressable style={styles.matchModal} onPress={() => {}}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: theme.soft }]}>
                <Ionicons name="git-compare-outline" size={22} color={theme.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{t.c3partnerDetail.matchOpportunity}</Text>

                <Text style={styles.modalSubtitle}>
                  {user?.role === "farmer"
                    ? t.c3partnerDetail.chooseHarvest
                    : t.c3partnerDetail.chooseDemand}
                </Text>
              </View>

              <Pressable onPress={closeOpportunityModal} style={styles.modalClose}>
                <Ionicons name="close" size={19} color="#64748B" />
              </Pressable>
            </View>

            {selectedPartnerDemand ? (
              <View style={styles.targetOpportunity}>
                <Text style={styles.targetLabel}>{t.c3partnerDetail.millerDemand}</Text>

                <Text style={styles.targetTitle}>
                  {translatePaddyType(selectedPartnerDemand.paddyType, t)}
                </Text>

                <Text style={styles.targetText}>
                  {formatNumber(selectedPartnerDemand.quantityNeeded)}{" "}
                  {t.c3partnerDetail.kg} •{" "}
                  {formatCurrency(selectedPartnerDemand.offeredPrice)}/
                  {t.c3partnerDetail.kg}
                </Text>
              </View>
            ) : null}

            {selectedPartnerHarvest ? (
              <View style={styles.targetOpportunity}>
                <Text style={styles.targetLabel}>{t.c3partnerDetail.farmerHarvest}</Text>

                <Text style={styles.targetTitle}>
                  {translatePaddyType(selectedPartnerHarvest.paddyType, t)}
                </Text>

                <Text style={styles.targetText}>
                  {formatNumber(selectedPartnerHarvest.quantity)}{" "}
                  {t.c3partnerDetail.kg} • {t.c3partnerDetail.expectedPrice}{" "}
                  {formatCurrency(selectedPartnerHarvest.expectedPrice)}/
                  {t.c3partnerDetail.kg}
                </Text>
              </View>
            ) : null}

            <Text style={styles.chooseTitle}>
              {user?.role === "farmer"
                ? t.c3partnerDetail.chooseYourHarvest
                : t.c3partnerDetail.chooseYourDemand}
            </Text>

            {resourcesLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={theme.primary} />

                <Text style={styles.modalLoadingText}>
                  {t.c3partnerDetail.loadingRecords}
                </Text>
              </View>
            ) : user?.role === "farmer" ? (
              myHarvests.length > 0 ? (
                <ScrollView style={styles.resourceList} showsVerticalScrollIndicator={false}>
                  {myHarvests.map((harvest) => {
                    const selected = selectedResourceId === harvest._id;

                    return (
                      <Pressable
                        key={harvest._id}
                        onPress={() => setSelectedResourceId(harvest._id)}
                        style={[
                          styles.resourceCard,
                          selected && {
                            borderColor: theme.primary,
                            backgroundColor: theme.soft,
                          },
                        ]}
                      >
                        <View style={styles.radioOuter}>
                          {selected ? (
                            <View
                              style={[styles.radioInner, { backgroundColor: theme.primary }]}
                            />
                          ) : null}
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.resourceTitle}>
                            {translatePaddyType(harvest.paddyType, t)}
                          </Text>

                          <Text style={styles.resourceText}>
                            {formatNumber(harvest.quantity)} {t.c3partnerDetail.kg}{" "}
                            • {translateSeason(harvest.season, t)}
                          </Text>

                          <Text style={styles.resourcePrice}>
                            {t.c3partnerDetail.expectedPrice}{" "}
                            {formatCurrency(harvest.expectedPrice)}/
                            {t.c3partnerDetail.kg}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : (
                <NoCompatibleResource
                  role="farmer"
                  theme={theme}
                  onCreate={createMissingResource}
                />
              )
            ) : myDemands.length > 0 ? (
              <ScrollView style={styles.resourceList} showsVerticalScrollIndicator={false}>
                {myDemands.map((demand) => {
                  const selected = selectedResourceId === demand._id;

                  return (
                    <Pressable
                      key={demand._id}
                      onPress={() => setSelectedResourceId(demand._id)}
                      style={[
                        styles.resourceCard,
                        selected && {
                          borderColor: theme.primary,
                          backgroundColor: theme.soft,
                        },
                      ]}
                    >
                      <View style={styles.radioOuter}>
                        {selected ? (
                          <View
                            style={[styles.radioInner, { backgroundColor: theme.primary }]}
                          />
                        ) : null}
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.resourceTitle}>
                          {translatePaddyType(demand.paddyType, t)}
                        </Text>

                        <Text style={styles.resourceText}>
                          {formatNumber(demand.quantityNeeded)}{" "}
                          {t.c3partnerDetail.kg} {t.c3partnerDetail.kgNeeded}
                        </Text>

                        <Text style={styles.resourcePrice}>
                          {t.c3partnerDetail.offer}{" "}
                          {formatCurrency(demand.offeredPrice)}/
                          {t.c3partnerDetail.kg}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <NoCompatibleResource
                role="miller"
                theme={theme}
                onCreate={createMissingResource}
              />
            )}

            <View style={styles.modalInfo}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#64748B" />

              <Text style={styles.modalInfoText}>
                {t.c3partnerDetail.matchInfo}
              </Text>
            </View>

            <Pressable
              disabled={!selectedResourceId || resourcesLoading}
              onPress={continueToMatching}
              style={[
                styles.continueButton,
                { backgroundColor: theme.primary },
                (!selectedResourceId || resourcesLoading) && styles.disabledButton,
              ]}
            >
              <Ionicons name="sparkles" size={17} color="#FFFFFF" />
              <Text style={styles.continueButtonText}>{t.c3partnerDetail.checkAiMatch}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function DemandOpportunities({
  demands,
  theme,
  onMatch,
}: {
  demands: PartnerDemandOpportunity[];
  theme: Theme;
  onMatch: (demand: PartnerDemandOpportunity) => void;
}) {
  const { t } = useLanguage();

  if (demands.length === 0) {
    return (
      <OpportunityEmpty
        text={t.c3partnerDetail.noOpenDemands}
        theme={theme}
      />
    );
  }

  return (
    <View style={styles.opportunityList}>
      {demands.map((demand) => (
        <View
          key={demand._id}
          style={[styles.opportunityCard, { borderColor: theme.cardBorder }]}
        >
          <View style={styles.opportunityTop}>
            <View style={[styles.opportunityIcon, { backgroundColor: theme.soft }]}>
              <Ionicons name="storefront-outline" size={19} color={theme.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.opportunityTitle}>
                {translatePaddyType(demand.paddyType, t)}
              </Text>

              <Text style={styles.opportunitySubtitle}>
                {t.c3partnerDetail.openMillerDemand}
              </Text>
            </View>

            <BadgeText text={t.c3partnerDetail.open} theme={theme} />
          </View>

          <View style={styles.opportunityMetrics}>
            <SmallMetric
              label={t.c3partnerDetail.quantity}
              value={`${formatNumber(demand.quantityNeeded)} ${t.c3partnerDetail.kg}`}
            />

            <SmallMetric
              label={t.c3partnerDetail.offer}
              value={`${formatCurrency(demand.offeredPrice)}/${t.c3partnerDetail.kg}`}
            />
          </View>

          <Pressable
            onPress={() => onMatch(demand)}
            style={({ pressed }) => [
              styles.matchOpportunityButton,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="git-compare-outline" size={16} color="#FFFFFF" />
            <Text style={styles.matchOpportunityText}>
              {t.c3partnerDetail.matchWithDemand}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function HarvestOpportunities({
  harvests,
  theme,
  onMatch,
}: {
  harvests: PartnerHarvestOpportunity[];
  theme: Theme;
  onMatch: (harvest: PartnerHarvestOpportunity) => void;
}) {
  const { t } = useLanguage();

  if (harvests.length === 0) {
    return (
      <OpportunityEmpty
        text={t.c3partnerDetail.noAvailableHarvests}
        theme={theme}
      />
    );
  }

  return (
    <View style={styles.opportunityList}>
      {harvests.map((harvest) => (
        <View
          key={harvest._id}
          style={[styles.opportunityCard, { borderColor: theme.cardBorder }]}
        >
          <View style={styles.opportunityTop}>
            <View style={[styles.opportunityIcon, { backgroundColor: theme.soft }]}>
              <Ionicons name="leaf-outline" size={19} color={theme.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.opportunityTitle}>
                {translatePaddyType(harvest.paddyType, t)}
              </Text>

              <Text style={styles.opportunitySubtitle}>
                {translateSeason(harvest.season, t)} {t.c3partnerDetail.harvest}
              </Text>
            </View>

            <BadgeText text={t.c3partnerDetail.available} theme={theme} />
          </View>

          <View style={styles.opportunityMetrics}>
            <SmallMetric
              label={t.c3partnerDetail.quantity}
              value={`${formatNumber(harvest.quantity)} ${t.c3partnerDetail.kg}`}
            />

            <SmallMetric
              label={t.c3partnerDetail.expected}
              value={`${formatCurrency(harvest.expectedPrice)}/${t.c3partnerDetail.kg}`}
            />

            <SmallMetric
              label={t.c3partnerDetail.aiPrice}
              value={`${formatCurrency(harvest.aiPredictedPrice)}/${t.c3partnerDetail.kg}`}
            />
          </View>

          <Pressable
            onPress={() => onMatch(harvest)}
            style={({ pressed }) => [
              styles.matchOpportunityButton,
              { backgroundColor: theme.primary },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="git-compare-outline" size={16} color="#FFFFFF" />
            <Text style={styles.matchOpportunityText}>
              {t.c3partnerDetail.matchWithHarvest}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function OpportunityEmpty({ text, theme }: { text: string; theme: Theme }) {
  return (
    <View style={[styles.opportunityEmpty, { borderColor: theme.cardBorder }]}>
      <Ionicons name="information-circle-outline" size={19} color={theme.primary} />
      <Text style={styles.opportunityEmptyText}>{text}</Text>
    </View>
  );
}

function NoCompatibleResource({
  role,
  theme,
  onCreate,
}: {
  role: "farmer" | "miller";
  theme: Theme;
  onCreate: () => void;
}) {
  const { t } = useLanguage();

  return (
    <View style={styles.noResourceCard}>
      <View style={[styles.noResourceIcon, { backgroundColor: theme.soft }]}>
        <Ionicons
          name={role === "farmer" ? "leaf-outline" : "storefront-outline"}
          size={24}
          color={theme.primary}
        />
      </View>

      <Text style={styles.noResourceTitle}>
        {role === "farmer"
          ? t.c3partnerDetail.noCompatibleHarvest
          : t.c3partnerDetail.noCompatibleDemand}
      </Text>

      <Text style={styles.noResourceText}>
        {role === "farmer"
          ? t.c3partnerDetail.needHarvest
          : t.c3partnerDetail.needDemand}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.createResourceButton,
          { backgroundColor: theme.primary },
          pressed && styles.pressed,
        ]}
        onPress={onCreate}
      >
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text style={styles.createResourceText}>
          {role === "farmer"
            ? t.c3partnerDetail.addHarvest
            : t.c3partnerDetail.createDemand}
        </Text>
      </Pressable>
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
  theme: Theme;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <View style={[styles.infoIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={17} color={theme.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
  theme: Theme;
}) {
  return (
    <View style={[styles.summaryCard, { borderColor: theme.cardBorder }]}>
      <View style={[styles.summaryIcon, { backgroundColor: theme.soft }]}>
        <Ionicons name={icon} size={17} color={theme.primary} />
      </View>

      <Text style={styles.summaryLabel}>{label}</Text>

      <Text style={styles.summaryValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
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
      <Ionicons name={icon} size={11} color="#FFFFFF" />
      <Text style={styles.heroBadgeText}>{label}</Text>
    </View>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.smallMetricLabel}>{label}</Text>
      <Text style={styles.smallMetricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function BadgeText({ text, theme }: { text: string; theme: Theme }) {
  return (
    <View style={[styles.statusBadge, { backgroundColor: theme.soft }]}>
      <Text style={[styles.statusBadgeText, { color: theme.dark }]}>{text}</Text>
    </View>
  );
}

function normalizeSriLankanPhone(phone: string) {
  const value = phone.replace(/\D/g, "");

  if (value.length === 10 && value.startsWith("0")) {
    return `94${value.slice(1)}`;
  }

  if (value.length === 9 && value.startsWith("7")) {
    return `94${value}`;
  }

  return value;
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

  return value;
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

function translateSeason(value: string | undefined, t: any): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "maha") {
    return t.c3seasons.Maha;
  }

  if (normalized === "yala") {
    return t.c3seasons.Yala;
  }

  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(value);
}

function formatCurrency(value: number) {
  return `Rs. ${new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatDate(
  value: string | null | undefined,
  noDate: string,
  dateUnavailable: string,
) {
  if (!value) return noDate;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return dateUnavailable;
  }

  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

type Theme = {
  primary: string;
  dark: string;
  soft: string;
  border: string;
  page: string;
  cardBorder: string;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 17,
    borderBottomWidth: 1,
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },

  headerTitle: {
    color: "#1F2937",
    fontSize: 15.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  content: {
    padding: 17,
    paddingBottom: 120,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  stateTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 10,
  },

  errorDescription: {
    color: "#64748B",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: 5,
  },

  backButtonLarge: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 16,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
  },

  profileHero: {
    alignItems: "center",
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
    overflow: "hidden",
  },

  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  partnerName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
    marginTop: 12,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },

  heroLocation: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
  },

  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    marginTop: 11,
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  heroBadgeText: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontFamily: "Poppins_700Bold",
  },

  relationshipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginBottom: 18,
  },

  relationshipIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  relationshipTitle: {
    color: "#1F2937",
    fontSize: 11.5,
    fontFamily: "Poppins_700Bold",
  },

  relationshipText: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    lineHeight: 14,
    marginTop: 3,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontFamily: "Poppins_800ExtraBold",
    marginBottom: 9,
  },

  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: -5,
  },

  infoCard: {
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginBottom: 18,
  },

  infoRow: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  infoLabel: {
    color: "#94A3B8",
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
  },

  infoValue: {
    color: "#1F2937",
    fontSize: 11.5,
    fontFamily: "Poppins_700Bold",
    marginTop: 2,
  },

  contactCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginBottom: 18,
  },

  contactTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  contactIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  contactLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.7,
  },

  contactName: {
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  contactNumber: {
    fontSize: 13.5,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  contactActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  contactAction: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  contactActionText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Poppins_800ExtraBold",
  },

  whatsappAction: {
    backgroundColor: "#16A34A",
  },

  lockedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    marginBottom: 18,
  },

  lockedTitle: {
    color: "#475569",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
  },

  lockedText: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    lineHeight: 14,
    marginTop: 2,
  },

  opportunityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  countBadge: {
    minWidth: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeText: {
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
  },

  opportunityList: {
    gap: 10,
    marginBottom: 19,
  },

  opportunityCard: {
    padding: 13,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },

  opportunityTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  opportunityIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  opportunityTitle: {
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
  },

  opportunitySubtitle: {
    color: "#94A3B8",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 7.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  opportunityMetrics: {
    flexDirection: "row",
    gap: 7,
    padding: 9,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    marginTop: 10,
  },

  opportunityEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginBottom: 18,
  },

  opportunityEmptyText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
    lineHeight: 14,
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  summaryCard: {
    width: "48.5%",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  summaryLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontFamily: "Poppins_600SemiBold",
  },

  summaryValue: {
    color: "#1F2937",
    fontSize: 11.5,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 3,
  },

  tradeValueCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginBottom: 19,
  },

  tradeValueIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  tradeValueLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontFamily: "Poppins_800ExtraBold",
  },

  tradeValue: {
    color: "#1F2937",
    fontSize: 13.5,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  historyHeader: {
    marginTop: 2,
    marginBottom: 9,
  },

  historyList: {
    gap: 10,
  },

  historyCard: {
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
  },

  historyTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  historyIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  historyTitle: {
    color: "#1F2937",
    fontSize: 11.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  historyDate: {
    color: "#94A3B8",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  historyPrice: {
    fontSize: 11.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  historyMetrics: {
    flexDirection: "row",
    gap: 7,
    padding: 9,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    marginTop: 10,
  },

  smallMetricLabel: {
    color: "#94A3B8",
    fontSize: 7.5,
    fontFamily: "Poppins_600SemiBold",
  },

  smallMetricValue: {
    color: "#334155",
    fontSize: 9,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  noTradeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginTop: 2,
  },

  noTradeTitle: {
    color: "#1F2937",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
  },

  noTradeText: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    lineHeight: 14,
    marginTop: 2,
  },

  matchOpportunityButton: {
    minHeight: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 11,
  },

  matchOpportunityText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Poppins_800ExtraBold",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.46)",
  },

  matchModal: {
    maxHeight: "88%",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFFFF",
  },

  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
    marginBottom: 16,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  modalIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    color: "#1F2937",
    fontSize: 15.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  modalSubtitle: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },

  targetOpportunity: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 15,
  },

  targetLabel: {
    color: "#94A3B8",
    fontSize: 8,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.8,
  },

  targetTitle: {
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 4,
  },

  targetText: {
    color: "#64748B",
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  chooseTitle: {
    color: "#1F2937",
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 16,
    marginBottom: 9,
  },

  modalLoading: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  modalLoadingText: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
  },

  resourceList: {
    maxHeight: 260,
  },

  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  resourceTitle: {
    color: "#1F2937",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
  },

  resourceText: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },

  resourcePrice: {
    color: "#334155",
    fontSize: 9.5,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },

  modalInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: 10,
    borderRadius: 13,
    backgroundColor: "#F8FAFC",
    marginTop: 11,
  },

  modalInfoText: {
    flex: 1,
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    lineHeight: 14,
  },

  continueButton: {
    minHeight: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 12,
  },

  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
  },

  disabledButton: {
    opacity: 0.45,
  },

  noResourceCard: {
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
  },

  noResourceIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  noResourceTitle: {
    color: "#1F2937",
    fontSize: 11,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 9,
  },

  noResourceText: {
    color: "#64748B",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    lineHeight: 14,
    textAlign: "center",
    marginTop: 3,
  },

  createResourceButton: {
    minHeight: 40,
    paddingHorizontal: 17,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 11,
  },

  createResourceText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});