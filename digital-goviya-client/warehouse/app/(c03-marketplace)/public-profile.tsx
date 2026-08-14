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

  const params =
    useLocalSearchParams<{
      partnerType?: string;
      partnerId?: string;
    }>();

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
            primary:
              "#15803D",

            dark:
              "#14532D",

            soft:
              "#DCFCE7",

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

            page:
              "#FBF8F1",
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
        "Unable to open profile",
        error instanceof Error
          ? error.message
          : "Please try again."
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
        "Unable to connect",
        error instanceof Error
          ? error.message
          : "Please try again."
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
        "Unable to respond",
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    } finally {
      setActionLoading(
        false
      );
    }
  }

  if (
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
          <ActivityIndicator
            size="large"
            color={
              theme.primary
            }
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading profile
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const profile =
    data.profile;

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
            styles.backButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#1F2937"
          />
        </Pressable>

        <Text
          style={
            styles.headerTitle
          }
        >
          Public Profile
        </Text>

        <View
          style={{
            width: 42,
          }}
        />
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
          style={
            styles.hero
          }
        >
          <View
            style={
              styles.avatar
            }
          >
            <Ionicons
              name={
                profile.type ===
                "miller"
                  ? "business"
                  : "leaf"
              }
              size={32}
              color="#FFFFFF"
            />
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
              styles.verificationRow
            }
          >
            <Ionicons
              name={
                profile.isVerified
                  ? "checkmark-circle"
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
                ? "PMB REGISTERED MILLER"
                : profile.verificationSource ===
                  "RESEARCH_SYNTHETIC"
                ? "RESEARCH FARMER PROFILE"
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
              color="rgba(255,255,255,0.7)"
            />

            <Text
              style={
                styles.heroLocationText
              }
            >
              {
                profile.district
              }
              {" • "}
              {
                profile.location
              }
            </Text>
          </View>
        </LinearGradient>

        <View
          style={
            styles.connectionCard
          }
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
                  : "person-add-outline"
              }
              size={23}
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
                styles.connectionTitle
              }
            >
              {getConnectionTitle(
                data.connection
                  .status,
                data.connection
                  .direction
              )}
            </Text>

            <Text
              style={
                styles.connectionDescription
              }
            >
              {getConnectionDescription(
                data.connection
                  .status,
                data.connection
                  .direction
              )}
            </Text>
          </View>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Profile information
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
              profile.district
            }
            theme={
              theme
            }
          />

          <InfoRow
            icon="navigate-outline"
            label="Location"
            value={
              profile.location
            }
            theme={
              theme
            }
          />

          {profile.type ===
          "miller" ? (
            <>
              <InfoRow
                icon="business-outline"
                label="Rice mill"
                value={
                  profile.millName
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="person-outline"
                label="Owner / representative"
                value={
                  profile.personName ||
                  "Not provided"
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="document-text-outline"
                label="PMB registration"
                value={
                  profile.businessRegistrationNumber ||
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
                  profile.farmName ||
                  "Not provided"
                }
                theme={
                  theme
                }
              />

              <InfoRow
                icon="resize-outline"
                label="Farm size"
                value={`${profile.farmSizeAcres ?? 0} acres`}
                theme={
                  theme
                }
              />

              <InfoRow
                icon="leaf-outline"
                label="Main variety"
                value={
                  profile.mainPaddyVariety ||
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

              <View>
                <Text
                  style={
                    styles.contactTitle
                  }
                >
                  Contact unlocked
                </Text>

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
                styles.contactActions
              }
            >
              <Pressable
                style={[
                  styles.contactButton,

                  {
                    backgroundColor:
                      theme.primary,
                  },
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
                  Call
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.contactButton,

                  {
                    backgroundColor:
                      "#16A34A",
                  },
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
                  WhatsApp
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
            <Ionicons
              name="lock-closed-outline"
              size={23}
              color="#64748B"
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.privateTitle
                }
              >
                Contact details are private
              </Text>

              <Text
                style={
                  styles.privateText
                }
              >
                Contact information becomes available only after both marketplace users connect.
              </Text>
            </View>
          </View>
        )}

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
        <Ionicons
          name="checkmark-circle"
          size={20}
          color="#166534"
        />

        <Text
          style={
            styles.connectedText
          }
        >
          Connected Trading Partner
        </Text>
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
          styles.responseActions
        }
      >
        <Pressable
          disabled={loading}
          style={
            styles.rejectButton
          }
          onPress={
            onReject
          }
        >
          <Text
            style={
              styles.rejectText
            }
          >
            Reject
          </Text>
        </Pressable>

        <Pressable
          disabled={loading}
          style={[
            styles.acceptButton,

            {
              backgroundColor:
                theme.primary,
            },
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
                Accept Request
              </Text>
            </>
          )}
        </Pressable>
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
        <Ionicons
          name="time-outline"
          size={20}
          color="#64748B"
        />

        <Text
          style={
            styles.pendingText
          }
        >
          Connection request sent
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      disabled={loading}
      style={[
        styles.sendButton,

        {
          backgroundColor:
            theme.primary,
        },
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
            Send Connection Request
          </Text>
        </>
      )}
    </Pressable>
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

function getConnectionTitle(
  status: string,
  direction: string | null
) {
  if (
    status ===
    "accepted"
  ) {
    return "Connected";
  }

  if (
    status ===
      "pending" &&
    direction ===
      "incoming"
  ) {
    return "Connection request received";
  }

  if (
    status ===
      "pending" &&
    direction ===
      "outgoing"
  ) {
    return "Request pending";
  }

  return "Build a trading connection";
}

function getConnectionDescription(
  status: string,
  direction: string | null
) {
  if (
    status ===
    "accepted"
  ) {
    return "You can now access approved contact information and build your trading relationship.";
  }

  if (
    status ===
      "pending" &&
    direction ===
      "incoming"
  ) {
    return "This marketplace user would like to connect with you.";
  }

  if (
    status ===
      "pending" &&
    direction ===
      "outgoing"
  ) {
    return "Waiting for the other marketplace user to respond.";
  }

  return "Send a request to connect while keeping private contact details protected.";
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
        "#E5E7EB",
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
        "#F3F4F6",
    },

    headerTitle: {
      color:
        "#1F2937",

      fontSize: 16,
      fontWeight:
        "900",
    },

    content: {
      padding: 18,

      paddingBottom:
        125,
    },

    loadingState: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 10,
    },

    loadingText: {
      color:
        "#64748B",

      fontSize: 10,
      fontWeight:
        "800",
    },

    hero: {
      borderRadius: 25,

      alignItems:
        "center",

      padding: 23,

      marginBottom: 17,
    },

    avatar: {
      width: 76,
      height: 76,

      borderRadius: 25,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.13)",

      borderWidth: 1,
      borderColor:
        "rgba(255,255,255,0.18)",
    },

    name: {
      color:
        "#FFFFFF",

      fontSize: 19,
      fontWeight:
        "900",

      textAlign:
        "center",

      marginTop: 13,
    },

    verificationRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      marginTop: 7,
    },

    verificationText: {
      color:
        "#FDE68A",

      fontSize: 7.5,
      fontWeight:
        "900",

      letterSpacing:
        0.7,
    },

    heroLocation: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 4,

      marginTop: 7,
    },

    heroLocationText: {
      color:
        "rgba(255,255,255,0.7)",

      fontSize: 8.5,
    },

    connectionCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 11,

      borderRadius: 18,

      padding: 14,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#E5E7EB",

      marginBottom: 21,
    },

    connectionIcon: {
      width: 44,
      height: 44,

      borderRadius: 14,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    connectionTitle: {
      color:
        "#1F2937",

      fontSize: 11,
      fontWeight:
        "900",
    },

    connectionDescription: {
      color:
        "#64748B",

      fontSize: 8.3,
      lineHeight: 13,

      marginTop: 3,
    },

    sectionTitle: {
      color:
        "#1F2937",

      fontSize: 14,
      fontWeight:
        "900",

      marginBottom: 10,
    },

    infoCard: {
      borderRadius: 19,

      paddingHorizontal:
        14,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#E5E7EB",

      marginBottom: 21,
    },

    infoRow: {
      minHeight: 63,

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
      borderBottomWidth: 0,
    },

    infoIcon: {
      width: 37,
      height: 37,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    infoLabel: {
      color:
        "#94A3B8",

      fontSize: 7.5,
      fontWeight:
        "700",
    },

    infoValue: {
      color:
        "#1F2937",

      fontSize: 10,
      fontWeight:
        "800",

      marginTop: 3,
    },

    contactCard: {
      borderRadius: 19,

      padding: 15,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#BBF7D0",

      marginBottom: 20,
    },

    contactHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 11,
    },

    contactIcon: {
      width: 43,
      height: 43,

      borderRadius: 14,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    contactTitle: {
      color:
        "#166534",

      fontSize: 10,
      fontWeight:
        "900",
    },

    phone: {
      color:
        "#1F2937",

      fontSize: 12,
      fontWeight:
        "900",

      marginTop: 3,
    },

    contactActions: {
      flexDirection:
        "row",

      gap: 9,

      marginTop: 14,
    },

    contactButton: {
      flex: 1,

      minHeight: 44,

      borderRadius: 13,

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

      fontSize: 9,
      fontWeight:
        "900",
    },

    privateCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 11,

      borderRadius: 18,

      padding: 15,

      backgroundColor:
        "#F8FAFC",

      borderWidth: 1,
      borderColor:
        "#E2E8F0",

      marginBottom: 20,
    },

    privateTitle: {
      color:
        "#475569",

      fontSize: 10,
      fontWeight:
        "900",
    },

    privateText: {
      color:
        "#64748B",

      fontSize: 8,
      lineHeight: 13,

      marginTop: 3,
    },

    sendButton: {
      minHeight: 52,

      borderRadius: 16,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 7,
    },

    sendButtonText: {
      color:
        "#FFFFFF",

      fontSize: 10,
      fontWeight:
        "900",
    },

    pendingBar: {
      minHeight: 51,

      borderRadius: 16,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 7,

      backgroundColor:
        "#F1F5F9",

      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },

    pendingText: {
      color:
        "#64748B",

      fontSize: 9.5,
      fontWeight:
        "900",
    },

    connectedBar: {
      minHeight: 51,

      borderRadius: 16,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 7,

      backgroundColor:
        "#DCFCE7",

      borderWidth: 1,
      borderColor:
        "#BBF7D0",
    },

    connectedText: {
      color:
        "#166534",

      fontSize: 9.5,
      fontWeight:
        "900",
    },

    responseActions: {
      flexDirection:
        "row",

      gap: 9,
    },

    rejectButton: {
      flex: 1,

      minHeight: 51,

      borderRadius: 15,

      alignItems:
        "center",

      justifyContent:
        "center",

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
      fontWeight:
        "900",
    },

    acceptButton: {
      flex: 1.5,

      minHeight: 51,

      borderRadius: 15,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 6,
    },

    acceptText: {
      color:
        "#FFFFFF",

      fontSize: 9.5,
      fontWeight:
        "900",
    },
  });