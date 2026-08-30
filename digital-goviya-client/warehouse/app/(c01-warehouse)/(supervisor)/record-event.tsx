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
import { useLanguage } from "@/contexts/LanguageContext";

const EVENT_TYPE_KEYS = [
  { value: "INFLOW",         icon: "arrow-down-circle", color: COLORS.success },
  { value: "OUTFLOW",        icon: "arrow-up-circle",   color: COLORS.danger },
  { value: "REDISTRIBUTION", icon: "swap-horizontal",   color: COLORS.info },
  { value: "DAMAGE",         icon: "warning",           color: COLORS.warning },
  { value: "ADJUSTMENT",     icon: "pencil",            color: COLORS.textMuted },
] as const;

export default function RecordEventScreen() {
  const { t } = useLanguage();

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
      Alert.alert(t.warehouse.createWarehouse.requiredTitle, t.warehouse.recordEvent.requiredType);
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert(t.warehouse.createWarehouse.requiredTitle, t.warehouse.recordEvent.requiredQuantity);
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

      const eventTypeLabel = t.warehouse.eventTypes[eventType as keyof typeof t.warehouse.eventTypes] ?? eventType;

      Alert.alert(
        t.warehouse.recordEvent.recordedTitle,
        t.warehouse.recordEvent.recordedBody
          .replace("{type}", eventTypeLabel)
          .replace("{quantity}", quantity)
          .replace("{stock}", String(summary.currentStockTons))
          .replace("{available}", String(summary.availableTons))
          .replace("{hash}", event.documentHash?.slice(0, 16) ?? ""),
        [
          {
            text: t.warehouse.recordEvent.attachDocument,
            onPress: () =>
              router.push({
                pathname:
                  "/(c01-warehouse)/(supervisor)/upload-document" as any,
                params: { eventId: event.id, warehouseId },
              }),
          },
          {
            text: t.warehouse.recordEvent.done,
            onPress: () => router.back(),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        t.warehouse.errors.title,
        err?.response?.data?.message || t.warehouse.recordEvent.recordError,
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
          <Text style={styles.headerTitle}>{t.warehouse.recordEvent.title}</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {warehouseName}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t.warehouse.recordEvent.eventType}</Text>
          {EVENT_TYPE_KEYS.map((et) => (
            <TouchableOpacity
              key={et.value}
              style={[
                styles.typeCard,
                eventType === et.value && styles.typeCardSelected,
              ]}
              onPress={() => setEventType(et.value)}
            >
              <View
                style={[styles.typeIcon, { backgroundColor: et.color + "20" }]}
              >
                <Ionicons name={et.icon as any} size={22} color={et.color} />
              </View>
              <View style={styles.typeInfo}>
                <Text
                  style={[
                    styles.typeLabel,
                    eventType === et.value && { color: COLORS.primaryDark },
                  ]}
                >
                  {t.warehouse.eventTypes[et.value as keyof typeof t.warehouse.eventTypes]}
                </Text>
                <Text style={styles.typeDesc}>
                  {t.warehouse.eventTypeDesc[et.value as keyof typeof t.warehouse.eventTypeDesc]}
                </Text>
              </View>
              {eventType === et.value && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>{t.warehouse.recordEvent.quantity}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.warehouse.recordEvent.quantityPlaceholder}
            placeholderTextColor={COLORS.textFaint}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />

          <Text style={styles.sectionTitle}>{t.warehouse.recordEvent.notes}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t.warehouse.recordEvent.notesPlaceholder}
            placeholderTextColor={COLORS.textFaint}
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.hashNote}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.info} />
            <Text style={styles.hashNoteText}>
              {t.warehouse.recordEvent.hashNote}
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
                <Text style={styles.submitBtnText}>{t.warehouse.recordEvent.submit}</Text>
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