import {
  Ionicons,
} from "@expo/vector-icons";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";

import {
  useLanguage,
} from "@/contexts/LanguageContext";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  connectionService,
} from "@/services/c03-marketplace/connection.service";

import type {
  ConnectionPartnerType,
  PublicProfileResponse,
} from "@/types/c03-marketplace/connection.types";

export default function PublicProfileScreen() {
  const {
    user,
  } = useMarketplaceAuth();

  const {
    t,
  } = useLanguage();

  const params =
    useLocalSearchParams<{
      partnerType?: string;
      partnerId?: string;
    }>();

  const [
    fontsLoaded,
  ] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
  });

  const [
    data,
    setData,
  ] =
    useState<
      PublicProfileResponse["data"] | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const isFarmer =
    user?.role === "farmer";

  const theme = useMemo(
    () =>
      isFarmer
        ? {
            primary: "#15803D",
            dark: "#14532D",
            soft: "#DCFCE7",
            softDark: "#BBF7D0",
            page: "#F6FAF7",
            accent: "#22C55E",
          }
        : {
            primary: "#92400E",
            dark: "#78350F",
            soft: "#FEF3C7",
            softDark: "#FDE68A",
            page: "#FBF8F1",
            accent: "#D97706",
          },
    [isFarmer]
  );

  const partnerType =
    params.partnerType as
      | ConnectionPartnerType
      | undefined;

  const partnerId =
    params.partnerId;

  async function loadProfile() {
    if (
      !partnerType ||
      !partnerId
    ) {
      return;
    }

    try {
      setLoading(true);

      const response =
        await connectionService.getPublicProfile(
          partnerType,
          partnerId
        );

      setData(
        response.data
      );
    } catch (error) {
      Alert.alert(
        t.c3publicProfile.unableToOpen,
        error instanceof Error
          ? error.message
          : t.c3publicProfile.pleaseTryAgain
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, [
    partnerType,
    partnerId,
  ]);

  async function sendRequest() {
    if (
      !partnerType ||
      !partnerId
    ) {
      return;
    }

    try {
      setActionLoading(
        true
      );

      await connectionService.sendRequest(
        partnerType,
        partnerId
      );

      await loadProfile();
    } catch (error) {
      Alert.alert(
        t.c3publicProfile.unableToConnect,
        error instanceof Error
          ? error.message
          : t.c3publicProfile.pleaseTryAgain
      );
    } finally {
      setActionLoading(
        false
      );
    }
  }

  async function respond(
    decision:
      | "accepted"
      | "rejected"
  ) {
    const connectionId =
      data?.connection
        .connectionId;

    if (!connectionId) {
      return;
    }

    try {
      setActionLoading(
        true
      );

      await connectionService.respond(
        connectionId,
        decision
      );

      await loadProfile();
    } catch (error) {
      Alert.alert(
        t.c3publicProfile.unableToRespond,
        error instanceof Error
          ? error.message
          : t.c3publicProfile.pleaseTryAgain
      );
    } finally {
      setActionLoading(
        false
      );
    }
  }

  if (
    !fontsLoaded ||
    loading ||
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
            styles.loadingState
          }
        >
          <View
            style={[
              styles.loadingIcon,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <ActivityIndicator
              size="small"
              color={
                theme.primary
              }
            />
          </View>

          <Text
            style={
              styles.loadingText
            }
          >
            {t.c3publicProfile.loadingTitle}
          </Text>

          <Text
            style={
              styles.loadingSubtext
            }
          >
            {t.c3publicProfile.loadingSubtext}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const profile =
    data.profile;

  const isMiller =
    profile.type ===
    "miller";

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
      {/* HEADER */}
      <View
        style={
          styles.header
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={({ pressed }) => [
            styles.backButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#1F2937"
          />
        </Pressable>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            {t.c3publicProfile.title}
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            {t.c3publicProfile.subtitle}
          </Text>
        </View>

        <View
          style={
            styles.headerRight
          }
        >
          <View
            style={[
              styles.headerDot,
              {
                backgroundColor:
                  theme.accent,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HERO */}
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
            styles.hero
          }
        >
          <View
            style={
              styles.heroGlowOne
            }
          />

          <View
            style={
              styles.heroGlowTwo
            }
          />

          <View
            style={
              styles.avatarOuter
            }
          >
            <View
              style={
                styles.avatar
              }
            >
              <Ionicons
                name={
                  isMiller
                    ? "business"
                    : "leaf"
                }
                size={31}
                color="#FFFFFF"
              />
            </View>

            {profile.isVerified && (
              <View
                style={
                  styles.verifiedBadge
                }
              >
                <Ionicons
                  name="checkmark"
                  size={11}
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>

          <Text
            style={
              styles.name
            }
          >
            {profile.name}
          </Text>

          <View
            style={
              styles.roleBadge
            }
          >
            <Ionicons
              name={
                isMiller
                  ? "business-outline"
                  : "leaf-outline"
              }
              size={12}
              color="#FDE68A"
            />

            <Text
              style={
                styles.roleBadgeText
              }
            >
              {isMiller
                ? t.c3publicProfile.riceMiller
                : t.c3publicProfile.farmer}
            </Text>
          </View>

          <View
            style={
              styles.verificationRow
            }
          >
            <Ionicons
              name={
                profile.isVerified
                  ? "shield-checkmark"
                  : "information-circle-outline"
              }
              size={14}
              color="#FDE68A"
            />

            <Text
              style={
                styles.verificationText
              }
            >
              {profile.type ===
                "miller" &&
              profile.verificationSource ===
                "PMB"
                ? t.c3publicProfile.pmbRegisteredMiller
                : profile.verificationSource ===
                  "RESEARCH_SYNTHETIC"
                ? t.c3publicProfile.researchFarmerProfile
                : profile.type.toUpperCase()}
            </Text>
          </View>

          <View
            style={
              styles.heroLocation
            }
          >
            <Ionicons
              name="location-outline"
              size={14}
              color="rgba(255,255,255,0.75)"
            />

            <Text
              style={
                styles.heroLocationText
              }
            >
              {translateDistrict(
                profile.district,
                t.c3districts,
                t.c3publicProfile.notProvided
              )}
              {"  •  "}
              {
                profile.location
              }
            </Text>
          </View>
        </LinearGradient>

        {/* CONNECTION STATUS */}
        <View
          style={[
            styles.connectionCard,
            {
              borderColor:
                theme.softDark,
            },
          ]}
        >
          <View
            style={[
              styles.connectionIcon,
              {
                backgroundColor:
                  theme.soft,
              },
            ]}
          >
            <Ionicons
              name={
                data.connection
                  .status ===
                "accepted"
                  ? "people"
                  : data.connection
                      .status ===
                    "pending"
                  ? "time-outline"
                  : "person-add-outline"
              }
              size={22}
              color={
                theme.primary
              }
            />
          </View>

          <View
            style={
              styles.connectionContent
            }
          >
            <View
              style={
                styles.connectionTitleRow
              }
            >
              <Text
                style={
                  styles.connectionTitle
                }
              >
                {getConnectionTitle(
                  data.connection
                    .status,
                  data.connection
                    .direction,
                  t
                )}
              </Text>

              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      data.connection
                        .status ===
                      "accepted"
                        ? "#22C55E"
                        : data.connection
                            .status ===
                          "pending"
                        ? "#F59E0B"
                        : "#94A3B8",
                  },
                ]}
              />
            </View>

            <Text
              style={
                styles.connectionDescription
              }
            >
              {getConnectionDescription(
                data.connection
                  .status,
                data.connection
                  .direction,
                t
              )}
            </Text>
          </View>
        </View>

        {/* PROFILE INFORMATION */}
        <SectionHeader
          title={
            t.c3publicProfile.profileInformation
          }
          subtitle={
            isMiller
              ? t.c3publicProfile.riceMillDetails
              : t.c3publicProfile.farmDetails
          }
        />

        <View
          style={
            styles.infoCard
          }
        >
          <InfoRow
            icon="location-outline"
            label={
              t.c3publicProfile.district
            }
            value={
              translateDistrict(
                profile.district,
                t.c3districts,
                t.c3publicProfile.notProvided
              )
            }
            theme={
              theme
            }
          />

          <InfoRow
            icon="navigate-outline"
            label={
              t.c3publicProfile.location
            }
            value={
              profile.location
            }
            theme={
              theme
            }
          />

          {isMiller ? (
            <>
              <InfoRow
                icon="business-outline"
                label={
                  t.c3publicProfile.riceMill
                }
                value={
                  profile.millName
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="person-outline"
                label={
                  t.c3publicProfile.ownerRepresentative
                }
                value={
                  profile.personName ||
                  t.c3publicProfile.notProvided
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="document-text-outline"
                label={
                  t.c3publicProfile.pmbRegistration
                }
                value={
                  profile.businessRegistrationNumber ||
                  t.c3publicProfile.notProvided
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
                label={
                  t.c3publicProfile.farm
                }
                value={
                  profile.farmName ||
                  t.c3publicProfile.notProvided
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="resize-outline"
                label={
                  t.c3publicProfile.farmSize
                }
                value={`${profile.farmSizeAcres ?? 0} ${t.c3publicProfile.acres}`}
                theme={
                  theme
                }
              />

              <InfoRow
                icon="leaf-outline"
                label={
                  t.c3publicProfile.mainVariety
                }
                value={
                  profile.mainPaddyVariety
                    ? translatePaddyType(
                        profile.mainPaddyVariety,
                        t
                      )
                    : t.c3publicProfile.notProvided
                }
                theme={
                  theme
                }
                isLast
              />
            </>
          )}
        </View>

        {/* CONTACT */}
        <SectionHeader
          title={
            t.c3publicProfile.contact
          }
          subtitle={
            data.contactUnlocked &&
            data.contact
              ? t.c3publicProfile.directContactAvailable
              : t.c3publicProfile.protectedUntilConnection
          }
        />

        {data.contactUnlocked &&
        data.contact ? (
          <View
            style={[
              styles.contactCard,
              {
                borderColor:
                  theme.softDark,
              },
            ]}
          >
            <View
              style={
                styles.contactHeader
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
                  size={21}
                  color={
                    theme.primary
                  }
                />
              </View>

              <View
                style={
                  styles.contactHeaderContent
                }
              >
                <View
                  style={
                    styles.unlockedRow
                  }
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color="#16A34A"
                  />

                  <Text
                    style={
                      styles.contactTitle
                    }
                  >
                    {t.c3publicProfile.contactUnlocked}
                  </Text>
                </View>

                <Text
                  style={
                    styles.phone
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
                styles.contactDivider
              }
            />

            <View
              style={
                styles.contactActions
              }
            >
              <Pressable
                style={({ pressed }) => [
                  styles.contactButton,
                  {
                    backgroundColor:
                      theme.primary,
                  },
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  void Linking.openURL(
                    `tel:${data.contact?.phone}`
                  )
                }
              >
                <Ionicons
                  name="call"
                  size={17}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.contactButtonText
                  }
                >
                  {t.c3publicProfile.call}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.contactButton,
                  {
                    backgroundColor:
                      "#16A34A",
                  },
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  void Linking.openURL(
                    `https://wa.me/${normalizePhone(
                      data.contact?.phone ||
                        ""
                    )}`
                  )
                }
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.contactButtonText
                  }
                >
                  {t.c3publicProfile.whatsapp}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View
            style={
              styles.privateCard
            }
          >
            <View
              style={
                styles.privateIcon
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={21}
                color="#64748B"
              />
            </View>

            <View
              style={
                styles.privateContent
              }
            >
              <Text
                style={
                  styles.privateTitle
                }
              >
                {t.c3publicProfile.contactPrivate}
              </Text>

              <Text
                style={
                  styles.privateText
                }
              >
                {t.c3publicProfile.contactPrivateText}
              </Text>
            </View>
          </View>
        )}

        {/* CONNECTION ACTION */}
        <ConnectionActions
          data={data}
          theme={theme}
          loading={
            actionLoading
          }
          onSend={() =>
            void sendRequest()
          }
          onAccept={() =>
            void respond(
              "accepted"
            )
          }
          onReject={() =>
            void respond(
              "rejected"
            )
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <View>
        <Text
          style={
            styles.sectionTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.sectionSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function ConnectionActions({
  data,
  theme,
  loading,
  onSend,
  onAccept,
  onReject,
}: {
  data:
    PublicProfileResponse["data"];

  theme: {
    primary: string;
  };

  loading: boolean;

  onSend: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const {
    t,
  } = useLanguage();

  if (
    data.connection.status ===
    "accepted"
  ) {
    return (
      <View
        style={
          styles.connectedBar
        }
      >
        <View
          style={
            styles.connectedIcon
          }
        >
          <Ionicons
            name="checkmark"
            size={15}
            color="#166534"
          />
        </View>

        <View
          style={
            styles.connectedContent
          }
        >
          <Text
            style={
              styles.connectedText
            }
          >
            {t.c3publicProfile.connectedTradingPartner}
          </Text>

          <Text
            style={
              styles.connectedSubtext
            }
          >
            {t.c3publicProfile.connectedSubtext}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={17}
          color="#86A98F"
        />
      </View>
    );
  }

  if (
    data.connection.status ===
      "pending" &&
    data.connection.direction ===
      "incoming"
  ) {
    return (
      <View
        style={
          styles.responseContainer
        }
      >
        <Text
          style={
            styles.actionLabel
          }
        >
          {t.c3publicProfile.respondToRequest}
        </Text>

        <View
          style={
            styles.responseActions
          }
        >
          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.rejectButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={
              onReject
            }
          >
            <Ionicons
              name="close"
              size={17}
              color="#B91C1C"
            />

            <Text
              style={
                styles.rejectText
              }
            >
              {t.c3publicProfile.reject}
            </Text>
          </Pressable>

          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.acceptButton,
              {
                backgroundColor:
                  theme.primary,
              },
              pressed &&
                styles.pressed,
            ]}
            onPress={
              onAccept
            }
          >
            {loading ? (
              <ActivityIndicator
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
                  {t.c3publicProfile.acceptRequest}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  if (
    data.connection.status ===
      "pending" &&
    data.connection.direction ===
      "outgoing"
  ) {
    return (
      <View
        style={
          styles.pendingBar
        }
      >
        <View
          style={
            styles.pendingIcon
          }
        >
          <Ionicons
            name="time-outline"
            size={18}
            color="#B45309"
          />
        </View>

        <View
          style={
            styles.pendingContent
          }
        >
          <Text
            style={
              styles.pendingText
            }
          >
            {t.c3publicProfile.requestSent}
          </Text>

          <Text
            style={
              styles.pendingSubtext
            }
          >
            {t.c3publicProfile.waitingResponse}
          </Text>
        </View>

        <Ionicons
          name="hourglass-outline"
          size={18}
          color="#94A3B8"
        />
      </View>
    );
  }

  return (
    <View
      style={
        styles.sendContainer
      }
    >
      <View
        style={
          styles.sendInfo
        }
      >
        <View
          style={
            styles.sendInfoIcon
          }
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={17}
            color={theme.primary}
          />
        </View>

        <View
          style={
            styles.sendInfoContent
          }
        >
          <Text
            style={
              styles.sendInfoTitle
            }
          >
            {t.c3publicProfile.readyToConnect}
          </Text>

          <Text
            style={
              styles.sendInfoText
            }
          >
            {t.c3publicProfile.contactStaysPrivate}
          </Text>
        </View>
      </View>

      <Pressable
        disabled={loading}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor:
              theme.primary,
          },
          pressed &&
            styles.pressed,
        ]}
        onPress={
          onSend
        }
      >
        {loading ? (
          <ActivityIndicator
            color="#FFFFFF"
          />
        ) : (
          <>
            <Ionicons
              name="person-add-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={
                styles.sendButtonText
              }
            >
              {t.c3publicProfile.sendConnectionRequest}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={17}
              color="#FFFFFF"
            />
          </>
        )}
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
  icon:
    keyof typeof Ionicons.glyphMap;

  label: string;
  value: string;

  theme: {
    primary: string;
    soft: string;
  };

  isLast?: boolean;
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
        style={
          styles.infoContent
        }
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
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={15}
        color="#CBD5E1"
      />
    </View>
  );
}

function getConnectionTitle(
  status: string,
  direction: string | null,
  t: any
) {
  if (
    status ===
    "accepted"
  ) {
    return t.c3publicProfile.statusConnected;
  }

  if (
    status ===
      "pending" &&
    direction ===
      "incoming"
  ) {
    return t.c3publicProfile.statusIncoming;
  }

  if (
    status ===
      "pending" &&
    direction ===
      "outgoing"
  ) {
    return t.c3publicProfile.statusOutgoing;
  }

  return t.c3publicProfile.statusDefault;
}

function getConnectionDescription(
  status: string,
  direction: string | null,
  t: any
) {
  if (
    status ===
    "accepted"
  ) {
    return t.c3publicProfile.descConnected;
  }

  if (
    status ===
      "pending" &&
    direction ===
      "incoming"
  ) {
    return t.c3publicProfile.descIncoming;
  }

  if (
    status ===
      "pending" &&
    direction ===
      "outgoing"
  ) {
    return t.c3publicProfile.descOutgoing;
  }

  return t.c3publicProfile.descDefault;
}

function translatePaddyType(value: string, t: any): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "nadu") return t.c3paddyTypes.Nadu;
  if (normalized === "samba") return t.c3paddyTypes.Samba;
  if (normalized === "keeri samba" || normalized === "keerisamba") return t.c3paddyTypes.KeeriSamba;
  return value;
}

function translateDistrict(district: string | undefined, translations: { Ampara: string; Badulla: string; Kandy: string; Monaragala: string }, fallback: string): string {
  if (!district) return fallback;
  const districtMap: Record<string, string> = {
    Ampara: translations.Ampara,
    Badulla: translations.Badulla,
    Kandy: translations.Kandy,
    Monaragala: translations.Monaragala,
  };
  return districtMap[district.trim()] ?? district.trim();
}

function normalizePhone(
  phone: string
) {
  let value =
    phone.replace(
      /\D/g,
      ""
    );

  if (
    value.startsWith(
      "0"
    )
  ) {
    value =
      `94${value.slice(
        1
      )}`;
  }

  return value;
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    pressed: {
      opacity: 0.78,

      transform: [
        {
          scale: 0.985,
        },
      ],
    },

    /* HEADER */

    header: {
      minHeight: 68,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingHorizontal:
        18,

      backgroundColor:
        "#FFFFFF",

      borderBottomWidth: 1,

      borderBottomColor:
        "#EEF2F7",
    },

    backButton: {
      width: 42,
      height: 42,

      borderRadius: 14,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#F5F7FA",
    },

    headerCenter: {
      alignItems:
        "center",
    },

    headerTitle: {
      color:
        "#111827",

      fontSize: 15,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    headerSubtitle: {
      color:
        "#94A3B8",

      fontSize: 7.5,

      fontFamily:
        "Poppins_600SemiBold",

      marginTop: 2,
    },

    headerRight: {
      width: 42,
      height: 42,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    headerDot: {
      width: 8,
      height: 8,

      borderRadius: 10,
    },

    /* CONTENT */

    content: {
      paddingHorizontal:
        17,

      paddingTop: 15,

      paddingBottom:
        125,
    },

    /* LOADING */

    loadingState: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    loadingIcon: {
      width: 55,
      height: 55,

      borderRadius: 18,

      alignItems:
        "center",

      justifyContent:
        "center",

      marginBottom: 12,
    },

    loadingText: {
      color:
        "#334155",

      fontSize: 11,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    loadingSubtext: {
      color:
        "#94A3B8",

      fontSize: 8.5,

      fontFamily:
        "Poppins_400Regular",

      marginTop: 4,
    },

    /* HERO */

    hero: {
      borderRadius: 27,

      alignItems:
        "center",

      paddingHorizontal:
        22,

      paddingTop: 27,

      paddingBottom: 24,

      marginBottom: 14,

      overflow:
        "hidden",

      shadowColor:
        "#0F172A",

      shadowOffset: {
        width: 0,
        height: 8,
      },

      shadowOpacity:
        0.13,

      shadowRadius: 15,

      elevation: 5,
    },

    heroGlowOne: {
      position:
        "absolute",

      width: 150,
      height: 150,

      borderRadius: 100,

      backgroundColor:
        "rgba(255,255,255,0.055)",

      top: -65,
      right: -45,
    },

    heroGlowTwo: {
      position:
        "absolute",

      width: 120,
      height: 120,

      borderRadius: 100,

      backgroundColor:
        "rgba(255,255,255,0.04)",

      bottom: -55,
      left: -35,
    },

    avatarOuter: {
      position:
        "relative",

      marginBottom: 12,
    },

    avatar: {
      width: 78,
      height: 78,

      borderRadius: 27,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.13)",

      borderWidth: 1,

      borderColor:
        "rgba(255,255,255,0.22)",
    },

    verifiedBadge: {
      position:
        "absolute",

      right: -2,
      bottom: -2,

      width: 23,
      height: 23,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#16A34A",

      borderWidth: 3,

      borderColor:
        "#14532D",
    },

    name: {
      color:
        "#FFFFFF",

      fontSize: 20,

      fontFamily:
        "Poppins_800ExtraBold",

      textAlign:
        "center",

      letterSpacing:
        -0.3,
    },

    roleBadge: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      paddingHorizontal:
        10,

      paddingVertical: 5,

      borderRadius: 20,

      backgroundColor:
        "rgba(255,255,255,0.11)",

      borderWidth: 1,

      borderColor:
        "rgba(255,255,255,0.13)",

      marginTop: 8,
    },

    roleBadgeText: {
      color:
        "#FDE68A",

      fontSize: 7.5,

      fontFamily:
        "Poppins_800ExtraBold",

      letterSpacing:
        0.8,
    },

    verificationRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      marginTop: 10,
    },

    verificationText: {
      color:
        "#FDE68A",

      fontSize: 7.5,

      fontFamily:
        "Poppins_800ExtraBold",

      letterSpacing:
        0.6,
    },

    heroLocation: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 4,

      marginTop: 8,
    },

    heroLocationText: {
      color:
        "rgba(255,255,255,0.72)",

      fontSize: 8.5,

      fontFamily:
        "Poppins_500Medium",
    },

    /* CONNECTION */

    connectionCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,

      borderRadius: 20,

      padding: 14,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      marginBottom: 22,

      shadowColor:
        "#0F172A",

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity:
        0.045,

      shadowRadius: 8,

      elevation: 2,
    },

    connectionIcon: {
      width: 46,
      height: 46,

      borderRadius: 15,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    connectionContent: {
      flex: 1,
    },

    connectionTitleRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 7,
    },

    connectionTitle: {
      flex: 1,

      color:
        "#1F2937",

      fontSize: 11,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    statusDot: {
      width: 7,
      height: 7,

      borderRadius: 10,
    },

    connectionDescription: {
      color:
        "#64748B",

      fontSize: 8.3,

      fontFamily:
        "Poppins_400Regular",

      lineHeight: 13,

      marginTop: 4,
    },

    /* SECTION */

    sectionHeader: {
      marginBottom: 9,

      paddingHorizontal: 2,
    },

    sectionTitle: {
      color:
        "#111827",

      fontSize: 14,

      fontFamily:
        "Poppins_800ExtraBold",

      letterSpacing:
        -0.2,
    },

    sectionSubtitle: {
      color:
        "#94A3B8",

      fontSize: 7.8,

      fontFamily:
        "Poppins_600SemiBold",

      marginTop: 3,
    },

    /* INFO */

    infoCard: {
      borderRadius: 20,

      paddingHorizontal:
        14,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#E8EDF3",

      marginBottom: 21,

      shadowColor:
        "#0F172A",

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity:
        0.035,

      shadowRadius: 8,

      elevation: 2,
    },

    infoRow: {
      minHeight: 66,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 11,

      borderBottomWidth: 1,

      borderBottomColor:
        "#F1F5F9",
    },

    infoRowLast: {
      borderBottomWidth:
        0,
    },

    infoIcon: {
      width: 39,
      height: 39,

      borderRadius: 13,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    infoContent: {
      flex: 1,
    },

    infoLabel: {
      color:
        "#94A3B8",

      fontSize: 7.5,

      fontFamily:
        "Poppins_600SemiBold",

      letterSpacing:
        0.2,
    },

    infoValue: {
      color:
        "#1F2937",

      fontSize: 10,

      fontFamily:
        "Poppins_700Bold",

      marginTop: 3,

      lineHeight: 15,
    },

    /* CONTACT */

    contactCard: {
      borderRadius: 20,

      padding: 15,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      marginBottom: 21,

      shadowColor:
        "#0F172A",

      shadowOffset: {
        width: 0,
        height: 3,
      },

      shadowOpacity:
        0.04,

      shadowRadius: 8,

      elevation: 2,
    },

    contactHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 11,
    },

    contactIcon: {
      width: 45,
      height: 45,

      borderRadius: 15,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    contactHeaderContent: {
      flex: 1,
    },

    unlockedRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 4,
    },

    contactTitle: {
      color:
        "#166534",

      fontSize: 10,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    phone: {
      color:
        "#111827",

      fontSize: 13,

      fontFamily:
        "Poppins_800ExtraBold",

      marginTop: 4,

      letterSpacing:
        0.2,
    },

    contactDivider: {
      height: 1,

      backgroundColor:
        "#F1F5F9",

      marginVertical: 14,
    },

    contactActions: {
      flexDirection:
        "row",

      gap: 9,
    },

    contactButton: {
      flex: 1,

      minHeight: 45,

      borderRadius: 14,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 6,
    },

    contactButtonText: {
      color:
        "#FFFFFF",

      fontSize: 9.5,

      fontFamily:
        "Poppins_700Bold",
    },

    /* PRIVATE */

    privateCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 11,

      borderRadius: 20,

      padding: 15,

      backgroundColor:
        "#F8FAFC",

      borderWidth: 1,

      borderColor:
        "#E2E8F0",

      marginBottom: 21,
    },

    privateIcon: {
      width: 43,
      height: 43,

      borderRadius: 14,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#E2E8F0",
    },

    privateContent: {
      flex: 1,
    },

    privateTitle: {
      color:
        "#475569",

      fontSize: 10,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    privateText: {
      color:
        "#64748B",

      fontSize: 8,

      fontFamily:
        "Poppins_400Regular",

      lineHeight: 13,

      marginTop: 4,
    },

    /* SEND */

    sendContainer: {
      marginTop: 1,
    },

    sendInfo: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

      paddingHorizontal: 3,

      marginBottom: 11,
    },

    sendInfoIcon: {
      width: 34,
      height: 34,

      borderRadius: 11,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#E2E8F0",
    },

    sendInfoContent: {
      flex: 1,
    },

    sendInfoTitle: {
      color:
        "#334155",

      fontSize: 9.5,

      fontFamily:
        "Poppins_700Bold",
    },

    sendInfoText: {
      color:
        "#94A3B8",

      fontSize: 7.8,

      fontFamily:
        "Poppins_400Regular",

      lineHeight: 12,

      marginTop: 2,
    },

    sendButton: {
      minHeight: 53,

      borderRadius: 17,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 8,

      shadowColor:
        "#0F172A",

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity:
        0.12,

      shadowRadius: 10,

      elevation: 4,
    },

    sendButtonText: {
      color:
        "#FFFFFF",

      fontSize: 10,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    /* PENDING */

    pendingBar: {
      minHeight: 65,

      borderRadius: 18,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

      paddingHorizontal:
        13,

      backgroundColor:
        "#FFFBEB",

      borderWidth: 1,

      borderColor:
        "#FDE68A",

      marginBottom: 5,
    },

    pendingIcon: {
      width: 39,
      height: 39,

      borderRadius: 13,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FEF3C7",
    },

    pendingContent: {
      flex: 1,
    },

    pendingText: {
      color:
        "#92400E",

      fontSize: 9.5,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    pendingSubtext: {
      color:
        "#A16207",

      fontSize: 7.8,

      fontFamily:
        "Poppins_400Regular",

      marginTop: 3,
    },

    /* CONNECTED */

    connectedBar: {
      minHeight: 65,

      borderRadius: 18,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,

      paddingHorizontal:
        13,

      backgroundColor:
        "#F0FDF4",

      borderWidth: 1,

      borderColor:
        "#BBF7D0",

      marginBottom: 5,
    },

    connectedIcon: {
      width: 39,
      height: 39,

      borderRadius: 13,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#DCFCE7",
    },

    connectedContent: {
      flex: 1,
    },

    connectedText: {
      color:
        "#166534",

      fontSize: 9.5,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    connectedSubtext: {
      color:
        "#4D7C5A",

      fontSize: 7.8,

      fontFamily:
        "Poppins_400Regular",

      marginTop: 3,
    },

    /* RESPONSE */

    responseContainer: {
      marginTop: 1,
    },

    actionLabel: {
      color:
        "#64748B",

      fontSize: 8,

      fontFamily:
        "Poppins_600SemiBold",

      marginBottom: 8,

      paddingHorizontal: 2,
    },

    responseActions: {
      flexDirection:
        "row",

      gap: 9,

      marginBottom: 5,
    },

    rejectButton: {
      flex: 0.85,

      minHeight: 53,

      borderRadius: 16,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 5,

      backgroundColor:
        "#FEF2F2",

      borderWidth: 1,

      borderColor:
        "#FECACA",
    },

    rejectText: {
      color:
        "#B91C1C",

      fontSize: 9.5,

      fontFamily:
        "Poppins_800ExtraBold",
    },

    acceptButton: {
      flex: 1.5,

      minHeight: 53,

      borderRadius: 16,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 6,

      shadowColor:
        "#0F172A",

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity:
        0.1,

      shadowRadius: 8,

      elevation: 3,
    },

    acceptText: {
      color:
        "#FFFFFF",

      fontSize: 9.5,

      fontFamily:
        "Poppins_800ExtraBold",
    },
  });