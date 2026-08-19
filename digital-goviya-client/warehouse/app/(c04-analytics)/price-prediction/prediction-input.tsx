import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  FlatList,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

const RESULT_ROUTE = "/(c04-analytics)/price-prediction/prediction-result";

const DISTRICTS = ["Ampara", "Anuradhapura", "Polonnaruwa", "Kurunagala"];
const MAX_FORECAST_DAYS = 30;

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toApiDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PredictionInputScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const [district, setDistrict] = useState<string | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isWeb = Platform.OS === "web";

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const maxDate = useMemo(() => {
    const m = new Date(today);
    m.setDate(m.getDate() + MAX_FORECAST_DAYS);
    return m;
  }, [today]);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const isValid = !!district && !!date;

  const handlePredict = () => {
    if (!isValid || !date || !district) return;
    router.push({
      pathname: RESULT_ROUTE as any,
      params: { district, date: toApiDate(date) },
    });
  };

  const handleDateChange = (_event: any, selected?: Date) => {
    if (selected) {
      setDate(selected);
      if (Platform.OS !== "ios") setShowDatePicker(false);
    }
  };

  const handleWebDateChange = (event: any) => {
    const value = event.target.value;
    if (!value) return;

    const [year, month, day] = value.split("-").map(Number);
    const selected = new Date(year, month - 1, day);

    if (!Number.isNaN(selected.getTime())) {
      setDate(selected);
      setShowDatePicker(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0A331D", "#12522E", "#0B3B22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroBg}
      />

      <SafeAreaView style={styles.safe}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>

          <View style={styles.eyebrowPill}>
            <Ionicons name="pricetag" size={11} color="#F5C542" />
            <Text style={styles.eyebrow}>PRICE PREDICTION</Text>
          </View>

          <Text style={styles.heroTitle}>Get Today's{"\n"}Price Estimate</Text>
          <Text style={styles.heroSub}>Choose a district and date to continue</Text>
        </View>

        {/* Sheet */}
        <Animated.View
          style={[styles.sheet, { opacity: fade, transform: [{ translateY: rise }] }]}
        >
          <View style={styles.sheetHandle} />

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>District</Text>
            <TouchableOpacity
              style={styles.selectField}
              activeOpacity={0.8}
              onPress={() => setDistrictModalOpen(true)}
            >
              <View style={styles.selectFieldLeft}>
                <Ionicons name="location-outline" size={18} color="#15803D" />
                <Text style={[styles.selectFieldText, !district && styles.placeholderText]}>
                  {district ?? "Select district"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>Date</Text>
            <TouchableOpacity
              style={styles.selectField}
              activeOpacity={0.8}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.selectFieldLeft}>
                <Ionicons name="calendar-outline" size={18} color="#15803D" />
                <Text style={[styles.selectFieldText, !date && styles.placeholderText]}>
                  {date ? formatDate(date) : "Select date"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Today up to {MAX_FORECAST_DAYS} days ahead ({formatDate(maxDate)})
            </Text>

            {showDatePicker && isWeb ? (
              <View style={styles.webPickerWrap}>
                <Text style={styles.webPickerLabel}>Choose a date</Text>
                <input
                  type="date"
                  value={date ? toApiDate(date) : ""}
                  min={toApiDate(today)}
                  max={toApiDate(maxDate)}
                  onChange={handleWebDateChange}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    fontFamily: "Poppins, sans-serif",
                    color: "#111827",
                    backgroundColor: "#fff",
                  }}
                />
              </View>
            ) : showDatePicker ? (
              <DateTimePicker
                value={date ?? today}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={today}
                maximumDate={maxDate}
                onChange={handleDateChange}
                {...(Platform.OS === "ios" ? { themeVariant: "light" } : {})}
              />
            ) : null}

            <View style={styles.noteBanner}>
              <Ionicons name="information-circle" size={18} color="#B45309" />
              <Text style={styles.noteText}>
                Predictions are available only for Long Grain White Paddy.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.primaryBtnShadow, !isValid && styles.disabledShadow]}
            activeOpacity={isValid ? 0.9 : 1}
            onPress={handlePredict}
            disabled={!isValid}
          >
            <LinearGradient
              colors={isValid ? ["#F5C542", "#D97706"] : ["#E5E7EB", "#D1D5DB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={[styles.primaryBtnText, !isValid && styles.disabledBtnText]}>
                Predict Price
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={isValid ? "#0B3B22" : "#9CA3AF"}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      {/* District picker modal */}
      <Modal
        visible={districtModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setDistrictModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDistrictModalOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>Select District</Text>
            <FlatList
              data={DISTRICTS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = item === district;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, active && styles.modalItemActive]}
                    onPress={() => {
                      setDistrict(item);
                      setDistrictModalOpen(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                      {item}
                    </Text>
                    {active && <Ionicons name="checkmark-circle" size={18} color="#15803D" />}
                  </TouchableOpacity>
                );
              }}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B3B22" },
  heroBg: { position: "absolute", top: 0, left: 0, right: 0, height: 240 },
  safe: { flex: 1 },

  hero: {
    paddingTop: 8,
    paddingBottom: 22,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(245,197,66,0.25)",
  },
  eyebrow: {
    color: "rgba(253,230,138,0.85)",
    fontSize: 9.5,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: "white",
    fontSize: 23,
    fontFamily: "Poppins_800ExtraBold",
    textAlign: "center",
    lineHeight: 29,
    marginTop: 2,
  },
  heroSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12.5,
    fontFamily: "Poppins_500Medium",
    textAlign: "center",
  },

  sheet: {
    flex: 1,
    backgroundColor: "#FAFAF9",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },

  fieldLabel: {
    fontSize: 11.5,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  selectField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1.4,
    borderColor: "#E5E7EB",
  },
  selectFieldLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectFieldText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  placeholderText: { color: "#9CA3AF", fontFamily: "Poppins_500Medium" },
  helperText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 6,
    fontFamily: "Poppins_500Medium",
  },
  webPickerWrap: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  webPickerLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    marginBottom: 8,
  },

  noteBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 12,
    marginTop: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
    fontFamily: "Poppins_500Medium",
  },

  primaryBtnShadow: {
    borderRadius: 14,
    shadowColor: "#D97706",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    marginTop: 16,
  },
  disabledShadow: { shadowOpacity: 0, elevation: 0 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: {
    color: "#0B3B22",
    fontSize: 15.5,
    fontFamily: "Poppins_700Bold",
  },
  disabledBtnText: { color: "#9CA3AF" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(11,59,34,0.45)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 28,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: "#1F2937",
    marginBottom: 10,
    textAlign: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  modalItemActive: { backgroundColor: "#F0FDF4" },
  modalItemText: {
    fontSize: 14.5,
    fontFamily: "Poppins_500Medium",
    color: "#374151",
  },
  modalItemTextActive: { color: "#15803D", fontFamily: "Poppins_700Bold" },
});