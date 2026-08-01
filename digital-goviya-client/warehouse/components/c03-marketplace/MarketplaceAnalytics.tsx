import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface AnalyticsItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

interface MarketplaceAnalyticsProps {
  title: string;
  subtitle: string;
  items: AnalyticsItem[];
  theme: "farmer" | "miller";
  loading?: boolean;
}

export function MarketplaceAnalytics({
  title,
  subtitle,
  items,
  theme,
  loading = false,
}: MarketplaceAnalyticsProps) {
  const isFarmer = theme === "farmer";

  const accent = isFarmer
    ? "#15803D"
    : "#92400E";

  const softBackground = isFarmer
    ? "#ECFDF5"
    : "#FFFBEB";

  const border = isFarmer
    ? "#BBF7D0"
    : "#FDE68A";

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: border,
          backgroundColor: softBackground,
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={accent}
          />
        ) : (
          <View
            style={[
              styles.liveBadge,
              {
                backgroundColor: "#FFFFFF",
              },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor: accent,
                },
              ]}
            />

            <Text
              style={[
                styles.liveText,
                {
                  color: accent,
                },
              ]}
            >
              LIVE
            </Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View
            key={item.label}
            style={styles.metricCard}
          >
            <View
              style={[
                styles.metricIcon,
                {
                  backgroundColor:
                    softBackground,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={accent}
              />
            </View>

            <Text
              style={styles.metricValue}
              numberOfLines={1}
            >
              {loading ? "—" : item.value}
            </Text>

            <Text style={styles.metricLabel}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  title: {
    color: "#16241C",
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
  },

  subtitle: {
    color: "#7A7364",
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  liveText: {
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
  },

  grid: {
    flexDirection: "row",
    gap: 9,
  },

  metricCard: {
    flex: 1,
    minHeight: 105,
    borderRadius: 17,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },

  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  metricValue: {
    color: "#16241C",
    fontSize: 17,
    fontFamily: "Poppins_800ExtraBold",
  },

  metricLabel: {
    color: "#7A7364",
    fontSize: 9,
    lineHeight: 13,
    fontFamily: "Poppins_500Medium",
    marginTop: 3,
  },
});