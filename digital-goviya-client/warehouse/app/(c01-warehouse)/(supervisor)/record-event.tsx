import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { COLORS } from "@/constants/theme";
import { useDebouncedCallback } from "@/hooks/shared/useDebounce";

const EVENT_TYPES = [
  {
    value: "INFLOW",
    label: "Inflow",
    icon: "arrow-down-circle",
    color: COLORS.success,
    desc: "Stock received from farmers",
  },
  {
    value: "OUTFLOW",
    label: "Outflow",
    icon: "arrow-up-circle",
    color: COLORS.danger,
    desc: "Stock dispatched to millers/traders",
  },
  {
    value: "REDISTRIBUTION",
    label: "Redistribution",
    icon: "swap-horizontal",
    color: COLORS.info,
    desc: "Transfer to/from another warehouse",
  },
  {
    value: "DAMAGE",
    label: "Damage",
    icon: "warning",
    color: COLORS.warning,
    desc: "Loss from disaster or spoilage",
  },
  {
    value: "ADJUSTMENT",
    label: "Adjustment",
    icon: "pencil",
    color: COLORS.textMuted,
    desc: "Manual correction after stock count",
  },
];

export default function RecordEventScreen() {
  const { warehouseId, warehouseName } = useLocalSearchParams<{
    warehouseId: string;
    warehouseName: string;
  }>();

  const [eventType, setEventType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const handleSubmit = useDebouncedCallback(async () => {
    if (!eventType) {
      Alert.alert("Required", "Select an event type");
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert("Required", "Enter a valid quantity in tons");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(
        `/api/warehouses/${warehouseId}/stock-events`,
        {
          eventType,
          quantityTons: parseFloat(quantity),
          notes: notes.trim() || undefined,
        },
      );

      const event = res.data.data.event;
      const summary = res.data.data.warehouseSummary;
      setLastEventId(event.id);

      Alert.alert(
        "Event Recorded ✅",
        `${eventType} of ${quantity} tons recorded.\n\nUpdated stock: ${summary.currentStockTons}t\nAvailable: ${summary.availableTons}t\n\nDocument hash: ${event.documentHash?.slice(0, 16)}...`,
        [
          {
            text: "Attach Document",
            onPress: () =>
              router.push({
                pathname:
                  "/(c01-warehouse)/(supervisor)/upload-document" as any,
                params: { eventId: event.id, warehouseId },
              }),
          },
          {
            text: "Done",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Failed to record event",
      );
    } finally {
      setSubmitting(false);
    }
  }, 1000);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Record Stock Event</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {warehouseName}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Event Type *</Text>
          {EVENT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[
                styles.typeCard,
                eventType === t.value && styles.typeCardSelected,
              ]}
              onPress={() => setEventType(t.value)}
            >
              <View
                style={[styles.typeIcon, { backgroundColor: t.color + "20" }]}
              >
                <Ionicons name={t.icon as any} size={22} color={t.color} />
              </View>
              <View style={styles.typeInfo}>
                <Text
                  style={[
                    styles.typeLabel,
                    eventType === t.value && { color: COLORS.primaryDark },
                  ]}
                >
                  {t.label}
                </Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
              {eventType === t.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Quantity (tons) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 150"
            placeholderTextColor={COLORS.textFaint}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Farmer batch, invoice number, reason for damage..."
            placeholderTextColor={COLORS.textFaint}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.hashNote}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.info} />
            <Text style={styles.hashNoteText}>
              A document hash will be automatically generated and can be
              linked to a physical receipt after submission.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={styles.submitBtnText}>Record Event</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  scroll: { flex: 1 },
  content: { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: { marginRight: 12 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub: { color: COLORS.primaryLight, fontSize: 12 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginTop: 16,
  },

  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  typeCardSelected: { borderColor: COLORS.primary, backgroundColor: "#F0FDF4" },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  typeDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.bgCard,
  },
  textArea: { height: 100, textAlignVertical: "top" },

  hashNote: {
    flexDirection: "row",
    backgroundColor: COLORS.infoBg,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  hashNoteText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.infoText,
    lineHeight: 18,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  submitBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  bottomSpacer: { height: 40 },
});
