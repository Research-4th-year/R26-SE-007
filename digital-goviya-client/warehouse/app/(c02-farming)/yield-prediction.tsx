import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { authService } from "@/services/shared/auth.service";

const API_URL = "http://127.0.0.1:8000";

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
  "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa",
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const PADDY_TYPES = ["Bg 352", "At 362", "Samba", "Keeri Samba", "Nadu"];
const UNITS = ["Hectares", "Acres", "Perches"];

// Custom Dropdown Component to fix iOS clipping and styling issues
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

export default function YieldPredictionScreen() {
  const [formData, setFormData] = useState({
    District: "Anuradhapura",
    Total_Land_Size: "1000",
    Land_Size_Unit: "Hectares",
    Paddy_Type: "Bg 352",
    Temperature_C: "28.5",
    Humidity: "75.0",
    Soil_Moisture: "0.3",
    isLiveIoT: false
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const payload = {
      ...formData,
      Total_Land_Size: parseFloat(formData.Total_Land_Size),
      Temperature_C: parseFloat(formData.Temperature_C),
      Humidity: parseFloat(formData.Humidity),
      Soil_Moisture: parseFloat(formData.Soil_Moisture),
    };

    try {
      const res = await fetch(`${API_URL}/predict_yield_production`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Yield Prediction API failed");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data from backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!result) return;
    setSaveStatus('Saving...');
    try {
      const user = await authService.getStoredUser();
      
      let convertedSize = parseFloat(formData.Total_Land_Size) || 0;
      if (formData.Land_Size_Unit === 'Perches') convertedSize = convertedSize * 0.00252929;
      else if (formData.Land_Size_Unit === 'Acres') convertedSize = convertedSize * 0.404686;

      const payload = {
        user_id: user?.id || 'mobile_user',
        district: formData.District,
        land_size: convertedSize,
        paddy_type: formData.Paddy_Type,
        estimated_yield: getTotalYieldKg(result.predicted_yield_kg_per_ha)
      };

      const res = await fetch(`${API_URL}/api/history/yield`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus('Saved to Profile');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Failed to Save');
      }
    } catch (err) {
      setSaveStatus('Failed to Save');
    }
  };

  const getTotalYieldKg = (val: number) => {
    let size = parseFloat(formData.Total_Land_Size);
    if (isNaN(size)) size = 0;
    if (formData.Land_Size_Unit === 'Acres') size = size * 0.404686;
    if (formData.Land_Size_Unit === 'Perches') size = size * 0.00252929;
    return val * size;
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
          <Text style={styles.headerTitle}>Yield Prediction</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Harvest Parameters</Text>
            
            <Text style={styles.label}>District</Text>
            <CustomSelect 
              label="District" 
              value={formData.District} 
              options={DISTRICTS} 
              onSelect={(v: string) => setFormData({...formData, District: v})} 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Land Size</Text>
                <View style={styles.inputBox}>
                  <TextInput 
                    style={[styles.input, { flex: 1 }]}
                    value={formData.Total_Land_Size}
                    onChangeText={(t) => setFormData({...formData, Total_Land_Size: t})}
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

            <Text style={styles.label}>Paddy Type</Text>
            <CustomSelect 
              label="Paddy Type" 
              value={formData.Paddy_Type} 
              options={PADDY_TYPES} 
              onSelect={(v: string) => setFormData({...formData, Paddy_Type: v})} 
            />

            <Text style={styles.label}>IoT Temperature (°C)</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={[styles.input, { flex: 1 }]}
                value={formData.Temperature_C}
                onChangeText={(t) => setFormData({...formData, Temperature_C: t})}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>IoT Humidity (%)</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={[styles.input, { flex: 1 }]}
                value={formData.Humidity}
                onChangeText={(t) => setFormData({...formData, Humidity: t})}
                keyboardType="numeric"
              />
            </View>
            
            <Text style={styles.label}>Soil Moisture (m³/m³)</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={[styles.input, { flex: 1 }]}
                value={formData.Soil_Moisture}
                onChangeText={(t) => setFormData({...formData, Soil_Moisture: t})}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>Predict Yield</Text>
                  <Ionicons name="calculator" size={18} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultSubHeader}>Estimated Yield</Text>
              
              <Text style={styles.yieldValue}>
                {(getTotalYieldKg(result.predicted_yield_kg_per_ha)).toFixed(1)} <Text style={styles.yieldUnit}>kg</Text>
              </Text>

              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Metric Tons</Text>
                  <Text style={styles.metricValue}>{(getTotalYieldKg(result.predicted_yield_kg_per_ha) / 1000).toFixed(2)} MT</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>per {formData.Land_Size_Unit}</Text>
                  <Text style={styles.metricValue}>
                    {formData.Land_Size_Unit === 'Acres' ? (result.predicted_yield_kg_per_ha * 0.404686).toFixed(0) :
                     formData.Land_Size_Unit === 'Perches' ? (result.predicted_yield_kg_per_ha * 0.00252929).toFixed(0) :
                     result.predicted_yield_kg_per_ha.toFixed(0)} kg
                  </Text>
                </View>
              </View>

              {result.agronomic_recommendations && result.agronomic_recommendations.length > 0 && (
                <View style={styles.insightsBox}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                    <Ionicons name="bulb" size={18} color="#D97706" />
                    <Text style={styles.insightsTitle}>Agronomic Insights</Text>
                  </View>
                  {result.agronomic_recommendations.map((rec: string, i: number) => (
                    <Text key={i} style={styles.insightItem}>• {rec}</Text>
                  ))}
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 20, backgroundColor: "#3B82F6" }]}
                onPress={handleSaveToProfile}
              >
                <Text style={styles.primaryBtnText}>{saveStatus || "Save to Profile"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  heroBg: { ...StyleSheet.absoluteFill, height: 250 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: "white" },
  container: { padding: 20 },
  card: { backgroundColor: "white", borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, color: "#1F2937", marginBottom: 20 },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#4B5563", marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 16 },
  inputBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  input: { fontFamily: "Poppins_500Medium", fontSize: 15, color: "#1F2937" },
  primaryBtn: { backgroundColor: "#0A331D", flexDirection: "row", paddingVertical: 16, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 10 },
  primaryBtnText: { fontFamily: "Poppins_600SemiBold", color: "white", fontSize: 16, marginRight: 10 },
  errorBox: { flexDirection: "row", backgroundColor: "#FEF2F2", padding: 16, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  errorText: { fontFamily: "Poppins_500Medium", color: "#DC2626", marginLeft: 10, flex: 1 },
  resultCard: { backgroundColor: "white", borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  resultSubHeader: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#6B7280", marginBottom: 8 },
  yieldValue: { fontFamily: "Poppins_800ExtraBold", fontSize: 40, color: "#0A331D", marginBottom: 20 },
  yieldUnit: { fontSize: 24, color: "#4B5563" },
  metricRow: { flexDirection: "row", width: "100%", justifyContent: "space-around", borderTopWidth: 1, borderColor: "#F3F4F6", paddingTop: 20, marginBottom: 20 },
  metricItem: { alignItems: "center" },
  metricLabel: { fontFamily: "Poppins_500Medium", color: "#9CA3AF", fontSize: 12, marginBottom: 4 },
  metricValue: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#1F2937", textAlign: 'center' },
  insightsBox: { width: "100%", backgroundColor: "#FFFBEB", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#FEF3C7" },
  insightsTitle: { fontFamily: "Poppins_600SemiBold", color: "#D97706", fontSize: 14, marginLeft: 6 },
  insightItem: { fontFamily: "Poppins_500Medium", color: "#4B5563", fontSize: 13, marginBottom: 4, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 20, padding: 20, width: "100%", maxHeight: "80%" },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#1F2937", marginBottom: 16 },
  modalOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalOptionText: { fontFamily: "Poppins_500Medium", fontSize: 16, color: "#4B5563" },
  modalOptionTextActive: { color: "#0A331D", fontFamily: "Poppins_700Bold" },
});
