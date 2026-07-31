import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";

export default function FarmerHomeScreen() {
  const { user } = useMarketplaceAuth();

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
            style={styles.profileButton}
            onPress={() => router.push("/(c03-marketplace)/(farmer)/profile")}
          >
            <Ionicons name="person-outline" size={21} color="#15803D" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="leaf" size={28} color="#FFFFFF" />
          </View>

          <Text style={styles.heroEyebrow}>FARMER MARKETPLACE</Text>

          <Text style={styles.heroTitle}>
            Sell paddy at a fair market price
          </Text>

          <Text style={styles.heroDescription}>
            Create listings, find suitable millers and use AI agents to
            negotiate fairly.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("./add-harvest")}
          >
            <Ionicons name="add-circle-outline" size={20} color="#14532D" />

            <Text style={styles.primaryButtonText}>Create Paddy Listing</Text>
          </Pressable>
        </View>

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
            <Ionicons name="checkmark-circle" size={24} color="#15803D" />
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
          size={22}
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
        size={18}
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
    marginBottom: 20,
  },

  greeting: {
    color: "#6B7280",
    fontSize: 13,
  },

  userName: {
    color: "#1F2937",
    fontSize: 22,
    fontWeight: "800",
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
  },

  heroCard: {
    borderRadius: 25,
    backgroundColor: "#14532D",
    padding: 21,
    marginBottom: 25,
  },

  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: 15,
  },

  heroEyebrow: {
    color: "#FDE68A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 29,
    fontWeight: "800",
    marginTop: 8,
    maxWidth: 280,
  },

  heroDescription: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  primaryButton: {
    height: 50,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FDE68A",
    marginTop: 18,
  },

  primaryButtonText: {
    color: "#14532D",
    fontSize: 13,
    fontWeight: "800",
  },

  sectionTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontWeight: "800",
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
    fontSize: 13,
    fontWeight: "800",
  },

  actionSubtitle: {
    color: "#6B7280",
    fontSize: 11,
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
    fontSize: 13,
    fontWeight: "800",
  },

  demoBannerDescription: {
    color: "#4B5563",
    fontSize: 11,
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
