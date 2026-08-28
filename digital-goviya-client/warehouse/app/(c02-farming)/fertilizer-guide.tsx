import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFarmingAuth } from "@/contexts/FarmingAuthContext";
import data from "./fertilizer.json";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../i18n";

const rawData = (data as any).default || data;
const fertilizerData: any[] = Array.isArray(rawData) ? rawData : (rawData.recommendations || []);

import { API_URL } from "@/services/c02-farming/apiConfig";

const ZONES = ["Dry Zone", "Wet Zone", "Intermediate Zone"];
const DURATIONS = ["3 Month", "3 1/2 Month", "4 Month", "4 1/2 Month"];
const UNITS = ["Hectares", "Acres", "Perches"];

function CustomSelect({ label, value, options, onSelect }: any) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.inputBox} onPress={() => setVisible(true)}>
        <Text style={[styles.input, { flex: 1 }]}>{value}</Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </TouchableOpacity>
      
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select {label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, value === item && styles.modalOptionTextActive]}>
                    {item}
                  </Text>
                  {value === item && <Ionicons name="checkmark-circle" size={20} color="#0A331D" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export default function FertilizerGuideScreen() {
  const { currentUser } = useFarmingAuth();
  const { language } = useLanguage();
  const t = translations[language].c02Farming.fertilizerGuide;

  const [formData, setFormData] = useState({
    Zone: "Dry Zone",
    Irrigation: "Irrigated paddy fields",
    Duration: "3 1/2 Month",
    Land_Size: "1",
    Land_Size_Unit: "Hectares"
  });

  const [saveStatus, setSaveStatus] = useState<string>('');

  const getDurationKey = (duration: string) => {
    const mapping: any = {
      "3 Month": "3_month",
      "3 1/2 Month": "3_5_month",
      "4 Month": "4_month",
      "4 1/2 Month": "4_5_month"
    };
    return mapping[duration] || "3_month";
  };

  const getMultiplier = () => {
    let size = parseFloat(formData.Land_Size) || 0;
    if (formData.Land_Size_Unit === 'Perches') size = size * 0.00252929;
    else if (formData.Land_Size_Unit === 'Acres') size = size * 0.404686;
    return size;
  };

  const getFertilizerData = () => {
    let zoneData = fertilizerData.find(z => 
      z.agro_zone.toLowerCase().includes(formData.Zone.toLowerCase()) && 
      z.cultivation_condition.toLowerCase().includes(formData.Irrigation.toLowerCase().replace(' paddy fields', ''))
    );
    if (!zoneData) {
      zoneData = fertilizerData.find(z => z.agro_zone.toLowerCase().includes("dry zone"));
    }
    const durationKey = getDurationKey(formData.Duration);
    return (zoneData?.fertilizer_recommendations as any)?.[durationKey];
  };

  const durationData = getFertilizerData();
  const multiplier = getMultiplier();

  const handleSaveToProfile = async () => {
    if (!durationData) return;
    setSaveStatus('Saving...');
    try {
      // multiplier converts base per-hectare rates to the user's land size
      const payload = {
        user_id: currentUser?.uid || 'mobile_user',
        agro_zone: formData.Zone,
        irrigation: formData.Irrigation,
        crop_duration: formData.Duration,
        total_urea: parseFloat((durationData.total.urea * multiplier).toFixed(2)),
        total_tsp: parseFloat((durationData.total.tsp * multiplier).toFixed(2)),
        total_mop: parseFloat((durationData.total.mop * multiplier).toFixed(2)),
        total_zinc: parseFloat(((durationData.total.zinc_sulphate || 0) * multiplier).toFixed(2))
      };

      const res = await fetch(`${API_URL}/api/fertilizer_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus('Saved to Profile ✓');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        const errText = await res.text();
        console.error('Save fertilizer error:', errText);
        setSaveStatus('Failed to Save');
      }
    } catch (err) {
      console.error('handleSaveToProfile error:', err);
      setSaveStatus('Failed to Save');
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
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.headerTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t.farmDetails}</Text>
            
            <Text style={styles.label}>{t.climaticZone}</Text>
            <CustomSelect 
              label={t.climaticZone} 
              value={formData.Zone === "Dry Zone" ? t.dryZone : formData.Zone === "Wet Zone" ? t.wetZone : t.intermediateZone} 
              options={[t.dryZone, t.intermediateZone, t.wetZone]}
              onSelect={(val: string) => {
                const enVal = val === t.dryZone ? "Dry Zone" : val === t.wetZone ? "Wet Zone" : "Intermediate Zone";
                setFormData({ ...formData, Zone: enVal });
              }} 
            />

            <Text style={styles.label}>{t.cultivationCondition}</Text>
            <CustomSelect 
              label={t.cultivationCondition} 
              value={formData.Irrigation === "Irrigated paddy fields" ? t.irrigated : t.rainfed} 
              options={[t.irrigated, t.rainfed]}
              onSelect={(val: string) => {
                const enVal = val === t.irrigated ? "Irrigated paddy fields" : "Rainfed paddy fields";
                setFormData({ ...formData, Irrigation: enVal });
              }} 
            />

            <Text style={styles.label}>{t.cropDuration}</Text>
            <CustomSelect 
              label={t.cropDuration} 
              value={formData.Duration} 
              options={DURATIONS} 
              onSelect={(v: string) => setFormData({...formData, Duration: v})} 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>{t.landSize}</Text>
                <View style={styles.inputBox}>
                  <TextInput 
                    style={[styles.input, { flex: 1 }]}
                    value={formData.Land_Size}
                    onChangeText={(t) => setFormData({...formData, Land_Size: t})}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Unit</Text>
                <CustomSelect 
                  label="Unit" 
                  value={formData.Land_Size_Unit} 
                  options={UNITS} 
                  onSelect={(v: string) => setFormData({...formData, Land_Size_Unit: v})} 
                />
              </View>
            </View>
          </View>

          {durationData && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeaderBox}>
                <Ionicons name="leaf" size={24} color="#10B981" />
                <Text style={styles.resultHeader}>{t.totalRequirement}</Text>
              </View>
              
              <View style={{ gap: 12 }}>
                <View style={[styles.metricItem, { width: "100%", backgroundColor: "#F0F9FF", flexDirection: "row", alignItems: "center" }]}>
                  <View style={{ backgroundColor: "white", padding: 8, borderRadius: 12, marginRight: 15, shadowColor: "#0284C7", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                    <Image source={require("../../assets/farming-icons/fertilizer.png")} style={{ width: 35, height: 35 }} resizeMode="contain" />
                  </View>
          <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>{t.urea}</Text>
                    <Text style={[styles.metricValue, { color: "#0284C7" }]}>
                      {(durationData.total.urea * multiplier).toFixed(1)} kg
                    </Text>
                  </View>
                  <Ionicons name="water" size={24} color="#0284C7" style={{ opacity: 0.15 }} />
                </View>

                <View style={[styles.metricItem, { width: "100%", backgroundColor: "#FFFBEB", flexDirection: "row", alignItems: "center" }]}>
                  <View style={{ backgroundColor: "white", padding: 8, borderRadius: 12, marginRight: 15, shadowColor: "#D97706", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                    <Image source={require("../../assets/farming-icons/fertilizer.png")} style={{ width: 35, height: 35 }} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>{t.tsp}</Text>
                    <Text style={[styles.metricValue, { color: "#D97706" }]}>
                      {(durationData.total.tsp * multiplier).toFixed(1)} kg
                    </Text>
                  </View>
                  <Ionicons name="flask" size={24} color="#D97706" style={{ opacity: 0.15 }} />
                </View>

                <View style={[styles.metricItem, { width: "100%", backgroundColor: "#FEF2F2", flexDirection: "row", alignItems: "center" }]}>
                  <View style={{ backgroundColor: "white", padding: 8, borderRadius: 12, marginRight: 15, shadowColor: "#DC2626", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}>
                    <Image source={require("../../assets/farming-icons/fertilizer.png")} style={{ width: 35, height: 35 }} resizeMode="contain" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.metricLabel}>{t.mop}</Text>
                    <Text style={[styles.metricValue, { color: "#DC2626" }]}>
                      {(durationData.total.mop * multiplier).toFixed(1)} kg
                    </Text>
                  </View>
                  <Ionicons name="leaf" size={24} color="#DC2626" style={{ opacity: 0.15 }} />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 20, backgroundColor: "#3B82F6" }]}
                onPress={handleSaveToProfile}
              >
                <Text style={styles.primaryBtnText}>{saveStatus || t.saveToProfile}</Text>
              </TouchableOpacity>
            </View>
          )}

          {durationData && durationData.schedule && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeaderBox}>
                <Ionicons name="calendar" size={24} color="#6366F1" />
                <Text style={styles.resultHeader}>Application Schedule</Text>
              </View>
              
              {durationData.schedule.map((item: any, index: number) => (
                <View key={index} style={styles.scheduleItem}>
                  <Text style={styles.scheduleTime}>{item.time}</Text>
                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleText}>Urea: {(item.urea * multiplier).toFixed(1)} kg</Text>
                    <Text style={styles.scheduleText}>TSP: {(item.tsp * multiplier).toFixed(1)} kg</Text>
                    <Text style={styles.scheduleText}>MOP: {(item.mop * multiplier).toFixed(1)} kg</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fefffeff" },
  heroBg: { ...StyleSheet.absoluteFill, height: 250 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#ffffff",
  },
  container: { padding: 20 },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#1F2937",
    marginBottom: 16,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
    color: "#1F2937",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryBtn: {
    backgroundColor: "#0A331D",
    flexDirection: "row",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0A331D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "white",
    marginRight: 8,
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  resultHeaderBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  resultHeader: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#1F2937",
    marginLeft: 8,
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricItem: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 16,
  },
  metricLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#1F2937",
  },
  scheduleItem: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#6366F1",
  },
  scheduleTime: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#374151",
    marginBottom: 4,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: "#6B7280",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "70%" },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#1F2937", marginBottom: 16 },
  modalOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalOptionText: { fontFamily: "Poppins_500Medium", fontSize: 16, color: "#4B5563" },
  modalOptionTextActive: { fontFamily: "Poppins_600SemiBold", color: "#0A331D" },
});
