import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
} from "expo-router";

import {
  useMemo,
} from "react";

import {
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

export default function PartnersScreen() {
  const {
    user,
  } = useMarketplaceAuth();

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

              page:
                "#F8FAF8",

              border:
                "#BBF7D0",
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

              border:
                "#FDE68A",
            },
      [isFarmer]
    );

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
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
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
              Trading Partners
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              {isFarmer
                ? "Millers you have traded with"
                : "Farmers you have traded with"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.heroCard,

            {
              backgroundColor:
                theme.dark,
            },
          ]}
        >
          <View
            style={
              styles.heroIcon
            }
          >
            <Ionicons
              name="people"
              size={30}
              color="#FFFFFF"
            />
          </View>

          <Text
            style={
              styles.heroEyebrow
            }
          >
            TRADING NETWORK
          </Text>

          <Text
            style={
              styles.heroTitle
            }
          >
            Build trusted marketplace relationships
          </Text>

          <Text
            style={
              styles.heroDescription
            }
          >
            Your successful trading
            partners will appear here,
            together with negotiation
            history, prices and previous
            transactions.
          </Text>
        </View>

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
              name={
                isFarmer
                  ? "business-outline"
                  : "leaf-outline"
              }
              size={35}
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
            Partner history is coming next
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            We will now connect this
            screen to your successful AI
            negotiations and display real
            trading partners automatically.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    content: {
      padding: 20,

      paddingBottom:
        120,
    },

    header: {
      minHeight: 62,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,

      marginBottom:
        18,
    },

    headerButton: {
      width: 42,
      height: 42,

      borderRadius:
        14,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#E5E7EB",
    },

    headerTitle: {
      color:
        "#1F2937",

      fontSize: 19,

      fontWeight:
        "900",
    },

    headerSubtitle: {
      color:
        "#6B7280",

      fontSize: 10,

      marginTop: 2,
    },

    heroCard: {
      borderRadius:
        25,

      padding: 21,
    },

    heroIcon: {
      width: 52,
      height: 52,

      borderRadius:
        17,

      alignItems:
        "center",

      justifyContent:
        "center",

      backgroundColor:
        "rgba(255,255,255,0.14)",

      marginBottom:
        15,
    },

    heroEyebrow: {
      color:
        "#FDE68A",

      fontSize: 9,

      fontWeight:
        "900",

      letterSpacing:
        1.2,
    },

    heroTitle: {
      color:
        "#FFFFFF",

      fontSize: 21,

      lineHeight: 28,

      fontWeight:
        "900",

      marginTop: 7,
    },

    heroDescription: {
      color:
        "rgba(255,255,255,0.68)",

      fontSize: 11,

      lineHeight: 18,

      marginTop: 8,
    },

    emptyState: {
      alignItems:
        "center",

      paddingHorizontal:
        24,

      paddingVertical:
        58,
    },

    emptyIcon: {
      width: 82,
      height: 82,

      borderRadius:
        27,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    emptyTitle: {
      color:
        "#1F2937",

      fontSize: 16,

      fontWeight:
        "900",

      textAlign:
        "center",

      marginTop: 17,
    },

    emptyText: {
      color:
        "#64748B",

      fontSize: 10,

      lineHeight: 17,

      textAlign:
        "center",

      maxWidth: 290,

      marginTop: 7,
    },
  });