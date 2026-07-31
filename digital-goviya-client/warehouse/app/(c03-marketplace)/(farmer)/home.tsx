import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";

export default function FarmerHomeScreen() {
  const { user } = useMarketplaceAuth();

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good evening,</Text>

            <Text style={styles.userName}>{user?.fullName ?? "Farmer"}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              pressed && styles.profileButtonPressed,
            ]}
            onPress={() => router.push("/(c03-marketplace)/(farmer)/profile")}
          >
            <Ionicons name="person-outline" size={20} color="#15803D" />
          </Pressable>
        </View>

        <LinearGradient
          colors={["#0A331D", "#12522E", "#0B3B22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconRing}>
            <View style={styles.heroIcon}>
              <Ionicons name="leaf" size={24} color="#15803D" />
            </View>
          </View>

          <View style={styles.heroEyebrowPill}>
            <Ionicons name="sparkles" size={11} color="#F5C542" />
            <Text style={styles.heroEyebrow}>FARMER MARKETPLACE</Text>
          </View>

          <Text style={styles.heroTitle}>
            Sell paddy at a fair market price
          </Text>

          <Text style={styles.heroDescription}>
            Create listings, find suitable millers and use AI agents to
            negotiate fairly.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryShadow,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("./add-harvest")}
          >
            <LinearGradient
              colors={["#F5C542", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Ionicons name="add-circle-outline" size={19} color="#0B3B22" />
              <Text style={styles.primaryButtonText}>
                Create Paddy Listing
              </Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <View style={styles.actionGrid}>
          <ActionCard
            icon="add-circle-outline"
            title="Add Harvest"
            subtitle="Get AI price guidance"
            onPress={() => router.push("/(c03-marketplace)/(farmer)/add-harvest")}
          />

          <ActionCard
            icon="pricetag-outline"
            title="My Harvests"
            subtitle="View submitted harvests"
            onPress={() => router.push("/(c03-marketplace)/(farmer)/my-harvests")}
          />

          <ActionCard
            icon="people-outline"
            title="Matched Millers"
            subtitle="View suitable buyers"
            onPress={() => router.push("/(c03-marketplace)/(miller)/home")}
          />

          <ActionCard
            icon="chatbubble-ellipses-outline"
            title="AI Assistant"
            subtitle="Ask market questions"
            onPress={() => router.push("/(c03-marketplace)/(farmer)/home")}
          />
        </View>

        <View style={styles.demoBanner}>
          <View style={styles.demoBannerIcon}>
            <Ionicons name="checkmark-circle" size={22} color="#15803D" />
          </View>

          <View style={styles.demoBannerText}>
            <Text style={styles.demoBannerTitle}>Farmer session active</Text>

            <Text style={styles.demoBannerDescription}>
              Signed in as {user?.email}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
}: ActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed,
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={21}
          color="#15803D"
        />
      </View>

      <View style={styles.actionTextArea}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text style={styles.actionSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color="#94A3B8"
        style={styles.actionChevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },

  content: {
    padding: 20,
    paddingBottom: 34,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  greeting: {
    color: "#6B7280",
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
  },

  userName: {
    color: "#1F2937",
    fontSize: 21,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 2,
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  profileButtonPressed: {
    opacity: 0.85,
  },

  heroCard: {
    borderRadius: 26,
    padding: 22,
    marginBottom: 26,
    overflow: "hidden",
  },

  heroIconRing: {
    width: 60,
    height: 60,
    borderRadius: 18,
    padding: 3,
    backgroundColor: "rgba(245,197,66,0.16)",
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  heroEyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.25)",
  },

  heroEyebrow: {
    color: "rgba(253,230,138,0.85)",
    fontSize: 9.5,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1.2,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    lineHeight: 28,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 12,
    maxWidth: 280,
  },

  heroDescription: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Poppins_500Medium",
    marginTop: 8,
  },

  primaryShadow: {
    borderRadius: 15,
    marginTop: 18,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },

  primaryButton: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    color: "#0B3B22",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 15.5,
    fontFamily: "Poppins_700Bold",
    marginBottom: 13,
  },

  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  actionCard: {
    width: "47.8%",
    minHeight: 135,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF0ED",
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DCFCE7",
    marginBottom: 12,
  },

  actionTitle: {
    color: "#1F2937",
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
  },

  actionSubtitle: {
    color: "#6B7280",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
  },

  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 15,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginTop: 22,
  },

  demoBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  demoBannerText: {
    flex: 1,
  },

  demoBannerTitle: {
    color: "#14532D",
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
  },

  demoBannerDescription: {
    color: "#4B5563",
    fontSize: 10.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },

  actionCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },

  actionTextArea: {
    flex: 1,
  },

  actionChevron: {
    position: "absolute",
    top: 16,
    right: 14,
  },
});