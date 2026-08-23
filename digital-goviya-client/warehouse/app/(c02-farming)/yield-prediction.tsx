import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
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
import MapView, { Marker } from "react-native-maps";
import { useFarmingAuth } from "@/contexts/FarmingAuthContext";

import { API_URL } from "@/services/c02-farming/apiConfig";

import rawDistrictData from './districtData.json';

const districtData: Record<string, { name: string; lat: number; lon: number }[]> = rawDistrictData;

const DISTRICTS = Object.keys(districtData);
const PADDY_TYPES = ["Bg 352", "At 362", "Samba", "Keeri Samba", "Nadu"];
const UNITS = ["Hectares", "Acres", "Perches"];

const findClosestLocation = (lat: number, lon: number) => {
  let closestDist = Infinity;
  let bestMatch: any = null;

  for (const [district, cities] of Object.entries(districtData)) {
    for (const city of cities) {
      const dist = Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2);
      if (dist < closestDist) {
        closestDist = dist;
        bestMatch = {
          District: district,
          City: city.name,
          lat: city.lat,
          lon: city.lon
        };
      }
    }
  }
  return bestMatch;
};

// Custom Dropdown Component
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
  const { currentUser } = useFarmingAuth();

  const [formData, setFormData] = useState({
    District: "Anuradhapura",
    City: "Anuradhapura City",
    lat: districtData["Anuradhapura"][0].lat,
    lon: districtData["Anuradhapura"][0].lon,
    Total_Land_Size: "1000",
    Land_Size_Unit: "Hectares",
    Paddy_Type: "Bg 352",
    useFirebase: false
  });

  const [envData, setEnvData] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const [region, setRegion] = useState({
    latitude: formData.lat,
    longitude: formData.lon,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  });

  // Fetch Environmental Data automatically when coordinates or IoT switch changes
  useEffect(() => {
    const fetchEnvData = async () => {
      setFetchingData(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/api/environment_data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: formData.lat,
            lon: formData.lon,
            use_firebase: formData.useFirebase
          }),
        });
        if (!response.ok) throw new Error('Failed to fetch environmental data');
        const data = await response.json();
        setEnvData(data);
      } catch (err: any) {
        console.error("Auto-fetch error:", err.message);
      } finally {
        setFetchingData(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchEnvData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.lat, formData.lon, formData.useFirebase]);

  const handleDistrictChange = (d: string) => {
    const city = districtData[d][0];
    setFormData({
      ...formData,
      District: d,
      City: city.name,
      lat: city.lat,
      lon: city.lon
    });
    setRegion({
      latitude: city.lat,
      longitude: city.lon,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    });
  };

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    const match = findClosestLocation(coords.latitude, coords.longitude);
    if (match) {
      setFormData({
        ...formData,
        District: match.District,
        City: match.City,
        lat: coords.latitude,
        lon: coords.longitude
      });
      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    let final_land_size_ha = parseFloat(formData.Total_Land_Size) || 0;
    if (formData.Land_Size_Unit === 'Acres') {
      final_land_size_ha = final_land_size_ha * 0.404686;
    } else if (formData.Land_Size_Unit === 'Perches') {
      final_land_size_ha = final_land_size_ha * 0.00252929;
    }

    const payload = {
      District: formData.District,
      Total_Land_Size: final_land_size_ha,
      Paddy_Type: formData.Paddy_Type,
      lat: formData.lat,
      lon: formData.lon,
      use_firebase: formData.useFirebase
    };

    try {
      const res = await fetch(`${API_URL}/predict_yield_production`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to get yield prediction from the server");
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
      let convertedSize = parseFloat(formData.Total_Land_Size) || 0;
      if (formData.Land_Size_Unit === 'Perches') convertedSize = convertedSize * 0.00252929;
      else if (formData.Land_Size_Unit === 'Acres') convertedSize = convertedSize * 0.404686;

      const payload = {
        user_id: currentUser?.uid || 'mobile_user',
        district: formData.District,
        land_size: convertedSize,
        paddy_type: formData.Paddy_Type,
        predicted_yield_kg_per_ha: result.predicted_yield_kg_per_ha,
        total_yield_kg: getTotalYieldKg(result.predicted_yield_kg_per_ha)
      };

      const res = await fetch(`${API_URL}/api/yield_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus('Saved to Profile ✓');
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        const errText = await res.text();
        console.error('Save yield error:', errText);
        setSaveStatus('Failed to Save');
      }
    } catch (err) {
      console.error('handleSaveToProfile error:', err);
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
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yield Prediction</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {error && (
            <View style={{ backgroundColor: "#FEE2E2", padding: 12, borderRadius: 8, marginBottom: 15 }}>
              <Text style={{ color: "#EF4444", fontFamily: "Poppins_500Medium" }}>{error}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Harvest Parameters</Text>
            
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>Land Size</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.input}
                    value={formData.Total_Land_Size}
                    onChangeText={(t) => setFormData({...formData, Total_Land_Size: t})}
                    keyboardType="numeric"
                    placeholder="E.g. 1000"
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

            <Text style={styles.label}>Paddy Variety</Text>
            <CustomSelect 
              label="Paddy Variety" 
              value={formData.Paddy_Type} 
              options={PADDY_TYPES} 
              onSelect={(v: string) => setFormData({...formData, Paddy_Type: v})} 
            />
            
            <Text style={[styles.label, { marginTop: 10 }]}>District (Map Centers Here)</Text>
            <CustomSelect 
              label="District" 
              value={formData.District} 
              options={DISTRICTS} 
              onSelect={handleDistrictChange} 
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Location via Map</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={region}
                onRegionChangeComplete={(r) => setRegion(r)}
                onPress={handleMapPress}
              >
                <Marker coordinate={{ latitude: formData.lat, longitude: formData.lon }} />
              </MapView>
            </View>

            <View style={styles.mapInfoBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mapInfoLabel}>Nearest City (Auto-detected)</Text>
                <Text style={styles.mapInfoValue}>{formData.City}, {formData.District}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.mapInfoLabel}>Coordinates</Text>
                <Text style={styles.mapInfoCoords}>{formData.lat.toFixed(4)}, {formData.lon.toFixed(4)}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setFormData({...formData, useFirebase: !formData.useFirebase})}
            >
              <Ionicons 
                name={formData.useFirebase ? "checkbox" : "square-outline"} 
                size={24} 
                color={formData.useFirebase ? "#10b981" : "#9CA3AF"} 
              />
              <Text style={styles.checkboxLabel}>Data Get From IoT Device</Text>
            </TouchableOpacity>

            {envData && (
              <View style={styles.envPanel}>
                <View style={styles.envHeader}>
                  <Text style={styles.envTitle}>Live Environmental Factors</Text>
                  {fetchingData && <ActivityIndicator size="small" color="#10b981" />}
                </View>
                
                <View style={styles.envGrid}>
                  <View style={styles.envItem}>
                    <Text style={styles.envItemLabel}>Temp</Text>
                    <Text style={styles.envItemValue}>{envData.Temperature_C?.toFixed(2)}°C</Text>
                  </View>
                  <View style={styles.envItem}>
                    <Text style={styles.envItemLabel}>Humidity</Text>
                    <Text style={styles.envItemValue}>{envData.Humidity?.toFixed(2)}%</Text>
                  </View>
                  <View style={[styles.envItem, { width: "100%", marginTop: 10 }]}>
                    <Text style={styles.envItemLabel}>Soil Moisture</Text>
                    <Text style={styles.envItemValue}>{envData.Soil_Moisture?.toFixed(2)} m³/m³</Text>
                  </View>
                </View>
                <Text style={styles.envFooter}>
                  {formData.useFirebase ? 'Fetched directly from IoT Device' : 'Fetched from 14-day Weather Forecast'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.submitGradient}>
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitText}>Predict Yield & Production</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Production Estimate</Text>
              <View style={styles.productionHighlight}>
                <Text style={styles.productionValue}>{result.total_estimated_production_mt?.toFixed(2)}</Text>
                <Text style={styles.productionUnit}>Metric Tons</Text>
              </View>
              <Text style={styles.productionAltValue}>
                ({getTotalYieldKg(result.predicted_yield_kg_per_ha).toFixed(2)} kg)
              </Text>

              <Text style={[styles.resultSubtitle, { marginTop: 25 }]}>Automated Environmental Data</Text>
              <View style={styles.envGrid}>
                <View style={styles.envItem}>
                  <Text style={styles.envItemLabel}>Temp</Text>
                  <Text style={styles.envItemValue}>{result.environmental_factors.Temperature_C?.toFixed(2)}°C</Text>
                </View>
                <View style={styles.envItem}>
                  <Text style={styles.envItemLabel}>Humidity</Text>
                  <Text style={styles.envItemValue}>{result.environmental_factors.Humidity?.toFixed(2)}%</Text>
                </View>
                <View style={[styles.envItem, { width: "100%", marginTop: 10 }]}>
                  <Text style={styles.envItemLabel}>Soil Moisture</Text>
                  <Text style={styles.envItemValue}>{result.environmental_factors.Soil_Moisture?.toFixed(2)} m³/m³</Text>
                </View>
              </View>

              <View style={styles.yieldBreakdown}>
                <View style={styles.yieldRow}>
                  <Text style={styles.yieldLabel}>Yield per Hectare</Text>
                  <Text style={styles.yieldValue}>{result.predicted_yield_kg_per_ha?.toFixed(2)} kg/ha</Text>
                </View>
                <View style={[styles.yieldRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.yieldLabel}>Total Expected Yield</Text>
                  <Text style={[styles.yieldValue, { color: "#10b981" }]}>
                    {getTotalYieldKg(result.predicted_yield_kg_per_ha).toFixed(2)} kg
                  </Text>
                </View>
              </View>

              <View style={styles.recommendationsBox}>
                <Text style={styles.recommendationsTitle}>Agronomic Recommendations</Text>
                {result.agronomic_recommendations?.map((insight: string, idx: number) => (
                  <View key={idx} style={styles.recommendationBullet}>
                    <Ionicons name="leaf" size={14} color="#10b981" style={{ marginTop: 2, marginRight: 8 }} />
                    <Text style={styles.recommendationText}>{insight}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToProfile}>
                <Text style={styles.saveBtnText}>{saveStatus || 'Save to Profile'}</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  heroBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 20,
    color: "white",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  input: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#1F2937",
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapInfoBox: {
    backgroundColor: "#F8FAFC",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  mapInfoLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#64748B",
    marginBottom: 2,
  },
  mapInfoValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#1E293B",
  },
  mapInfoCoords: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#3B82F6",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  checkboxLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#374151",
    marginLeft: 10,
  },
  envPanel: {
    backgroundColor: "#F0FDF4",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  envHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  envTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    color: "#059669",
  },
  envGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  envItem: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.6)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(167,243,208,0.5)",
  },
  envItemLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#64748B",
  },
  envItemValue: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#0F172A",
  },
  envFooter: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 15,
  },
  submitBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  submitText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  resultTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: "#1F2937",
    marginBottom: 10,
    textAlign: "center",
  },
  productionHighlight: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  productionValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 48,
    color: "#10B981",
  },
  productionUnit: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#64748B",
    marginLeft: 8,
  },
  productionAltValue: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#3B82F6",
    textAlign: "center",
    marginTop: 5,
  },
  resultSubtitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#10B981",
    marginBottom: 15,
  },
  yieldBreakdown: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  yieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  yieldLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#4B5563",
  },
  yieldValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#1F2937",
  },
  recommendationsBox: {
    backgroundColor: "#F0FDF4",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  recommendationsTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#059669",
    marginBottom: 12,
  },
  recommendationBullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  recommendationText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#1F2937",
    flex: 1,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
  },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "white",
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 15,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalOptionText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    color: "#4B5563",
  },
  modalOptionTextActive: {
    color: "#0A331D",
    fontFamily: "Poppins_600SemiBold",
  },
});
