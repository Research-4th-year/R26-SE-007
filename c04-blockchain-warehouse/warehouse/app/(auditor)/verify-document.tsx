import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { api } from "../../services/api";
import { COLORS } from "../../constants/theme";

export default function VerifyDocumentScreen() {
  const [file, setFile]           = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult]       = useState<any>(null);

  const handlePickFile = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
      });
      if (!picked.canceled && picked.assets?.length > 0) {
        setFile(picked.assets[0]);
        setResult(null);
      }
    } catch {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleVerify = async () => {
    if (!file) return;
    setVerifying(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("document", {
        uri:  file.uri,
        name: file.name,
        type: file.mimeType ?? "application/pdf",
      } as any);

      const res = await api.post("/api/documents/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data.data);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Verify Document</Text>
          <Text style={styles.headerSub}>SHA-256 tamper detection</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.content}>

          {/* Explanation */}
          <View style={styles.explainCard}>
            <Ionicons name="information-circle" size={16} color={COLORS.info} />
            <Text style={styles.explainText}>
              Upload any stock report document. The system computes its SHA-256 hash
              and checks it against the blockchain record. If the file has been altered
              even by one byte, verification will fail.
            </Text>
          </View>

          {/* File picker */}
          <TouchableOpacity style={styles.pickBtn} onPress={handlePickFile}>
            <Ionicons name="folder-open" size={22} color={COLORS.primary} />
            <Text style={styles.pickBtnText}>
              {file ? file.name : "Choose document to verify..."}
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

          <TouchableOpacity
            style={[styles.verifyBtn, (!file || verifying) && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={!file || verifying}
          >
            {verifying
              ? <><ActivityIndicator size="small" color={COLORS.white} /><Text style={styles.verifyBtnText}>Computing hash...</Text></>
              : <><Ionicons name="search" size={18} color={COLORS.white} /><Text style={styles.verifyBtnText}>Verify Integrity</Text></>
            }
          </TouchableOpacity>

          {/* Result */}
          {result && (
            <View style={styles.resultSection}>
              {/* Verdict */}
              <View style={[styles.verdictCard, {
                backgroundColor: result.verified ? COLORS.successBg : COLORS.dangerBg,
                borderColor:     result.verified ? COLORS.success   : COLORS.danger,
              }]}>
                <Ionicons
                  name={result.verified ? "shield-checkmark" : "shield"}
                  size={32}
                  color={result.verified ? COLORS.success : COLORS.danger}
                />
                <View style={styles.verdictText}>
                  <Text style={[styles.verdictTitle, {
                    color: result.verified ? COLORS.successText : COLORS.dangerText
                  }]}>
                    {result.verified ? "Document Verified ✅" : "Verification Failed ❌"}
                  </Text>
                  <Text style={[styles.verdictDesc, {
                    color: result.verified ? COLORS.successText : COLORS.dangerText
                  }]}>
                    {result.verified
                      ? "This document matches the stored hash. It has not been tampered with."
                      : "No matching hash found. This document may have been altered or was never registered."}
                  </Text>
                </View>
              </View>

              {/* Hash */}
              <View style={styles.hashCard}>
                <Text style={styles.hashLabel}>Computed SHA-256</Text>
                <Text style={styles.hashValue}>{result.hash}</Text>
              </View>

              {/* Stored record */}
              {result.storedRecord && (
                <View style={styles.recordCard}>
                  <Text style={styles.recordTitle}>Stored Record</Text>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>Original name</Text>
                    <Text style={styles.recordValue}>{result.storedRecord.originalName}</Text>
                  </View>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>Uploaded by</Text>
                    <Text style={styles.recordValue}>{result.storedRecord.uploadedBy?.fullName}</Text>
                  </View>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>Uploaded at</Text>
                    <Text style={styles.recordValue}>
                      {new Date(result.storedRecord.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.recordRow}>
                    <Text style={styles.recordLabel}>File size</Text>
                    <Text style={styles.recordValue}>
                      {(result.storedRecord.sizeBytes / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                </View>
              )}

              {/* Linked events */}
              {result.linkedEvents && result.linkedEvents.length > 0 && (
                <View style={styles.linkedCard}>
                  <Text style={styles.linkedTitle}>
                    Linked to {result.linkedEvents.length} stock event{result.linkedEvents.length > 1 ? "s" : ""}
                  </Text>
                  {result.linkedEvents.map((ev: any) => (
                    <TouchableOpacity
                      key={ev.id}
                      style={styles.linkedEvent}
                      onPress={() => router.push({
                        pathname: "/(supervisor)/event-detail" as any,
                        params: { eventId: ev.id, warehouseId: ev.warehouseId }
                      })}
                    >
                      <View style={styles.linkedEventLeft}>
                        <Text style={styles.linkedEventType}>{ev.eventType}</Text>
                        <Text style={styles.linkedEventTime}>
                          {new Date(ev.timestamp).toLocaleDateString()}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textFaint} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

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

  pickBtn: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: "dashed",
    borderRadius: 12, padding: 16, gap: 10, justifyContent: "center",
    marginBottom: 10,
  },
  pickBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },

  fileInfo: {
    flexDirection: "row", alignItems: "center",
    gap: 6, marginBottom: 16,
  },
  fileInfoText: { flex: 1, fontSize: 12, color: COLORS.textMuted },
  fileSize:     { fontSize: 11, color: COLORS.textFaint },

  verifyBtn: {
    backgroundColor: COLORS.info, borderRadius: 12,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginBottom: 20,
  },
  verifyBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 15 },
  btnDisabled:   { opacity: 0.5 },

  resultSection: { gap: 12 },

  verdictCard: {
    flexDirection: "row", alignItems: "flex-start",
    borderRadius: 14, padding: 16, gap: 14,
    borderWidth: 1.5,
  },
  verdictText:  { flex: 1 },
  verdictTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  verdictDesc:  { fontSize: 13, lineHeight: 18 },

  hashCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  hashLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginBottom: 6 },
  hashValue: { fontSize: 11, color: COLORS.textPrimary, fontFamily: "monospace", lineHeight: 18 },

  recordCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  recordTitle: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 10 },
  recordRow:   { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  recordLabel: { width: 110, fontSize: 12, color: COLORS.textFaint, fontWeight: "600" },
  recordValue: { flex: 1, fontSize: 12, color: COLORS.textPrimary },

  linkedCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  linkedTitle:      { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary, marginBottom: 10 },
  linkedEvent:      { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  linkedEventLeft:  { flex: 1 },
  linkedEventType:  { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  linkedEventTime:  { fontSize: 11, color: COLORS.textMuted },

  bottomSpacer: { height: 40 },
});