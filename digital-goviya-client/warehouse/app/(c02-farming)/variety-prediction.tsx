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
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../i18n";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFarmingAuth } from "@/contexts/FarmingAuthContext";
import { Platform, Alert } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import FarmerGuidance from "@/components/FarmerGuidance";
import FertilizerSummary from "@/components/FertilizerSummary";

let MapView: any = View;
let Marker: any = View;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

import { API_URL } from "@/services/c02-farming/apiConfig";
import rawDistrictData from "./districtData.json";

const districtData: Record<string, {name: string, lat: number, lon: number}[]> = rawDistrictData;
const DISTRICTS = Object.keys(districtData).sort();

const ZONES = ["Dry Zone", "Wet Zone", "Intermediate Zone"];
const SEASONS = ["Maha", "Yala", "Annual"];
const IRRIGATION_METHODS = ["Irrigated", "Rainfed"];
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

// districtData is imported from districtData.json

const districtToZoneMap: Record<string, string> = {
  "Anuradhapura": "Dry Zone", "Polonnaruwa": "Dry Zone", "Ampara": "Dry Zone", "Hambantota": "Dry Zone", "Trincomalee": "Dry Zone", "Batticaloa": "Dry Zone", "Puttalam": "Dry Zone", "Mannar": "Dry Zone", "Vavuniya": "Dry Zone", "Kilinochchi": "Dry Zone", "Mullaitivu": "Dry Zone", "Jaffna": "Dry Zone", "Moneragala": "Dry Zone", "Kurunegala": "Intermediate Zone", "Badulla": "Intermediate Zone", "Matale": "Intermediate Zone", "Kandy": "Wet Zone", "Nuwara Eliya": "Wet Zone", "Kegalle": "Wet Zone", "Ratnapura": "Wet Zone", "Colombo": "Wet Zone", "Gampaha": "Wet Zone", "Kalutara": "Wet Zone", "Galle": "Wet Zone", "Matara": "Wet Zone"
};

