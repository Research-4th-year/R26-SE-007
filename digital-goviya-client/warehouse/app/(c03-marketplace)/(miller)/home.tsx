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

export default function MillerHomeScreen() {
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

            <Text style={styles.userName}>{user?.fullName ?? "Miller"}</Text>
          </View>

          <Pressable
            style={styles.profileButton}
            onPress={() => router.push("/(c03-marketplace)/(miller)/profile")}
          >
            <Ionicons name="person-outline" size={21} color="#B45309" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="business" size={28} color="#FFFFFF" />
          </View>

          <Text style={styles.heroEyebrow}>MILLER MARKETPLACE</Text>

          <Text style={styles.heroTitle}>
            Find quality paddy from trusted farmers
          </Text>

          <Text style={styles.heroDescription}>
            Browse matched listings and use your AI miller agent to negotiate
            within your purchasing budget.
          </Text>

          <Pressable
            onPress={() => router.push("./create-demand")}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Ionicons name="add-circle-outline" size={20} color="#78350F" />

            <Text style={styles.primaryButtonText}>Create Paddy Demand</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <View style={styles.actionGrid}>
          <ActionCard
            icon="add-circle-outline"
            title="Create Demand"
            subtitle="Publish requirement"
            onPress={() => router.push("./create-demand")}
          />

          <ActionCard
            icon="document-text-outline"
            title="My Demands"
            subtitle="View active requests"
            onPress={() => router.push("./my-demands")}
          />

          <ActionCard
            icon="leaf-outline"
            title="Matched Harvests"
            subtitle="Explore sellers"
            onPress={() => {
              // Connect after matching UI is created.
            }}
          />

          <ActionCard
            icon="chatbubble-ellipses-outline"
            title="AI Assistant"
            subtitle="Ask market questions"
            onPress={() => router.push("/(c03-marketplace)/(miller)/home")}
          />
        </View>

        <View style={styles.demoBanner}>
          <View style={styles.demoBannerIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#B45309" />
          </View>

          <View style={styles.demoBannerText}>
            <Text style={styles.demoBannerTitle}>Miller session active</Text>

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
        pressed &&
          styles.actionCardPressed,
      ]}
    >
      <View style={styles.actionIcon}>
        <Ionicons
          name={icon}
          size={22}
          color="#B45309"
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
        color="#D6B98A"
        style={styles.actionChevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFBF5",
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
    borderColor: "#F3E8D5",
  },

  heroCard: {
    borderRadius: 25,
    backgroundColor: "#78350F",
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
    maxWidth: 295,
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
    color: "#78350F",
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
    borderColor: "#F3E8D5",
    padding: 15,
  },

  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
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
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
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
    color: "#78350F",
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
