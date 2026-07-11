import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, StyleSheet, FlatList
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../services/api";
import { COLORS } from "../../constants/theme";
import { useDebouncedCallback } from "../../hooks/useDebounce";

interface SearchResult {
  place_id:    number;
  display_name:string;
  lat:         string;
  lon:         string;
}

export default function CreateWarehouseScreen() {
  const [name, setName]         = useState("");
  const [code, setCode]         = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress]   = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [capacityTons, setCapacityTons] = useState("");

  const [searchQuery, setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching]       = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const query = encodeURIComponent(searchQuery + ", Sri Lanka");
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5&countrycodes=lk`,
        { headers: { "User-Agent": "PaddyWarehouseApp/1.0" } }
      );
      const data: SearchResult[] = await res.json();
      if (data.length === 0) {
        Alert.alert("No results", "No locations found. Try a more specific address.");
      }
      setSearchResults(data);
    } catch {
      Alert.alert("Error", "Address search failed. Check your connection.");
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setLatitude(parseFloat(result.lat).toFixed(4));
    setLongitude(parseFloat(result.lon).toFixed(4));
    setAddress(result.display_name.split(",").slice(0, 3).join(",").trim());
    setSearchResults([]);
    setSearchQuery("");
    // Auto-fill district from result if empty
    const parts = result.display_name.split(",");
    if (!district && parts.length > 2) {
      setDistrict(parts[parts.length - 3]?.trim() ?? "");
    }
  };

  const handleSubmit = useDebouncedCallback(async () => {
    if (!name.trim())     { Alert.alert("Required", "Enter warehouse name"); return; }
    if (!code.trim())     { Alert.alert("Required", "Enter warehouse code (e.g. AMP-02)"); return; }
    if (!district.trim()) { Alert.alert("Required", "Enter district"); return; }
    if (!latitude || !longitude) { Alert.alert("Required", "Search for an address to set coordinates"); return; }
    if (!capacityTons || isNaN(Number(capacityTons))) {
      Alert.alert("Required", "Enter a valid capacity in tons");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/warehouses", {
        name:         name.trim(),
        code:         code.trim().toUpperCase(),
        district:     district.trim(),
        address:      address.trim() || undefined,
        latitude:     parseFloat(latitude),
        longitude:    parseFloat(longitude),
        capacityTons: parseFloat(capacityTons),
      });
      Alert.alert("Success", `Warehouse ${code.toUpperCase()} created`, [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed to create warehouse");
    } finally {
      setSubmitting(false);
    }
  },1000);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Create Warehouse</Text>
          <Text style={styles.headerSub}>Admin only</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>

          {/* Address search */}
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <Text style={styles.hint}>Search by address or place name to auto-fill coordinates</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. Ampara town, Badulla road..."
              placeholderTextColor={COLORS.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.searchBtn, searching && styles.btnDisabled]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching
                ? <ActivityIndicator size="small" color={COLORS.white} />
                : <Ionicons name="search" size={18} color={COLORS.white} />
              }
            </TouchableOpacity>
          </View>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <View style={styles.resultsCard}>
              {searchResults.map((r) => (
                <TouchableOpacity
                  key={r.place_id}
                  style={styles.resultRow}
                  onPress={() => handleSelectResult(r)}
                >
                  <Ionicons name="location" size={14} color={COLORS.primary} />
                  <Text style={styles.resultText} numberOfLines={2}>
                    {r.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Coordinates display */}
          {latitude && longitude ? (
            <View style={styles.coordCard}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.coordText}>
                {latitude}, {longitude}
              </Text>
              <TouchableOpacity onPress={() => { setLatitude(""); setLongitude(""); setAddress(""); }}>
                <Ionicons name="close-circle" size={16} color={COLORS.textFaint} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.coordPlaceholder}>
              <Ionicons name="location-outline" size={16} color={COLORS.textFaint} />
              <Text style={styles.coordPlaceholderText}>No location selected</Text>
            </View>
          )}

          {/* Warehouse details */}
          <Text style={styles.sectionTitle}>🏭 Warehouse Details</Text>

          <Text style={styles.label}>Warehouse Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ampara North Warehouse"
            placeholderTextColor={COLORS.textFaint}
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. AMP-02"
                placeholderTextColor={COLORS.textFaint}
                value={code}
                onChangeText={setCode}
                autoCapitalize="characters"
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>District *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ampara"
                placeholderTextColor={COLORS.textFaint}
                value={district}
                onChangeText={setDistrict}
              />
            </View>
          </View>

          <Text style={styles.label}>Address (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            placeholderTextColor={COLORS.textFaint}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Capacity (tons) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500"
            placeholderTextColor={COLORS.textFaint}
            keyboardType="numeric"
            value={capacityTons}
            onChangeText={setCapacityTons}
          />

          {/* Manual coordinate override */}
          <TouchableOpacity
            onPress={() => Alert.alert(
              "Manual coordinates",
              "You can also type coordinates directly below if needed"
            )}
          >
            <Text style={styles.manualLink}>Enter coordinates manually instead?</Text>
          </TouchableOpacity>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                placeholder="7.2963"
                placeholderTextColor={COLORS.textFaint}
                keyboardType="numeric"
                value={latitude}
                onChangeText={setLatitude}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                placeholder="81.6723"
                placeholderTextColor={COLORS.textFaint}
                keyboardType="numeric"
                value={longitude}
                onChangeText={setLongitude}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name="add-circle" size={20} color={COLORS.white} />
                  <Text style={styles.submitBtnText}>Create Warehouse</Text>
                </>
            }
          </TouchableOpacity>

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

  sectionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textSecondary, marginTop: 20, marginBottom: 6 },
  hint:         { fontSize: 12, color: COLORS.textFaint, marginBottom: 10 },
  label:        { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 4, marginTop: 10 },
  manualLink:   { fontSize: 12, color: COLORS.info, marginTop: 4, marginBottom: 8 },

  searchRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  searchInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary, backgroundColor: COLORS.bgCard,
  },
  searchBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 16, alignItems: "center", justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },

  resultsCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 10, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  resultRow: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  resultText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 18 },

  coordCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.successBg, borderRadius: 10,
    padding: 10, gap: 8, marginBottom: 4,
  },
  coordText: { flex: 1, fontSize: 13, color: COLORS.successText, fontWeight: "600" },

  coordPlaceholder: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.borderLight, borderRadius: 10,
    padding: 10, gap: 8, marginBottom: 4,
  },
  coordPlaceholderText: { fontSize: 13, color: COLORS.textFaint },

  row:  { flexDirection: "row", gap: 12 },
  half: { flex: 1 },

  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
    fontSize: 14, color: COLORS.textPrimary,
    backgroundColor: COLORS.bgCard, marginBottom: 4,
  },

  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 24,
  },
  submitBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },

  bottomSpacer: { height: 40 },
});