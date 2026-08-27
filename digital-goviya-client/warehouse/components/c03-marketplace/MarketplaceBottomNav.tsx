import {
  Ionicons,
} from "@expo/vector-icons";

import {
  router,
  usePathname,
} from "expo-router";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  useLanguage,
} from "@/contexts/LanguageContext";

interface NavigationItem {
  key:
    | "home"
    | "search"
    | "marketplace"
    | "partners"
    | "profile";

  label: string;

  icon:
    keyof typeof Ionicons.glyphMap;

  activeIcon:
    keyof typeof Ionicons.glyphMap;

  route: string;

  activeWhen:
    string[];
}

export function MarketplaceBottomNav() {
  const {
    user,
    isAuthenticated,
    isLoading,
  } =
    useMarketplaceAuth();

  const { t } =
    useLanguage();

  const pathname =
    usePathname();

  const insets =
    useSafeAreaInsets();

  if (
    isLoading ||
    !isAuthenticated ||
    !user
  ) {
    return null;
  }

  if (
    pathname.includes(
      "/login"
    ) ||
    pathname.includes(
      "/register"
    ) ||
    pathname.includes(
      "/change-password"
    ) ||
    pathname.includes("/assistant") ||
    user.mustChangePassword
  ) {
    return null;
  }

  const isFarmer =
    user.role === "farmer";

  const primaryColor =
    isFarmer
      ? "#15803D"
      : "#92400E";

  const darkColor =
    isFarmer
      ? "#14532D"
      : "#78350F";

  const activeBackground =
    isFarmer
      ? "#DCFCE7"
      : "#FEF3C7";

  const items:
    NavigationItem[] = [
      {
        key:
          "home",

        label:
          t.c3bottomNav.home,

        icon:
          "home-outline",

        activeIcon:
          "home",

        route:
          isFarmer
            ? "/(c03-marketplace)/(farmer)/home"
            : "/(c03-marketplace)/(miller)/home",

        activeWhen: [
          isFarmer
            ? "/(farmer)/home"
            : "/(miller)/home",
        ],
      },

      {
        key:
          "search",

        label:
          t.c3bottomNav.search,

        icon:
          "search-outline",

        activeIcon:
          "search",

        route:
          "/(c03-marketplace)/search",

        activeWhen: [
          "/search",
          "/public-profile",
        ],
      },

      {
        key:
          "marketplace",

        label:
          isFarmer
            ? t.c3bottomNav.harvests
            : t.c3bottomNav.demands,

        icon:
          isFarmer
            ? "leaf-outline"
            : "storefront-outline",

        activeIcon:
          isFarmer
            ? "leaf"
            : "storefront",

        route:
          isFarmer
            ? "/(c03-marketplace)/(farmer)/my-harvests"
            : "/(c03-marketplace)/(miller)/my-demands",

        activeWhen:
          isFarmer
            ? [
                "/(farmer)/my-harvests",
                "/(farmer)/add-harvest",
                "/(farmer)/harvest-result",
                "/(farmer)/matched-millers",
              ]
            : [
                "/(miller)/my-demands",
                "/(miller)/create-demand",
                "/(miller)/demand-result",
                "/(miller)/matched-farmers",
              ],
      },

      {
        key:
          "partners",

        label:
          t.c3bottomNav.partners,

        icon:
          "people-outline",

        activeIcon:
          "people",

        route:
          "/(c03-marketplace)/partners",

        activeWhen: [
          "/partners",
          "/partner-detail",
        ],
      },

      {
        key:
          "profile",

        label:
          t.c3bottomNav.profile,

        icon:
          "person-outline",

        activeIcon:
          "person",

        route:
          isFarmer
            ? "/(c03-marketplace)/(farmer)/profile"
            : "/(c03-marketplace)/(miller)/profile",

        activeWhen: [
          isFarmer
            ? "/(farmer)/profile"
            : "/(miller)/profile",
        ],
      },
    ];

  function isActive(
    item:
      NavigationItem
  ) {
    return item.activeWhen.some(
      (part) =>
        pathname.includes(
          part
        )
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,

        {
          paddingBottom:
            Math.max(
              insets.bottom,
              8
            ),
        },
      ]}
    >
      <View
        style={
          styles.navigationContainer
        }
      >
        {items.map(
          (item) => {
            const active =
              isActive(
                item
              );

            return (
              <Pressable
                key={
                  item.key
                }
                accessibilityRole="button"
                accessibilityLabel={
                  item.label
                }
                onPress={() => {
                  if (active) {
                    return;
                  }

                  router.replace(
                    item.route as never
                  );
                }}
                style={({
                  pressed,
                }) => [
                  styles.navigationItem,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,

                    active && {
                      backgroundColor:
                        activeBackground,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      active
                        ? item.activeIcon
                        : item.icon
                    }
                    size={21}
                    color={
                      active
                        ? primaryColor
                        : "#8A9490"
                    }
                  />
                </View>

                <Text
                  numberOfLines={
                    1
                  }
                  style={[
                    styles.navigationLabel,

                    active && {
                      color:
                        darkColor,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }
        )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    wrapper: {
      position:
        "absolute",

      left: 0,
      right: 0,
      bottom: 0,

      paddingHorizontal:
        13,

      zIndex: 100,
    },

    navigationContainer: {
      minHeight: 68,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-around",

      borderRadius: 23,

      paddingHorizontal:
        5,

      paddingVertical:
        7,

      backgroundColor:
        "#FFFFFF",

      borderWidth: 1,

      borderColor:
        "#E5E7EB",

      shadowColor:
        "#000000",

      shadowOpacity:
        0.12,

      shadowRadius:
        18,

      shadowOffset: {
        width: 0,
        height: -4,
      },

      elevation: 12,
    },

    navigationItem: {
      flex: 1,

      alignItems:
        "center",

      justifyContent:
        "center",

      minHeight: 54,
    },

    iconContainer: {
      minWidth: 38,

      height: 32,

      borderRadius: 12,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    navigationLabel: {
      color:
        "#8A9490",

      fontSize: 8,

      fontWeight:
        "700",

      marginTop: 2,
    },

    pressed: {
      opacity: 0.72,

      transform: [
        {
          scale: 0.96,
        },
      ],
    },
  });