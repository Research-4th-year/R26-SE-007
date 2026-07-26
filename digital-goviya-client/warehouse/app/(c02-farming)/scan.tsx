import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import * as DocumentPicker from "expo-document-picker";
import { predictDisease } from "@/services/farming/api";

export default function ScanLeafScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePickImage = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImageUri(res.assets[0].uri);
        setResult(null); // Reset previous result
      }
    } catch (err) {
      console.error("Error picking image", err);
      Alert.alert("Error", "Failed to select image.");
    }
  };

  const handleScan = async () => {
    if (!imageUri) {
      Alert.alert("No Image", "Please select an image first.");
      return;
    }

    setLoading(true);
    try {
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const imageFile = {
        uri: imageUri,
        name: filename,
        type,
      };

      // Optional: mock sensors data if needed, or pass empty
      const sensors = {
        temperature: 30,
        humidity: 60,
        rain: 0,
      };

      const res = await predictDisease(imageFile, sensors);
      setResult(res);
    } catch (err) {
      Alert.alert("Analysis Failed", "Could not analyze the leaf. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaf Disease Scanner</Text>
        <Text style={styles.subtitle}>Upload a photo of the affected leaf for AI analysis</Text>
      </View>

      <View style={styles.content}>
        {/* Upload Area */}
        <TouchableOpacity style={styles.uploadArea} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <>
              <Ionicons name="images-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.uploadText}>Tap to Select an Image</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.scanButton, !imageUri && styles.scanButtonDisabled]} 
          onPress={handleScan}
          disabled={!imageUri || loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="scan" size={20} color={COLORS.white} style={styles.scanIcon} />
              <Text style={styles.scanButtonText}>Analyze Leaf</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Prediction Result */}
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Prediction Result</Text>
          {result ? (
            <View style={[styles.resultBox, { borderColor: COLORS.primary }]}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <Text style={styles.resultDisease}>{result.disease || result.predicted_class || "Analysis Complete"}</Text>
              </View>
              {result.confidence && (
                <Text style={styles.confidenceText}>
                  Confidence: {(result.confidence * 100).toFixed(2)}%
                </Text>
              )}
              {result.treatment && (
                <View style={styles.treatmentBox}>
                  <Text style={styles.treatmentTitle}>Recommended Treatment</Text>
                  <Text style={styles.treatmentText}>{result.treatment}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyResultBox}>
              <Ionicons name="scan-outline" size={32} color={COLORS.textFaint} />
              <Text style={styles.resultPlaceholder}>
                Awaiting image scan...
              </Text>
            </View>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  header: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadArea: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 16,
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  scanButtonDisabled: {
    backgroundColor: COLORS.textFaint,
  },
  scanIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  resultContainer: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  emptyResultBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    height: 150,
  },
  resultPlaceholder: {
    marginTop: 12,
    color: COLORS.textFaint,
    fontSize: 16,
  },
  resultBox: {
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  resultDisease: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.successText,
    marginLeft: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  treatmentBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  treatmentTitle: {
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  treatmentText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacer: { height: 32 },
});
