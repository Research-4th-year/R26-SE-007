import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { authService } from "@/services/shared/auth.service";
import { COLORS } from "@/constants/theme";
import { useLanguage } from "@/contexts/LanguageContext";

const ADMIN_ACTIONS = [
  {
    titleKey: "createWarehouseTitle" as const,
    descKey: "createWarehouseDesc" as const,
    icon: "add-circle",
    color: COLORS.primary,
    route: "/(c01-warehouse)/(admin)/create-warehouse",
  },
  {
    titleKey: "registerUserTitle" as const,
    descKey: "registerUserDesc" as const,
    icon: "person-add",
    color: COLORS.info,
    route: "/(c01-warehouse)/(admin)/register-user",
  },
  {
    titleKey: "manageUsersTitle" as const,
    descKey: "manageUsersDesc" as const,
    icon: "people",
    color: COLORS.warning,
    route: "/(c01-warehouse)/(admin)/manage-users",
  },
];

export default function AdminScreen() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    authService.getStoredUser().then(setUser);
  }, []);

  if (user && user.role !== "ADMIN") {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed" size={48} color={COLORS.textFaint} />
        <Text style={styles.lockedTitle}>{t.warehouse.admin.lockedTitle}</Text>
        <Text style={styles.lockedSub}>
          {t.warehouse.admin.lockedMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.warehouse.admin.title}</Text>
        <Text style={styles.headerSub}>{t.warehouse.admin.subtitle}</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>{t.warehouse.admin.management}</Text>
          {ADMIN_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.route}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: action.color + "20" },
                ]}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <View style={styles.actionInfo}>
                <Text style={styles.actionTitle}>
                  {t.warehouse.admin[action.titleKey]}
                </Text>
                <Text style={styles.actionDesc}>
                  {t.warehouse.admin[action.descKey]}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={COLORS.textFaint}
              />
            </TouchableOpacity>
          ))}

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
    padding: 32,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  lockedSub: {
    fontSize: 13,
    color: COLORS.textFaint,
    textAlign: "center",
    marginTop: 8,
  },
  scroll: { flex: 1 },
  content: { padding: 16 },

  header: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: "bold" },
  headerSub: { color: COLORS.primaryLight, fontSize: 12, marginTop: 2 },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: "bold", color: COLORS.textPrimary },
  actionDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  bottomSpacer: { height: 40 },
});