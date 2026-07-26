import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

export default function ScanLeafScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaf Disease Scanner</Text>
        <Text style={styles.subtitle}>Upload or capture a photo of the affected leaf</Text>
      </View>

      <View style={styles.content}>
        {/* Camera/Upload Area */}
        <TouchableOpacity style={styles.uploadArea}>
          <Ionicons name="camera-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.uploadText}>Tap to Capture or Upload Image</Text>
        </TouchableOpacity>

        {/* Prediction Result Placeholder */}
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Prediction Result</Text>
          <View style={styles.resultBox}>
            <Ionicons name="scan-outline" size={32} color={COLORS.textFaint} />
            <Text style={styles.resultPlaceholder}>
              Awaiting image scan...
            </Text>
          </View>
        </View>
      </View>
      
      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.scanButton}>
          <Ionicons name="scan" size={20} color={COLORS.white} style={styles.scanIcon} />
          <Text style={styles.scanButtonText}>Analyze Leaf</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: 24,
  },
  uploadText: {
    color: COLORS.textMuted,
    marginTop: 12,
    fontSize: 16,
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
  resultBox: {
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
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  scanIcon: {
    marginRight: 8,
  },
  scanButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});
