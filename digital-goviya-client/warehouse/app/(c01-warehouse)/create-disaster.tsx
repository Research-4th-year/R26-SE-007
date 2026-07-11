import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StyleSheet
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { disasterService } from "../services/disaster.service";
import { warehouseService, Warehouse } from "../services/warehouse.service";
import { COLORS } from "../constants/theme";

const DISASTER_TYPES = ["FLOOD", "CYCLONE", "ELEPHANT_ATTACK", "FIRE", "OTHER"];

export default function CreateDisasterScreen() {
  const [warehouses, setWarehouses]           = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [disasterType, setDisasterType]       = useState<string>("");
  const [description, setDescription]         = useState("");
  const [estimatedLoss, setEstimatedLoss]     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(true);

  useEffect(() => {
    warehouseService.listWarehouses().then((w) => {
      setWarehouses(w);
      setLoadingWarehouses(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!selectedWarehouse) { Alert.alert("Error", "Select an affected warehouse"); return; }
    if (!disasterType)      { Alert.alert("Error", "Select a disaster type"); return; }

    setLoading(true);
    try {
      const disaster = await disasterService.createDisaster({
        disasterType,
        affectedWarehouseId: selectedWarehouse,
        description: description.trim() || undefined,
        estimatedLossTons: estimatedLoss ? parseFloat(estimatedLoss) : undefined,
        occurredAt: new Date().toISOString(),
      });
      Alert.alert("Success", "Disaster event recorded and anchored on blockchain", [
        { text: "View", onPress: () => router.replace(`/disaster/${disaster.id}`) },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to create disaster");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Disaster</Text>
        <Text style={styles.headerSubtitle}>Creates a blockchain-anchored record</Text>
      </View>

      <ScrollView style={styles.list}>
        {/* Disaster Type */}
        <Text style={styles.label}>Disaster Type *</Text>
        <View style={styles.typeRow}>
          {DISASTER_TYPES.map((type) => {
            const selected = disasterType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setDisasterType(type)}
                style={[styles.typeChip, selected && styles.typeChipSelected]}
              >
                <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                  {type.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Affected Warehouse */}
        <Text style={styles.label}>Affected Warehouse *</Text>
        {loadingWarehouses ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <View style={styles.warehouseList}>
            {warehouses.map((wh) => {
              const selected = selectedWarehouse === wh.id;
              return (
                <TouchableOpacity
                  key={wh.id}
                  onPress={() => setSelectedWarehouse(wh.id)}
                  style={[styles.warehouseOption, selected && styles.warehouseOptionSelected]}
                >
                  <Text style={[styles.warehouseOptionName, selected && styles.warehouseOptionNameSelected]}>
                    {wh.name}
                  </Text>
                  <Text style={styles.warehouseOptionSubtitle}>{wh.code} · {wh.district}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the damage..."
          placeholderTextColor={COLORS.textFaint}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* Estimated Loss */}
        <Text style={styles.label}>Estimated Loss (tons)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 45"
          placeholderTextColor={COLORS.textFaint}
          keyboardType="numeric"
          value={estimatedLoss}
          onChangeText={setEstimatedLoss}
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitButtonText}>Report Disaster</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },

  header: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  backButton: { marginBottom: 12 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: COLORS.primaryLight, fontSize: 14 },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  label: { color: COLORS.textSecondary, fontWeight: "bold", marginBottom: 8 },

  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, backgroundColor: COLORS.bgCard, borderColor: COLORS.border },
  typeChipSelected: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
  typeChipText: { fontSize: 14, fontWeight: "500", color: COLORS.textMuted },
  typeChipTextSelected: { color: COLORS.white },

  warehouseList: { marginBottom: 16 },
  warehouseOption: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, backgroundColor: COLORS.bgCard, borderColor: COLORS.border },
  warehouseOptionSelected: { backgroundColor: COLORS.successBg, borderColor: COLORS.success },
  warehouseOptionName: { fontWeight: "500", color: COLORS.textSecondary },
  warehouseOptionNameSelected: { color: COLORS.primaryDark },
  warehouseOptionSubtitle: { color: COLORS.textFaint, fontSize: 12 },

  textArea: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, color: COLORS.textPrimary, marginBottom: 16,
    textAlignVertical: "top",
  },
  input: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, color: COLORS.textPrimary, marginBottom: 24,
  },

  submitButton: { backgroundColor: COLORS.danger, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 32 },
  submitButtonDisabled: { backgroundColor: "#FCA5A5" },
  submitButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
});