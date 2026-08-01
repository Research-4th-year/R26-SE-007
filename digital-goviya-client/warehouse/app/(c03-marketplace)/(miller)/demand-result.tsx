import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const CREAM = "#FBF8F1";
const CARD_BORDER = "#ECE6D6";
const INK = "#16241C";
const INK_MUTED = "#7A7364";

export default function DemandResultScreen() {
  const params = useLocalSearchParams();

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  // Entrance animation — presentation only, mirrors the other marketplace screens.
  const cardsFade = useRef(new Animated.Value(0)).current;
  const cardsRise = useRef(new Animated.Value(16)).current;
  const checkScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.parallel([
      Animated.timing(cardsFade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(cardsRise, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
        delay: 100,
      }),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const status = String(params.status ?? "open");
  const statusStyle = getStatusStyle(status);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity: cardsFade,
            transform: [{ translateY: cardsRise }],
          }}
        >
          {/* Success hero */}
          <LinearGradient
            colors={["#92400E", "#78350F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Animated.View
              style={[
                styles.checkRing,
                { transform: [{ scale: checkScale }] },
              ]}
            >
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={34} color="#16A34A" />
              </View>
            </Animated.View>

            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={12} color="#78350F" />
              <Text style={styles.heroBadgeText}>Demand submitted</Text>
            </View>

            <Text style={styles.heroTitle}>Demand Published</Text>

            <Text style={styles.heroSubtitle}>
              Your requirement is now visible to the marketplace and ready
              for AI-based matching against farmer harvests.
            </Text>
          </LinearGradient>

          {/* Ticket perforation — signature motif shared across the marketplace */}
          <View style={styles.perforationRow}>
            <View style={styles.perforationNotchLeft} />
            <View style={styles.perforationLine} />
            <View style={styles.perforationNotchRight} />
          </View>

          {/* Receipt-style summary card */}
          <View style={styles.ticketCard}>
            <View style={styles.ticketNotchLeft} />
            <View style={styles.ticketNotchRight} />

            <View style={styles.ticketHeaderRow}>
              <View style={styles.ticketHeaderIcon}>
                <Ionicons name="document-text-outline" size={16} color="#92400E" />
              </View>
              <Text style={styles.ticketHeaderText}>Demand summary</Text>

              <View style={[styles.statusPill, { backgroundColor: statusStyle.background }]}>
                <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                <Text style={[styles.statusPillText, { color: statusStyle.text }]}>
                  {formatLabel(status)}
                </Text>
              </View>
            </View>

            <View style={styles.dashedDivider} />

            <InfoRow
              icon="leaf-outline"
              label="Paddy type"
              value={formatLabel(String(params.paddyType ?? ""))}
            />

            <InfoRow
              icon="cube-outline"
              label="Quantity needed"
              value={`${formatNumber(params.quantityNeeded)} kg`}
            />

            <InfoRow
              icon="cash-outline"
              label="Offered price"
              value={`LKR ${formatNumber(params.offeredPrice)}/kg`}
              last
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.replace("./my-demands")}
            style={styles.primaryShadow}
          >
            <LinearGradient
              colors={["#FDE68A", "#F5C542"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Ionicons name="document-text-outline" size={18} color="#78350F" />
              <Text style={styles.primaryButtonText}>View My Demands</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Pressable
            onPress={() => router.replace("./create-demand")}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add-circle-outline" size={17} color="#92400E" />
            <Text style={styles.secondaryButtonText}>Publish Another Demand</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}

function InfoRow({ icon, label, value, last }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIconBox}>
        <Ionicons name={icon} size={15} color="#92400E" />
      </View>

      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function formatLabel(value: string): string {
  return value
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatNumber(value: unknown): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return String(value ?? "-");
  }

  return new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}

function getStatusStyle(status: string): { background: string; text: string } {
  switch (status) {
    case "open":
      return { background: "#FEF3C7", text: "#92400E" };
    case "negotiation_ready":
      return { background: "#DBEAFE", text: "#1D4ED8" };
    case "negotiating":
      return { background: "#FDE68A", text: "#78350F" };
    case "agreement_reached":
      return { background: "#D1FAE5", text: "#065F46" };
    case "negotiation_failed":
    case "rejected":
      return { background: "#FEE2E2", text: "#B91C1C" };
    case "cancelled":
      return { background: "#F1EEE4", text: "#7A7364" };
    default:
      return { background: "#F1EEE4", text: "#7A7364" };
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: CREAM,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  // Hero
  hero: {
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 26,
    alignItems: "center",
    overflow: "hidden",
  },

  checkRing: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  checkCircle: {
    width: 66,
    height: 66,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5C542",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },

  heroBadgeText: {
    color: "#78350F",
    fontSize: 10.5,
    fontFamily: "Poppins_700Bold",
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
  },

  heroSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12.5,
    lineHeight: 19,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },

  // Ticket perforation
  perforationRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 16,
  },

  perforationLine: {
    flex: 1,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D8CFB8",
    marginHorizontal: -6,
  },

  perforationNotchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CREAM,
    marginLeft: -8,
  },

  perforationNotchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: CREAM,
    marginRight: -8,
  },

  // Receipt-style ticket card
  ticketCard: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: "#5C4A24",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  ticketNotchLeft: {
    position: "absolute",
    top: -1,
    left: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },

  ticketNotchRight: {
    position: "absolute",
    top: -1,
    right: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },

  ticketHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  ticketHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  ticketHeaderText: {
    flex: 1,
    color: INK,
    fontSize: 12.5,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.3,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  statusPillText: {
    fontSize: 8.5,
    fontFamily: "Poppins_700Bold",
  },

  dashedDivider: {
    height: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#EFEADA",
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F2E8",
  },

  infoIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#FAFAF7",
    alignItems: "center",
    justifyContent: "center",
  },

  infoLabel: {
    flex: 1,
    color: INK_MUTED,
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
  },

  infoValue: {
    color: INK,
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  // Primary CTA
  primaryShadow: {
    borderRadius: 16,
    marginTop: 22,
    shadowColor: "#D97706",
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  primaryButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 16,
  },

  primaryButtonText: {
    color: "#78350F",
    fontSize: 14.5,
    fontFamily: "Poppins_800ExtraBold",
  },

  // Secondary action
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 50,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: "#92400E",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});