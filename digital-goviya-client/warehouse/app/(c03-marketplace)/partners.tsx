import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  Modal,
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
  partnerService,
} from "@/services/c03-marketplace/partner.service";

import {
  connectionService,
} from "@/services/c03-marketplace/connection.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  PartnerListItem,
} from "@/types/c03-marketplace/partner.types";

import type {
  MyConnectionItem,
} from "@/types/c03-marketplace/connection.types";

type PartnerTab =
  | "connected"
  | "requests"
  | "trade";

type Theme = {
  primary: string;
  dark: string;
  soft: string;
  border: string;
  page: string;
};

export default function PartnersScreen() {
  const {
    user,
  } = useMarketplaceAuth();

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<PartnerTab>(
      "connected"
    );

  const [
    connections,
    setConnections,
  ] =
    useState<
      MyConnectionItem[]
    >([]);

  const [
    requests,
    setRequests,
  ] =
    useState<
      MyConnectionItem[]
    >([]);

  const [
    tradePartners,
    setTradePartners,
  ] =
    useState<
      PartnerListItem[]
    >([]);

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    actionId,
    setActionId,
  ] =
    useState<
      string | null
    >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(null);

  const [
    selectedOutgoingRequest,
    setSelectedOutgoingRequest,
  ] =
    useState<
      MyConnectionItem | null
    >(null);

  const [
    cancellingRequest,
    setCancellingRequest,
  ] = useState(false);

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

  const loadAll =
    useCallback(
      async (
        refresh = false
      ) => {
        try {
          setErrorMessage(
            null
          );

          if (refresh) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          const [
            acceptedResponse,
            requestResponse,
            tradeResponse,
          ] =
            await Promise.all([
              connectionService
                .getMyConnections(
                  "accepted"
                ),

              connectionService
                .getMyConnections(
                  "pending"
                ),

              partnerService
                .getMyPartners(),
            ]);

          setConnections(
            Array.isArray(
              acceptedResponse.data
            )
              ? acceptedResponse.data
              : []
          );

          setRequests(
            Array.isArray(
              requestResponse.data
            )
              ? requestResponse.data
              : []
          );

          setTradePartners(
            Array.isArray(
              tradeResponse.data
            )
              ? tradeResponse.data
              : []
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

          setRefreshing(
            false
          );
        }
      },
      []
    );

  useFocusEffect(
    useCallback(
      () => {
        void loadAll();
      },
      [loadAll]
    )
  );

  async function respondToRequest(
    item:
      MyConnectionItem,

    decision:
      | "accepted"
      | "rejected"
  ) {
    try {
      setActionId(
        item.connectionId
      );

      await connectionService.respond(
        item.connectionId,
        decision
      );

      if (
        decision ===
        "accepted"
      ) {
        Alert.alert(
          "Connection accepted",
          `${item.partner.name} is now in your marketplace network.`
        );
      }

      await loadAll();
    } catch (
      error
    ) {
      Alert.alert(
        "Unable to respond",
        getApiErrorMessage(
          error
        )
      );
    } finally {
      setActionId(
        null
      );
    }
  }

  async function cancelRequest() {
    if (
      !selectedOutgoingRequest
    ) {
      return;
    }

    try {
      setCancellingRequest(
        true
      );

      await connectionService.cancelRequest(
        selectedOutgoingRequest.connectionId
      );

      const partnerName =
        selectedOutgoingRequest.partner.name;

      setSelectedOutgoingRequest(
        null
      );

      Alert.alert(
        "Request cancelled",
        `Your connection request to ${partnerName} has been cancelled.`
      );

      await loadAll();
    } catch (
      error
    ) {
      Alert.alert(
        "Unable to cancel request",
        getApiErrorMessage(
          error
        )
      );
    } finally {
      setCancellingRequest(
        false
      );
    }
  }

  function openPartner(
    partnerType:
      "farmer" |
      "miller",

    partnerId:
      string
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

  function openPublicProfile(
    item:
      MyConnectionItem
  ) {
    setSelectedOutgoingRequest(
      null
    );

    router.push({
      pathname:
        "/(c03-marketplace)/public-profile" as any,

      params: {
        partnerType:
          item.partner.type,

        partnerId:
          item.partner.id,
      },
    });
  }

  const query =
    searchQuery
      .trim()
      .toLowerCase();

  const visibleConnections =
    useMemo(
      () =>
        connections.filter(
          (item) =>
            matchesSearch(
              item.partner,
              query
            )
        ),
      [
        connections,
        query,
      ]
    );

  const visibleRequests =
    useMemo(
      () =>
        requests.filter(
          (item) =>
            matchesSearch(
              item.partner,
              query
            )
        ),
      [
        requests,
        query,
      ]
    );

  const visibleTrades =
    useMemo(
      () =>
        tradePartners.filter(
          (item) =>
            matchesSearch(
              item.partner,
              query
            )
        ),
      [
        tradePartners,
        query,
      ]
    );

  const incomingCount =
    requests.filter(
      (item) =>
        item.direction ===
        "incoming"
    ).length;

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
            Loading your network
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            Checking connections,
            requests and trading
            history.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.headerEyebrow
            }
          >
            MARKETPLACE NETWORK
          </Text>

          <Text
            style={
              styles.headerTitle
            }
          >
            Partners
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            Manage trusted marketplace
            connections and trading
            relationships.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              refreshing
            }
            onRefresh={() =>
              void loadAll(
                true
              )
            }
            tintColor={
              theme.primary
            }
            colors={[
              theme.primary,
            ]}
          />
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
            styles.hero
          }
        >
          <View
            style={
              styles.heroTop
            }
          >
            <View
              style={
                styles.heroIcon
              }
            >
              <Ionicons
                name="people"
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
                  styles.heroEyebrow
                }
              >
                TRUSTED NETWORK
              </Text>

              <Text
                style={
                  styles.heroTitle
                }
              >
                Your trading relationships
              </Text>
            </View>
          </View>

          <View
            style={
              styles.statsRow
            }
          >
            <Stat
              label="Connected"
              value={
                connections.length
              }
            />

            <Stat
              label="Requests"
              value={
                requests.length
              }
            />

            <Stat
              label="Incoming"
              value={
                incomingCount
              }
            />

            <Stat
              label="Trade partners"
              value={
                tradePartners.length
              }
            />
          </View>
        </LinearGradient>

        <View
          style={
            styles.tabBar
          }
        >
          <TabButton
            label="Connected"
            icon="people-outline"
            selected={
              activeTab ===
              "connected"
            }
            badge={
              connections.length
            }
            theme={
              theme
            }
            onPress={() =>
              setActiveTab(
                "connected"
              )
            }
          />

          <TabButton
            label="Requests"
            icon="mail-unread-outline"
            selected={
              activeTab ===
              "requests"
            }
            badge={
              incomingCount
            }
            theme={
              theme
            }
            onPress={() =>
              setActiveTab(
                "requests"
              )
            }
          />

          <TabButton
            label="Trade"
            icon="receipt-outline"
            selected={
              activeTab ===
              "trade"
            }
            badge={
              tradePartners.length
            }
            theme={
              theme
            }
            onPress={() =>
              setActiveTab(
                "trade"
              )
            }
          />
        </View>

        <View
          style={
            styles.searchBox
          }
        >
          <Ionicons
            name="search-outline"
            size={18}
            color="#64748B"
          />

          <TextInput
            value={
              searchQuery
            }
            onChangeText={
              setSearchQuery
            }
            placeholder={
              isFarmer
                ? "Search miller, district or location..."
                : "Search farmer, district or location..."
            }
            placeholderTextColor="#94A3B8"
            style={
              styles.searchInput
            }
          />

          {searchQuery ? (
            <Pressable
              onPress={() =>
                setSearchQuery(
                  ""
                )
              }
            >
              <Ionicons
                name="close-circle"
                size={19}
                color="#94A3B8"
              />
            </Pressable>
          ) : null}
        </View>

        {errorMessage ? (
          <Pressable
            style={
              styles.errorCard
            }
            onPress={() =>
              void loadAll()
            }
          >
            <Ionicons
              name="warning-outline"
              size={23}
              color="#B91C1C"
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.errorTitle
                }
              >
                Unable to load network
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {errorMessage}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {activeTab ===
        "connected" ? (
          <ConnectedSection
            items={
              visibleConnections
            }
            theme={
              theme
            }
            onOpen={
              openPartner
            }
          />
        ) : null}

        {activeTab ===
        "requests" ? (
          <RequestsSection
            items={
              visibleRequests
            }
            actionId={
              actionId
            }
            theme={
              theme
            }
            onRespond={
              respondToRequest
            }
            onOpen={
              openPartner
            }
            onOutgoingPress={
              setSelectedOutgoingRequest
            }
          />
        ) : null}

        {activeTab ===
        "trade" ? (
          <TradeSection
            items={
              visibleTrades
            }
            theme={
              theme
            }
            onOpen={
              openPartner
            }
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={
          Boolean(
            selectedOutgoingRequest
          )
        }
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() =>
          setSelectedOutgoingRequest(
            null
          )
        }
      >
        <Pressable
          style={
            styles.modalOverlay
          }
          onPress={() =>
            setSelectedOutgoingRequest(
              null
            )
          }
        >
          <Pressable
            onPress={() => {}}
            style={
              styles.requestPopup
            }
          >
            {selectedOutgoingRequest ? (
              <>
                <View
                  style={
                    styles.popupHandle
                  }
                />

                <View
                  style={
                    styles.popupHeader
                  }
                >
                  <View
                    style={[
                      styles.popupIcon,
                      {
                        backgroundColor:
                          theme.soft,
                      },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={24}
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
                        styles.popupTitle
                      }
                    >
                      Connection request
                    </Text>

                    <Text
                      style={
                        styles.popupSubtitle
                      }
                    >
                      Waiting for response
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setSelectedOutgoingRequest(
                        null
                      )
                    }
                    style={
                      styles.popupClose
                    }
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color="#64748B"
                    />
                  </Pressable>
                </View>

                <View
                  style={
                    styles.popupPartnerCard
                  }
                >
                  <PartnerIdentity
                    partner={
                      selectedOutgoingRequest.partner
                    }
                    theme={
                      theme
                    }
                  />
                </View>

                <View
                  style={
                    styles.popupInfo
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#64748B"
                  />

                  <Text
                    style={
                      styles.popupInfoText
                    }
                  >
                    Your request was sent on{" "}
                    {formatDate(
                      selectedOutgoingRequest.requestedAt
                    )}
                    . The other party has not
                    responded yet. You can cancel
                    the request while it is pending.
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.popupPrimaryButton,
                    {
                      backgroundColor:
                        theme.primary,
                    },
                  ]}
                  onPress={() =>
                    openPublicProfile(
                      selectedOutgoingRequest
                    )
                  }
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.popupPrimaryText
                    }
                  >
                    View Profile
                  </Text>
                </Pressable>

                <Pressable
                  disabled={
                    cancellingRequest
                  }
                  style={[
                    styles.popupCancelButton,
                    cancellingRequest &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    Alert.alert(
                      "Cancel request?",
                      `Do you want to cancel your connection request to ${selectedOutgoingRequest.partner.name}?`,
                      [
                        {
                          text:
                            "Keep request",

                          style:
                            "cancel",
                        },

                        {
                          text:
                            "Cancel request",

                          style:
                            "destructive",

                          onPress:
                            () =>
                              void cancelRequest(),
                        },
                      ]
                    )
                  }
                >
                  {cancellingRequest ? (
                    <ActivityIndicator
                      size="small"
                      color="#B91C1C"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="close-circle-outline"
                        size={18}
                        color="#B91C1C"
                      />

                      <Text
                        style={
                          styles.popupCancelText
                        }
                      >
                        Cancel Request
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function ConnectedSection({
  items,
  theme,
  onOpen,
}: {
  items:
    MyConnectionItem[];

  theme:
    Theme;

  onOpen: (
    type:
      "farmer" |
      "miller",
    id:
      string
  ) => void;
}) {
  return (
    <View>
      <SectionHeader
        title="Connected partners"
        subtitle={`${items.length} marketplace connection${
          items.length === 1
            ? ""
            : "s"
        }`}
      />

      {items.length ===
      0 ? (
        <EmptyState
          icon="people-outline"
          title="No connections yet"
          text="Use Search to discover Farmers or Millers and send a connection request."
          theme={
            theme
          }
        />
      ) : (
        <View
          style={
            styles.list
          }
        >
          {items.map(
            (item) => (
              <Pressable
                key={
                  item.connectionId
                }
                onPress={() =>
                  onOpen(
                    item.partner.type,
                    item.partner.id
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.connectionCard,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <PartnerIdentity
                  partner={
                    item.partner
                  }
                  theme={
                    theme
                  }
                />

                <View
                  style={
                    styles.badgeRow
                  }
                >
                  <Badge
                    icon="checkmark-circle"
                    text="Connected"
                    background="#DCFCE7"
                    color="#166534"
                  />

                  <Badge
                    icon="call-outline"
                    text="Contact unlocked"
                    background="#EFF6FF"
                    color="#1D4ED8"
                  />
                </View>

                <View
                  style={
                    styles.cardFooter
                  }
                >
                  <Text
                    style={
                      styles.cardFooterText
                    }
                  >
                    Connected{" "}
                    {formatDate(
                      item.respondedAt ||
                        item.requestedAt
                    )}
                  </Text>

                  <View
                    style={
                      styles.openRow
                    }
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
                      View partner
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={
                        theme.primary
                      }
                    />
                  </View>
                </View>
              </Pressable>
            )
          )}
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
  items:
    MyConnectionItem[];

  actionId:
    string | null;

  theme:
    Theme;

  onRespond: (
    item:
      MyConnectionItem,
    decision:
      | "accepted"
      | "rejected"
  ) => void;

  onOpen: (
    type:
      "farmer" |
      "miller",
    id:
      string
  ) => void;

  onOutgoingPress: (
    item:
      MyConnectionItem
  ) => void;
}) {
  const incoming =
    items.filter(
      (item) =>
        item.direction ===
        "incoming"
    );

  const outgoing =
    items.filter(
      (item) =>
        item.direction ===
        "outgoing"
    );

  if (
    items.length === 0
  ) {
    return (
      <>
        <SectionHeader
          title="Connection requests"
          subtitle="Incoming and outgoing requests"
        />

        <EmptyState
          icon="mail-outline"
          title="No pending requests"
          text="New connection requests will appear here."
          theme={
            theme
          }
        />
      </>
    );
  }

  return (
    <View>
      {incoming.length >
      0 ? (
        <>
          <SectionHeader
            title="Incoming requests"
            subtitle={`${incoming.length} waiting for your response`}
          />

          <View
            style={
              styles.list
            }
          >
            {incoming.map(
              (item) => {
                const busy =
                  actionId ===
                  item.connectionId;

                return (
                  <View
                    key={
                      item.connectionId
                    }
                    style={
                      styles.requestCard
                    }
                  >
                    <Pressable
                      onPress={() =>
                        onOpen(
                          item.partner.type,
                          item.partner.id
                        )
                      }
                    >
                      <PartnerIdentity
                        partner={
                          item.partner
                        }
                        theme={
                          theme
                        }
                      />
                    </Pressable>

                    <View
                      style={
                        styles.requestMessage
                      }
                    >
                      <Ionicons
                        name="person-add-outline"
                        size={16}
                        color={
                          theme.primary
                        }
                      />

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
                        disabled={
                          busy
                        }
                        style={[
                          styles.rejectButton,
                          busy &&
                            styles.disabledButton,
                        ]}
                        onPress={() =>
                          onRespond(
                            item,
                            "rejected"
                          )
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
                        disabled={
                          busy
                        }
                        style={[
                          styles.acceptButton,
                          {
                            backgroundColor:
                              theme.primary,
                          },
                          busy &&
                            styles.disabledButton,
                        ]}
                        onPress={() =>
                          onRespond(
                            item,
                            "accepted"
                          )
                        }
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
                              size={17}
                              color="#FFFFFF"
                            />

                            <Text
                              style={
                                styles.acceptText
                              }
                            >
                              Accept
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        </>
      ) : null}

      {outgoing.length >
      0 ? (
        <>
          <SectionHeader
            title="Sent requests"
            subtitle={`${outgoing.length} waiting for a response`}
          />

          <View
            style={
              styles.list
            }
          >
            {outgoing.map(
              (item) => (
                <Pressable
                  key={
                    item.connectionId
                  }
                  onPress={() =>
                    onOutgoingPress(
                      item
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.connectionCard,

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <PartnerIdentity
                    partner={
                      item.partner
                    }
                    theme={
                      theme
                    }
                  />

                  <View
                    style={
                      styles.pendingBox
                    }
                  >
                    <Ionicons
                      name="time-outline"
                      size={17}
                      color="#64748B"
                    />

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.pendingTitle
                        }
                      >
                        Request sent
                      </Text>

                      <Text
                        style={
                          styles.pendingText
                        }
                      >
                        Waiting for their response
                        since{" "}
                        {formatDate(
                          item.requestedAt
                        )}
                      </Text>
                    </View>

                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color="#64748B"
                    />
                  </View>
                </Pressable>
              )
            )}
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
  items:
    PartnerListItem[];

  theme:
    Theme;

  onOpen: (
    type:
      "farmer" |
      "miller",
    id:
      string
  ) => void;
}) {
  return (
    <View>
      <SectionHeader
        title="Trade partners"
        subtitle="Partners from successful AI negotiations"
      />

      {items.length ===
      0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No trade partners yet"
          text="Successful AI negotiations will automatically appear here."
          theme={
            theme
          }
        />
      ) : (
        <View
          style={
            styles.list
          }
        >
          {items.map(
            (item) => (
              <Pressable
                key={
                  item.partner.id
                }
                onPress={() =>
                  onOpen(
                    item.partner.type,
                    item.partner.id
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.tradeCard,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <PartnerIdentity
                  partner={
                    item.partner
                  }
                  theme={
                    theme
                  }
                />

                <View
                  style={
                    styles.badgeRow
                  }
                >
                  {item.relationship
                    ?.connected ? (
                    <Badge
                      icon="people"
                      text="Connected"
                      background="#DCFCE7"
                      color="#166534"
                    />
                  ) : null}

                  {item.isFavorite ? (
                    <Badge
                      icon="star"
                      text="Favourite"
                      background="#FEF3C7"
                      color="#92400E"
                    />
                  ) : null}
                </View>

                <View
                  style={
                    styles.metrics
                  }
                >
                  <Metric
                    label="Trades"
                    value={String(
                      item.summary
                        .totalAgreements
                    )}
                  />

                  <Metric
                    label="Quantity"
                    value={`${formatNumber(
                      item.summary
                        .totalQuantityKg
                    )} kg`}
                  />

                  <Metric
                    label="Avg price"
                    value={formatCurrency(
                      item.summary
                        .averageAgreedPrice
                    )}
                  />
                </View>

                <View
                  style={
                    styles.cardFooter
                  }
                >
                  <Text
                    style={
                      styles.cardFooterText
                    }
                  >
                    Last trade:{" "}
                    {formatDate(
                      item.summary
                        .lastTransactionAt
                    )}
                  </Text>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={
                      theme.primary
                    }
                  />
                </View>
              </Pressable>
            )
          )}
        </View>
      )}
    </View>
  );
}

function PartnerIdentity({
  partner,
  theme,
}: {
  partner: {
    type:
      "farmer" |
      "miller";

    name:
      string;

    district:
      string;

    location:
      string;
  };

  theme:
    Theme;
}) {
  return (
    <View
      style={
        styles.partnerTop
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
            partner.type ===
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
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.partnerName
          }
          numberOfLines={1}
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
            size={13}
            color="#64748B"
          />

          <Text
            style={
              styles.partnerLocation
            }
            numberOfLines={1}
          >
            {partner.district}
            {" • "}
            {partner.location}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title:
    string;

  subtitle:
    string;
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

function TabButton({
  label,
  icon,
  selected,
  badge,
  theme,
  onPress,
}: {
  label:
    string;

  icon:
    keyof typeof Ionicons.glyphMap;

  selected:
    boolean;

  badge:
    number;

  theme:
    Theme;

  onPress:
    () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={[
        styles.tabButton,

        selected && {
          backgroundColor:
            theme.dark,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={
          selected
            ? "#FFFFFF"
            : "#64748B"
        }
      />

      <Text
        style={[
          styles.tabText,

          selected &&
            styles.tabTextSelected,
        ]}
      >
        {label}
      </Text>

      {badge > 0 ? (
        <View
          style={[
            styles.tabBadge,

            selected && {
              backgroundColor:
                "rgba(255,255,255,0.18)",
            },
          ]}
        >
          <Text
            style={[
              styles.tabBadgeText,

              selected && {
                color:
                  "#FFFFFF",
              },
            ]}
          >
            {badge > 99
              ? "99+"
              : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Badge({
  icon,
  text,
  background,
  color,
}: {
  icon:
    keyof typeof Ionicons.glyphMap;

  text:
    string;

  background:
    string;

  color:
    string;
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
        color={
          color
        }
      />

      <Text
        style={[
          styles.badgeText,
          {
            color,
          },
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
  icon:
    keyof typeof Ionicons.glyphMap;

  title:
    string;

  text:
    string;

  theme:
    Theme;
}) {
  return (
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
          name={icon}
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
        {title}
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function Stat({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <View
      style={
        styles.stat
      }
    >
      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.statLabel
        }
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
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricValue
        }
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function matchesSearch(
  partner: {
    name:
      string;

    district:
      string;

    location:
      string;
  },
  query:
    string
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
    .includes(
      query
    );
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
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
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

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      paddingHorizontal:
        18,

      paddingTop:
        13,

      paddingBottom:
        14,

      backgroundColor:
        "#FFFFFF",

      borderBottomWidth:
        1,

      borderBottomColor:
        "#E5E7EB",
    },

    headerEyebrow: {
      color:
        "#94A3B8",

      fontSize:
        7.5,

      fontWeight:
        "900",

      letterSpacing:
        1.2,
    },

    headerTitle: {
      color:
        "#1F2937",

      fontSize:
        21,

      fontWeight:
        "900",

      marginTop:
        2,
    },

    headerSubtitle: {
      color:
        "#64748B",

      fontSize:
        9,

      lineHeight:
        14,

      marginTop:
        3,
    },

    content: {
      padding:
        17,

      paddingBottom:
        125,
    },

    centerState: {
      flex: 1,

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
        12,
    },

    stateText: {
      color:
        "#64748B",

      fontSize:
        9,

      lineHeight:
        15,

      textAlign:
        "center",

      marginTop:
        5,
    },

    hero: {
      borderRadius:
        23,

      padding:
        17,

      marginBottom:
        14,
    },

    heroTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,
    },

    heroIcon: {
      width:
        47,

      height:
        47,

      borderRadius:
        15,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.13)",
    },

    heroEyebrow: {
      color:
        "#FDE68A",

      fontSize:
        7,

      fontWeight:
        "900",

      letterSpacing:
        1,
    },

    heroTitle: {
      color:
        "#FFFFFF",

      fontSize:
        14,

      fontWeight:
        "900",

      marginTop:
        3,
    },

    statsRow: {
      flexDirection:
        "row",

      gap:
        6,

      marginTop:
        15,
    },

    stat: {
      flex: 1,

      alignItems:
        "center",

      paddingVertical:
        8,

      borderRadius:
        12,

      backgroundColor:
        "rgba(255,255,255,0.1)",
    },

    statValue: {
      color:
        "#FFFFFF",

      fontSize:
        14,

      fontWeight:
        "900",
    },

    statLabel: {
      color:
        "rgba(255,255,255,0.68)",

      fontSize:
        6.5,

      fontWeight:
        "700",

      marginTop:
        2,
    },

    tabBar: {
      flexDirection:
        "row",

      gap:
        6,

      padding:
        5,

      borderRadius:
        17,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",

      marginBottom:
        12,
    },

    tabButton: {
      flex: 1,

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
        4,
    },

    tabText: {
      color:
        "#64748B",

      fontSize:
        7.5,

      fontWeight:
        "900",
    },

    tabTextSelected: {
      color:
        "#FFFFFF",
    },

    tabBadge: {
      minWidth:
        17,

      height:
        17,

      paddingHorizontal:
        4,

      borderRadius:
        9,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#F1F5F9",
    },

    tabBadgeText: {
      color:
        "#64748B",

      fontSize:
        6.5,

      fontWeight:
        "900",
    },

    searchBox: {
      minHeight:
        48,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,

      paddingHorizontal:
        13,

      borderRadius:
        15,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",

      marginBottom:
        16,
    },

    searchInput: {
      flex: 1,

      color:
        "#1F2937",

      fontSize:
        10,

      paddingVertical:
        0,
    },

    sectionHeader: {
      marginBottom:
        10,

      marginTop:
        3,
    },

    sectionTitle: {
      color:
        "#1F2937",

      fontSize:
        14,

      fontWeight:
        "900",
    },

    sectionSubtitle: {
      color:
        "#94A3B8",

      fontSize:
        8,

      marginTop:
        2,
    },

    list: {
      gap:
        11,

      marginBottom:
        18,
    },

    connectionCard: {
      padding:
        14,

      borderRadius:
        19,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",
    },

    requestCard: {
      padding:
        14,

      borderRadius:
        19,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",
    },

    tradeCard: {
      padding:
        14,

      borderRadius:
        19,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",
    },

    partnerTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,
    },

    avatar: {
      width:
        48,

      height:
        48,

      borderRadius:
        16,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    partnerName: {
      color:
        "#1F2937",

      fontSize:
        12.5,

      fontWeight:
        "900",
    },

    locationRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        3,

      marginTop:
        4,
    },

    partnerLocation: {
      flex: 1,

      color:
        "#64748B",

      fontSize:
        8,
    },

    badgeRow: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        5,

      marginTop:
        10,
    },

    badge: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        4,

      paddingHorizontal:
        8,

      paddingVertical:
        5,

      borderRadius:
        999,
    },

    badgeText: {
      fontSize:
        7,

      fontWeight:
        "900",
    },

    cardFooter: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginTop:
        12,

      paddingTop:
        11,

      borderTopWidth:
        1,

      borderTopColor:
        "#F1F5F9",
    },

    cardFooterText: {
      color:
        "#94A3B8",

      fontSize:
        7.5,
    },

    openRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        3,
    },

    openText: {
      fontSize:
        7.5,

      fontWeight:
        "900",
    },

    requestMessage: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        7,

      padding:
        10,

      borderRadius:
        12,

      backgroundColor:
        "#F8FAFC",

      marginTop:
        11,
    },

    requestMessageText: {
      flex: 1,

      color:
        "#64748B",

      fontSize:
        8,

      lineHeight:
        13,
    },

    requestActions: {
      flexDirection:
        "row",

      gap:
        8,

      marginTop:
        11,
    },

    rejectButton: {
      flex: 1,

      minHeight:
        43,

      borderRadius:
        13,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FEF2F2",

      borderWidth:
        1,

      borderColor:
        "#FECACA",
    },

    rejectText: {
      color:
        "#B91C1C",

      fontSize:
        8.5,

      fontWeight:
        "900",
    },

    acceptButton: {
      flex:
        1.4,

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
        5,
    },

    acceptText: {
      color:
        "#FFFFFF",

      fontSize:
        8.5,

      fontWeight:
        "900",
    },

    pendingBox: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        8,

      padding:
        10,

      borderRadius:
        12,

      backgroundColor:
        "#F1F5F9",

      marginTop:
        11,
    },

    pendingTitle: {
      color:
        "#475569",

      fontSize:
        8.5,

      fontWeight:
        "900",
    },

    pendingText: {
      color:
        "#64748B",

      fontSize:
        7.5,

      marginTop:
        2,
    },

    metrics: {
      flexDirection:
        "row",

      gap:
        7,

      padding:
        10,

      borderRadius:
        13,

      backgroundColor:
        "#F8FAFC",

      marginTop:
        11,
    },

    metricLabel: {
      color:
        "#94A3B8",

      fontSize:
        6.5,

      fontWeight:
        "700",
    },

    metricValue: {
      color:
        "#1F2937",

      fontSize:
        8.5,

      fontWeight:
        "900",

      marginTop:
        2,
    },

    emptyState: {
      alignItems:
        "center",

      paddingVertical:
        45,

      paddingHorizontal:
        25,

      borderRadius:
        18,

      backgroundColor:
        "#FFFFFF",

      borderWidth:
        1,

      borderColor:
        "#E5E7EB",
    },

    emptyIcon: {
      width:
        64,

      height:
        64,

      borderRadius:
        21,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emptyTitle: {
      color:
        "#1F2937",

      fontSize:
        13,

      fontWeight:
        "900",

      marginTop:
        10,
    },

    emptyText: {
      color:
        "#64748B",

      fontSize:
        8.5,

      lineHeight:
        14,

      textAlign:
        "center",

      marginTop:
        4,
    },

    errorCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      padding:
        13,

      borderRadius:
        16,

      backgroundColor:
        "#FEF2F2",

      borderWidth:
        1,

      borderColor:
        "#FECACA",

      marginBottom:
        13,
    },

    errorTitle: {
      color:
        "#991B1B",

      fontSize:
        10,

      fontWeight:
        "900",
    },

    errorText: {
      color:
        "#B91C1C",

      fontSize:
        8,

      marginTop:
        2,
    },

    modalOverlay: {
      flex:
        1,

      justifyContent:
        "flex-end",

      backgroundColor:
        "rgba(15,23,42,0.45)",
    },

    requestPopup: {
      backgroundColor:
        "#FFFFFF",

      borderTopLeftRadius:
        28,

      borderTopRightRadius:
        28,

      paddingHorizontal:
        18,

      paddingTop:
        10,

      paddingBottom:
        28,

      shadowColor:
        "#000000",

      shadowOpacity:
        0.2,

      shadowRadius:
        20,

      shadowOffset: {
        width:
          0,

        height:
          -5,
      },

      elevation:
        20,
    },

    popupHandle: {
      alignSelf:
        "center",

      width:
        40,

      height:
        4,

      borderRadius:
        999,

      backgroundColor:
        "#CBD5E1",

      marginBottom:
        16,
    },

    popupHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        11,
    },

    popupIcon: {
      width:
        48,

      height:
        48,

      borderRadius:
        15,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    popupTitle: {
      color:
        "#1F2937",

      fontSize:
        15,

      fontWeight:
        "900",
    },

    popupSubtitle: {
      color:
        "#64748B",

      fontSize:
        8.5,

      marginTop:
        2,
    },

    popupClose: {
      width:
        38,

      height:
        38,

      borderRadius:
        12,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#F1F5F9",
    },

    popupPartnerCard: {
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

      marginTop:
        16,
    },

    popupInfo: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        8,

      padding:
        12,

      borderRadius:
        14,

      backgroundColor:
        "#F8FAFC",

      marginTop:
        11,
    },

    popupInfoText: {
      flex:
        1,

      color:
        "#64748B",

      fontSize:
        8.5,

      lineHeight:
        14,
    },

    popupPrimaryButton: {
      minHeight:
        50,

      borderRadius:
        15,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        7,

      marginTop:
        15,
    },

    popupPrimaryText: {
      color:
        "#FFFFFF",

      fontSize:
        9.5,

      fontWeight:
        "900",
    },

    popupCancelButton: {
      minHeight:
        50,

      borderRadius:
        15,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        7,

      backgroundColor:
        "#FEF2F2",

      borderWidth:
        1,

      borderColor:
        "#FECACA",

      marginTop:
        8,
    },

    popupCancelText: {
      color:
        "#B91C1C",

      fontSize:
        9.5,

      fontWeight:
        "900",
    },

    disabledButton: {
      opacity:
        0.55,
    },

    pressed: {
      opacity:
        0.84,

      transform: [
        {
          scale:
            0.99,
        },
      ],
    },
  });