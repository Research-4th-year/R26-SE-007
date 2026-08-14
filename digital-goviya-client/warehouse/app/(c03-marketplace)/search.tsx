import {
  Ionicons,
} from "@expo/vector-icons";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  router,
  useFocusEffect,
} from "expo-router";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
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
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  connectionService,
} from "@/services/c03-marketplace/connection.service";

import type {
  SearchMarketplaceItem,
} from "@/types/c03-marketplace/connection.types";

const DISTRICTS = [
  "All",
  "Ampara",
  "Kandy",
  "Badulla",
  "Monaragala",
];

export default function SearchScreen() {
  const {
    user,
  } = useMarketplaceAuth();

  const [
    results,
    setResults,
  ] =
    useState<
      SearchMarketplaceItem[]
    >([]);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    selectedDistrict,
    setSelectedDistrict,
  ] = useState("All");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    searching,
    setSearching,
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

  const loadUsers =
    useCallback(
      async (
        refresh = false
      ) => {
        try {
          if (refresh) {
            setRefreshing(
              true
            );
          } else {
            setLoading(true);
          }

          const response =
            await connectionService.searchUsers({
              district:
                selectedDistrict ===
                "All"
                  ? undefined
                  : selectedDistrict,
            });

          setResults(
            response.data
          );
        } catch (error) {
          console.error(
            "Search loading failed:",
            error
          );

          Alert.alert(
            "Unable to load users",
            error instanceof Error
              ? error.message
              : "Please try again."
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      [
        selectedDistrict,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  async function handleSearch() {
    try {
      setSearching(
        true
      );

      const response =
        await connectionService.searchUsers({
          query:
            searchQuery,

          district:
            selectedDistrict ===
              "All"
              ? undefined
              : selectedDistrict,
        });

      setResults(
        response.data
      );
    } catch (error) {
      Alert.alert(
        "Search failed",
        error instanceof Error
          ? error.message
          : "Unable to search."
      );
    } finally {
      setSearching(
        false
      );
    }
  }

  async function handleConnect(
    item:
      SearchMarketplaceItem
  ) {
    try {
      await connectionService.sendRequest(
        item.profile.type,
        item.profile.id
      );

      setResults(
        (current) =>
          current.map(
            (result) =>
              result.profile.id ===
              item.profile.id
                ? {
                    ...result,

                    connection: {
                      ...result.connection,

                      status:
                        "pending",

                      direction:
                        "outgoing",

                      canSendRequest:
                        false,

                      canRespond:
                        false,
                    },
                  }
                : result
          )
      );

      Alert.alert(
        "Request sent",
        `Your connection request was sent to ${item.profile.name}.`
      );
    } catch (error) {
      Alert.alert(
        "Unable to connect",
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    }
  }

  const filteredResults =
    useMemo(() => {
      if (
        !searchQuery.trim()
      ) {
        return results;
      }

      const normalized =
        searchQuery
          .trim()
          .toLowerCase();

      return results.filter(
        (item) =>
          [
            item.profile.name,

            item.profile
              .district,

            item.profile
              .location,

            item.profile.type ===
            "miller"
              ? item.profile
                  .millName
              : item.profile
                  .farmerName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(
              normalized
            )
      );
    }, [
      results,
      searchQuery,
    ]);

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
        <View>
          <Text
            style={
              styles.headerEyebrow
            }
          >
            MARKETPLACE DISCOVERY
          </Text>

          <Text
            style={
              styles.headerTitle
            }
          >
            {isFarmer
              ? "Find Millers"
              : "Find Farmers"}
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            {isFarmer
              ? "Discover registered rice millers and build trusted trading relationships."
              : "Discover farmer profiles and build your paddy sourcing network."}
          </Text>
        </View>
      </View>

      {loading ? (
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
              styles.loadingTitle
            }
          >
            Finding marketplace profiles
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          refreshControl={
            <RefreshControl
              refreshing={
                refreshing
              }
              onRefresh={() =>
                void loadUsers(
                  true
                )
              }
              tintColor={
                theme.primary
              }
            />
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
                styles.heroIcon
              }
            >
              <Ionicons
                name="search"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.heroTitle
                }
              >
                Search your trading network
              </Text>

              <Text
                style={
                  styles.heroText
                }
              >
                Search by name,
                {isFarmer
                  ? " mill name,"
                  : " farm name,"}{" "}
                district or location.
              </Text>
            </View>
          </LinearGradient>

          <View
            style={
              styles.searchContainer
            }
          >
            <Ionicons
              name="search-outline"
              size={19}
              color="#64748B"
            />

            <TextInput
              value={
                searchQuery
              }
              onChangeText={
                setSearchQuery
              }
              onSubmitEditing={() =>
                void handleSearch()
              }
              placeholder={
                isFarmer
                  ? "Search name or rice mill..."
                  : "Search farmer or farm..."
              }
              placeholderTextColor="#94A3B8"
              style={
                styles.searchInput
              }
            />

            {searching ? (
              <ActivityIndicator
                size="small"
                color={
                  theme.primary
                }
              />
            ) : searchQuery ? (
              <Pressable
                onPress={() => {
                  setSearchQuery(
                    ""
                  );

                  void loadUsers();
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#94A3B8"
                />
              </Pressable>
            ) : null}
          </View>

          <Text
            style={
              styles.filterLabel
            }
          >
            Filter by district
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.districtList
            }
          >
            {DISTRICTS.map(
              (district) => {
                const active =
                  district ===
                  selectedDistrict;

                return (
                  <Pressable
                    key={
                      district
                    }
                    onPress={() =>
                      setSelectedDistrict(
                        district
                      )
                    }
                    style={[
                      styles.districtChip,

                      active && {
                        backgroundColor:
                          theme.dark,

                        borderColor:
                          theme.dark,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.districtText,

                        active &&
                          styles.districtTextActive,
                      ]}
                    >
                      {
                        district
                      }
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>

          <View
            style={
              styles.resultHeader
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              {isFarmer
                ? "Available Millers"
                : "Available Farmers"}
            </Text>

            <Text
              style={
                styles.resultCount
              }
            >
              {
                filteredResults.length
              }{" "}
              profiles
            </Text>
          </View>

          {filteredResults.length ===
          0 ? (
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={[
                  styles.emptyIcon,

                  {
                    backgroundColor:
                      theme.soft,
                  },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={31}
                  color={
                    theme.primary
                  }
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No profiles found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Try a different
                name, location or
                district.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.resultList
              }
            >
              {filteredResults.map(
                (item) => (
                  <SearchCard
                    key={
                      item.profile
                        .id
                    }
                    item={
                      item
                    }
                    theme={
                      theme
                    }
                    onConnect={() =>
                      void handleConnect(
                        item
                      )
                    }
                    onOpen={() =>
                      router.push({
                        pathname:
                          "/(c03-marketplace)/public-profile" as any,

                        params: {
                          partnerType:
                            item.profile
                              .type,

                          partnerId:
                            item.profile
                              .id,
                        },
                      })
                    }
                  />
                )
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SearchCard({
  item,
  theme,
  onOpen,
  onConnect,
}: {
  item:
    SearchMarketplaceItem;

  theme: {
    primary: string;
    dark: string;
    soft: string;
    border: string;
  };

  onOpen: () => void;
  onConnect: () => void;
}) {
  const profile =
    item.profile;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.profileCard,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.profileTop
        }
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
              profile.type ===
              "miller"
                ? "business-outline"
                : "leaf-outline"
            }
            size={24}
            color={
              theme.primary
            }
          />
        </View>

        <View
          style={
            styles.profileText
          }
        >
          <View
            style={
              styles.profileNameRow
            }
          >
            <Text
              style={
                styles.profileName
              }
              numberOfLines={1}
            >
              {
                profile.name
              }
            </Text>

            {profile.isVerified ? (
              <Ionicons
                name="checkmark-circle"
                size={15}
                color="#2563EB"
              />
            ) : null}
          </View>

          <Text
            style={
              styles.profileType
            }
          >
            {profile.type ===
            "miller"
              ? profile.verificationSource ===
                "PMB"
                ? "PMB REGISTERED MILLER"
                : "RICE MILLER"
              : profile.verificationSource ===
                "RESEARCH_SYNTHETIC"
              ? "RESEARCH FARMER PROFILE"
              : "FARMER"}
          </Text>

          <View
            style={
              styles.locationRow
            }
          >
            <Ionicons
              name="location-outline"
              size={13}
              color="#64748B"
            />

            <Text
              style={
                styles.locationText
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
        </View>
      </View>

      {profile.type ===
      "miller" ? (
        <View
          style={
            styles.infoStrip
          }
        >
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
              MILL
            </Text>

            <Text
              style={
                styles.infoValue
              }
              numberOfLines={1}
            >
              {
                profile.millName
              }
            </Text>
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
              REGISTRATION
            </Text>

            <Text
              style={
                styles.infoValue
              }
              numberOfLines={1}
            >
              {profile.businessRegistrationNumber ||
                "Not provided"}
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={
            styles.infoStrip
          }
        >
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
              MAIN PADDY
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {profile.mainPaddyVariety ||
                "Not provided"}
            </Text>
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
              FARM SIZE
            </Text>

            <Text
              style={
                styles.infoValue
              }
            >
              {profile.farmSizeAcres ??
                0}{" "}
              acres
            </Text>
          </View>
        </View>
      )}

      <View
        style={
          styles.actions
        }
      >
        <Pressable
          onPress={onOpen}
          style={
            styles.viewButton
          }
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={
              theme.primary
            }
          />

          <Text
            style={[
              styles.viewButtonText,

              {
                color:
                  theme.primary,
              },
            ]}
          >
            View Profile
          </Text>
        </Pressable>

        <ConnectionButton
          item={
            item
          }
          theme={
            theme
          }
          onConnect={
            onConnect
          }
          onOpen={
            onOpen
          }
        />
      </View>
    </Pressable>
  );
}

function ConnectionButton({
  item,
  theme,
  onConnect,
  onOpen,
}: {
  item:
    SearchMarketplaceItem;

  theme: {
    primary: string;
    soft: string;
  };

  onConnect: () => void;
  onOpen: () => void;
}) {
  if (
    item.connection.status ===
    "accepted"
  ) {
    return (
      <Pressable
        onPress={
          onOpen
        }
        style={[
          styles.connectButton,

          {
            backgroundColor:
              "#DCFCE7",
          },
        ]}
      >
        <Ionicons
          name="checkmark-circle"
          size={16}
          color="#166534"
        />

        <Text
          style={[
            styles.connectButtonText,

            {
              color:
                "#166534",
            },
          ]}
        >
          Connected
        </Text>
      </Pressable>
    );
  }

  if (
    item.connection.status ===
      "pending" &&
    item.connection.direction ===
      "outgoing"
  ) {
    return (
      <View
        style={[
          styles.connectButton,

          {
            backgroundColor:
              "#F1F5F9",
          },
        ]}
      >
        <Ionicons
          name="time-outline"
          size={16}
          color="#64748B"
        />

        <Text
          style={[
            styles.connectButtonText,

            {
              color:
                "#64748B",
            },
          ]}
        >
          Requested
        </Text>
      </View>
    );
  }

  if (
    item.connection.status ===
      "pending" &&
    item.connection.direction ===
      "incoming"
  ) {
    return (
      <Pressable
        onPress={
          onOpen
        }
        style={[
          styles.connectButton,

          {
            backgroundColor:
              "#FEF3C7",
          },
        ]}
      >
        <Ionicons
          name="mail-unread-outline"
          size={16}
          color="#92400E"
        />

        <Text
          style={[
            styles.connectButtonText,

            {
              color:
                "#92400E",
            },
          ]}
        >
          Respond
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={
        onConnect
      }
      style={[
        styles.connectButton,

        {
          backgroundColor:
            theme.primary,
        },
      ]}
    >
      <Ionicons
        name="person-add-outline"
        size={16}
        color="#FFFFFF"
      />

      <Text
        style={
          styles.connectWhiteText
        }
      >
        Connect
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      paddingHorizontal: 18,
      paddingTop: 15,
      paddingBottom: 15,

      backgroundColor:
        "#FFFFFF",

      borderBottomWidth: 1,
      borderBottomColor:
        "#E5E7EB",
    },

    headerEyebrow: {
      color:
        "#94A3B8",

      fontSize: 8,
      fontWeight:
        "900",

      letterSpacing:
        1.2,
    },

    headerTitle: {
      color:
        "#1F2937",

      fontSize: 22,
      fontWeight:
        "900",

      marginTop: 4,
    },

    headerSubtitle: {
      color:
        "#64748B",

      fontSize: 9.5,
      lineHeight: 15,

      maxWidth: 340,

      marginTop: 4,
    },

    loadingState: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 12,
    },

    loadingTitle: {
      color:
        "#475569",

      fontSize: 11,
      fontWeight:
        "800",
    },

    content: {
      padding: 18,

      paddingBottom:
        125,
    },

    hero: {
      borderRadius: 21,
      padding: 16,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,

      marginBottom: 15,
    },

    heroIcon: {
      width: 48,
      height: 48,

      borderRadius: 16,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.14)",
    },

    heroTitle: {
      color:
        "#FFFFFF",

      fontSize: 14,
      fontWeight:
        "900",
    },

    heroText: {
      color:
        "rgba(255,255,255,0.68)",

      fontSize: 8.5,
      lineHeight: 14,

      marginTop: 4,
    },

    searchContainer: {
      minHeight: 52,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 9,

      paddingHorizontal:
        14,

      borderRadius: 16,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    searchInput: {
      flex: 1,

      color:
        "#1F2937",

      fontSize: 10.5,
    },

    filterLabel: {
      color:
        "#64748B",

      fontSize: 8.5,
      fontWeight:
        "800",

      marginTop: 14,
    },

    districtList: {
      gap: 7,
      paddingVertical: 10,
    },

    districtChip: {
      paddingHorizontal: 13,
      paddingVertical: 8,

      borderRadius: 999,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    districtText: {
      color:
        "#64748B",

      fontSize: 8.5,
      fontWeight:
        "800",
    },

    districtTextActive: {
      color:
        "#FFFFFF",
    },

    resultHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginTop: 5,
      marginBottom: 10,
    },

    sectionTitle: {
      color:
        "#1F2937",

      fontSize: 15,
      fontWeight:
        "900",
    },

    resultCount: {
      color:
        "#94A3B8",

      fontSize: 8,
      fontWeight:
        "700",
    },

    resultList: {
      gap: 12,
    },

    profileCard: {
      borderRadius: 20,

      padding: 14,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    profileTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 11,
    },

    avatar: {
      width: 51,
      height: 51,

      borderRadius: 17,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    profileText: {
      flex: 1,
    },

    profileNameRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,
    },

    profileName: {
      flexShrink: 1,

      color:
        "#1F2937",

      fontSize: 13,
      fontWeight:
        "900",
    },

    profileType: {
      color:
        "#94A3B8",

      fontSize: 7,
      fontWeight:
        "900",

      letterSpacing:
        0.7,

      marginTop: 2,
    },

    locationRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 4,

      marginTop: 5,
    },

    locationText: {
      color:
        "#64748B",

      fontSize: 8.3,
    },

    infoStrip: {
      flexDirection:
        "row",

      gap: 10,

      padding: 11,

      marginTop: 12,

      borderRadius: 13,

      backgroundColor:
        "#F8FAFC",
    },

    infoLabel: {
      color:
        "#94A3B8",

      fontSize: 6.5,
      fontWeight:
        "800",
    },

    infoValue: {
      color:
        "#334155",

      fontSize: 8.5,
      fontWeight:
        "800",

      marginTop: 3,
    },

    actions: {
      flexDirection:
        "row",

      gap: 8,

      marginTop: 12,
    },

    viewButton: {
      flex: 1,

      minHeight: 43,

      borderRadius: 13,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 6,

      backgroundColor:
        "#F8FAFC",

      borderWidth: 1,
      borderColor:
        "#E2E8F0",
    },

    viewButtonText: {
      fontSize: 8.5,
      fontWeight:
        "900",
    },

    connectButton: {
      flex: 1,

      minHeight: 43,

      borderRadius: 13,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 6,
    },

    connectButtonText: {
      fontSize: 8.5,
      fontWeight:
        "900",
    },

    connectWhiteText: {
      color:
        "#FFFFFF",

      fontSize: 8.5,
      fontWeight:
        "900",
    },

    emptyState: {
      alignItems:
        "center",

      paddingVertical:
        55,
    },

    emptyIcon: {
      width: 70,
      height: 70,

      borderRadius: 23,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emptyTitle: {
      color:
        "#1F2937",

      fontSize: 14,
      fontWeight:
        "900",

      marginTop: 12,
    },

    emptyText: {
      color:
        "#64748B",

      fontSize: 8.5,

      marginTop: 4,
    },

    pressed: {
      opacity: 0.87,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },
  });