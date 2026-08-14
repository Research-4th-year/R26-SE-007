import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

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

import {
  useFocusEffect,
} from "expo-router";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  partnerService,
} from "@/services/c03-marketplace/partner.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  PartnerDetailData,
  PartnerDemandOpportunity,
  PartnerHarvestOpportunity,
  PartnerType,
} from "@/types/c03-marketplace/partner.types";

export default function PartnerDetailScreen() {
  const params =
    useLocalSearchParams<{
      partnerType?: string;
      partnerId?: string;
    }>();

  const {
    user,
  } = useMarketplaceAuth();

  const [
    data,
    setData,
  ] =
    useState<
      PartnerDetailData |
      null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    favoriteLoading,
    setFavoriteLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null);

  const isFarmer =
    user?.role === "farmer";

  const theme =
    useMemo(
      () =>
        isFarmer
          ? {
              primary:
                "#15803D",

              dark:
                "#14532D",

              soft:
                "#DCFCE7",

              border:
                "#BBF7D0",

              page:
                "#F8FAF8",
            }
          : {
              primary:
                "#92400E",

              dark:
                "#78350F",

              soft:
                "#FEF3C7",

              border:
                "#FDE68A",

              page:
                "#FBF8F1",
            },
      [isFarmer]
    );

  const partnerType =
    params.partnerType as
      | PartnerType
      | undefined;

  const partnerId =
    params.partnerId;

  const loadPartner =
    useCallback(
      async () => {
        if (
          !partnerType ||
          !partnerId
        ) {
          setErrorMessage(
            "Partner information is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setErrorMessage(
            null
          );

          setLoading(
            true
          );

          const response =
            await partnerService.getPartnerDetails(
              partnerType,
              partnerId
            );

          setData(
            response.data
          );
        } catch (
          error
        ) {
          setErrorMessage(
            getApiErrorMessage(
              error
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        partnerType,
        partnerId,
      ]
    );

  useFocusEffect(
    useCallback(
      () => {
        void loadPartner();
      },
      [loadPartner]
    )
  );

  async function toggleFavorite() {
    if (
      !data ||
      !partnerType ||
      !partnerId ||
      favoriteLoading
    ) {
      return;
    }

    try {
      setFavoriteLoading(
        true
      );

      if (
        data.isFavorite
      ) {
        await partnerService.removeFavorite(
          partnerType,
          partnerId
        );
      } else {
        await partnerService.addFavorite(
          partnerType,
          partnerId
        );
      }

      setData(
        (current) =>
          current
            ? {
                ...current,

                isFavorite:
                  !current.isFavorite,
              }
            : current
      );
    } catch (
      error
    ) {
      console.error(
        "Favourite update failed:",
        error
      );
    } finally {
      setFavoriteLoading(
        false
      );
    }
  }

  async function callPartner() {
    const phone =
      data?.contact
        ?.phone;

    if (!phone) {
      return;
    }

    await Linking.openURL(
      `tel:${phone}`
    );
  }

  async function openWhatsApp() {
    const phone =
      data?.contact
        ?.phone;

    if (!phone) {
      return;
    }

    await Linking.openURL(
      `https://wa.me/${normalizeSriLankanPhone(
        phone
      )}`
    );
  }

  if (
    loading
  ) {
    return (
      <SafeAreaView
        style={[
          styles.screen,
          {
            backgroundColor:
              theme.page,
          },
        ]}
      >
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color={
              theme.primary
            }
          />

          <Text
            style={
              styles.stateTitle
            }
          >
            Loading partner
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    errorMessage ||
    !data
  ) {
    return (
      <SafeAreaView
        style={[
          styles.screen,
          {
            backgroundColor:
              theme.page,
          },
        ]}
      >
        <View
          style={
            styles.centerState
          }
        >
          <Ionicons
            name="warning-outline"
            size={36}
            color="#B91C1C"
          />

          <Text
            style={
              styles.stateTitle
            }
          >
            Unable to load partner
          </Text>

          <Text
            style={
              styles.errorDescription
            }
          >
            {errorMessage}
          </Text>

          <Pressable
            style={[
              styles.backButtonLarge,
              {
                backgroundColor:
                  theme.primary,
              },
            ]}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const {
    partner,
    relationship,
    summary,
    opportunities,
  } = data;

  const connected =
    relationship.connected;

  const hasTrades =
    relationship.hasTraded;

  const opportunityCount =
    partner.type ===
    "miller"
      ? opportunities
          .demands.length
      : opportunities
          .harvests.length;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        {
          backgroundColor:
            theme.page,
        },
      ]}
    >
      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.headerButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#1F2937"
          />
        </Pressable>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Partner Details
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Profile, opportunities
            and trading history
          </Text>
        </View>

        <Pressable
          disabled={
            favoriteLoading
          }
          onPress={() =>
            void toggleFavorite()
          }
          style={[
            styles.favoriteButton,
            {
              backgroundColor:
                data.isFavorite
                  ? theme.soft
                  : "#FFFFFF",

              borderColor:
                data.isFavorite
                  ? theme.border
                  : "#E5E7EB",
            },
          ]}
        >
          {favoriteLoading ? (
            <ActivityIndicator
              size="small"
              color={
                theme.primary
              }
            />
          ) : (
            <Ionicons
              name={
                data.isFavorite
                  ? "star"
                  : "star-outline"
              }
              size={20}
              color={
                data.isFavorite
                  ? "#D97706"
                  : "#64748B"
              }
            />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <LinearGradient
          colors={[
            theme.dark,
            theme.primary,
          ]}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 1,
          }}
          style={
            styles.profileHero
          }
        >
          <View
            style={
              styles.heroAvatar
            }
          >
            <Ionicons
              name={
                partner.type ===
                "miller"
                  ? "business"
                  : "leaf"
              }
              size={31}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={
              styles.partnerName
            }
          >
            {partner.name}
          </Text>

          <View
            style={
              styles.locationRow
            }
          >
            <Ionicons
              name="location-outline"
              size={14}
              color="rgba(255,255,255,0.75)"
            />

            <Text
              style={
                styles.heroLocation
              }
            >
              {partner.district}
              {" • "}
              {partner.location}
            </Text>
          </View>

          <View
            style={
              styles.heroBadges
            }
          >
            {connected ? (
              <HeroBadge
                icon="people"
                label="Connected"
              />
            ) : null}

            {hasTrades ? (
              <HeroBadge
                icon="receipt"
                label="Trade partner"
              />
            ) : null}

            {data.isFavorite ? (
              <HeroBadge
                icon="star"
                label="Favourite"
              />
            ) : null}
          </View>
        </LinearGradient>

        <View
          style={
            styles.relationshipCard
          }
        >
          <View
            style={[
              styles.relationshipIcon,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <Ionicons
              name={
                connected
                  ? "shield-checkmark-outline"
                  : "receipt-outline"
              }
              size={22}
              color={
                theme.primary
              }
            />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text
              style={
                styles.relationshipTitle
              }
            >
              {connected
                ? "Trusted marketplace connection"
                : "Trading relationship"}
            </Text>

            <Text
              style={
                styles.relationshipText
              }
            >
              {connected
                ? "You are connected. Contact details and current marketplace opportunities are available."
                : "You have previously completed a successful AI negotiation with this partner."}
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Partner information
        </Text>

        <View
          style={
            styles.infoCard
          }
        >
          <InfoRow
            icon="location-outline"
            label="District"
            value={
              partner.district
            }
            theme={
              theme
            }
          />

          <InfoRow
            icon="navigate-outline"
            label="Location"
            value={
              partner.location
            }
            theme={
              theme
            }
          />

          {partner.type ===
          "miller" ? (
            <>
              <InfoRow
                icon="business-outline"
                label="Rice mill"
                value={
                  partner.millName ??
                  partner.name
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="person-outline"
                label="Representative"
                value={
                  partner.personName ||
                  "Not provided"
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="document-text-outline"
                label="Registration"
                value={
                  partner.businessRegistrationNumber ||
                  "Not provided"
                }
                theme={
                  theme
                }
                isLast
              />
            </>
          ) : (
            <>
              <InfoRow
                icon="business-outline"
                label="Farm"
                value={
                  partner.farmName ||
                  "Not provided"
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="resize-outline"
                label="Farm size"
                value={`${formatNumber(
                  partner.farmSizeAcres ??
                    0
                )} acres`}
                theme={
                  theme
                }
              />

              <InfoRow
                icon="leaf-outline"
                label="Main variety"
                value={
                  partner.mainPaddyVariety ||
                  "Not provided"
                }
                theme={
                  theme
                }
                isLast
              />
            </>
          )}
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Contact
        </Text>

        {data.contactUnlocked &&
        data.contact ? (
          <View
            style={
              styles.contactCard
            }
          >
            <View
              style={
                styles.contactTop
              }
            >
              <View
                style={[
                  styles.contactIcon,
                  {
                    backgroundColor:
                      theme.soft,
                  },
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.contactLabel
                  }
                >
                  CONTACT UNLOCKED
                </Text>

                <Text
                  style={
                    styles.contactName
                  }
                >
                  {
                    data.contact
                      .fullName
                  }
                </Text>

                <Text
                  style={
                    styles.contactNumber
                  }
                >
                  {
                    data.contact
                      .phone
                  }
                </Text>
              </View>
            </View>

            <View
              style={
                styles.contactActions
              }
            >
              <Pressable
                onPress={() =>
                  void callPartner()
                }
                style={[
                  styles.contactAction,
                  {
                    backgroundColor:
                      theme.primary,
                  },
                ]}
              >
                <Ionicons
                  name="call"
                  size={17}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.contactActionText
                  }
                >
                  Call
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  void openWhatsApp()
                }
                style={[
                  styles.contactAction,
                  styles.whatsappAction,
                ]}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.contactActionText
                  }
                >
                  WhatsApp
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            style={
              styles.lockedCard
            }
          >
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="#64748B"
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.lockedTitle
                }
              >
                Contact protected
              </Text>

              <Text
                style={
                  styles.lockedText
                }
              >
                Contact details require
                an accepted connection
                or approved contact
                request.
              </Text>
            </View>
          </View>
        )}

        {connected ? (
          <>
            <View
              style={
                styles.opportunityHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  {partner.type ===
                  "miller"
                    ? "Active Demands"
                    : "Available Harvests"}
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Current opportunities
                  from this partner
                </Text>
              </View>

              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor:
                      theme.soft,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    {
                      color:
                        theme.primary,
                    },
                  ]}
                >
                  {
                    opportunityCount
                  }
                </Text>
              </View>
            </View>

            {partner.type ===
            "miller" ? (
              <DemandOpportunities
                demands={
                  opportunities.demands
                }
                theme={
                  theme
                }
              />
            ) : (
              <HarvestOpportunities
                harvests={
                  opportunities.harvests
                }
                theme={
                  theme
                }
              />
            )}
          </>
        ) : null}

        {hasTrades ? (
          <>
            <Text
              style={
                styles.sectionTitle
              }
            >
              Trading summary
            </Text>

            <View
              style={
                styles.summaryGrid
              }
            >
              <SummaryCard
                icon="receipt-outline"
                label="Agreements"
                value={String(
                  summary.totalAgreements
                )}
                theme={
                  theme
                }
              />

              <SummaryCard
                icon="cube-outline"
                label="Quantity"
                value={`${formatNumber(
                  summary.totalQuantityKg
                )} kg`}
                theme={
                  theme
                }
              />

              <SummaryCard
                icon="cash-outline"
                label="Average price"
                value={formatCurrency(
                  summary.averageAgreedPrice
                )}
                theme={
                  theme
                }
              />

              <SummaryCard
                icon="trending-up-outline"
                label="Latest price"
                value={formatCurrency(
                  summary.latestAgreedPrice
                )}
                theme={
                  theme
                }
              />
            </View>

            {typeof summary.totalTradeValue ===
            "number" ? (
              <View
                style={
                  styles.tradeValueCard
                }
              >
                <View
                  style={[
                    styles.tradeValueIcon,
                    {
                      backgroundColor:
                        theme.soft,
                    },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={20}
                    color={
                      theme.primary
                    }
                  />
                </View>

                <View>
                  <Text
                    style={
                      styles.tradeValueLabel
                    }
                  >
                    TOTAL TRADE VALUE
                  </Text>

                  <Text
                    style={
                      styles.tradeValue
                    }
                  >
                    {formatCurrency(
                      summary.totalTradeValue
                    )}
                  </Text>
                </View>
              </View>
            ) : null}

            <View
              style={
                styles.historyHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Transaction History
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  {
                    data.transactions
                      .length
                  }{" "}
                  successful agreement
                  {data.transactions
                    .length === 1
                    ? ""
                    : "s"}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.historyList
              }
            >
              {data.transactions.map(
                (
                  transaction
                ) => (
                  <View
                    key={
                      transaction.negotiationMongoId
                    }
                    style={
                      styles.historyCard
                    }
                  >
                    <View
                      style={
                        styles.historyTop
                      }
                    >
                      <View
                        style={[
                          styles.historyIcon,
                          {
                            backgroundColor:
                              theme.soft,
                          },
                        ]}
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={19}
                          color={
                            theme.primary
                          }
                        />
                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.historyTitle
                          }
                        >
                          {formatPaddyType(
                            transaction.paddyType
                          )}
                        </Text>

                        <Text
                          style={
                            styles.historyDate
                          }
                        >
                          {formatDate(
                            transaction.createdAt
                          )}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.historyPrice,
                          {
                            color:
                              theme.primary,
                          },
                        ]}
                      >
                        {formatCurrency(
                          transaction.agreedPrice
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.historyMetrics
                      }
                    >
                      <SmallMetric
                        label="Quantity"
                        value={`${formatNumber(
                          transaction.quantityKg
                        )} kg`}
                      />

                      <SmallMetric
                        label="Rounds"
                        value={String(
                          transaction.roundsCompleted
                        )}
                      />

                      <SmallMetric
                        label="Value"
                        value={formatCurrency(
                          transaction.totalValue
                        )}
                      />
                    </View>
                  </View>
                )
              )}
            </View>
          </>
        ) : (
          <View
            style={
              styles.noTradeCard
            }
          >
            <Ionicons
              name="sparkles-outline"
              size={24}
              color={
                theme.primary
              }
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.noTradeTitle
                }
              >
                No completed trades yet
              </Text>

              <Text
                style={
                  styles.noTradeText
                }
              >
                You are connected,
                but you have not
                completed an AI
                negotiation with this
                partner yet.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DemandOpportunities({
  demands,
  theme,
}: {
  demands:
    PartnerDemandOpportunity[];

  theme:
    Theme;
}) {
  if (
    demands.length ===
    0
  ) {
    return (
      <OpportunityEmpty
        text="This Miller currently has no open demands."
        theme={
          theme
        }
      />
    );
  }

  return (
    <View
      style={
        styles.opportunityList
      }
    >
      {demands.map(
        (demand) => (
          <View
            key={
              demand._id
            }
            style={
              styles.opportunityCard
            }
          >
            <View
              style={
                styles.opportunityTop
              }
            >
              <View
                style={[
                  styles.opportunityIcon,
                  {
                    backgroundColor:
                      theme.soft,
                  },
                ]}
              >
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.opportunityTitle
                  }
                >
                  {formatPaddyType(
                    demand.paddyType
                  )}
                </Text>

                <Text
                  style={
                    styles.opportunitySubtitle
                  }
                >
                  Open Miller Demand
                </Text>
              </View>

              <BadgeText
                text="OPEN"
              />
            </View>

            <View
              style={
                styles.opportunityMetrics
              }
            >
              <SmallMetric
                label="Quantity"
                value={`${formatNumber(
                  demand.quantityNeeded
                )} kg`}
              />

              <SmallMetric
                label="Offer"
                value={`${formatCurrency(
                  demand.offeredPrice
                )}/kg`}
              />
            </View>

            <Text
              style={
                styles.opportunityHint
              }
            >
              Use one of your Harvests
              to find and request a
              matching opportunity with
              this Miller.
            </Text>
          </View>
        )
      )}
    </View>
  );
}

function HarvestOpportunities({
  harvests,
  theme,
}: {
  harvests:
    PartnerHarvestOpportunity[];

  theme:
    Theme;
}) {
  if (
    harvests.length ===
    0
  ) {
    return (
      <OpportunityEmpty
        text="This Farmer currently has no available harvests."
        theme={
          theme
        }
      />
    );
  }

  return (
    <View
      style={
        styles.opportunityList
      }
    >
      {harvests.map(
        (harvest) => (
          <View
            key={
              harvest._id
            }
            style={
              styles.opportunityCard
            }
          >
            <View
              style={
                styles.opportunityTop
              }
            >
              <View
                style={[
                  styles.opportunityIcon,
                  {
                    backgroundColor:
                      theme.soft,
                  },
                ]}
              >
                <Ionicons
                  name="leaf-outline"
                  size={20}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text
                  style={
                    styles.opportunityTitle
                  }
                >
                  {formatPaddyType(
                    harvest.paddyType
                  )}
                </Text>

                <Text
                  style={
                    styles.opportunitySubtitle
                  }
                >
                  {formatPaddyType(
                    harvest.season
                  )}{" "}
                  harvest
                </Text>
              </View>

              <BadgeText
                text="AVAILABLE"
              />
            </View>

            <View
              style={
                styles.opportunityMetrics
              }
            >
              <SmallMetric
                label="Quantity"
                value={`${formatNumber(
                  harvest.quantity
                )} kg`}
              />

              <SmallMetric
                label="Expected"
                value={`${formatCurrency(
                  harvest.expectedPrice
                )}/kg`}
              />

              <SmallMetric
                label="AI price"
                value={`${formatCurrency(
                  harvest.aiPredictedPrice
                )}/kg`}
              />
            </View>

            <Text
              style={
                styles.opportunityHint
              }
            >
              Use one of your Demands
              to match with this
              Farmer's available
              harvest.
            </Text>
          </View>
        )
      )}
    </View>
  );
}

function OpportunityEmpty({
  text,
  theme,
}: {
  text:
    string;

  theme:
    Theme;
}) {
  return (
    <View
      style={
        styles.opportunityEmpty
      }
    >
      <Ionicons
        name="information-circle-outline"
        size={20}
        color={
          theme.primary
        }
      />

      <Text
        style={
          styles.opportunityEmptyText
        }
      >
        {text}
      </Text>
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
  icon:
    keyof typeof Ionicons.glyphMap;

  label:
    string;

  value:
    string;

  theme:
    Theme;

  isLast?:
    boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        isLast &&
          styles.infoRowLast,
      ]}
    >
      <View
        style={[
          styles.infoIcon,
          {
            backgroundColor:
              theme.soft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            theme.primary
          }
        />
      </View>

      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.infoLabel
          }
        >
          {label}
        </Text>

        <Text
          style={
            styles.infoValue
          }
        >
          {value}
        </Text>
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
  icon:
    keyof typeof Ionicons.glyphMap;

  label:
    string;

  value:
    string;

  theme:
    Theme;
}) {
  return (
    <View
      style={
        styles.summaryCard
      }
    >
      <View
        style={[
          styles.summaryIcon,
          {
            backgroundColor:
              theme.soft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            theme.primary
          }
        />
      </View>

      <Text
        style={
          styles.summaryLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.summaryValue
        }
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function HeroBadge({
  icon,
  label,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  label:
    string;
}) {
  return (
    <View
      style={
        styles.heroBadge
      }
    >
      <Ionicons
        name={icon}
        size={12}
        color="#FFFFFF"
      />

      <Text
        style={
          styles.heroBadgeText
        }
      >
        {label}
      </Text>
    </View>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <View
      style={{
        flex: 1,
      }}
    >
      <Text
        style={
          styles.smallMetricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.smallMetricValue
        }
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function BadgeText({
  text,
}: {
  text:
    string;
}) {
  return (
    <View
      style={
        styles.statusBadge
      }
    >
      <Text
        style={
          styles.statusBadgeText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function normalizeSriLankanPhone(
  phone:
    string
) {
  let value =
    phone.replace(
      /\D/g,
      ""
    );

  if (
    value.length ===
      10 &&
    value.startsWith(
      "0"
    )
  ) {
    return `94${value.slice(
      1
    )}`;
  }

  if (
    value.length ===
      9 &&
    value.startsWith(
      "7"
    )
  ) {
    return `94${value}`;
  }

  return value;
}

function formatPaddyType(
  value:
    string
) {
  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatNumber(
  value:
    number
) {
  return new Intl.NumberFormat(
    "en-LK",
    {
      maximumFractionDigits:
        2,
    }
  ).format(
    value
  );
}

function formatCurrency(
  value:
    number
) {
  return `Rs. ${new Intl.NumberFormat(
    "en-LK",
    {
      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    value
  )}`;
}

function formatDate(
  value:
    string |
    null |
    undefined
) {
  if (!value) {
    return "No date";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat(
    "en-LK",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(
    date
  );
}

type Theme = {
  primary:
    string;

  dark:
    string;

  soft:
    string;

  border:
    string;

  page:
    string;
};

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      minHeight:
        70,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,

      paddingHorizontal:
        17,

      backgroundColor:
        "#FFFFFF",

      borderBottomWidth:
        1,

      borderBottomColor:
        "#E5E7EB",
    },

    headerButton: {
      width:
        42,

      height:
        42,

      borderRadius:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#F3F4F6",
    },

    headerTitle: {
      color:
        "#1F2937",

      fontSize:
        16,

      fontWeight:
        "900",
    },

    headerSubtitle: {
      color:
        "#64748B",

      fontSize:
        8,

      marginTop:
        2,
    },

    favoriteButton: {
      width:
        42,

      height:
        42,

      borderRadius:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth:
        1,
    },

    content: {
      padding:
        17,

      paddingBottom:
        125,
    },

    centerState: {
      flex:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding:
        30,
    },

    stateTitle: {
      color:
        "#1F2937",

      fontSize:
        15,

      fontWeight:
        "900",

      marginTop:
        10,
    },

    errorDescription: {
      color:
        "#64748B",

      fontSize:
        9,

      textAlign:
        "center",

      marginTop:
        5,
    },

    backButtonLarge: {
      paddingHorizontal:
        22,

      paddingVertical:
        12,

      borderRadius:
        13,

      marginTop:
        16,
    },

    backButtonText: {
      color:
        "#FFFFFF",

      fontSize:
        9,

      fontWeight:
        "900",
    },

    profileHero: {
      alignItems:
        "center",

      borderRadius:
        24,

      padding:
        22,

      marginBottom:
        14,
    },

    heroAvatar: {
      width:
        73,

      height:
        73,

      borderRadius:
        24,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.14)",

      borderWidth:
        1,

      borderColor:
        "rgba(255,255,255,0.2)",
    },

    partnerName: {
      color:
        "#FFFFFF",

      fontSize:
        18,

      fontWeight:
        "900",

      textAlign:
        "center",

      marginTop:
        12,
    },

    locationRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        4,

      marginTop:
        5,
    },

    heroLocation: {
      color:
        "rgba(255,255,255,0.74)",

      fontSize:
        8.5,
    },

    heroBadges: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "center",

      gap:
        6,

      marginTop:
        11,
    },

    heroBadge: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        4,

      paddingHorizontal:
        9,

      paddingVertical:
        5,

      borderRadius:
        999,

      backgroundColor:
        "rgba(255,255,255,0.14)",
    },

    heroBadgeText: {
      color:
        "#FFFFFF",

      fontSize:
        7,

      fontWeight:
        "800",
    },

    relationshipCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      padding:
        13,

      borderRadius:
        17,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",

      marginBottom:
        18,
    },

    relationshipIcon: {
      width:
        43,

      height:
        43,

      borderRadius:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    relationshipTitle: {
      color:
        "#1F2937",

      fontSize:
        10,

      fontWeight:
        "900",
    },

    relationshipText: {
      color:
        "#64748B",

      fontSize:
        7.5,

      lineHeight:
        12,

      marginTop:
        3,
    },

    sectionTitle: {
      color:
        "#1F2937",

      fontSize:
        13.5,

      fontWeight:
        "900",

      marginBottom:
        9,
    },

    sectionSubtitle: {
      color:
        "#94A3B8",

      fontSize:
        7.5,

      marginTop:
        -5,
    },

    infoCard: {
      paddingHorizontal:
        14,

      borderRadius:
        18,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",

      marginBottom:
        18,
    },

    infoRow: {
      minHeight:
        61,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      borderBottomWidth:
        1,

      borderBottomColor:
        "#F1F5F9",
    },

    infoRowLast: {
      borderBottomWidth:
        0,
    },

    infoIcon: {
      width:
        37,

      height:
        37,

      borderRadius:
        12,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    infoLabel: {
      color:
        "#94A3B8",

      fontSize:
        7,

      fontWeight:
        "700",
    },

    infoValue: {
      color:
        "#1F2937",

      fontSize:
        9.5,

      fontWeight:
        "800",

      marginTop:
        2,
    },

    contactCard: {
      padding:
        14,

      borderRadius:
        18,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#BBF7D0",

      marginBottom:
        18,
    },

    contactTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,
    },

    contactIcon: {
      width:
        43,

      height:
        43,

      borderRadius:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    contactLabel: {
      color:
        "#94A3B8",

      fontSize:
        6.5,

      fontWeight:
        "900",

      letterSpacing:
        0.7,
    },

    contactName: {
      color:
        "#1F2937",

      fontSize:
        10,

      fontWeight:
        "900",

      marginTop:
        2,
    },

    contactNumber: {
      color:
        "#166534",

      fontSize:
        12,

      fontWeight:
        "900",

      marginTop:
        2,
    },

    contactActions: {
      flexDirection:
        "row",

      gap:
        8,

      marginTop:
        12,
    },

    contactAction: {
      flex:
        1,

      minHeight:
        43,

      borderRadius:
        13,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        6,
    },

    contactActionText: {
      color:
        "#FFFFFF",

      fontSize:
        8.5,

      fontWeight:
        "900",
    },

    whatsappAction: {
      backgroundColor:
        "#16A34A",
    },

    lockedCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      padding:
        13,

      borderRadius:
        17,

      backgroundColor:
        "#F8FAFC",

      borderWidth:
        1,

      borderColor:
        "#E2E8F0",

      marginBottom:
        18,
    },

    lockedTitle: {
      color:
        "#475569",

      fontSize:
        9.5,

      fontWeight:
        "900",
    },

    lockedText: {
      color:
        "#64748B",

      fontSize:
        7.5,

      lineHeight:
        12,

      marginTop:
        2,
    },

    opportunityHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom:
        9,
    },

    countBadge: {
      minWidth:
        29,

      height:
        29,

      borderRadius:
        10,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    countBadgeText: {
      fontSize:
        10,

      fontWeight:
        "900",
    },

    opportunityList: {
      gap:
        10,

      marginBottom:
        19,
    },

    opportunityCard: {
      padding:
        13,

      borderRadius:
        18,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",
    },

    opportunityTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,
    },

    opportunityIcon: {
      width:
        41,

      height:
        41,

      borderRadius:
        13,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    opportunityTitle: {
      color:
        "#1F2937",

      fontSize:
        11,

      fontWeight:
        "900",
    },

    opportunitySubtitle: {
      color:
        "#94A3B8",

      fontSize:
        7,

      marginTop:
        2,
    },

    statusBadge: {
      paddingHorizontal:
        7,

      paddingVertical:
        4,

      borderRadius:
        999,

      backgroundColor:
        "#DCFCE7",
    },

    statusBadgeText: {
      color:
        "#166534",

      fontSize:
        6,

      fontWeight:
        "900",
    },

    opportunityMetrics: {
      flexDirection:
        "row",

      gap:
        7,

      padding:
        9,

      borderRadius:
        12,

      backgroundColor:
        "#F8FAFC",

      marginTop:
        10,
    },

    opportunityHint: {
      color:
        "#64748B",

      fontSize:
        7,

      lineHeight:
        11,

      marginTop:
        8,
    },

    opportunityEmpty: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,

      padding:
        14,

      borderRadius:
        17,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",

      marginBottom:
        18,
    },

    opportunityEmptyText: {
      flex:
        1,

      color:
        "#64748B",

      fontSize:
        8,

      lineHeight:
        13,
    },

    summaryGrid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,

      marginBottom:
        10,
    },

    summaryCard: {
      width:
        "48.5%",

      padding:
        12,

      borderRadius:
        16,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",
    },

    summaryIcon: {
      width:
        36,

      height:
        36,

      borderRadius:
        11,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom:
        8,
    },

    summaryLabel: {
      color:
        "#94A3B8",

      fontSize:
        6.5,

      fontWeight:
        "700",
    },

    summaryValue: {
      color:
        "#1F2937",

      fontSize:
        10,

      fontWeight:
        "900",

      marginTop:
        3,
    },

    tradeValueCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      padding:
        13,

      borderRadius:
        17,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",

      marginBottom:
        19,
    },

    tradeValueIcon: {
      width:
        42,

      height:
        42,

      borderRadius:
        13,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    tradeValueLabel: {
      color:
        "#94A3B8",

      fontSize:
        6.5,

      fontWeight:
        "900",
    },

    tradeValue: {
      color:
        "#1F2937",

      fontSize:
        12,

      fontWeight:
        "900",

      marginTop:
        2,
    },

    historyHeader: {
      marginTop:
        2,

      marginBottom:
        9,
    },

    historyList: {
      gap:
        10,
    },

    historyCard: {
      padding:
        13,

      borderRadius:
        17,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",
    },

    historyTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,
    },

    historyIcon: {
      width:
        39,

      height:
        39,

      borderRadius:
        12,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    historyTitle: {
      color:
        "#1F2937",

      fontSize:
        10,

      fontWeight:
        "900",
    },

    historyDate: {
      color:
        "#94A3B8",

      fontSize:
        7,

      marginTop:
        2,
    },

    historyPrice: {
      fontSize:
        10,

      fontWeight:
        "900",
    },

    historyMetrics: {
      flexDirection:
        "row",

      gap:
        7,

      padding:
        9,

      borderRadius:
        12,

      backgroundColor:
        "#F8FAFC",

      marginTop:
        10,
    },

    smallMetricLabel: {
      color:
        "#94A3B8",

      fontSize:
        6.2,

      fontWeight:
        "700",
    },

    smallMetricValue: {
      color:
        "#334155",

      fontSize:
        7.8,

      fontWeight:
        "900",

      marginTop:
        2,
    },

    noTradeCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      padding:
        14,

      borderRadius:
        17,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",

      marginTop:
        2,
    },

    noTradeTitle: {
      color:
        "#1F2937",

      fontSize:
        9.5,

      fontWeight:
        "900",
    },

    noTradeText: {
      color:
        "#64748B",

      fontSize:
        7.5,

      lineHeight:
        12,

      marginTop:
        2,
    },
  });