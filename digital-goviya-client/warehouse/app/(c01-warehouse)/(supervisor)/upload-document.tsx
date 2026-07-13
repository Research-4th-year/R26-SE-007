import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { api } from "@/services/shared/api";
import { COLORS } from "@/constants/theme";

export default function UploadDocumentScreen() {
  const { eventId, warehouseId } = useLocalSearchParams<{
    eventId:     string;
    warehouseId: string;
  }>();

  const [file, setFile]           = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedHash, setUploadedHash] = useState<string | null>(null);
  const [linking, setLinking]     = useState(false);
  const [linked, setLinked]       = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setFile(result.assets[0]);
        setUploadedHash(null);
        setLinked(false);
      }
    } catch {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", {
        uri:  file.uri,
        name: file.name,
        type: file.mimeType ?? "application/pdf",
      } as any);

      const res = await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const hash = res.data.data.hash;
      setUploadedHash(hash);
      Alert.alert(
        "Uploaded ✅",
        `SHA-256: ${hash.slice(0, 16)}...\n\nTap 'Link to Event' to attach this document to your stock event.`
      );
    } catch (err: any) {
      Alert.alert("Upload Failed", err?.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleLink = async () => {
    if (!uploadedHash) return;
    setLinking(true);
    try {
      await api.post("/api/documents/link", {
        documentHash: uploadedHash,
        stockEventId: eventId,
      });
      setLinked(true);
      Alert.alert(
        "Linked ✅",
        "Document hash linked to stock event. The SHA-256 fingerprint is now part of the audit record.",
        [{ text: "Done", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to link document");
    } finally {
      setLinking(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Attach Document</Text>
          <Text style={styles.headerSub}>Link physical receipt to stock event</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.content}>

          {/* Explanation */}
          <View style={styles.explainCard}>
            <Ionicons name="information-circle" size={16} color={COLORS.info} />
            <Text style={styles.explainText}>
              Upload a photo or PDF of the physical delivery receipt.
              Its SHA-256 hash will be computed and linked to this stock event,
              creating a tamper-evident audit record.
            </Text>
          </View>

          {/* Step 1 — Pick file */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
              <Text style={styles.stepTitle}>Select Document</Text>
            </View>
            <Text style={styles.stepDesc}>PDF, JPEG, PNG or WEBP · Max 10 MB</Text>

            <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile}>
              <Ionicons name="folder-open" size={20} color={COLORS.primary} />
              <Text style={styles.pickBtnText}>
                {file ? file.name : "Choose file..."}
              </Text>
            </TouchableOpacity>

            {file && (
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={14} color={COLORS.info} />
                <Text style={styles.fileInfoText}>{file.name}</Text>
                <Text style={styles.fileSize}>
                  {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Step 2 — Upload */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNum, !file && styles.stepNumInactive]}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={[styles.stepTitle, !file && styles.stepTitleInactive]}>
                Compute SHA-256 Hash
              </Text>
            </View>
            <Text style={styles.stepDesc}>
              The server hashes the file and stores it in the document registry
            </Text>

            {uploadedHash ? (
              <View style={styles.hashCard}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.hashText} numberOfLines={1}>{uploadedHash}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadBtn, (!file || uploading) && styles.btnDisabled]}
                onPress={handleUpload}
                disabled={!file || uploading}
              >
                {uploading
                  ? <><ActivityIndicator size="small" color={COLORS.white} /><Text style={styles.btnText}>Hashing...</Text></>
                  : <><Ionicons name="cloud-upload" size={18} color={COLORS.white} /><Text style={styles.btnText}>Upload & Hash</Text></>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* Step 3 — Link */}
          <View style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNum, !uploadedHash && styles.stepNumInactive]}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <Text style={[styles.stepTitle, !uploadedHash && styles.stepTitleInactive]}>
                Link to Stock Event
              </Text>
            </View>
            <Text style={styles.stepDesc}>
              Attaches the hash to event {eventId?.slice(0, 8)}...
            </Text>

            {linked ? (
              <View style={styles.linkedCard}>
                <Ionicons name="link" size={16} color={COLORS.success} />
                <Text style={styles.linkedText}>Successfully linked to stock event</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.linkBtn, (!uploadedHash || linking) && styles.btnDisabled]}
                onPress={handleLink}
                disabled={!uploadedHash || linking}
              >
                {linking
                  ? <><ActivityIndicator size="small" color={COLORS.white} /><Text style={styles.btnText}>Linking...</Text></>
                  : <><Ionicons name="link" size={18} color={COLORS.white} /><Text style={styles.btnText}>Link to Event</Text></>
                }
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bgScreen },
  scroll:  { flex: 1 },
  content: { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
    flexDirection: "row", alignItems: "center",
  },
  backBtn:     { marginRight: 12 },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  headerSub:   { color: COLORS.primaryLight, fontSize: 12 },

  explainCard: {
    flexDirection: "row", backgroundColor: COLORS.infoBg,
    borderRadius: 12, padding: 12, marginBottom: 16, gap: 8,
  },
  explainText: { flex: 1, fontSize: 12, color: COLORS.infoText, lineHeight: 18 },

  stepCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14,
    padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  stepHeader:      { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 10 },
  stepNum:         { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  stepNumInactive: { backgroundColor: COLORS.borderLight },
  stepNumText:     { color: COLORS.white, fontSize: 12, fontWeight: "bold" },
  stepTitle:       { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  stepTitleInactive: { color: COLORS.textFaint },
  stepDesc:        { fontSize: 12, color: COLORS.textMuted, marginBottom: 12 },

  pickBtn: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: "dashed",
    borderRadius: 10, padding: 14, gap: 8, justifyContent: "center",
  },
  pickBtnText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },

  fileInfo: {
    flexDirection: "row", alignItems: "center",
    marginTop: 8, gap: 6,
  },
  fileInfoText: { flex: 1, fontSize: 12, color: COLORS.textMuted },
  fileSize:     { fontSize: 11, color: COLORS.textFaint },

  hashCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.successBg, borderRadius: 8,
    padding: 10, gap: 8,
  },
  hashText: { flex: 1, fontSize: 12, color: COLORS.successText, fontFamily: "monospace" },

  uploadBtn: {
    backgroundColor: COLORS.info, borderRadius: 10,
    paddingVertical: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  linkBtn: {
    backgroundColor: COLORS.success, borderRadius: 10,
    paddingVertical: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  linkedCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.successBg, borderRadius: 8,
    padding: 10, gap: 8,
  },
  linkedText: { fontSize: 13, color: COLORS.successText, fontWeight: "600" },
  btnText:    { color: COLORS.white, fontWeight: "bold", fontSize: 14 },
  btnDisabled:{ opacity: 0.5 },

  bottomSpacer: { height: 40 },
});