import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { MarketplaceButton } from "@/components/c03-marketplace/MarketplaceButton";

export default function DemandResultScreen() {
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>

          <Ionicons
            name="checkmark-circle"
            size={70}
            color="#16A34A"
          />

          <Text style={styles.title}>
            Demand Published
          </Text>

          <Text style={styles.subtitle}>
            Your demand is now visible to the marketplace.
          </Text>

        </View>

        <View style={styles.infoCard}>

          <InfoRow
            label="Paddy Type"
            value={String(params.paddyType)}
          />

          <InfoRow
            label="Quantity"
            value={`${params.quantityNeeded} kg`}
          />

          <InfoRow
            label="Offered Price"
            value={`Rs. ${params.offeredPrice}/kg`}
          />

          <InfoRow
            label="Status"
            value={String(params.status)}
          />

        </View>

        <MarketplaceButton
          title="View My Demands"
          onPress={() =>
            router.replace("./my-demands")
          }
        />

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: "#EEE",
      }}
    >
      <Text>{label}</Text>
      <Text
        style={{
          fontWeight: "700",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    gap: 20,
  },

  card: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    marginTop: 15,
  },

  subtitle: {
    textAlign: "center",
    marginTop: 8,
    color: "#64748B",
  },

  infoCard: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 18,
  },
});