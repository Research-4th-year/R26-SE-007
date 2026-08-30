import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { useFarmingAuth } from "@/contexts/FarmingAuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../i18n";
import enDiseaseData from "../../assets/data/disease-advisory.json";
import siDiseaseData from "../../assets/data/disease-advisory-si.json";

// const API_URL = "http://127.0.0.1:8000";
// Update this to the IP of the machine running the FastAPI backend
//    – Android emulator: 10.0.2.2
//    – iOS simulator:   http://localhost
//    – Physical device:  http://<your‑local‑ip> 192.168.8.105
// const API_URL = "http://127.0.0.1:8000";
// const API_URL = "http://localhost:8000";
import { API_URL } from "@/services/c02-farming/apiConfig";


export default function DiseaseDetectionScreen() {
  const { currentUser } = useFarmingAuth();
  const { language } = useLanguage();
  const t = translations[language].c02Farming.diseaseAdvisory;
  const tMain = translations[language].c02Farming.diseaseDetection;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  
  const [history, setHistory] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/disease_history/${currentUser?.uid || 'mobile_user'}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.log('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const getAdvisoryData = (diseaseName: string) => {
    const normalizedName = diseaseName.toLowerCase().replace(/\s+/g, '_');
    const dataset = language === 'si' ? siDiseaseData : enDiseaseData;
    return dataset.diseases.find((d: any) => d.id === normalizedName);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
        setResult(null);
        setError(null);
      }
    } catch (err) {
      setError("Error picking image.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Sorry, we need camera permissions to make this work!');
        return;
      }

      let pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
        setResult(null);
        setError(null);
      }
    } catch (err) {
      setError("Error taking photo.");
    }
  };

  const analyzeImage = async () => {
    if (!imageUri) return;
    setLoading(true);
    setError(null);

    try {
      const filename = imageUri.split('/').pop() || 'image.jpeg';
      const match = /\.(\w+)$/.exec(filename);
      let mimeType = match ? `image/${match[1]}` : `image/jpeg`;
      if (mimeType === 'image/jpg') mimeType = 'image/jpeg';

      const formData = new FormData();
      // Standard React Native way to append files to FormData
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: mimeType
      } as any);

      const response = await fetch(`${API_URL}/predict_disease`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Analysis failed (${response.status}): ${errText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProfile = async () => {
    if (!result) return;
    setSaveStatus('Saving...');
    try {
      const payload = {
        user_id: currentUser?.uid || 'mobile_user',
        disease_name: result.disease,
        disease_type: result.disease_type,
        confidence: result.confidence
      };

      const res = await fetch(`${API_URL}/api/disease_history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveStatus('Saved to Profile');
        fetchHistory();
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Failed to Save');
      }
    } catch (err) {
      setSaveStatus('Failed to Save');
    }
  };

  const renderAdvisory = (diseaseName: string) => {
    const data = getAdvisoryData(diseaseName);
    if (!data) return null;

    return (
      <View style={styles.advisoryContainer}>
        {/* Symptoms Section */}
        {data.symptoms && (
          <View style={[styles.advisoryBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
            <View style={styles.boxHeaderRow}>
              {/* <Ionicons name="medical" size={18} color="#DC2626" /> */}
              <Text style={[styles.boxTitle, { color: '#B91C1C' }]}>{t.symptoms}</Text>
            </View>
            {data.symptoms.map((symptom: string, idx: number) => (
              <Text key={idx} style={[styles.boxText, { color: '#7F1D1D' }]}>• {symptom}</Text>
            ))}
          </View>
        )}

        {/* Prevention Section */}
        {data.prevention && (
          <View style={[styles.advisoryBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <View style={styles.boxHeaderRow}>
              {/* <Ionicons name="shield-checkmark" size={18} color="#16A34A" /> */}
              <Text style={[styles.boxTitle, { color: '#15803D' }]}>{t.prevention}</Text>
            </View>
            {data.prevention.map((item: string, idx: number) => (
              <Text key={idx} style={[styles.boxText, { color: '#14532D' }]}>• {item}</Text>
            ))}
          </View>
        )}

        {/* Fertilizer & Chemical Guidance Section */}
        {data.fertilizer && (
          <View style={[styles.advisoryBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={styles.boxHeaderRow}>
              {/* <Ionicons name="leaf" size={18} color="#D97706" /> */}
              <Text style={[styles.boxTitle, { color: '#B45309' }]}>{t.fertilizer}</Text>
            </View>
            {data.fertilizer.nitrogen && data.fertilizer.nitrogen.map((item: string, idx: number) => (
              <Text key={`n-${idx}`} style={[styles.boxText, { color: '#78350F' }]}>• <Text style={{ fontWeight: 'bold' }}>{t.nitrogen}:</Text> {item}</Text>
            ))}
            {data.fertilizer.potassium && data.fertilizer.potassium.map((item: string, idx: number) => (
              <Text key={`p-${idx}`} style={[styles.boxText, { color: '#78350F' }]}>• <Text style={{ fontWeight: 'bold' }}>{t.potassium}:</Text> {item}</Text>
            ))}
            {data.fertilizer.general && data.fertilizer.general.map((item: string, idx: number) => (
              <Text key={`g-${idx}`} style={[styles.boxText, { color: '#78350F' }]}>• <Text style={{ fontWeight: 'bold' }}>{t.general}:</Text> {item}</Text>
            ))}
            {data.fertilizer.reason && (
              <Text style={[styles.boxText, { color: '#78350F', marginTop: 10, fontStyle: 'italic' }]}>
                <Text style={{ fontWeight: 'bold' }}>{t.reason}:</Text> {data.fertilizer.reason}
              </Text>
            )}
          </View>
        )}

        {/* Chemical Treatment Section */}
        {data.chemical && (
          <View style={[styles.advisoryBox, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
            <View style={styles.boxHeaderRow}>
              {/* <Ionicons name="flask" size={18} color="#475569" /> */}
              <Text style={[styles.boxTitle, { color: '#334155' }]}>{t.chemical}</Text>
            </View>
            {data.chemical.instruction && (
              <Text style={[styles.boxText, { color: '#475569' }]}>
                {data.chemical.instruction}
              </Text>
            )}
          </View>
        )}
      </View>
    );
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tMain.headerTitle}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{tMain.cardTitle}</Text>
            <Text style={styles.cardDesc}>
              {tMain.cardDesc}
            </Text>

            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                <Text style={styles.placeholderText}>{tMain.noImage}</Text>
              </View>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                <Ionicons name="images" size={20} color="#15803D" />
                <Text style={styles.actionBtnText}>{tMain.gallery}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color="#15803D" />
                <Text style={styles.actionBtnText}>{tMain.camera}</Text>
              </TouchableOpacity>
            </View>

            {imageUri && (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={analyzeImage}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>{tMain.analyze}</Text>
                    <Ionicons name="scan" size={18} color="white" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={20} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {result && (
            <View>
              <View style={styles.resultCard}>
                <Text style={styles.resultHeader}>{tMain.analysisResult}</Text>
                
                <Text style={[
                  styles.diseaseName,
                  { color: result.disease.toLowerCase() === 'healthy' ? '#10B981' : result.disease.toLowerCase() === 'another type' ? '#6B7280' : '#EF4444' }
                ]}>
                  {result.disease.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase())}
                </Text>
                
                <View style={styles.metricRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{tMain.type}</Text>
                    <Text style={[
                      styles.metricValue, 
                      { color: result.disease_type === 'Fungal' ? '#D97706' : result.disease_type === 'Bacterial' ? '#DC2626' : '#374151' }
                    ]}>
                      {result.disease_type}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{tMain.confidence}</Text>
                    <Text style={styles.metricValue}>{result.confidence.toFixed(1)}%</Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 20, backgroundColor: "#3B82F6", width: '100%' }]}
                  onPress={handleSaveToProfile}
                >
                  <Text style={styles.primaryBtnText}>{saveStatus || tMain.saveToProfile}</Text>
                </TouchableOpacity>
              </View>

              {renderAdvisory(result.disease)}
            </View>
          )}

          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historySectionTitle}>{tMain.pastPredictions}</Text>
              {history.map((item, index) => {
                const formattedName = item.disease_name.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase());
                let dateStr = "Unknown Date";
                if (item.created_at) {
                  const dateObj = new Date(item.created_at);
                  dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }
                
                return (
                  <TouchableOpacity 
                    key={item.id || index} 
                    style={styles.historyCard}
                    onPress={() => {
                      setSelectedHistoryItem(item);
                      setModalVisible(true);
                    }}
                  >
                    <View style={styles.historyCardLeft}>
                      <Text style={styles.historyDiseaseName}>{formattedName}</Text>
                      <Text style={styles.historyDate}>{dateStr}</Text>
                    </View>
                    <View style={styles.historyCardRight}>
                      <Text style={styles.historyConfidence}>{item.confidence ? item.confidence.toFixed(0) + '%' : ''}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedHistoryItem ? selectedHistoryItem.disease_name.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase()) : ''}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {selectedHistoryItem && renderAdvisory(selectedHistoryItem.disease_name)}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    color: "#141414ff",
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
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 20,
  },
  placeholderBox: {
    width: '100%',
    height: 200,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  placeholderText: {
    fontFamily: "Poppins_500Medium",
    color: "#9CA3AF",
    marginTop: 10,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#DCFCE7",
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  actionBtnText: {
    fontFamily: "Poppins_600SemiBold",
    color: "#15803D",
    marginLeft: 8,
  },
  primaryBtn: {
    backgroundColor: "#0A331D",
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0A331D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontFamily: "Poppins_600SemiBold",
    color: "white",
    fontSize: 16,
    marginRight: 10,
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    color: "#DC2626",
    marginLeft: 10,
    flex: 1,
  },
  resultCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  resultHeader: {
    fontFamily: "Poppins_600SemiBold",
    color: "#6B7280",
    fontSize: 14,
    marginBottom: 10,
  },
  diseaseName: {
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 28,
    textAlign: "center",
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
    paddingTop: 20,
  },
  metricItem: {
    alignItems: "center",
  },
  metricLabel: {
    fontFamily: "Poppins_500Medium",
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#1F2937",
  },
  advisoryContainer: {
    marginTop: 20,
    gap: 16,
  },
  advisoryBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  boxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  boxTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  boxText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 20,
  },
  historySection: {
    marginTop: 10,
    marginBottom: 40,
  },
  historySectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyCardLeft: {
    flex: 1,
  },
  historyDiseaseName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#111827',
  },
  historyDate: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyConfidence: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#3B82F6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    padding: 20,
    paddingTop: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: '#1F2937',
  },
  modalCloseBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  }
});
