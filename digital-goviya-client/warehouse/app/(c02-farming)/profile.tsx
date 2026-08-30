import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFarmingAuth } from "@/contexts/FarmingAuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { translations } from "../../i18n";
import districtData from "./districtData.json";

import { API_URL } from "@/services/c02-farming/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "settings" | "advisory" | "yield" | "disease" | "fertilizer";

interface ProfileData {
  name: string;
  phone: string;
  location: string;
  farm_size: string;
  farm_unit: string;
}

interface AdvisoryItem {
  id: number;
  created_at: string;
  field_id: string;
  city: string;
  district: string;
  predicted_variety: string;
  suitability_score: number;
}

interface YieldItem {
  id: number;
  created_at: string;
  district: string;
  land_size: number;
  paddy_type: string;
  predicted_yield_kg_per_ha: number;
  total_yield_kg: number;
}

interface DiseaseItem {
  id: number;
  created_at: string;
  disease_name: string;
  disease_type: string;
  confidence: number;
}

interface FertilizerItem {
  id: number;
  created_at: string;
  agro_zone: string;
  crop_duration: string;
  total_urea: number;
  total_tsp: number;
  total_mop: number;
  total_zinc: number;
}

// ─── Picker Modal (simple dropdown replacement) ───────────────────────────────
function PickerField({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <TouchableOpacity style={styles.pickerBtn} onPress={() => setOpen(!open)}>
        <Text style={styles.pickerBtnText}>{value || "Select…"}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
      </TouchableOpacity>
      {open && (
        <ScrollView style={styles.pickerDropdown} nestedScrollEnabled>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pickerOption, value === opt && styles.pickerOptionActive]}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[styles.pickerOptionText, value === opt && styles.pickerOptionTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { currentUser, logout } = useFarmingAuth();
  const { language } = useLanguage();
  const t = translations[language].c02Farming.authAndProfile;
  const [activeTab, setActiveTab] = useState<Tab>("settings");

  // Use Firebase uid as user_id (same as web frontend)
  const userId = currentUser?.uid ?? "";
  const userEmail = currentUser?.email ?? "";

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    phone: "",
    location: "",
    farm_size: "",
    farm_unit: "Acres",
  });

  const [advisoryHistory, setAdvisoryHistory] = useState<AdvisoryItem[]>([]);
  const [yieldHistory, setYieldHistory] = useState<YieldItem[]>([]);
  const [diseaseHistory, setDiseaseHistory] = useState<DiseaseItem[]>([]);
  const [fertilizerHistory, setFertilizerHistory] = useState<FertilizerItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const districts = Object.keys(districtData);

  // ─── Fetch on mount when Firebase user is ready ───────────────────────────
  useEffect(() => {
    if (userId) fetchAllData();
  }, [userId]);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchProfile(),
      fetchHistory("history", setAdvisoryHistory),
      fetchHistory("yield_history", setYieldHistory),
      fetchHistory("disease_history", setDiseaseHistory),
      fetchHistory("fertilizer_history", setFertilizerHistory),
    ]);
    setLoading(false);
    setRefreshing(false);
  }, [userId]);

  async function fetchProfile() {
    try {
      const res = await fetch(`${API_URL}/api/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.message) {
          setProfile({
            name: data.name || "",
            phone: data.phone || "",
            location: data.location || "",
            farm_size: String(data.farm_size || ""),
            farm_unit: data.farm_unit || "Acres",
          });
        }
      }
    } catch (err) {
      console.error("fetchProfile:", err);
    }
  }

  async function fetchHistory(endpoint: string, setter: (d: any[]) => void) {
    try {
      const res = await fetch(`${API_URL}/api/${endpoint}/${userId}`);
      if (res.ok) setter(await res.json());
    } catch (err) {
      console.error(`fetchHistory(${endpoint}):`, err);
    }
  }

  // ─── Save profile ───────────────────────────────────────────────────────────
  async function handleUpdateProfile() {
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        ...profile,
        farm_size: parseFloat(profile.farm_size) || 0,
      };
      const res = await fetch(`${API_URL}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showMessage("Profile updated successfully!");
        setIsEditing(false);
      } else {
        showMessage("Failed to update profile.");
      }
    } catch (err) {
      showMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete record ──────────────────────────────────────────────────────────
  function handleDeleteRecord<T extends { id: number | string }>(
    endpoint: string,
    id: number | string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    list: T[]
  ) {
    Alert.alert("Delete Record", "Are you sure you want to delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/${endpoint}/${userId}/${id}`, { method: "DELETE" });
            if (res.ok) setter(list.filter((item) => item.id !== id));
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  }

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ─── Tab definitions ─────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "settings", label: t.tabSettings, icon: "person" },
    { key: "advisory", label: t.tabAdvisory, icon: "leaf" },
    { key: "yield", label: t.tabYield, icon: "stats-chart" },
    { key: "disease", label: t.tabDisease, icon: "scan" },
    { key: "fertilizer", label: t.tabFertilizer, icon: "flask" },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.screen, { justifyContent: "center", alignItems: "center" }]}>
        <LinearGradient colors={["#0A331D", "#12522E", "#0B3B22"]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color="#F5C542" />
        <Text style={{ color: "white", marginTop: 12, fontFamily: "Poppins_500Medium" }}>
          Loading profile…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={["#0A331D", "#12522E", "#0B3B22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroBg}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.profileTitle}</Text>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert("Log Out", "Are you sure you want to log out?", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                  await logout();
                  router.replace("/(c02-farming)/login" as any);
                },
              },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Success / error banner */}
      {!!message && (
        <View style={styles.messageBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
      >
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Ionicons
              name={t.icon as any}
              size={14}
              color={activeTab === t.key ? "white" : "#6B7280"}
            />
            <Text style={[styles.tabBtnText, activeTab === t.key && styles.tabBtnTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.contentArea}
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAllData(); }} tintColor="#F5C542" />
        }
      >
        {/* ── Settings Tab ── */}
        {activeTab === "settings" && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t.accountDetails}</Text>
              {!isEditing && (
                <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                  <Ionicons name="pencil" size={14} color="#15803D" />
                  <Text style={styles.editBtnText}>{t.edit}</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditing ? (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t.fullName.replace(" *", "")}</Text>
                  <TextInput
                    style={styles.input}
                    value={profile.name}
                    onChangeText={(v) => setProfile({ ...profile, name: v })}
                    placeholder="Enter your name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t.phone}</Text>
                  <TextInput
                    style={styles.input}
                    value={profile.phone}
                    onChangeText={(v) => setProfile({ ...profile, phone: v })}
                    placeholder="Enter phone number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                  />
                </View>

                <PickerField
                  label={t.locationDistrict.replace(" *", "")}
                  value={profile.location}
                  options={districts}
                  onSelect={(v) => setProfile({ ...profile, location: v })}
                />

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>{t.farmSize.replace(" *", "")}</Text>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      style={[styles.input, { flex: 2 }]}
                      value={profile.farm_size}
                      onChangeText={(v) => setProfile({ ...profile, farm_size: v })}
                      placeholder="e.g. 2.5"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <PickerField
                      label=""
                      value={profile.farm_unit}
                      options={["Acres", "Perch", "Hectares"]}
                      onSelect={(v) => setProfile({ ...profile, farm_unit: v })}
                    />
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                    <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleUpdateProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>{t.saveChanges}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {[
                  { label: t.email, value: userEmail },
                  { label: t.fullName.replace(" *", ""), value: profile.name || "Not set" },
                  { label: t.phone, value: profile.phone || "Not set" },
                  { label: t.location, value: profile.location || "Not set" },
                  {
                    label: t.farmSize.replace(" *", ""),
                    value: profile.farm_size
                      ? `${profile.farm_size} ${profile.farm_unit}`
                      : "Not set",
                  },
                ].map((row) => (
                  <View key={row.label} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{row.label}</Text>
                    <Text style={styles.infoValue}>{row.value}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ── Advisory Tab ── */}
        {activeTab === "advisory" && (
          <View>
            <Text style={styles.sectionTitle}>{t.advHistory}</Text>
            {advisoryHistory.length === 0 ? (
              <EmptyState message={t.noAdv} icon="leaf-outline" />
            ) : (
              advisoryHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                    <View style={[styles.scoreBadge, { backgroundColor: scoreBg(item.suitability_score) }]}>
                      <Text style={styles.scoreBadgeText}>Score: {item.suitability_score}/5</Text>
                    </View>
                  </View>
                  <View style={styles.historyCardBody}>
                    <InfoLine label={t.field} value={item.field_id} />
                    <InfoLine label={t.location} value={`${item.city}, ${item.district}`} />
                    <InfoLine label={t.varietyPred} value={item.predicted_variety} highlight />
                  </View>
                  <DeleteBtn label={t.delete} onPress={() => handleDeleteRecord("history", item.id, setAdvisoryHistory, advisoryHistory)} />
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Yield Tab ── */}
        {activeTab === "yield" && (
          <View>
            <Text style={styles.sectionTitle}>{t.yieldPred}</Text>
            {yieldHistory.length === 0 ? (
              <EmptyState message={t.noYield} icon="stats-chart-outline" />
            ) : (
              yieldHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={styles.historyCardBody}>
                    <InfoLine label={t.location} value={`${item.district} (${item.land_size} Ha)`} />
                    <InfoLine label={t.paddyType} value={item.paddy_type} />
                    <InfoLine label={t.yieldRate} value={`${item.predicted_yield_kg_per_ha.toFixed(2)} kg/ha`} />
                    <InfoLine
                      label={t.totalYield}
                      value={`${item.total_yield_kg.toFixed(2)} kg`}
                      highlight
                      highlightColor="#10B981"
                    />
                  </View>
                  <DeleteBtn label={t.delete} onPress={() => handleDeleteRecord("yield_history", item.id, setYieldHistory, yieldHistory)} />
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Disease Tab ── */}
        {activeTab === "disease" && (
          <View>
            <Text style={styles.sectionTitle}>{t.disDetect}</Text>
            {diseaseHistory.length === 0 ? (
              <EmptyState message={t.noDis} icon="scan-outline" />
            ) : (
              diseaseHistory.map((item) => {
                const isHealthy = item.disease_name.toLowerCase() === "healthy";
                const color = isHealthy ? "#10B981" : "#EF4444";
                return (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                      <Text style={[styles.confText, { color }]}>
                        {item.confidence.toFixed(1)}% Conf.
                      </Text>
                    </View>
                    <View style={styles.historyCardBody}>
                      <InfoLine label={t.diagnosis} value={item.disease_name.replace(/_/g, " ")} highlight highlightColor={color} />
                      <InfoLine label={t.type} value={item.disease_type} />
                    </View>
                    <DeleteBtn label={t.delete} onPress={() => handleDeleteRecord("disease_history", item.id, setDiseaseHistory, diseaseHistory)} />
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── Fertilizer Tab ── */}
        {activeTab === "fertilizer" && (
          <View>
            <Text style={styles.sectionTitle}>{t.fertPlans}</Text>
            {fertilizerHistory.length === 0 ? (
              <EmptyState message={t.noFert} icon="flask-outline" />
            ) : (
              fertilizerHistory.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyDate}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={styles.historyCardBody}>
                    <InfoLine label={t.zone} value={item.agro_zone} />
                    <InfoLine label={t.duration} value={item.crop_duration.replace(/_/g, " ")} />
                  </View>
                  <View style={styles.fertGrid}>
                    <FertItem label="Urea" value={`${item.total_urea} kg`} color="#2563EB" />
                    <FertItem label="TSP" value={`${item.total_tsp} kg`} color="#D97706" />
                    <FertItem label="MOP" value={`${item.total_mop} kg`} color="#EF4444" />
                    <FertItem label="Zinc" value={`${item.total_zinc} kg`} color="#10B981" />
                  </View>
                  <DeleteBtn label={t.delete} onPress={() => handleDeleteRecord("fertilizer_history", item.id, setFertilizerHistory, fertilizerHistory)} />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function EmptyState({ message, icon }: { message: string; icon: any }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={40} color="#D1D5DB" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function InfoLine({
  label, value, highlight, highlightColor,
}: {
  label: string; value: string; highlight?: boolean; highlightColor?: string;
}) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLineLabel}>{label}:</Text>
      <Text style={[styles.infoLineValue, highlight && { color: highlightColor || "#0A331D", fontFamily: "Poppins_700Bold" }]}>
        {value}
      </Text>
    </View>
  );
}

function FertItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.fertItem}>
      <Text style={styles.fertLabel}>{label}</Text>
      <Text style={[styles.fertValue, { color }]}>{value}</Text>
    </View>
  );
}

function DeleteBtn({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <TouchableOpacity style={styles.deleteBtnSmall} onPress={onPress}>
      <Ionicons name="trash-outline" size={13} color="#EF4444" />
      <Text style={styles.deleteBtnSmallText}>{label}</Text>
    </TouchableOpacity>
  );
}

function scoreBg(score: number) {
  if (score >= 4) return "#DCFCE7";
  if (score >= 2) return "#FEF9C3";
  return "#FEE2E2";
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  heroBg: { ...StyleSheet.absoluteFill, height: 220 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "white",
  },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,100,100,0.2)",
    justifyContent: "center", alignItems: "center",
  },

  // Message banner
  messageBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#ECFDF5",
    marginHorizontal: 20, borderRadius: 10,
    padding: 12, marginBottom: 4,
  },
  messageText: {
    fontFamily: "Poppins_500Medium",
    color: "#065F46", fontSize: 13, marginLeft: 8,
  },

  // Tab bar
  tabBar: { maxHeight: 60 },
  tabBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginRight: 8,
  },
  tabBtnActive: { backgroundColor: "#0A331D" },
  tabBtnText: {
    fontFamily: "Poppins_600SemiBold", fontSize: 12,
    color: "#6B7280", marginLeft: 5,
  },
  tabBtnTextActive: { color: "white" },

  // Content
  contentArea: { flex: 1 },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18, color: "#ffffffff", marginBottom: 16,
  },

  // Card
  card: {
    backgroundColor: "white", borderRadius: 20, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 4,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 16,
  },
  cardTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#1F2937" },
  editBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#DCFCE7", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  editBtnText: {
    fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#15803D", marginLeft: 4,
  },

  // Info rows (read mode)
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  infoLabel: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#6B7280" },
  infoValue: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#1F2937", maxWidth: "60%", textAlign: "right" },

  // Form (edit mode)
  formGroup: { marginBottom: 16 },
  formLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Poppins_500Medium", fontSize: 14, color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  pickerBtn: {
    borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  pickerBtnText: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#1F2937" },
  pickerDropdown: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12,
    backgroundColor: "white", maxHeight: 180, marginTop: 4,
  },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 10 },
  pickerOptionActive: { backgroundColor: "#DCFCE7" },
  pickerOptionText: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#374151" },
  pickerOptionTextActive: { color: "#15803D", fontFamily: "Poppins_600SemiBold" },

  formActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    alignItems: "center",
  },
  cancelBtnText: { fontFamily: "Poppins_600SemiBold", color: "#6B7280" },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#0A331D", alignItems: "center", justifyContent: "center",
  },
  saveBtnText: { fontFamily: "Poppins_600SemiBold", color: "white", fontSize: 14 },

  // History cards
  historyCard: {
    backgroundColor: "white", borderRadius: 16, padding: 16,
    marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  historyCardHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 10,
  },
  historyDate: { fontFamily: "Poppins_500Medium", fontSize: 11, color: "#9CA3AF" },
  scoreBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  scoreBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#374151" },
  confText: { fontFamily: "Poppins_700Bold", fontSize: 13 },

  historyCardBody: { marginBottom: 10 },
  infoLine: { flexDirection: "row", marginBottom: 4, flexWrap: "wrap" },
  infoLineLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#374151", marginRight: 4 },
  infoLineValue: { fontFamily: "Poppins_500Medium", fontSize: 13, color: "#6B7280", flex: 1 },

  // Fertilizer grid
  fertGrid: {
    flexDirection: "row", flexWrap: "wrap",
    backgroundColor: "#F9FAFB", borderRadius: 10, padding: 10,
    marginBottom: 10, gap: 4,
  },
  fertItem: { width: "47%", padding: 6 },
  fertLabel: { fontFamily: "Poppins_500Medium", fontSize: 11, color: "#9CA3AF" },
  fertValue: { fontFamily: "Poppins_700Bold", fontSize: 14 },

  // Delete small btn
  deleteBtnSmall: {
    flexDirection: "row", alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "#FEF2F2", borderRadius: 8,
  },
  deleteBtnSmallText: {
    fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#EF4444", marginLeft: 4,
  },

  // Empty state
  emptyState: {
    alignItems: "center", paddingVertical: 40,
    backgroundColor: "white", borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  emptyText: {
    fontFamily: "Poppins_500Medium", fontSize: 14, color: "#9CA3AF", marginTop: 12,
  },
});