export default function VarietyPredictionScreen() {
  const { language } = useLanguage();
  const t = translations[language].c02Farming.varietyPrediction;
  const yt = translations[language].c02Farming.yieldPrediction;
  const { currentUser } = useFarmingAuth();

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
    Irrigation: "Irrigated",
    Cultivation_Date: new Date(),
    useFirebase: false
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [envData, setEnvData] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(false);

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
            lat: parseFloat(formData.lat) || 8.3114,
            lon: parseFloat(formData.lon) || 80.4037,
            use_firebase: formData.useFirebase,
            field_id: formData.field_id
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
  }, [formData.lat, formData.lon, formData.useFirebase, formData.field_id]);

  const findClosestLocation = (lat: number, lon: number) => {
    let bestMatch = null;
    let minDistance = Infinity;

    for (const district in districtData) {
      for (const city of districtData[district]) {
        const dLat = city.lat - lat;
        const dLon = city.lon - lon;
        const distance = Math.sqrt(dLat * dLat + dLon * dLon);

        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = { District: district, City: city.name, Zone: districtToZoneMap[district] || 'Dry Zone' };
        }
      }
    }
    return bestMatch;
  };

  const onMapClick = (e: any) => {
    const clickedLat = e.nativeEvent.coordinate.latitude;
    const clickedLon = e.nativeEvent.coordinate.longitude;
    const match = findClosestLocation(clickedLat, clickedLon);

    if (match) {
      setFormData({
        ...formData,
        District: match.District,
        City: match.City,
        Zone: match.Zone,
        lat: clickedLat.toString(),
        lon: clickedLon.toString()
      });
    } else {
      setFormData({
        ...formData,
        lat: clickedLat.toString(),
        lon: clickedLon.toString()
      });
    }
  };

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suitability, setSuitability] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const uid = currentUser?.uid;
      if (!uid) return;
      const res = await fetch(`${API_URL}/api/history/${uid}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryData(data || []);
      }
    } catch (err) {
      console.log("History fetch error", err);
    }
  };

  const deleteHistory = async (recordId: string) => {
    try {
      const uid = currentUser?.uid || 'mobile_user';
      const res = await fetch(`${API_URL}/api/history/${uid}/${recordId}`, { method: 'DELETE' });
      if (res.ok) fetchHistory();
    } catch (err) {
      console.log("Failed to delete record", err);
    }
  };

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
        `${API_URL}/predict_suitability?field_id=${formData.field_id}&lat=${formData.lat}&lon=${formData.lon}&use_firebase=${formData.useFirebase}`
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

  const handleSaveToProfile = async () => {
    if (!result || !suitability) return;
    setSaveStatus(yt.saving);
    try {
      const payload = {
        user_id: currentUser?.uid || 'mobile_user',
        field_id: formData.field_id,
        district: formData.District,
        city: formData.City,
        zone: formData.Zone,
        season: formData.Season,
        predicted_variety: result.predicted_variety_code,
        suitability_score: suitability.suitability_score || 0
      };

      const res = await fetch(`${API_URL}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus(yt.savedProfile);
        setTimeout(() => setSaveStatus(''), 3000);
        fetchHistory(); // Refresh list
      } else {
        setSaveStatus(yt.failedSave);
      }
    } catch (err) {
      setSaveStatus(yt.failedSave);
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
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{yt.selectLocation}</Text>
            <View style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
              {Platform.OS === 'web' ? (
                <Text style={{ color: '#6B7280' }}>Map is not supported on web. Please select from dropdowns.</Text>
              ) : (
                <MapView
                  style={{ flex: 1, width: '100%' }}
                  region={{
                    latitude: parseFloat(formData.lat) || 8.3114,
                    longitude: parseFloat(formData.lon) || 80.4037,
                    latitudeDelta: 1.5,
                    longitudeDelta: 1.5,
                  }}
                  onPress={onMapClick}
                >
                  <Marker
                    coordinate={{
                      latitude: parseFloat(formData.lat) || 8.3114,
                      longitude: parseFloat(formData.lon) || 80.4037,
                    }}
                    title="Selected Location"
                  />
                </MapView>
              )}
            </View>

            <Text style={styles.cardTitle}>{t.farmDetails}</Text>
            
            <Text style={styles.label}>{t.district}</Text>
            <CustomSelect 
              label="District" 
              value={formData.District} 
              options={DISTRICTS} 
              onSelect={handleDistrictChange} 
            />
            
            <Text style={styles.label}>{t.city}</Text>
            <CustomSelect 
              label="City" 
              value={formData.City} 
              options={currentCities} 
              onSelect={handleCityChange} 
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>{t.climaticZone}</Text>
                <CustomSelect 
                  label="Zone" 
                  value={formData.Zone} 
                  options={ZONES} 
                  onSelect={(v: string) => setFormData({...formData, Zone: v})} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.season}</Text>
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
                <Text style={styles.label}>{t.irrigationMethod}</Text>
                <CustomSelect 
                  label="Irrigation Method" 
                  value={formData.Irrigation} 
                  options={IRRIGATION_METHODS} 
                  onSelect={(v: string) => setFormData({...formData, Irrigation: v})} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.cultivationDate}</Text>
                <TouchableOpacity 
                  style={[styles.inputBox, { justifyContent: 'center' }]} 
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.input}>
                    {formData.Cultivation_Date.toISOString().split('T')[0]}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.Cultivation_Date}
                    mode="date"
                    display="default"
                    onChange={(event: any, selectedDate?: Date) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setFormData({...formData, Cultivation_Date: selectedDate});
                      }
                    }}
                  />
                )}
              </View>
            </View>

            <Text style={styles.label}>{t.iotFieldId}</Text>
            <View style={styles.inputBox}>
              <TextInput 
                style={[styles.input, { flex: 1 }]}
                value={formData.field_id}
                onChangeText={(t) => setFormData({...formData, field_id: t})}
                placeholder="E.g., field_001"
              />
            </View>

            <TouchableOpacity 
              style={[styles.inputBox, { marginBottom: 15, marginTop: 10, justifyContent: 'flex-start' }]} 
              onPress={() => setFormData({...formData, useFirebase: !formData.useFirebase})}
            >
              <Ionicons 
                name={formData.useFirebase ? "checkbox" : "square-outline"} 
                size={24} 
                color={formData.useFirebase ? "#10b981" : "#9CA3AF"} 
              />
              <Text style={[styles.label, { marginBottom: 0, marginLeft: 10 }]}>{yt.dataFromIot}</Text>
            </TouchableOpacity>

            {envData && (
              <View style={{ backgroundColor: "#F0FDF4", padding: 15, borderRadius: 12, borderWidth: 1, borderColor: "#A7F3D0", marginBottom: 20 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#059669" }}>{yt.liveEnv.replace(" (IoT Device)", "")}</Text>
                  {fetchingData && <ActivityIndicator size="small" color="#10b981" />}
                </View>
                
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                  <View style={{ width: "48%", backgroundColor: "rgba(255,255,255,0.6)", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "rgba(167,243,208,0.5)" }}>
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: "#64748B" }}>{yt.temp}</Text>
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#0F172A" }}>{envData.Temperature_C?.toFixed(2)}°C</Text>
                  </View>
                  <View style={{ width: "48%", backgroundColor: "rgba(255,255,255,0.6)", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "rgba(167,243,208,0.5)" }}>
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: "#64748B" }}>{yt.humidity}</Text>
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#0F172A" }}>{envData.Humidity?.toFixed(2)}%</Text>
                  </View>
                  <View style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.6)", padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "rgba(167,243,208,0.5)", marginTop: 10 }}>
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: "#64748B" }}>{yt.soilMoisture}</Text>
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: "#0F172A" }}>{envData.Soil_Moisture?.toFixed(2)} m³/m³</Text>
                  </View>
                </View>
                
              </View>
            )}

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.primaryBtnText}>{t.analyzeFarm}</Text>
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
            <View style={[styles.resultCard, { borderColor: '#BBF7D0', borderWidth: 1, backgroundColor: '#F0FDF4' }]}>
              <View style={styles.resultHeaderBox}>
                <View style={{ backgroundColor: '#D1FAE5', padding: 10, borderRadius: 12, marginRight: 10 }}>
                  <Text style={{ fontSize: 24 }}>🌾</Text>
                </View>
                <View>
                  <Text style={[styles.resultHeader, { color: '#065F46', marginLeft: 0 }]}>{t.optimalVariety}</Text>
                  <Text style={{ color: '#059669', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.aiRecommended}</Text>
                </View>
              </View>
              <View style={{ backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, alignSelf: 'flex-start', marginBottom: 20 }}>
                <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Poppins_700Bold' }}>{result.predicted_variety_code}</Text>
              </View>
              
              {result.details && (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                    <Text style={{ color: '#64748B', fontFamily: 'Poppins_500Medium' }}>{t.grainType}</Text>
                    <Text style={{ color: '#0F172A', fontFamily: 'Poppins_600SemiBold' }}>{result.details.Grain_Type}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }}>
                    <Text style={{ color: '#64748B', fontFamily: 'Poppins_500Medium' }}>{t.ageGroup}</Text>
                    <Text style={{ color: '#0F172A', fontFamily: 'Poppins_600SemiBold' }}>{result.details.Age_Group}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#64748B', fontFamily: 'Poppins_500Medium' }}>{t.category}</Text>
                    <Text style={{ color: '#0F172A', fontFamily: 'Poppins_600SemiBold' }}>{result.details.Category}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {suitability && (
            <View style={[styles.resultCard, { borderColor: '#BFDBFE', borderWidth: 1, backgroundColor: '#EFF6FF' }]}>
              <View style={styles.resultHeaderBox}>
                <View style={{ backgroundColor: '#DBEAFE', padding: 10, borderRadius: 12, marginRight: 10 }}>
                  <Text style={{ fontSize: 24 }}>🛰️</Text>
                </View>
                <View>
                  <Text style={[styles.resultHeader, { color: '#1E3A8A', marginLeft: 0 }]}>{t.fieldSuitability}</Text>
                  <Text style={{ color: '#2563EB', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.realTimeIoT}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'center', marginBottom: 25, marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>
                  {[1, 2, 3, 4, 5].map((level) => {
                    const score = suitability.suitability_score;
                    const blocksToFill = 6 - score; // Score 1 -> 5 blocks, Score 5 -> 1 block
                    const isActive = level <= blocksToFill;
                    
                    let activeColor = '#10B981'; // Default Green (for 1 and 2)
                    if (score === 1) activeColor = '#10B981'; // Green
                    else if (score === 2) activeColor = '#84CC16'; // Light Green
                    else if (score === 3) activeColor = '#F59E0B'; // Yellow/Orange
                    else if (score === 4) activeColor = '#F97316'; // Orange
                    else if (score === 5) activeColor = '#EF4444'; // Red
                    
                    return (
                      <View key={level} style={{
                        width: 45, 
                        height: 12, 
                        borderRadius: 6, 
                        backgroundColor: isActive ? activeColor : '#E2E8F0',
                        marginHorizontal: 4,
                        shadowColor: isActive ? activeColor : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isActive ? 0.4 : 0,
                        shadowRadius: 4,
                        elevation: isActive ? 4 : 0,
                      }} />
                    )
                  })}
                </View>
                
                {(() => {
                  const s = suitability.suitability_score;
                  const labels = {
                    1: { text: t.excellent, desc: t.excellentDesc, color: "#10B981" },
                    2: { text: t.good, desc: t.goodDesc, color: "#84CC16" },
                    3: { text: t.moderate, desc: t.moderateDesc, color: "#F59E0B" },
                    4: { text: t.poor, desc: t.poorDesc, color: "#F97316" },
                    5: { text: t.veryPoor, desc: t.veryPoorDesc, color: "#EF4444" }
                  };
                  const current = labels[s as keyof typeof labels] || labels[1];
                  return (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 24, fontFamily: 'Poppins_700Bold', color: current.color }}>
                        {s}/5 {current.text}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#64748B', fontFamily: 'Poppins_500Medium', marginTop: 2 }}>{current.desc}</Text>
                    </View>
                  );
                })()}
              </View>

              <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 }}>
                <Text style={{ fontFamily: 'Poppins_500Medium', color: '#334155', lineHeight: 22 }}>
                  💡 {suitability.reasoning}
                </Text>
              </View>
              
              {suitability.metrics && (
                <View style={styles.readingsGrid}>
                  <View style={[styles.readingBox, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                    <Text style={{ fontSize: 24, marginBottom: 5 }}>🌡️</Text>
                    <Text style={styles.readingLabel}>{yt.temp}</Text>
                    <Text style={styles.readingVal}>{suitability.metrics.temperature}°C</Text>
                  </View>
                  <View style={[styles.readingBox, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                    <Text style={{ fontSize: 24, marginBottom: 5 }}>💧</Text>
                    <Text style={styles.readingLabel}>{yt.humidity}</Text>
                    <Text style={styles.readingVal}>{suitability.metrics.humidity}%</Text>
                  </View>
                  <View style={[styles.readingBox, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                    <Text style={{ fontSize: 24, marginBottom: 5 }}>🌱</Text>
                    <Text style={styles.readingLabel}>{yt.soilMoisture}</Text>
                    <Text style={styles.readingVal}>{suitability.metrics.soil_moisture}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {result && suitability && (
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 10, marginBottom: 20, backgroundColor: "#2563EB" }]}
              onPress={handleSaveToProfile}
              disabled={saveStatus === 'Saving...'}
            >
              <Text style={styles.primaryBtnText}>{saveStatus || t.saveHistory}</Text>
            </TouchableOpacity>
          )}

          {result && result.details && (
            <>
              <FarmerGuidance 
                variety={result.predicted_variety_code}
                ageGroup={result.details.Age_Group}
                zone={formData.Zone}
                irrigation={formData.Irrigation}
                cultivationDate={formData.Cultivation_Date}
              />
              <FertilizerSummary 
                zone={formData.Zone}
                ageGroup={result.details.Age_Group}
                irrigation={formData.Irrigation}
              />
            </>
          )}

          {/* History Section */}
          {historyData.length > 0 && (
            <View style={{ marginTop: 30 }}>
              <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1E293B', marginBottom: 15 }}>{t.savedHistory}</Text>
              {historyData.map(row => (
                <TouchableOpacity 
                  key={row.id}
                  style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
                  onPress={() => setSelectedHistory(row)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#1E293B', fontSize: 15 }}>{row.field_id}</Text>
                    <Text style={{ fontFamily: 'Poppins_400Regular', color: '#64748B', fontSize: 12 }}>{row.city}, {row.district}</Text>
                    <Text style={{ fontFamily: 'Poppins_700Bold', color: '#10B981', fontSize: 14, marginTop: 4 }}>{row.predicted_variety} <Text style={{ color: '#94A3B8', fontSize: 12 }}>({row.suitability_score}/5)</Text></Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteHistory(row.id)} style={{ padding: 10 }}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </ScrollView>
      </View>

      {/* History Details Modal */}
      <Modal visible={!!selectedHistory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500 }]}>
            <TouchableOpacity onPress={() => setSelectedHistory(null)} style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 10, marginBottom: 20 }}>
              Advisory Details
            </Text>

            {selectedHistory && (
              <ScrollView>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <View style={{ width: '48%', marginBottom: 15 }}>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.fieldId}</Text>
                    <Text style={{ color: '#1E293B', fontSize: 14, fontFamily: 'Poppins_700Bold' }}>{selectedHistory.field_id}</Text>
                  </View>
                  <View style={{ width: '48%', marginBottom: 15 }}>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.location}</Text>
                    <Text style={{ color: '#1E293B', fontSize: 14, fontFamily: 'Poppins_700Bold' }}>{selectedHistory.city}, {selectedHistory.district}</Text>
                  </View>
                  <View style={{ width: '48%', marginBottom: 15 }}>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.climaticZone}</Text>
                    <Text style={{ color: '#1E293B', fontSize: 14, fontFamily: 'Poppins_700Bold' }}>{selectedHistory.zone}</Text>
                  </View>
                  <View style={{ width: '48%', marginBottom: 15 }}>
                    <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.season}</Text>
                    <Text style={{ color: '#1E293B', fontSize: 14, fontFamily: 'Poppins_700Bold' }}>{selectedHistory.season}</Text>
                  </View>
                </View>

                <View style={{ backgroundColor: '#F8FAFC', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 }}>
                  <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.predOptimalVariety}</Text>
                  <Text style={{ color: '#10B981', fontSize: 24, fontFamily: 'Poppins_700Bold' }}>{selectedHistory.predicted_variety}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: '#64748B', fontSize: 12, fontFamily: 'Poppins_500Medium' }}>{t.fieldSuitability}</Text>
                  {(() => {
                    const s = selectedHistory.suitability_score;
                    const c = s === 1 ? '#10B981' : s === 2 ? '#84CC16' : s === 3 ? '#F59E0B' : s === 4 ? '#F97316' : '#EF4444';
                    const t_label = s === 1 ? t.excellent : s === 2 ? t.good : s === 3 ? t.moderate : s === 4 ? t.poor : t.veryPoor;
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Text style={{ color: c, fontSize: 16, fontFamily: 'Poppins_700Bold', marginRight: 6 }}>{t_label}</Text>
                        <View style={{ backgroundColor: c, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 12 }}>{s}/5</Text>
                        </View>
                      </View>
                    )
                  })()}
                </View>

                {selectedHistory.created_at && (
                  <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'right', marginTop: 10 }}>
                    Saved on: {new Date(selectedHistory.created_at + 'Z').toLocaleString()}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 18, color: "#ffffffff" },
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


