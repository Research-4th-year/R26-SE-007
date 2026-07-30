import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const API_URL = "http://127.0.0.1:8000";

const DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle", "Gampaha",
  "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle", "Kilinochchi", "Kurunegala",
  "Mannar", "Matale", "Matara", "Moneragala", "Mullaitivu", "Nuwara Eliya", "Polonnaruwa",
  "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya"
];

const ZONES = ["Dry Zone", "Wet Zone", "Intermediate Zone"];
const SEASONS = ["Maha", "Yala", "Annual"];
const YN = ["No", "Yes"];

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

const districtData: Record<string, {name: string, lat: number, lon: number}[]> = {
  "Anuradhapura": [{ name: "Anuradhapura City", lat: 8.3114, lon: 80.4037 }, { name: "Kekirawa", lat: 8.0411, lon: 80.5925 }, { name: "Tambuttegama", lat: 8.1492, lon: 80.2981 }],
  "Polonnaruwa": [{ name: "Polonnaruwa City", lat: 7.9403, lon: 81.0188 }, { name: "Hingurakgoda", lat: 8.0551, lon: 80.9806 }, { name: "Medirigiriya", lat: 8.1444, lon: 80.9866 }],
  "Ampara": [{ name: "Ampara City", lat: 7.2840, lon: 81.6747 }, { name: "Akkaraipattu", lat: 7.2198, lon: 81.8485 }, { name: "Dehiattakandiya", lat: 7.6409, lon: 81.0253 }],
  "Kurunegala": [{ name: "Kurunegala City", lat: 7.4818, lon: 80.3609 }, { name: "Kuliyapitiya", lat: 7.4674, lon: 80.0401 }],
  "Hambantota": [{ name: "Hambantota City", lat: 6.1248, lon: 81.1185 }, { name: "Tangalle", lat: 6.0246, lon: 80.7963 }, { name: "Tissamaharama", lat: 6.2785, lon: 81.2863 }],
  "Trincomalee": [{ name: "Trincomalee City", lat: 8.5711, lon: 81.2330 }, { name: "Kinniya", lat: 8.5146, lon: 81.1830 }, { name: "Mutur", lat: 8.4552, lon: 81.2662 }],
  "Batticaloa": [{ name: "Batticaloa City", lat: 7.7102, lon: 81.6924 }, { name: "Kattankudy", lat: 7.6746, lon: 81.7225 }],
  "Puttalam": [{ name: "Puttalam City", lat: 8.0362, lon: 79.8283 }, { name: "Chilaw", lat: 7.5755, lon: 79.7993 }],
  "Mannar": [{ name: "Mannar City", lat: 8.9810, lon: 79.9044 }, { name: "Murunkan", lat: 8.8184, lon: 80.0261 }],
  "Vavuniya": [{ name: "Vavuniya City", lat: 8.7542, lon: 80.4982 }, { name: "Cheddikulam", lat: 8.6811, lon: 80.2588 }],
  "Kilinochchi": [{ name: "Kilinochchi City", lat: 9.3803, lon: 80.3770 }, { name: "Pallai", lat: 9.5393, lon: 80.3444 }],
  "Mullaitivu": [{ name: "Mullaitivu City", lat: 9.2671, lon: 80.8142 }, { name: "Puthukkudiyiruppu", lat: 9.3179, lon: 80.6698 }],
  "Jaffna": [{ name: "Jaffna City", lat: 9.6615, lon: 80.0255 }, { name: "Chavakachcheri", lat: 9.6586, lon: 80.1601 }],
  "Moneragala": [{ name: "Moneragala City", lat: 6.8728, lon: 81.3507 }, { name: "Bibile", lat: 7.1659, lon: 81.2319 }, { name: "Wellawaya", lat: 6.7371, lon: 81.1039 }],
  "Badulla": [{ name: "Badulla City", lat: 6.9819, lon: 81.0559 }, { name: "Bandarawela", lat: 6.8301, lon: 80.9982 }],
  "Matale": [{ name: "Matale City", lat: 7.4675, lon: 80.6234 }, { name: "Dambulla", lat: 7.8596, lon: 80.6517 }],
  "Kandy": [{ name: "Kandy City", lat: 7.2906, lon: 80.6337 }, { name: "Gampola", lat: 7.1633, lon: 80.5739 }],
  "Nuwara Eliya": [{ name: "Nuwara Eliya City", lat: 6.9497, lon: 80.7828 }, { name: "Hatton", lat: 6.8893, lon: 80.5968 }],
  "Kegalle": [{ name: "Kegalle City", lat: 7.2513, lon: 80.3464 }, { name: "Mawanella", lat: 7.2515, lon: 80.4449 }],
  "Ratnapura": [{ name: "Ratnapura City", lat: 6.7055, lon: 80.3847 }, { name: "Balangoda", lat: 6.6508, lon: 80.6974 }, { name: "Embilipitiya", lat: 6.3458, lon: 80.8407 }],
  "Colombo": [{ name: "Colombo City", lat: 6.9271, lon: 79.8612 }, { name: "Avissawella", lat: 6.9530, lon: 80.2078 }],
  "Gampaha": [{ name: "Gampaha City", lat: 7.0840, lon: 80.0098 }, { name: "Negombo", lat: 7.2091, lon: 79.8358 }],
  "Kalutara": [{ name: "Kalutara City", lat: 6.5854, lon: 79.9607 }, { name: "Mathugama", lat: 6.5167, lon: 80.1167 }],
  "Galle": [{ name: "Galle City", lat: 6.0535, lon: 80.2210 }, { name: "Elpitiya", lat: 6.2709, lon: 80.1419 }],
  "Matara": [{ name: "Matara City", lat: 5.9549, lon: 80.5469 }, { name: "Akuressa", lat: 6.0963, lon: 80.4853 }]
};

