import { Ionicons } from "@expo/vector-icons";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import type { MillerProfile } from "@/types/c03-marketplace/auth.types";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";

export default function MillerProfileScreen() {
  const { user, profile, signOut } = useMarketplaceAuth();

  const millerProfile =
    user?.role === "miller" ? (profile as MillerProfile) : null;

  async function handleLogout(): Promise<void> {
    try {
      await signOut();

      router.replace("/(c03-marketplace)/(auth)/login");
    } catch (error) {
      console.error("Miller logout failed:", error);

      Alert.alert(
        "Logout failed",
        "The session could not be removed. Please try again.",
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
    <SafeAreaView style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fade, transform: [{ translateY: rise }] }}
      >
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color="#16241C" />
          </Pressable>

          <Text style={styles.headerTitle}>Miller Profile</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.profileCardShadow}>
          <LinearGradient
            colors={["#5C3009", "#78350F", "#92400E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCard}
          >
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Ionicons name="business" size={30} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.name}>{user?.fullName}</Text>

            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark" size={11} color="#78350F" />
              <Text style={styles.roleText}>VERIFIED MILLER</Text>
            </View>

            <Text style={styles.email}>{user?.username}</Text>
          </LinearGradient>
        </View>

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="person-outline" size={16} color="#92400E" />
          </View>
          <Text style={styles.sectionTitle}>Personal information</Text>
        </View>

        <View style={styles.detailsCard}>
          <ProfileRow
            icon="call-outline"
            label="Phone"
            value={user?.phone ?? "Not provided"}
          />

          <ProfileRow
            icon="location-outline"
            label="District"
            value={millerProfile?.district ?? "Not provided"}
          />

          <ProfileRow
            icon="navigate-outline"
            label="Location"
            value={millerProfile?.location ?? "Not provided"}
          />

          <ProfileRow
            icon="business-outline"
            label="Rice mill"
            value={millerProfile?.millName ?? "Not provided"}
          />

          <ProfileRow
            icon="document-text-outline"
            label="Registration number"
            value={millerProfile?.businessRegistrationNumber || "Not provided"}
          />

          <ProfileRow
            icon="scale-outline"
            label="Purchasing capacity"
            value={`${millerProfile?.purchasingCapacityKg ?? 0} kg`}
            isLast
          />
        </View>

        <View style={styles.securityHeaderRow}>
          <View style={styles.securitySectionIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#92400E"
            />
          </View>

          <Text style={styles.sectionTitle}>Account & security</Text>
        </View>

        <View style={styles.securityCard}>
          <Pressable
            style={({ pressed }) => [
              styles.securityAction,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push("/(c03-marketplace)/(auth)/change-password")
            }
          >
            <View style={styles.securityActionIcon}>
              <Ionicons name="key-outline" size={20} color="#92400E" />
            </View>

            <View style={styles.securityActionText}>
              <Text style={styles.securityActionTitle}>Change password</Text>

              <Text style={styles.securityActionSubtitle}>
                Update your marketplace account password
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={19} color="#A89F8B" />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#B91C1C" />

          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

interface ProfileRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}

function ProfileRow({ icon, label, value, isLast }: ProfileRowProps) {
  return (
    <View style={[styles.profileRow, isLast && styles.profileRowLast]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color="#92400E" />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const CREAM = "#FBF8F1";
const CARD_BORDER = "#ECE6D6";
const INK = "#16241C";
const INK_MUTED = "#7A7364";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CREAM,
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
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  headerTitle: {
    color: INK,
    fontSize: 17,
    fontFamily: "Poppins_800ExtraBold",
  },

  headerPlaceholder: {
    width: 42,
  },

  profileCardShadow: {
    borderRadius: 26,
    marginBottom: 25,
    shadowColor: "#78350F",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
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
    color: "#78350F",
    fontSize: 9,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.8,
  },

  email: {
    color: "rgba(255,255,255,0.68)",
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
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    color: INK,
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },

  detailsCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  profileRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F2E8",
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
    backgroundColor: "#FEF3C7",
  },

  rowText: {
    flex: 1,
  },

  rowLabel: {
    color: INK_MUTED,
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },

  rowValue: {
    color: INK,
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
  backgroundColor: "#FEF3C7",
},

securityCard: {
  borderRadius: 20,
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: CARD_BORDER,
  shadowColor: "#5C4A24",
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
  backgroundColor: "#FEF3C7",
},

securityActionText: {
  flex: 1,
},

securityActionTitle: {
  color: INK,
  fontSize: 13,
  fontFamily: "Poppins_700Bold",
},

securityActionSubtitle: {
  color: INK_MUTED,
  fontSize: 9,
  fontFamily: "Poppins_500Medium",
  marginTop: 3,
},
});
