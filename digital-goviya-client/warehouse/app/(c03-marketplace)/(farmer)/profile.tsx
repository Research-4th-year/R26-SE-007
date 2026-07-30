import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  FarmerProfile,
} from "@/types/c03-marketplace/auth.types";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";

export default function FarmerProfileScreen() {
  const { user, profile, signOut } = useMarketplaceAuth();

  const farmerProfile =
  user?.role === "farmer"
    ? (profile as FarmerProfile)
    : null;

  async function handleLogout(): Promise<void> {
    try {
      await signOut();

      router.replace("/(c03-marketplace)/(auth)/login");
    } catch (error) {
      console.error("Farmer logout failed:", error);

      Alert.alert(
        "Logout failed",
        "The session could not be removed. Please try again.",
      );
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={21} color="#1F2937" />
          </Pressable>

          <Text style={styles.headerTitle}>Farmer Profile</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="leaf" size={34} color="#FFFFFF" />
          </View>

          <Text style={styles.name}>{user?.fullName}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>VERIFIED FARMER</Text>
          </View>

          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Personal information</Text>

        <View style={styles.detailsCard}>
          <ProfileRow
            icon="call-outline"
            label="Phone"
            value={user?.phone ?? "Not provided"}
          />

          <ProfileRow
            icon="location-outline"
            label="District"
            value={farmerProfile?.district ?? "Not provided"}
          />

          <ProfileRow
            icon="navigate-outline"
            label="Location"
            value={farmerProfile?.location ?? "Not provided"}
          />

          <ProfileRow
            icon="business-outline"
            label="Farm"
            value={farmerProfile?.farmName ?? "Not provided"}
          />

          <ProfileRow
            icon="resize-outline"
            label="Farm size"
            value={`${farmerProfile?.farmSizeAcres ?? 0} acres`}
          />

          <ProfileRow
            icon="leaf-outline"
            label="Main variety"
            value={farmerProfile?.mainPaddyVariety ?? "Not provided"}
            isLast
          />
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#B91C1C" />

          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
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
        <Ionicons name={icon} size={19} color="#15803D" />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
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
    paddingBottom: 40,
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
  },

  headerTitle: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "800",
  },

  headerPlaceholder: {
    width: 42,
  },

  profileCard: {
    alignItems: "center",
    borderRadius: 24,
    padding: 24,
    backgroundColor: "#14532D",
    marginBottom: 25,
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
    fontWeight: "800",
    marginTop: 13,
  },

  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FDE68A",
    marginTop: 7,
  },

  roleText: {
    color: "#854D0E",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  email: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    marginTop: 9,
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },

  detailsCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF0ED",
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
  },

  rowValue: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "700",
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
    fontWeight: "800",
  },
});