const districtToZoneMap: Record<string, string> = {
  "Anuradhapura": "Dry Zone", "Polonnaruwa": "Dry Zone", "Ampara": "Dry Zone", "Hambantota": "Dry Zone", "Trincomalee": "Dry Zone", "Batticaloa": "Dry Zone", "Puttalam": "Dry Zone", "Mannar": "Dry Zone", "Vavuniya": "Dry Zone", "Kilinochchi": "Dry Zone", "Mullaitivu": "Dry Zone", "Jaffna": "Dry Zone", "Moneragala": "Dry Zone", "Kurunegala": "Intermediate Zone", "Badulla": "Intermediate Zone", "Matale": "Intermediate Zone", "Kandy": "Wet Zone", "Nuwara Eliya": "Wet Zone", "Kegalle": "Wet Zone", "Ratnapura": "Wet Zone", "Colombo": "Wet Zone", "Gampaha": "Wet Zone", "Kalutara": "Wet Zone", "Galle": "Wet Zone", "Matara": "Wet Zone"
};

export default function VarietyPredictionScreen() {
  const [formData, setFormData] = useState({
    District: "Anuradhapura",
    City: "Anuradhapura City",
    lat: "8.3114",
    lon: "80.4037",
    Zone: "Dry Zone",
    Season: "Annual",
    Salinity_Prone: "No",
    Iron_Toxicity_Prone: "No",
    field_id: "field_001",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suitability, setSuitability] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDistrictChange = (district: string) => {
    const cities = districtData[district] || [];
    const firstCity = cities.length > 0 ? cities[0] : { name: "", lat: 0, lon: 0 };
    const zone = districtToZoneMap[district] || "Dry Zone";
    
    setFormData({
      ...formData,
      District: district,
      Zone: zone,
      City: firstCity.name,
      lat: firstCity.lat.toString(),
      lon: firstCity.lon.toString()
    });
  };

  const handleCityChange = (cityName: string) => {
    const cities = districtData[formData.District] || [];
    const city = cities.find(c => c.name === cityName);
    if (city) {
      setFormData({
        ...formData,
        City: city.name,
        lat: city.lat.toString(),
        lon: city.lon.toString()
      });
    }
  };

  const currentCities = (districtData[formData.District] || []).map(c => c.name);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuitability(null);
    
    try {
      const varRes = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!varRes.ok) throw new Error("Variety API failed");
      const varData = await varRes.json();
      setResult(varData);

      const suitRes = await fetch(
        `${API_URL}/predict_suitability?field_id=${formData.field_id}&lat=${formData.lat}&lon=${formData.lon}`
      );
      if (!suitRes.ok) throw new Error("Could not fetch IoT Field Status. Please check field ID.");
      const suitData = await suitRes.json();
      setSuitability(suitData);

    } catch (err: any) {
      setError(err.message || "Failed to fetch data from backend.");
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>Advisory & Suitability</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Farm Details</Text>
            
            <Text style={styles.label}>District</Text>
            <CustomSelect 
              label="District" 
              value={formData.District} 
              options={DISTRICTS} 
              onSelect={handleDistrictChange} 
            />
            
            <Text style={styles.label}>City (Coordinates Auto-Linked)</Text>
            <CustomSelect 
              label="City" 
              value={formData.City} 
              options={currentCities} 
              onSelect={handleCityChange} 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Climatic Zone</Text>
                <CustomSelect 
                  label="Zone" 
                  value={formData.Zone} 
                  options={ZONES} 
                  onSelect={(v: string) => setFormData({...formData, Zone: v})} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Season</Text>
                <CustomSelect 
                  label="Season" 
                  value={formData.Season} 
                  options={SEASONS} 
                  onSelect={(v: string) => setFormData({...formData, Season: v})} 
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Salinity Prone</Text>
                <CustomSelect 
                  label="Salinity" 
                  value={formData.Salinity_Prone} 
                  options={YN} 
                  onSelect={(v: string) => setFormData({...formData, Salinity_Prone: v})} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Iron Toxicity</Text>
                <CustomSelect 
                  label="Iron Toxicity" 
                  value={formData.Iron_Toxicity_Prone} 
                  options={YN} 
                  onSelect={(v: string) => setFormData({...formData, Iron_Toxicity_Prone: v})} 
                />
              </View>
            </View>

            <Text style={styles.label}>IoT Field ID</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={[styles.input, { flex: 1 }]}
                value={formData.field_id}
                onChangeText={(t) => setFormData({...formData, field_id: t})}
                placeholder="E.g., field_001"
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
                  <Text style={styles.primaryBtnText}>Analyze Farm</Text>
                  <Ionicons name="analytics" size={18} color="white" />
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
              <View style={styles.resultHeaderBox}>
                <Ionicons name="star" size={24} color="#F5C542" />
                <Text style={styles.resultHeader}>Recommended Variety</Text>
              </View>
              <Text style={styles.varietyName}>{result.predicted_variety_code}</Text>
              
              {result.details && (
                <Text style={styles.varietyDesc}>
                  Harvests in {result.details["Age_months"]} months. Ideal for {result.details["Climatic_Zone"]} with an average yield of {result.details["Average_Yield_tha"]} t/ha.
                </Text>
              )}
            </View>
          )}

          {suitability && suitability.field_suitability && (
            <View style={styles.resultCard}>
              <Text style={styles.suitabilityTitle}>IoT Field Status</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: suitability.field_suitability.status === 'Optimal' ? '#DCFCE7' : 
                                 suitability.field_suitability.status === 'Action Required' ? '#FEF2F2' : '#FEF9C3'
              }]}>
                <Text style={[styles.statusText, {
                  color: suitability.field_suitability.status === 'Optimal' ? '#15803D' : 
                         suitability.field_suitability.status === 'Action Required' ? '#DC2626' : '#D97706'
                }]}>
                  {suitability.field_suitability.status}
                </Text>
              </View>

              <Text style={styles.suitabilityMsg}>{suitability.field_suitability.message}</Text>
              
              {suitability.iot_readings && (
                <View style={styles.readingsGrid}>
                  <View style={styles.readingBox}>
                    <Text style={styles.readingLabel}>Temp</Text>
                    <Text style={styles.readingVal}>{suitability.iot_readings.temperature.toFixed(1)}°C</Text>
                  </View>
                  <View style={styles.readingBox}>
                    <Text style={styles.readingLabel}>Humidity</Text>
                    <Text style={styles.readingVal}>{suitability.iot_readings.humidity.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.readingBox}>
                    <Text style={styles.readingLabel}>Moisture</Text>
                    <Text style={styles.readingVal}>{suitability.iot_readings.soil_moisture.toFixed(1)}%</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  heroBg: { ...StyleSheet.absoluteFillObject, height: 250 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: "#0d0d0d" },
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
  resultCard: { backgroundColor: "white", borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  resultHeaderBox: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  resultHeader: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#1F2937", marginLeft: 8 },
  varietyName: { fontFamily: "Poppins_800ExtraBold", fontSize: 32, color: "#0A331D", marginBottom: 8 },
  varietyDesc: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#6B7280", lineHeight: 22 },
  suitabilityTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#1F2937", marginBottom: 16 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start", marginBottom: 12 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  suitabilityMsg: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#4B5563", marginBottom: 20 },
  readingsGrid: { flexDirection: "row", justifyContent: "space-between" },
  readingBox: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12, alignItems: "center", marginHorizontal: 4 },
  readingLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: "#9CA3AF", marginBottom: 4 },
  readingVal: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#1F2937" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 20, padding: 20, width: "100%", maxHeight: "80%" },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#1F2937", marginBottom: 16 },
  modalOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  modalOptionText: { fontFamily: "Poppins_500Medium", fontSize: 16, color: "#4B5563" },
  modalOptionTextActive: { color: "#0A331D", fontFamily: "Poppins_700Bold" },
});
