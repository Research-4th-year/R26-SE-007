import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  disasterService,
  Disaster,
  RankedCandidate,
} from "../../services/disaster.service";
import { COLORS, getStatusColors, DISASTER_ICONS } from "../../constants/theme";

export default function DisasterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [disaster, setDisaster] = useState<Disaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resolving, setResolving] = useState(false);

  const load = async () => {
    try {
      const data = await disasterService.getDisaster(id);
      setDisaster(data);
    } catch {
      Alert.alert("Error", "Failed to load disaster details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleRedistribute = (candidate: RankedCandidate) => {
    Alert.prompt(
      "Issue Redistribution Order",
      `From: ${candidate.name}\nAvailable: ${candidate.availableTons} tons\n\nEnter quantity (tons):`,
      async (qty) => {
        if (!qty) return;
        const quantity = parseFloat(qty);
        if (isNaN(quantity) || quantity <= 0) {
          Alert.alert("Invalid", "Enter a valid quantity");
          return;
        }
        try {
          await disasterService.redistribute(
            id,
            candidate.warehouseId,
            quantity,
          );
          Alert.alert(
            "Success",
            "Redistribution order issued and anchored on blockchain",
          );
          load();
        } catch (err: any) {
          Alert.alert(
            "Error",
            err?.response?.data?.message || "Failed to issue order",
          );
        }
      },
      "plain-text",
    );
  };

  const handleResolve = async () => {
    Alert.alert("Resolve Disaster", "Mark this disaster as resolved?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        style: "destructive",
        onPress: async () => {
          setResolving(true);
          try {
            await disasterService.updateStatus(id, "RESOLVED");
            Alert.alert("Resolved", "Disaster marked as resolved");
            router.back();
          } catch (err: any) {
            Alert.alert(
              "Error",
              err?.response?.data?.message || "Failed to resolve",
            );
          } finally {
            setResolving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!disaster) return null;

  const status = getStatusColors(disaster.status);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.headerIcon}>
            {DISASTER_ICONS[disaster.disasterType] ?? "⚠️"}
          </Text>
          <View>
            <Text style={styles.headerTitle}>
              {disaster.disasterType.replace("_", " ")}
            </Text>
            <Text style={styles.headerSubtitle}>
              {disaster.affectedWarehouse.name}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View style={styles.content}>
          {/* Status card */}
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <Text style={styles.cardTitle}>Status</Text>
              <View
                style={[styles.statusBadge, { backgroundColor: status.bg }]}
              >
                <Text style={[styles.statusBadgeText, { color: status.text }]}>
                  {disaster.status.replace("_", " ")}
                </Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Estimated Loss</Text>
                <Text style={styles.statValue}>
                  {disaster.estimatedLossTons ?? "—"} tons
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Reported by</Text>
                <Text style={styles.statValue}>
                  {disaster.reportedBy.fullName}
                </Text>
              </View>
            </View>
            {disaster.blockchainTxId && (
              <View style={styles.chainRow}>
                <Ionicons name="lock-closed" size={12} color={COLORS.info} />
                <Text style={styles.chainText}>
                  Anchored on Hyperledger Fabric
                </Text>
              </View>
            )}
          </View>

          {/* ZKP Proofs */}
          {disaster.zkpProofs && disaster.zkpProofs.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitleBlock}>ZKP Capacity Proofs</Text>
              {disaster.zkpProofs.map((proof: any) => (
                <View key={proof.id} style={styles.proofRow}>
                  <Ionicons
                    name={
                      proof.verificationResult ? "shield-checkmark" : "shield"
                    }
                    size={16}
                    color={
                      proof.verificationResult ? COLORS.success : COLORS.danger
                    }
                  />
                  <Text style={styles.proofId}>
                    {proof.warehouseId.slice(0, 8)}...
                  </Text>
                  <Text
                    style={[
                      styles.proofStatus,
                      {
                        color: proof.verificationResult
                          ? COLORS.success
                          : COLORS.danger,
                      },
                    ]}
                  >
                    {proof.verificationResult ? "VERIFIED" : "FAILED"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ZKP Proofs button */}
          {disaster.status !== "RESOLVED" && (
            <TouchableOpacity
              style={styles.zkpButton}
              onPress={() => router.push(`/disaster/zkp/${id}`)}
            >
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={COLORS.success}
              />
              <Text style={styles.zkpButtonText}>ZKP Capacity Proofs</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={COLORS.success}
              />
            </TouchableOpacity>
          )}

          {/* Ranked Candidates */}
          {disaster.rankedCandidates &&
            disaster.rankedCandidates.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Ranked Candidates ({disaster.rankedCandidates.length})
                </Text>
                {disaster.rankedCandidates.map((c, index) => (
                  <View key={c.warehouseId} style={styles.candidateCard}>
                    <View style={styles.candidateHeader}>
                      <View style={styles.candidateHeaderLeft}>
                        <View style={styles.rankBadge}>
                          <Text style={styles.rankBadgeText}>#{index + 1}</Text>
                        </View>
                        <View style={styles.candidateInfo}>
                          <Text style={styles.candidateName}>{c.name}</Text>
                          <Text style={styles.candidateSubtitle}>
                            {c.code} · {c.district}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreValue}>
                          {c.compositeScore.toFixed(3)}
                        </Text>
                        <Text style={styles.scoreLabel}>score</Text>
                      </View>
                    </View>

                    <View style={styles.candidateStatsRow}>
                      <View style={styles.candidateStatItem}>
                        <Text style={styles.candidateStatLabel}>Distance</Text>
                        <Text style={styles.candidateStatValue}>
                          {c.distanceKm} km
                        </Text>
                      </View>
                      <View style={styles.candidateStatItem}>
                        <Text style={styles.candidateStatLabel}>Available</Text>
                        <Text
                          style={[
                            styles.candidateStatValue,
                            { color: COLORS.info },
                          ]}
                        >
                          {c.availableTons} tons
                        </Text>
                      </View>
                      <View style={styles.candidateStatItem}>
                        <Text style={styles.candidateStatLabel}>GNN Score</Text>
                        <Text style={styles.candidateStatValue}>
                          {(c.reliabilityScore * 100).toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.candidateStatItem}>
                        <Text style={styles.candidateStatLabel}>ZKP</Text>
                        <View style={styles.zkpRow}>
                          <Ionicons
                            name={
                              c.zkpVerified
                                ? "shield-checkmark"
                                : "shield-outline"
                            }
                            size={12}
                            color={
                              c.zkpVerified ? COLORS.success : COLORS.textFaint
                            }
                          />
                          <Text
                            style={[
                              styles.zkpText,
                              {
                                color: c.zkpVerified
                                  ? COLORS.success
                                  : COLORS.textFaint,
                              },
                            ]}
                          >
                            {c.zkpVerified ? "Yes" : "No"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {c.canFulfil && disaster.status !== "RESOLVED" && (
                      <TouchableOpacity
                        style={styles.redistributeButton}
                        onPress={() => handleRedistribute(c)}
                      >
                        <Text style={styles.redistributeButtonText}>
                          Issue Redistribution Order
                        </Text>
                      </TouchableOpacity>
                    )}
                    {!c.canFulfil && (
                      <View style={styles.insufficientBadge}>
                        <Text style={styles.insufficientText}>
                          Insufficient capacity
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

          {/* Redistribution Orders */}
          {disaster.redistributionOrders &&
            disaster.redistributionOrders.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitleBlock}>Redistribution Orders</Text>
                {disaster.redistributionOrders.map((order: any) => (
                  <View key={order.id} style={styles.orderRow}>
                    <Text style={styles.orderText}>
                      {order.quantityTons} tons · {order.sourceWarehouse?.name}{" "}
                      → {order.destinationWarehouse?.name}
                    </Text>
                    {order.blockchainTxId && (
                      <View style={styles.orderChainRow}>
                        <Ionicons
                          name="lock-closed"
                          size={10}
                          color={COLORS.info}
                        />
                        <Text style={styles.orderChainText}>
                          Blockchain anchored
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

          {/* Audit Trail button */}
          <TouchableOpacity
            style={styles.auditButton}
            onPress={() => router.push(`/disaster/audit/${id}`)}
          >
            <Ionicons name="lock-closed" size={16} color={COLORS.info} />
            <Text style={styles.auditButtonText}>
              View Blockchain Audit Trail
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.info} />
          </TouchableOpacity>

          {/* Resolve button */}
          {disaster.status !== "RESOLVED" && (
            <TouchableOpacity
              style={[
                styles.resolveButton,
                resolving && styles.resolveButtonDisabled,
              ]}
              onPress={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgScreen },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgScreen,
  },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  backButton: { marginBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerIcon: { fontSize: 30, marginRight: 12 },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: COLORS.primaryLight, fontSize: 14 },

  list: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTitle: { color: COLORS.textSecondary, fontWeight: "bold" },
  cardTitleBlock: {
    color: COLORS.textSecondary,
    fontWeight: "bold",
    marginBottom: 12,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: "bold" },

  statsRow: { flexDirection: "row" },
  statItem: { flex: 1 },
  statLabel: { color: COLORS.textFaint, fontSize: 12 },
  statValue: { color: COLORS.textSecondary, fontWeight: "600" },

  chainRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  chainText: { color: COLORS.info, fontSize: 12, marginLeft: 4 },

  proofRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  proofId: { color: COLORS.textMuted, fontSize: 12, marginLeft: 8, flex: 1 },
  proofStatus: { fontSize: 12, fontWeight: "bold" },

  section: { marginBottom: 16 },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 12,
  },

  candidateCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  candidateHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  candidateHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rankBadgeText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: "bold",
  },
  candidateInfo: { flex: 1 },
  candidateName: { color: COLORS.textPrimary, fontWeight: "bold" },
  candidateSubtitle: { color: COLORS.textMuted, fontSize: 12 },
  scoreBox: { alignItems: "flex-end" },
  scoreValue: { color: COLORS.success, fontWeight: "bold", fontSize: 16 },
  scoreLabel: { color: COLORS.textFaint, fontSize: 12 },

  candidateStatsRow: { flexDirection: "row", marginBottom: 12 },
  candidateStatItem: { flex: 1 },
  candidateStatLabel: { color: COLORS.textFaint, fontSize: 12 },
  candidateStatValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  zkpRow: { flexDirection: "row", alignItems: "center" },
  zkpText: { fontSize: 12, marginLeft: 4 },

  redistributeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  redistributeButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  insufficientBadge: {
    backgroundColor: COLORS.borderLight,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  insufficientText: { color: COLORS.textFaint, fontSize: 12 },

  orderRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  orderText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "500" },
  orderChainRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  orderChainText: { color: COLORS.info, fontSize: 12, marginLeft: 4 },

  resolveButton: {
    backgroundColor: COLORS.textSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  resolveButtonDisabled: { backgroundColor: COLORS.textDisabled },
  resolveButtonText: { color: COLORS.white, fontWeight: "bold" },

  auditButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.infoBg,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  auditButtonText: {
    color: COLORS.info,
    fontWeight: "600",
    fontSize: 14,
  },
  zkpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 8,
  },
  zkpButtonText: {
    color: COLORS.successText,
    fontWeight: "600",
    fontSize: 14,
  },
  bottomSpacer: { height: 32 },
});
