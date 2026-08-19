import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";
import { connectionService } from "@/services/c03-marketplace/connection.service";
import type { SearchMarketplaceItem } from "@/types/c03-marketplace/connection.types";

// NOTE: This screen assumes Poppins has already been loaded app-wide
// (e.g. via @expo-google-fonts/poppins / expo-font in your root layout)
// using these family names: Poppins_400Regular, Poppins_500Medium,
// Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold.
const FONT = {
  regular: "Poppins_400Regular",
  medium: "Poppins_500Medium",
  semibold: "Poppins_600SemiBold",
  bold: "Poppins_700Bold",
  extrabold: "Poppins_800ExtraBold",
};

const DISTRICTS = ["All", "Ampara", "Kandy", "Badulla", "Monaragala"];

export default function SearchScreen() {
  const { user } = useMarketplaceAuth();

  const [results, setResults] = useState<SearchMarketplaceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);

  const isFarmer = user?.role === "farmer";

  const theme = useMemo(
    () =>
      isFarmer
        ? {
            primary: "#15803D",
            dark: "#14532D",
            soft: "#DCFCE7",
            border: "#BBF7D0",
            page: "#F7FAF7",
            shadow: "#0F5132",
          }
        : {
            primary: "#92400E",
            dark: "#78350F",
            soft: "#FEF3C7",
            border: "#FDE68A",
            page: "#FBF8F2",
            shadow: "#78350F",
          },
    [isFarmer]
  );

  const loadUsers = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await connectionService.searchUsers({
          district: selectedDistrict === "All" ? undefined : selectedDistrict,
        });

        setResults(response.data);
      } catch (error) {
        console.error("Search loading failed:", error);
        Alert.alert(
          "Unable to load users",
          error instanceof Error ? error.message : "Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDistrict]
  );

  useFocusEffect(
    useCallback(() => {
      void loadUsers();
    }, [loadUsers])
  );

  async function handleSearch() {
    try {
      setSearching(true);

      const response = await connectionService.searchUsers({
        query: searchQuery,
        district: selectedDistrict === "All" ? undefined : selectedDistrict,
      });

      setResults(response.data);
    } catch (error) {
      Alert.alert(
        "Search failed",
        error instanceof Error ? error.message : "Unable to search."
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleConnect(item: SearchMarketplaceItem) {
    try {
      await connectionService.sendRequest(item.profile.type, item.profile.id);

      setResults((current) =>
        current.map((result) =>
          result.profile.id === item.profile.id
            ? {
                ...result,
                connection: {
                  ...result.connection,
                  status: "pending",
                  direction: "outgoing",
                  canSendRequest: false,
                  canRespond: false,
                },
              }
            : result
        )
      );

      Alert.alert(
        "Request sent",
        `Your connection request was sent to ${item.profile.name}.`
      );
    } catch (error) {
      Alert.alert(
        "Unable to connect",
        error instanceof Error ? error.message : "Please try again."
      );
    }
  }

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return results;
    }

    const normalized = searchQuery.trim().toLowerCase();

    return results.filter((item) =>
      [
        item.profile.name,
        item.profile.district,
        item.profile.location,
        item.profile.type === "miller"
          ? item.profile.millName
          : item.profile.farmerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [results, searchQuery]);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.page }]}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>MARKETPLACE DISCOVERY</Text>
        <Text style={styles.headerTitle}>
          {isFarmer ? "Find Millers" : "Find Farmers"}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isFarmer
            ? "Discover registered rice millers and build trusted trading relationships."
            : "Discover farmer profiles and build your paddy sourcing network."}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingTitle}>Finding marketplace profiles</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadUsers(true)}
              tintColor={theme.primary}
            />
          }
        >
          <LinearGradient
            colors={[theme.dark, theme.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { shadowColor: theme.shadow }]}
          >
            <View style={styles.heroPatternA} pointerEvents="none" />
            <View style={styles.heroPatternB} pointerEvents="none" />
            <Ionicons
              name={isFarmer ? "leaf" : "business"}
              size={92}
              color="rgba(255,255,255,0.06)"
              style={styles.heroGhostIcon}
            />

            <View style={styles.heroIcon}>
              <Ionicons name="search" size={22} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Search your trading network</Text>
              <Text style={styles.heroText}>
                Search by name,{isFarmer ? " mill name," : " farm name,"}{" "}
                district or location.
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#94A3B8" />

            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => void handleSearch()}
              placeholder={
                isFarmer
                  ? "Search name or rice mill..."
                  : "Search farmer or farm..."
              }
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />

            {searching ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : searchQuery ? (
              <Pressable
                onPress={() => {
                  setSearchQuery("");
                  void loadUsers();
                }}
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={19} color="#CBD5E1" />
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.filterLabel}>Filter by district</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.districtList}
          >
            {DISTRICTS.map((district) => {
              const active = district === selectedDistrict;

              return (
                <Pressable
                  key={district}
                  onPress={() => setSelectedDistrict(district)}
                  style={[
                    styles.districtChip,
                    active && {
                      backgroundColor: theme.dark,
                      borderColor: theme.dark,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.districtText,
                      active && styles.districtTextActive,
                    ]}
                  >
                    {district}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.resultHeader}>
            <Text style={styles.sectionTitle}>
              {isFarmer ? "Available Millers" : "Available Farmers"}
            </Text>
            <View
              style={[styles.countPill, { backgroundColor: theme.soft }]}
            >
              <Text style={[styles.resultCount, { color: theme.dark }]}>
                {filteredResults.length} profiles
              </Text>
            </View>
          </View>

          {filteredResults.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[styles.emptyIcon, { backgroundColor: theme.soft }]}
              >
                <Ionicons name="search-outline" size={28} color={theme.primary} />
              </View>
              <Text style={styles.emptyTitle}>No profiles found</Text>
              <Text style={styles.emptyText}>
                Try a different name, location or district.
              </Text>
            </View>
          ) : (
            <View style={styles.resultList}>
              {filteredResults.map((item) => (
                <SearchCard
                  key={item.profile.id}
                  item={item}
                  theme={theme}
                  onConnect={() => void handleConnect(item)}
                  onOpen={() =>
                    router.push({
                      pathname: "/(c03-marketplace)/public-profile" as any,
                      params: {
                        partnerType: item.profile.type,
                        partnerId: item.profile.id,
                      },
                    })
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SearchCard({
  item,
  theme,
  onOpen,
  onConnect,
}: {
  item: SearchMarketplaceItem;
  theme: { primary: string; dark: string; soft: string; border: string };
  onOpen: () => void;
  onConnect: () => void;
}) {
  const profile = item.profile;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
    >
      <View style={styles.profileTop}>
        <LinearGradient
          colors={[theme.soft, "#FFFFFF"]}
          style={styles.avatar}
        >
          <Ionicons
            name={profile.type === "miller" ? "business-outline" : "leaf-outline"}
            size={22}
            color={theme.primary}
          />
        </LinearGradient>

        <View style={styles.profileText}>
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile.name}
            </Text>

            {profile.isVerified ? (
              <Ionicons name="checkmark-circle" size={15} color="#2563EB" />
            ) : null}
          </View>

          <Text style={[styles.profileType, { color: theme.primary }]}>
            {profile.type === "miller"
              ? profile.verificationSource === "PMB"
                ? "PMB REGISTERED MILLER"
                : "RICE MILLER"
              : profile.verificationSource === "RESEARCH_SYNTHETIC"
              ? "RESEARCH FARMER PROFILE"
              : "FARMER"}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color="#94A3B8" />
            <Text style={styles.locationText}>
              {profile.district} · {profile.location}
            </Text>
          </View>
        </View>
      </View>

      {profile.type === "miller" ? (
        <View style={styles.infoStrip}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>MILL</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {profile.millName}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>REGISTRATION</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {profile.businessRegistrationNumber || "Not provided"}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.infoStrip}>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>MAIN PADDY</Text>
            <Text style={styles.infoValue}>
              {profile.mainPaddyVariety || "Not provided"}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>FARM SIZE</Text>
            <Text style={styles.infoValue}>
              {profile.farmSizeAcres ?? 0} acres
            </Text>
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={onOpen} style={styles.viewButton}>
          <Ionicons name="person-outline" size={15} color={theme.primary} />
          <Text style={[styles.viewButtonText, { color: theme.primary }]}>
            View Profile
          </Text>
        </Pressable>

        <ConnectionButton item={item} theme={theme} onConnect={onConnect} onOpen={onOpen} />
      </View>
    </Pressable>
  );
}

function ConnectionButton({
  item,
  theme,
  onConnect,
  onOpen,
}: {
  item: SearchMarketplaceItem;
  theme: { primary: string; soft: string };
  onConnect: () => void;
  onOpen: () => void;
}) {
  if (item.connection.status === "accepted") {
    return (
      <Pressable
        onPress={onOpen}
        style={[styles.connectButton, { backgroundColor: "#DCFCE7" }]}
      >
        <Ionicons name="checkmark-circle" size={16} color="#166534" />
        <Text style={[styles.connectButtonText, { color: "#166534" }]}>
          Connected
        </Text>
      </Pressable>
    );
  }

  if (
    item.connection.status === "pending" &&
    item.connection.direction === "outgoing"
  ) {
    return (
      <View style={[styles.connectButton, { backgroundColor: "#F1F5F9" }]}>
        <Ionicons name="time-outline" size={16} color="#64748B" />
        <Text style={[styles.connectButtonText, { color: "#64748B" }]}>
          Requested
        </Text>
      </View>
    );
  }

  if (
    item.connection.status === "pending" &&
    item.connection.direction === "incoming"
  ) {
    return (
      <Pressable
        onPress={onOpen}
        style={[styles.connectButton, { backgroundColor: "#FEF3C7" }]}
      >
        <Ionicons name="mail-unread-outline" size={16} color="#92400E" />
        <Text style={[styles.connectButtonText, { color: "#92400E" }]}>
          Respond
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onConnect}
      style={[styles.connectButton, { backgroundColor: theme.primary }]}
    >
      <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
      <Text style={styles.connectWhiteText}>Connect</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F4",
  },

  headerEyebrow: {
    fontFamily: FONT.extrabold,
    color: "#94A3B8",
    fontSize: 10,
    letterSpacing: 1.4,
  },

  headerTitle: {
    fontFamily: FONT.extrabold,
    color: "#0F172A",
    fontSize: 24,
    marginTop: 4,
  },

  headerSubtitle: {
    fontFamily: FONT.regular,
    color: "#64748B",
    fontSize: 12.5,
    lineHeight: 18,
    maxWidth: 340,
    marginTop: 5,
  },

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingTitle: {
    fontFamily: FONT.semibold,
    color: "#475569",
    fontSize: 13,
  },

  content: {
    padding: 20,
    paddingBottom: 130,
  },

  hero: {
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },

  heroPatternA: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -50,
    right: -30,
  },

  heroPatternB: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: -35,
    right: 50,
  },

  heroGhostIcon: {
    position: "absolute",
    right: -10,
    bottom: -14,
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },

  heroTitle: {
    fontFamily: FONT.bold,
    color: "#FFFFFF",
    fontSize: 15,
  },

  heroText: {
    fontFamily: FONT.regular,
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  searchContainer: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF1F4",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    fontFamily: FONT.medium,
    color: "#0F172A",
    fontSize: 12.5,
  },

  filterLabel: {
    fontFamily: FONT.bold,
    color: "#94A3B8",
    fontSize: 10.5,
    letterSpacing: 0.4,
    marginTop: 18,
  },

  districtList: {
    gap: 8,
    paddingVertical: 10,
  },

  districtChip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  districtText: {
    fontFamily: FONT.semibold,
    color: "#64748B",
    fontSize: 10.5,
  },

  districtTextActive: {
    color: "#FFFFFF",
  },

  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 12,
  },

  sectionTitle: {
    fontFamily: FONT.extrabold,
    color: "#0F172A",
    fontSize: 17,
  },

  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  resultCount: {
    fontFamily: FONT.bold,
    fontSize: 10,
  },

  resultList: {
    gap: 14,
  },

  profileCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  profileText: {
    flex: 1,
  },

  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  profileName: {
    flexShrink: 1,
    fontFamily: FONT.bold,
    color: "#0F172A",
    fontSize: 14.5,
  },

  profileType: {
    fontFamily: FONT.extrabold,
    fontSize: 8.5,
    letterSpacing: 0.7,
    marginTop: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },

  locationText: {
    fontFamily: FONT.regular,
    color: "#64748B",
    fontSize: 10.5,
  },

  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    marginTop: 14,
    borderRadius: 15,
    backgroundColor: "#F8FAFC",
  },

  infoDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#E2E8F0",
  },

  infoLabel: {
    fontFamily: FONT.bold,
    color: "#94A3B8",
    fontSize: 7.5,
    letterSpacing: 0.3,
  },

  infoValue: {
    fontFamily: FONT.semibold,
    color: "#334155",
    fontSize: 10.5,
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
  },

  viewButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  viewButtonText: {
    fontFamily: FONT.bold,
    fontSize: 10.5,
  },

  connectButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  connectButtonText: {
    fontFamily: FONT.bold,
    fontSize: 10.5,
  },

  connectWhiteText: {
    fontFamily: FONT.bold,
    color: "#FFFFFF",
    fontSize: 10.5,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontFamily: FONT.extrabold,
    color: "#0F172A",
    fontSize: 15,
    marginTop: 14,
  },

  emptyText: {
    fontFamily: FONT.regular,
    color: "#64748B",
    fontSize: 10.5,
    marginTop: 5,
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});