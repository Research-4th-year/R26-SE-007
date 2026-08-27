import { Ionicons } from "@/components/c03-marketplace/themed-native";
import {
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";

interface DashboardMetricProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: "green" | "amber";
}

export function DashboardMetric({
  icon,
  label,
  value,
  accent = "green",
}: DashboardMetricProps) {
  const isAmber = accent === "amber";

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconBox,
          isAmber
            ? styles.amberIcon
            : styles.greenIcon,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={
            isAmber ? "#B45309" : "#15803D"
          }
        />
      </View>

      <Text style={styles.value}>
        {value}
      </Text>

      <Text style={styles.label}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "31%",
    minHeight: 108,
    borderRadius: 18,
    padding: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  greenIcon: {
    backgroundColor: "#DCFCE7",
  },

  amberIcon: {
    backgroundColor: "#FEF3C7",
  },

  value: {
    color: "#1F2937",
    fontSize: 18,
    fontWeight: "900",
  },

  label: {
    color: "#6B7280",
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },
});