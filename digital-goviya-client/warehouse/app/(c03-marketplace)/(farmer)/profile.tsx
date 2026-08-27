import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { router } from "expo-router";
import {
  Alert,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import type { FarmerProfile } from "@/types/c03-marketplace/auth.types";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";

import { useLanguage } from "@/contexts/LanguageContext";
import { MarketplaceAppearanceSettings } from "@/components/c03-marketplace/MarketplaceAppearanceSettings";
import { useMarketplaceAppearance } from "@/contexts/c03-marketplace/MarketplaceAppearanceContext";

export default function FarmerProfileScreen() {
  const { user, profile, signOut } = useMarketplaceAuth();

  const { t } = useLanguage();
  const { isDark } = useMarketplaceAppearance();

  const farmerProfile =
    user?.role === "farmer" ? (profile as FarmerProfile) : null;

  async function handleLogout(): Promise<void> {
    try {
      await signOut();

      router.replace("/(c03-marketplace)/(auth)/login");
    } catch (error) {
      console.error("Farmer logout failed:", error);

      Alert.alert(
        t.c3profile.logoutFailed,
        t.c3profile.logoutFailedMessage,
      );
    }
  }

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  // Entrance animation — matches the fade/rise used across the app
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView
      style={[
        styles.screen,
        isDark && { backgroundColor: "#0F172A" },
      ]}
    >
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{
          opacity: fade,
          transform: [{ translateY: rise }],
        }}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.c3profile.goBack}
            style={({ pressed }) => [
              styles.headerButton,
              isDark && { backgroundColor: "#1E293B" },
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={isDark ? "#F8FAFC" : "#1F2937"}
            />
          </Pressable>

          <Text
            style={[
              styles.headerTitle,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            {t.c3profile.title}
          </Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.profileCardShadow}>
          <LinearGradient
            colors={["#0A331D", "#14532D", "#166534"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Ionicons
                  name="leaf"
                  size={30}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <Text style={styles.name}>
              {user?.fullName}
            </Text>

            <View style={styles.roleBadge}>
              <Ionicons
                name="shield-checkmark"
                size={11}
                color="#854D0E"
              />

              <Text style={styles.roleText}>
                {t.c3profile.verifiedFarmer}
              </Text>
            </View>

            <Text style={styles.email}>
              {user?.username}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBox}>
            <Ionicons
              name="person-outline"
              size={16}
              color="#15803D"
            />
          </View>

          <Text
            style={[
              styles.sectionTitle,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            {t.c3profile.personalInformation}
          </Text>
        </View>

        <View
          style={[
            styles.detailsCard,
            isDark && {
              backgroundColor: "#1E293B",
              borderColor: "#334155",
            },
          ]}
        >
          <ProfileRow
            icon="call-outline"
            label={t.c3profile.phone}
            value={
              user?.phone ??
              t.c3profile.notProvided
            }
          />

          <ProfileRow
            icon="location-outline"
            label={t.c3profile.district}
            value={translateDistrict(
              farmerProfile?.district,
              t.c3districts,
              t.c3profile.notProvided
            )}
          />

          <ProfileRow
            icon="navigate-outline"
            label={t.c3profile.location}
            value={
              farmerProfile?.location ??
              t.c3profile.notProvided
            }
          />

          <ProfileRow
            icon="business-outline"
            label={t.c3profile.farm}
            value={
              farmerProfile?.farmName ??
              t.c3profile.notProvided
            }
          />

          <ProfileRow
            icon="resize-outline"
            label={t.c3profile.farmSize}
            value={`${farmerProfile?.farmSizeAcres ?? 0} ${t.c3profile.acres}`}
          />

          <ProfileRow
            icon="leaf-outline"
            label={t.c3profile.mainVariety}
            value={
              farmerProfile?.mainPaddyVariety
                ? translatePaddyType(
                    farmerProfile.mainPaddyVariety,
                    t
                  )
                : t.c3profile.notProvided
            }
            isLast
          />
        </View>

        <MarketplaceAppearanceSettings
          accent="#15803D"
          accentSoft="#DCFCE7"
        />

        <View style={styles.securityHeaderRow}>
          <View style={styles.securitySectionIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#15803D"
            />
          </View>

          <Text
            style={[
              styles.sectionTitle,
              isDark && { color: "#F8FAFC" },
            ]}
          >
            {t.c3profile.accountSecurity}
          </Text>
        </View>

        <View
          style={[
            styles.securityCard,
            isDark && {
              backgroundColor: "#1E293B",
              borderColor: "#334155",
            },
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.securityAction,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push(
                "/(c03-marketplace)/(auth)/change-password",
              )
            }
          >
            <View style={styles.securityActionIcon}>
              <Ionicons
                name="key-outline"
                size={20}
                color="#15803D"
              />
            </View>

            <View style={styles.securityActionText}>
              <Text
                style={[
                  styles.securityActionTitle,
                  isDark && { color: "#F8FAFC" },
                ]}
              >
                {t.c3profile.changePassword}
              </Text>

              <Text style={styles.securityActionSubtitle}>
                {t.c3profile.changePasswordDescription}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color="#94A3B8"
            />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#B91C1C"
          />

          <Text style={styles.logoutText}>
            {t.c3profile.signOut}
          </Text>
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function translatePaddyType(
  value: string,
  t: any
): string {
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
  fallback: string
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

interface ProfileRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}

function ProfileRow({
  icon,
  label,
  value,
  isLast,
}: ProfileRowProps) {
  const { isDark } = useMarketplaceAppearance();
  return (
    <View
      style={[
        styles.profileRow,
        isLast && styles.profileRowLast,
      ]}
    >
      <View style={styles.rowIcon}>
        <Ionicons
          name={icon}
          size={19}
          color="#15803D"
        />
      </View>

      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            isDark && { color: "#94A3B8" },
          ]}
        >
          {label}
        </Text>

        <Text
          style={[
            styles.rowValue,
            isDark && { color: "#F8FAFC" },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },

  content: {
    padding: 20,
    paddingBottom: 120,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  headerTitle: {
    color: "#1F2937",
    fontSize: 17,
    fontFamily: "Poppins_800ExtraBold",
  },

  headerPlaceholder: {
    width: 42,
  },

  profileCardShadow: {
    borderRadius: 26,
    marginBottom: 25,
    shadowColor: "#14532D",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  profileCard: {
    alignItems: "center",
    borderRadius: 26,
    padding: 26,
  },

  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },

  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 14,
  },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    backgroundColor: "#FDE68A",
    marginTop: 9,
  },

  roleText: {
    color: "#854D0E",
    fontSize: 9,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.8,
  },

  email: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 10,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  sectionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },

  detailsCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF0ED",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  profileRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F1",
  },

  profileRowLast: {
    borderBottomWidth: 0,
  },

  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  rowText: {
    flex: 1,
  },

  rowLabel: {
    color: "#6B7280",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },

  rowValue: {
    color: "#1F2937",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    marginTop: 3,
  },

  logoutButton: {
    height: 53,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 22,
  },

  logoutText: {
    color: "#B91C1C",
    fontSize: 13,
    fontFamily: "Poppins_800ExtraBold",
  },

  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.97 }],
  },

  securityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 25,
    marginBottom: 12,
  },

  securitySectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  securityCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF0ED",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  securityAction: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 15,
  },

  securityActionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
  },

  securityActionText: {
    flex: 1,
  },

  securityActionTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  securityActionSubtitle: {
    color: "#6B7280",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },
});