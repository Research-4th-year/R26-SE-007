import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { saveFarmerProfile } from "@/services/farming/api";

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "Farmer Name",
    phone: "+94 77 123 4567",
    location: "Anuradhapura, Sri Lanka",
    farmSize: "2.5 Acres"
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await saveFarmerProfile(profile);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      Alert.alert("Error", "Could not save profile updates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={COLORS.primaryLight} />
        </View>
        <View style={styles.profileInfo}>
          {isEditing ? (
            <TextInput 
              style={styles.inputName}
              value={profile.name}
              onChangeText={(text) => setProfile({...profile, name: text})}
            />
          ) : (
            <Text style={styles.profileName}>{profile.name}</Text>
          )}

          {isEditing ? (
            <TextInput 
              style={styles.inputPhone}
              value={profile.phone}
              onChangeText={(text) => setProfile({...profile, phone: text})}
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.profilePhone}>{profile.phone}</Text>
          )}
        </View>
        
        {isEditing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color={COLORS.white} size="small" /> : <Ionicons name="checkmark" size={20} color={COLORS.white} />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {/* Farm Details */}
        <Text style={styles.sectionTitle}>Farm Details</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="location-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Location</Text>
            </View>
            {isEditing ? (
              <TextInput 
                style={styles.settingInput}
                value={profile.location}
                onChangeText={(text) => setProfile({...profile, location: text})}
              />
            ) : (
              <Text style={styles.settingValue}>{profile.location}</Text>
            )}
          </View>
          <View style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="map-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Farm Size</Text>
            </View>
            {isEditing ? (
              <TextInput 
                style={styles.settingInput}
                value={profile.farmSize}
                onChangeText={(text) => setProfile({...profile, farmSize: text})}
              />
            ) : (
              <Text style={styles.settingValue}>{profile.farmSize}</Text>
            )}
          </View>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>English</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={notificationsEnabled ? COLORS.primary : COLORS.white}
            />
          </View>
          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Dark Theme</Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
              thumbColor={darkModeEnabled ? COLORS.primary : COLORS.white}
            />
          </View>
        </View>

        {/* App Information */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>App Information</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.textSecondary} />
              <Text style={styles.settingText}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  profileSection: {
    backgroundColor: COLORS.white,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryDark,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  inputName: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 0,
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  inputPhone: {
    fontSize: 14,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 0,
  },
  editButton: {
    padding: 8,
    backgroundColor: COLORS.primaryLight + "40",
    borderRadius: 8,
  },
  saveButton: {
    padding: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginRight: 8,
  },
  settingInput: {
    fontSize: 14,
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    minWidth: 100,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginLeft: 52,
  },
  logoutButton: {
    marginTop: 8,
    backgroundColor: COLORS.dangerBg,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.danger + "20",
  },
  logoutText: {
    color: COLORS.dangerText,
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacer: { height: 32 },
});
