import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { router, useFocusEffect } from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";

import { useLanguage } from "@/contexts/LanguageContext";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  notificationService,
} from "@/services/c03-marketplace/notification.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  MarketplaceNotification,
  MarketplaceNotificationType,
} from "@/types/c03-marketplace/notification.types";

export default function NotificationsScreen() {
  const { user } =
    useMarketplaceAuth();

  const { t, language } =
    useLanguage();

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      MarketplaceNotification[]
    >([]);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null
    );

  const isMiller =
    user?.role === "miller";

  const theme = useMemo(
    () =>
      isMiller
        ? {
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
          }
        : {
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
          },
    [isMiller]
  );

  const loadNotifications =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          setErrorMessage(
            null
          );

          if (showRefresh) {
            setRefreshing(
              true
            );
          } else {
            setLoading(true);
          }

          const response =
            await notificationService.getMine();

          setNotifications(
            response.data
          );

          setUnreadCount(
            response.unreadCount
          );
        } catch (error) {
          setErrorMessage(
            getApiErrorMessage(
              error
            )
          );
        } finally {
          setLoading(false);
          setRefreshing(
            false
          );
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications])
  );

  const markAllRead =
    async () => {
      if (
        unreadCount === 0
      ) {
        return;
      }

      try {
        await notificationService.markAllAsRead();

        setNotifications(
          (current) =>
            current.map(
              (item) => ({
                ...item,
                isRead: true,
                readAt:
                  item.readAt ??
                  new Date().toISOString(),
              })
            )
        );

        setUnreadCount(0);
      } catch (error) {
        console.error(
          "Mark all notifications failed:",
          error
        );
      }
    };

  const openNotification =
    async (
      item:
        MarketplaceNotification
    ) => {
      if (!item.isRead) {
        try {
          await notificationService.markAsRead(
            item._id
          );

          setNotifications(
            (current) =>
              current.map(
                (notification) =>
                  notification._id ===
                  item._id
                    ? {
                        ...notification,
                        isRead:
                          true,
                      }
                    : notification
              )
          );

          setUnreadCount(
            (current) =>
              Math.max(
                current - 1,
                0
              )
          );
        } catch (error) {
          console.error(
            "Notification read update failed:",
            error
          );
        }
      }

      navigateFromNotification(
        item,
        isMiller
      );
    };

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
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            {t.c3notifications.title}
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            {unreadCount > 0
              ? (unreadCount ===
                1
                  ? t.c3notifications
                      .unreadSingular
                  : t.c3notifications
                      .unreadPlural
                ).replace(
                  "{{count}}",
                  String(
                    unreadCount
                  )
                )
              : t.c3notifications
                  .allCaughtUp}
          </Text>
        </View>

        <Pressable
          disabled={
            unreadCount === 0
          }
          onPress={() =>
            void markAllRead()
          }
          style={[
            styles.readAllButton,
            {
              backgroundColor:
                theme.soft,
            },
            unreadCount === 0 &&
              styles.disabled,
          ]}
        >
          <Ionicons
            name="checkmark-done"
            size={18}
            color={
              theme.primary
            }
          />
        </Pressable>
      </View>

      {loading ? (
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
            {t.c3notifications.loadingTitle}
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
                void loadNotifications(
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
          {errorMessage ? (
            <Pressable
              onPress={() =>
                void loadNotifications()
              }
              style={
                styles.errorCard
              }
            >
              <Ionicons
                name="warning-outline"
                size={24}
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
                  {t.c3notifications.inboxUnavailable}
                </Text>

                <Text
                  style={
                    styles.errorText
                  }
                >
                  {
                    errorMessage
                  }{" "}
                  {t.c3notifications.tapToRetry}
                </Text>
              </View>
            </Pressable>
          ) : notifications.length ===
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
                  name="notifications-outline"
                  size={38}
                  color={
                    theme.primary
                  }
                />
              </View>

              <Text
                style={
                  styles.stateTitle
                }
              >
                {t.c3notifications.emptyTitle}
              </Text>

              <Text
                style={
                  styles.stateText
                }
              >
                {t.c3notifications.emptyText}
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.list
              }
            >
              {notifications.map(
                (item) => {
                  const visual =
                    getNotificationVisual(
                      item.type,
                      theme.primary,
                      theme.soft,
                      t
                    );

                  return (
                    <Pressable
                      key={
                        item._id
                      }
                      onPress={() =>
                        void openNotification(
                          item
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.card,

                        !item.isRead && {
                          backgroundColor:
                            isMiller
                              ? "#FFF9ED"
                              : "#F3FFF6",

                          borderColor:
                            theme.border,
                        },

                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          {
                            backgroundColor:
                              visual.background,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            visual.icon
                          }
                          size={21}
                          color={
                            visual.color
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.cardBody
                        }
                      >
                        <View
                          style={
                            styles.cardTop
                          }
                        >
                          <Text
                            style={
                              styles.actor
                            }
                            numberOfLines={
                              1
                            }
                          >
                            {
                              item.actorName
                            }
                          </Text>

                          <Text
                            style={
                              styles.time
                            }
                          >
                            {formatTimeAgo(
                              item.createdAt,
                              t
                            )}
                          </Text>
                        </View>

                        <Text
                          style={
                            styles.title
                          }
                        >
                          {language ===
                          "si"
                            ? item
                                .title
                                .sinhala
                            : item
                                .title
                                .english}
                        </Text>

                        <Text
                          style={
                            styles.message
                          }
                          numberOfLines={
                            3
                          }
                        >
                          {language ===
                          "si"
                            ? item
                                .message
                                .sinhala
                            : item
                                .message
                                .english}
                        </Text>

                        <View
                          style={
                            styles.cardBottom
                          }
                        >
                          <View
                            style={[
                              styles.typeBadge,
                              {
                                backgroundColor:
                                  visual.background,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeText,
                                {
                                  color:
                                    visual.color,
                                },
                              ]}
                            >
                              {
                                visual.label
                              }
                            </Text>
                          </View>

                          {!item.isRead ? (
                            <View
                              style={[
                                styles.unreadDot,
                                {
                                  backgroundColor:
                                    theme.primary,
                                },
                              ]}
                            />
                          ) : null}
                        </View>
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#94A3B8"
                      />
                    </Pressable>
                  );
                }
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function navigateFromNotification(
  notification:
    MarketplaceNotification,
  isMiller: boolean
) {
  const type =
    notification.type;

  if (
    type === "NEGOTIATION_AGREED" ||
    type === "NEGOTIATION_FAILED" ||
    type === "CONTACT_REQUEST" ||
    type === "CONTACT_ACCEPTED" ||
    type === "CONTACT_REJECTED"
  ) {
    if (
      notification.relatedNegotiationCode
    ) {
      router.push({
        pathname:
          "/(c03-marketplace)/negotiation-result",
        params: {
          negotiationId:
            notification.relatedNegotiationCode,
        },
      });

      return;
    }
  }

  if (isMiller) {
    router.push(
      "/(c03-marketplace)/(miller)/received-match-requests"
    );

    return;
  }

  router.push(
    "/(c03-marketplace)/(farmer)/my-match-requests"
  );
}

function getNotificationVisual(
  type:
    MarketplaceNotificationType,
  primary: string,
  soft: string,
  t: any
): {
  icon:
    keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
  label: string;
} {
  switch (type) {
    case "MATCH_REQUEST":
      return {
        icon:
          "people-outline",
        color:
          primary,
        background:
          soft,
        label:
          t.c3notifications
            .matchRequest,
      };

    case "MATCH_ACCEPTED":
      return {
        icon:
          "checkmark-circle-outline",
        color:
          "#15803D",
        background:
          "#DCFCE7",
        label:
          t.c3notifications
            .accepted,
      };

    case "MATCH_REJECTED":
      return {
        icon:
          "close-circle-outline",
        color:
          "#B91C1C",
        background:
          "#FEE2E2",
        label:
          t.c3notifications
            .declined,
      };

    case "NEGOTIATION_READY":
      return {
        icon:
          "sparkles-outline",
        color:
          "#7C3AED",
        background:
          "#EDE9FE",
        label:
          t.c3notifications
            .aiReady,
      };

    case "NEGOTIATION_AGREED":
      return {
        icon:
          "trophy-outline",
        color:
          "#15803D",
        background:
          "#DCFCE7",
        label:
          t.c3notifications
            .agreement,
      };

    case "NEGOTIATION_FAILED":
      return {
        icon:
          "analytics-outline",
        color:
          "#B45309",
        background:
          "#FEF3C7",
        label:
          t.c3notifications
            .negotiation,
      };

    case "CONTACT_REQUEST":
      return {
        icon:
          "call-outline",
        color:
          "#0369A1",
        background:
          "#E0F2FE",
        label:
          t.c3notifications
            .contactRequest,
      };

    case "CONTACT_ACCEPTED":
      return {
        icon:
          "logo-whatsapp",
        color:
          "#15803D",
        background:
          "#DCFCE7",
        label:
          t.c3notifications
            .contactUnlocked,
      };

    case "CONTACT_REJECTED":
      return {
        icon:
          "ban-outline",
        color:
          "#B91C1C",
        background:
          "#FEE2E2",
        label:
          t.c3notifications
            .contactDeclined,
      };

    default:
      return {
        icon:
          "notifications-outline",
        color:
          primary,
        background:
          soft,
        label:
          t.c3notifications
            .update,
      };
  }
}

function formatTimeAgo(
  dateString: string,
  t: any
): string {
  const created =
    new Date(
      dateString
    ).getTime();

  const now =
    Date.now();

  const seconds =
    Math.max(
      Math.floor(
        (now -
          created) /
          1000
      ),
      0
    );

  if (seconds < 60) {
    return t.c3notifications.justNow;
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  if (days < 7) {
    return `${days}d`;
  }

  return new Date(
    dateString
  ).toLocaleDateString(
    "en-LK",
    {
      month: "short",
      day: "numeric",
    }
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    header: {
      minHeight: 72,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
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
      width: 41,
      height: 41,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
      backgroundColor:
        "#F3F4F6",
    },

    headerText: {
      flex: 1,
    },

    headerTitle: {
      color:
        "#1F2937",
      fontSize: 18,
      fontWeight:
        "900",
    },

    headerSubtitle: {
      color:
        "#6B7280",
      fontSize: 9.5,
      marginTop: 2,
    },

    readAllButton: {
      width: 41,
      height: 41,
      borderRadius: 14,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    content: {
      padding: 17,
      paddingBottom: 120,
    },

    centerState: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      gap: 14,
    },

    emptyState: {
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 90,
      paddingHorizontal: 28,
    },

    emptyIcon: {
      width: 82,
      height: 82,
      borderRadius: 27,
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 16,
    },

    stateTitle: {
      color:
        "#1F2937",
      fontSize: 17,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    stateText: {
      color:
        "#64748B",
      fontSize: 10,
      lineHeight: 17,
      textAlign:
        "center",
      marginTop: 7,
      maxWidth: 280,
    },

    errorCard: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
      padding: 15,
      borderRadius: 18,
      backgroundColor:
        "#FEF2F2",
      borderWidth: 1,
      borderColor:
        "#FECACA",
    },

    errorTitle: {
      color:
        "#991B1B",
      fontSize: 11,
      fontWeight:
        "900",
    },

    errorText: {
      color:
        "#B91C1C",
      fontSize: 9,
      lineHeight: 14,
      marginTop: 2,
    },

    list: {
      gap: 11,
    },

    card: {
      minHeight: 118,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 11,
      padding: 14,
      borderRadius: 19,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
    },

    iconBox: {
      width: 45,
      height: 45,
      borderRadius: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
      alignSelf:
        "flex-start",
    },

    cardBody: {
      flex: 1,
    },

    cardTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      gap: 8,
    },

    actor: {
      flex: 1,
      color:
        "#334155",
      fontSize: 8.5,
      fontWeight:
        "800",
    },

    time: {
      color:
        "#94A3B8",
      fontSize: 7.5,
    },

    title: {
      color:
        "#1F2937",
      fontSize: 11.5,
      fontWeight:
        "900",
      marginTop: 5,
    },

    message: {
      color:
        "#64748B",
      fontSize: 9,
      lineHeight: 14,
      marginTop: 4,
    },

    cardBottom: {
      minHeight: 22,
      flexDirection:
        "row",
      alignItems:
        "center",
      justifyContent:
        "space-between",
      marginTop: 8,
    },

    typeBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    typeText: {
      fontSize: 7,
      fontWeight:
        "900",
    },

    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    pressed: {
      opacity: 0.84,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    disabled: {
      opacity: 0.42,
    },
  });