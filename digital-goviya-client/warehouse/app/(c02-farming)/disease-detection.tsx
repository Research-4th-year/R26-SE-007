import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from 'expo-image-picker';
import { authService } from "@/services/shared/auth.service";

const API_URL = "http://127.0.0.1:8000";

export default function DiseaseDetectionScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await fetch(`${API_URL}/predict_disease`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Ensure the server is running.");
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
      const user = await authService.getStoredUser();
      const payload = {
        user_id: user?.id || 'mobile_user',
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
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('Failed to Save');
      }
    } catch (err) {
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Disease Detection</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Upload Leaf Image</Text>
            <Text style={styles.cardDesc}>
              Upload or snap a picture of a paddy leaf to check for Fungal or Bacterial diseases.
            </Text>

            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                <Ionicons name="images" size={20} color="#15803D" />
                <Text style={styles.actionBtnText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={20} color="#15803D" />
                <Text style={styles.actionBtnText}>Camera</Text>
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
                    <Text style={styles.primaryBtnText}>Analyze Image</Text>
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
            <View style={styles.resultCard}>
              <Text style={styles.resultHeader}>Analysis Result</Text>
              
              <Text style={[
                styles.diseaseName,
                { color: result.disease.toLowerCase() === 'healthy' ? '#10B981' : result.disease.toLowerCase() === 'another type' ? '#6B7280' : '#EF4444' }
              ]}>
                {result.disease.replace(/_/g, ' ').toUpperCase()}
              </Text>
              
              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Type</Text>
                  <Text style={[
                    styles.metricValue, 
                    { color: result.disease_type === 'Fungal' ? '#D97706' : result.disease_type === 'Bacterial' ? '#DC2626' : '#374151' }
                  ]}>
                    {result.disease_type}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Confidence</Text>
                  <Text style={styles.metricValue}>{result.confidence.toFixed(1)}%</Text>
                </View>
              </View>
              
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
});
