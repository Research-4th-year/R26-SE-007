import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, StyleSheet, TextInput
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/shared/api";
import { COLORS } from "@/constants/theme";

interface RankedCandidate {
  warehouseId:      string;
  name:             string;
  code:             string;
  district:         string;
  distanceKm:       number;
  availableTons:    number;
  compositeScore:   number;
  canFulfil:        boolean;
  zkpVerified:      boolean;
}

interface ZKPProofRecord {
  id:                 string;
  warehouseId:        string;
  verificationResult: boolean;
  blockchainTxId:     string | null;
  submittedAt:        string;
  warehouse:          { name: string; code: string } | null;
}

export default function ZKPScreen() {
  const { id }                          = useLocalSearchParams<{ id: string }>();
  const [candidates, setCandidates]     = useState<RankedCandidate[]>([]);
  const [existingProofs, setExistingProofs] = useState<ZKPProofRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedWarehouse, setSelectedWarehouse] = useState<RankedCandidate | null>(null);
  const [availableCapacity, setAvailableCapacity] = useState("");
  const [threshold, setThreshold]       = useState("");
  const [generating, setGenerating]     = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [generatedProof, setGeneratedProof] = useState<any>(null);

  const load = async () => {
    try {
      const [disasterRes, proofsRes] = await Promise.all([
        api.get(`/api/disasters/${id}`),
        api.get(`/api/zkp/disasters/${id}/proofs`),
      ]);
      setCandidates(disasterRes.data.data.rankedCandidates ?? []);
      setExistingProofs(proofsRes.data.data);
      // Auto-fill threshold from estimatedLossTons
      const loss = disasterRes.data.data.estimatedLossTons;
      if (loss) setThreshold(String(loss));
    } catch (err: any) {
      Alert.alert("Error", "Failed to load ZKP data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleGenerate = async () => {
    if (!selectedWarehouse) {
      Alert.alert("Select a warehouse", "Choose which warehouse will submit the proof");
      return;
    }
    if (!availableCapacity || isNaN(Number(availableCapacity))) {
      Alert.alert("Invalid input", "Enter the warehouse's available capacity in tons");
      return;
    }
    if (!threshold || isNaN(Number(threshold))) {
      Alert.alert("Invalid input", "Enter the required threshold in tons");
      return;
    }

    setGenerating(true);
    setGeneratedProof(null);
    try {
      const res = await api.post("/api/zkp/generate", {
        warehouseId:       selectedWarehouse.warehouseId,
        disasterEventId:   id,
        availableCapacity: Number(availableCapacity),
        threshold:         Number(threshold),
      });
      setGeneratedProof(res.data.data);
      Alert.alert(
        "Proof Generated ✅",
        `The circuit proved: ${availableCapacity} tons ≥ ${threshold} tons threshold.\n\nThe actual capacity (${availableCapacity}) was NOT revealed in the proof.\n\nTap Submit to anchor this on the blockchain.`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Proof generation failed";
      Alert.alert("Proof Failed ❌", msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!generatedProof || !selectedWarehouse) return;

    setSubmitting(true);
    try {
      const res = await api.post("/api/zkp/submit", {
        disasterEventId: id,
        warehouseId:     selectedWarehouse.warehouseId,
        proof:           generatedProof.proof,
        publicSignals:   generatedProof.publicSignals,
      });

      const result = res.data.data;
      Alert.alert(
        result.verificationResult ? "Verified ✅" : "Verification Failed ❌",
        result.verificationResult
          ? `Proof anchored on Hyperledger Fabric.\n\nTx: ${result.blockchainTxId}\n\nThis warehouse is now marked as ZKP-verified in the ranked candidates list.`
          : "The proof could not be verified.",
        [{ text: "Done", onPress: () => { setGeneratedProof(null); setSelectedWarehouse(null); load(); } }]
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Submission failed";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading ZKP data...</Text>
      </View>
    );
  }

  const proofWarehouseIds = new Set(existingProofs.map(p => p.warehouseId));

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ZKP Capacity Proofs</Text>
          <Text style={styles.headerSub}>Zero Knowledge Proof verification</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.content}>

          {/* Explanation */}
          <View style={styles.explainCard}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.info} />
            <Text style={styles.explainText}>
              A warehouse can prove it has enough capacity without revealing its exact stock level.
              The proof is verified on-chain and marks the warehouse as ZKP-verified in the ranked list.
            </Text>
          </View>

          {/* Existing proofs */}
          {existingProofs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Submitted Proofs</Text>
              {existingProofs.map((proof) => (
                <View key={proof.id} style={styles.proofRow}>
                  <Ionicons
                    name={proof.verificationResult ? "shield-checkmark" : "shield"}
                    size={18}
                    color={proof.verificationResult ? COLORS.success : COLORS.danger}
                  />
                  <View style={styles.proofInfo}>
                    <Text style={styles.proofWarehouse}>
                      {proof.warehouse?.name ?? proof.warehouseId.slice(0, 8) + "..."}
                    </Text>
                    <Text style={styles.proofMeta}>
                      {proof.warehouse?.code} · {new Date(proof.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.proofBadge, {
                    backgroundColor: proof.verificationResult ? COLORS.successBg : COLORS.dangerBg
                  }]}>
                    <Text style={[styles.proofBadgeText, {
                      color: proof.verificationResult ? COLORS.successText : COLORS.dangerText
                    }]}>
                      {proof.verificationResult ? "VALID" : "INVALID"}
                    </Text>
                  </View>
                  {proof.blockchainTxId && (
                    <Ionicons name="lock-closed" size={12} color={COLORS.info} style={{ marginLeft: 6 }} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Generate new proof */}
          <Text style={styles.sectionTitle}>Generate New Proof</Text>

          {/* Step 1 — Select warehouse */}
          <Text style={styles.stepLabel}>Step 1 — Select candidate warehouse</Text>
          {candidates.filter(c => !proofWarehouseIds.has(c.warehouseId)).length === 0 ? (
            <View style={styles.allProvedCard}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              <Text style={styles.allProvedText}>All candidates have submitted proofs</Text>
            </View>
          ) : (
            candidates
              .filter(c => !proofWarehouseIds.has(c.warehouseId))
              .map((c) => (
                <TouchableOpacity
                  key={c.warehouseId}
                  style={[styles.candidateRow, selectedWarehouse?.warehouseId === c.warehouseId && styles.candidateRowSelected]}
                  onPress={() => {
                    setSelectedWarehouse(c);
                    setAvailableCapacity(String(c.availableTons));
                    setGeneratedProof(null);
                  }}
                >
                  <View style={styles.candidateInfo}>
                    <Text style={styles.candidateName}>{c.name}</Text>
                    <Text style={styles.candidateSub}>{c.code} · {c.distanceKm} km away</Text>
                  </View>
                  <View style={styles.candidateRight}>
                    <Text style={styles.candidateAvailable}>{c.availableTons}t free</Text>
                    {selectedWarehouse?.warehouseId === c.warehouseId && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))
          )}

          {/* Step 2 — Inputs */}
          {selectedWarehouse && (
            <>
              <Text style={styles.stepLabel}>Step 2 — Set capacity inputs</Text>
              <View style={styles.inputCard}>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>
                      🔒 Available Capacity (private)
                    </Text>
                    <Text style={styles.inputHint}>Never revealed to verifier</Text>
                    <TextInput
                      style={styles.input}
                      value={availableCapacity}
                      onChangeText={setAvailableCapacity}
                      keyboardType="numeric"
                      placeholder="e.g. 300"
                      placeholderTextColor={COLORS.textFaint}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>
                      👁 Threshold (public)
                    </Text>
                    <Text style={styles.inputHint}>Verifier sees this</Text>
                    <TextInput
                      style={styles.input}
                      value={threshold}
                      onChangeText={setThreshold}
                      keyboardType="numeric"
                      placeholder="e.g. 45"
                      placeholderTextColor={COLORS.textFaint}
                    />
                  </View>
                </View>
                <Text style={styles.proofEquation}>
                  Circuit proves: {availableCapacity || "?"} ≥ {threshold || "?"} tons
                </Text>
              </View>

              {/* Step 3 — Generate */}
              <Text style={styles.stepLabel}>Step 3 — Generate & submit proof</Text>
              <TouchableOpacity
                style={[styles.generateBtn, generating && styles.btnDisabled]}
                onPress={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <ActivityIndicator size="small" color={COLORS.white} />
                    <Text style={styles.btnText}>Running circuit... (2-5s)</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="flash" size={18} color={COLORS.white} />
                    <Text style={styles.btnText}>Generate ZKP Proof</Text>
                  </>
                )}
              </TouchableOpacity>

              {generatedProof && (
                <>
                  <View style={styles.proofGeneratedCard}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                    <View style={styles.proofGeneratedInfo}>
                      <Text style={styles.proofGeneratedTitle}>Proof ready</Text>
                      <Text style={styles.proofGeneratedSub}>
                        Public signals: [{generatedProof.publicSignals?.join(", ")}]
                      </Text>
                      <Text style={styles.proofGeneratedSub}>
                        The number {availableCapacity} is not in those signals.
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, submitting && styles.btnDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator size="small" color={COLORS.white} />
                        <Text style={styles.btnText}>Anchoring on blockchain...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={18} color={COLORS.white} />
                        <Text style={styles.btnText}>Submit & Anchor on Fabric</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: COLORS.textFaint, marginTop: 8 },
  scroll:   { flex: 1 },
  content:  { padding: 16 },

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
    borderRadius: 12, padding: 12, marginBottom: 20, gap: 10,
  },
  explainText: { flex: 1, fontSize: 12, color: COLORS.infoText, lineHeight: 18 },

  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textSecondary, marginBottom: 12 },
  stepLabel:    { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, marginBottom: 8, marginTop: 4 },

  proofRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 10,
    padding: 12, marginBottom: 8, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  proofInfo:        { flex: 1 },
  proofWarehouse:   { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  proofMeta:        { fontSize: 11, color: COLORS.textMuted },
  proofBadge:       { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  proofBadgeText:   { fontSize: 10, fontWeight: "bold" },

  candidateRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 10,
    padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: "transparent",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  candidateRowSelected: { borderColor: COLORS.primary, backgroundColor: "#F0FDF4" },
  candidateInfo:        { flex: 1 },
  candidateName:        { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  candidateSub:         { fontSize: 11, color: COLORS.textMuted },
  candidateRight:       { flexDirection: "row", alignItems: "center", gap: 8 },
  candidateAvailable:   { fontSize: 12, color: COLORS.info, fontWeight: "600" },

  allProvedCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.successBg, borderRadius: 12,
    padding: 14, gap: 10, marginBottom: 16,
  },
  allProvedText: { fontSize: 13, color: COLORS.successText, fontWeight: "600" },

  inputCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 14, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  inputRow:   { flexDirection: "row", gap: 12, marginBottom: 10 },
  inputHalf:  { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 2 },
  inputHint:  { fontSize: 10, color: COLORS.textFaint, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 10,
    fontSize: 16, fontWeight: "bold", color: COLORS.textPrimary,
    backgroundColor: COLORS.bgScreen,
  },
  proofEquation: {
    fontSize: 12, color: COLORS.info, fontWeight: "600",
    textAlign: "center", paddingTop: 8,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },

  generateBtn: {
    backgroundColor: COLORS.info, borderRadius: 12,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: COLORS.success, borderRadius: 12,
    paddingVertical: 14, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginBottom: 12,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: COLORS.white, fontWeight: "bold", fontSize: 14 },

  proofGeneratedCard: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: COLORS.successBg, borderRadius: 12,
    padding: 12, marginBottom: 12, gap: 10,
  },
  proofGeneratedInfo:  { flex: 1 },
  proofGeneratedTitle: { fontSize: 13, fontWeight: "bold", color: COLORS.successText },
  proofGeneratedSub:   { fontSize: 11, color: COLORS.successText, marginTop: 2 },

  bottomSpacer: { height: 40 },
});