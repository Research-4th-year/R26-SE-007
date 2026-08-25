import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { changeMarketplacePassword } from "@/services/c03-marketplace/auth.service";

import { saveMarketplaceSession } from "@/services/c03-marketplace/session-storage.service";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";

import { useLanguage } from "@/contexts/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Small animation helpers — purely presentational, no logic changes  */
/* ------------------------------------------------------------------ */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale(target = 0.97) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}

function useEntrance(delay = 0) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Live requirement helpers — display only, submit logic unchanged    */
/* ------------------------------------------------------------------ */

function getPasswordChecks(value: string) {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
  };
}

export default function ChangePasswordScreen() {
  const { user, refreshCurrentUser } = useMarketplaceAuth();

  const { t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPasswords, setShowPasswords] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
  Alert.alert(
    t.changePassword.missingInformation,
    t.changePassword.completeAllFields
  );

  return;
}

    if (newPassword !== confirmPassword) {
  Alert.alert(
    t.changePassword.passwordsDoNotMatch,
    t.changePassword.confirmPasswordAgain
  );

  return;
}

    try {
      setSubmitting(true);

      const session = await changeMarketplacePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      /*
       * Replace the stored token because the backend
       * generates a fresh JWT after the password change.
       */
      await saveMarketplaceSession(JSON.stringify(session));

      /*
       * Sync the provider with the backend.
       */
      await refreshCurrentUser();

      Alert.alert(
        t.changePassword.passwordUpdated,
        t.changePassword.passwordUpdatedMessage,
      );

      if (session.user.role === "farmer") {
        router.replace("/(c03-marketplace)/(farmer)/home");

        return;
      }

      router.replace("/(c03-marketplace)/(miller)/home");
    } catch (error) {
      Alert.alert(
        t.changePassword.passwordChangeFailed,
        error instanceof Error ? error.message : t.changePassword.unableToChangePassword
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isMiller = user?.role === "miller";

  const colors: [string, string] = isMiller
    ? ["#78350F", "#92400E"]
    : ["#14532D", "#15803D"];

  const accent = isMiller ? "#FDE68A" : "#BBF7D0";

  const isForcedPasswordChange = Boolean(user?.mustChangePassword);

  const checks = useMemo(
    () => getPasswordChecks(newPassword),
    [newPassword]
  );

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  const passwordsMismatch =
    confirmPassword.length > 0 &&
    newPassword !== confirmPassword;

  const cardEntrance = useEntrance(90);
  const headerEntrance = useEntrance(0);
  const button = usePressScale(0.97);
  const backButton = usePressScale(0.88);
  const toggleButton = usePressScale(0.94);

  return (
    <LinearGradient colors={colors} style={styles.screen}>
      <View style={styles.decoCircleOne} pointerEvents="none" />
      <View style={styles.decoCircleTwo} pointerEvents="none" />
      <View style={styles.decoCircleThree} pointerEvents="none" />

      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <KeyboardAvoidingView
          style={{
            flex: 1,
          }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!isForcedPasswordChange ? (
              <AnimatedPressable
                onPress={() => router.back()}
                onPressIn={backButton.onPressIn}
                onPressOut={backButton.onPressOut}
                style={[
                  styles.passwordBackButton,
                  { transform: [{ scale: backButton.scale }] },
                ]}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </AnimatedPressable>
            ) : null}

            <Animated.View style={headerEntrance}>
              <View style={styles.iconRingOuter}>
                <View style={styles.iconRing}>
                  <Ionicons name="key-outline" size={30} color="#FFFFFF" />
                </View>

                <View style={[styles.iconBadge, { backgroundColor: accent }]}>
                  <Ionicons
                    name={
                      isForcedPasswordChange ? "sparkles" : "shield-checkmark"
                    }
                    size={13}
                    color={isMiller ? "#78350F" : "#14532D"}
                  />
                </View>
              </View>

              <Text style={styles.title}>
                {isForcedPasswordChange
                  ? t.changePassword.createNewPassword
                  : t.changePassword.changeYourPassword}
              </Text>

              <Text style={styles.subtitle}>
                {isForcedPasswordChange
                  ? t.changePassword.forcedPasswordSubtitle
                  : t.changePassword.changePasswordSubtitle}
              </Text>
            </Animated.View>

            <Animated.View style={[styles.card, cardEntrance]}>
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.cardHeaderIcon,
                    {
                      backgroundColor: isMiller ? "#FEF3C7" : "#DCFCE7",
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed"
                    size={16}
                    color={isMiller ? "#92400E" : "#166534"}
                  />
                </View>

                <View style={styles.cardHeaderTextArea}>
                  <Text style={styles.cardHeaderTitle}>
                    {t.changePassword.accountSecurity}
                  </Text>
                  <Text style={styles.cardHeaderSubtitle}>
                    {t.changePassword.accountSecuritySubtitle}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <PasswordField
                label={t.changePassword.temporaryPassword}
                icon="key-outline"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                visible={showPasswords}
              />

              <PasswordField
                label={t.changePassword.newPassword}
                icon="lock-closed-outline"
                value={newPassword}
                onChangeText={setNewPassword}
                visible={showPasswords}
              />

              <PasswordField
                label={t.changePassword.confirmNewPassword}
                icon="checkmark-circle-outline"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                visible={showPasswords}
                statusIcon={
                  passwordsMatch
                    ? "checkmark-circle"
                    : passwordsMismatch
                      ? "close-circle"
                      : undefined
                }
                statusColor={
                  passwordsMatch
                    ? "#16A34A"
                    : passwordsMismatch
                      ? "#DC2626"
                      : undefined
                }
              />

              <AnimatedPressable
                onPress={() => setShowPasswords((value) => !value)}
                onPressIn={toggleButton.onPressIn}
                onPressOut={toggleButton.onPressOut}
                style={[
                  styles.showRow,
                  { transform: [{ scale: toggleButton.scale }] },
                ]}
              >
                <Ionicons
                  name={showPasswords ? "eye-off-outline" : "eye-outline"}
                  size={15}
                  color="#64748B"
                />

                <Text style={styles.showText}>
                  {showPasswords
                    ? t.changePassword.hidePasswords
                    : t.changePassword.showPasswords}
                </Text>
              </AnimatedPressable>

              <View style={styles.requirements}>
                <View style={styles.requirementHeaderRow}>
                  <Ionicons
                    name="information-circle"
                    size={14}
                    color="#92400E"
                  />
                  <Text style={styles.requirementTitle}>
                    {t.changePassword.passwordRequirements}
                  </Text>
                </View>

                <View style={styles.requirementChecklist}>
                  <RequirementRow
                    met={checks.length}
                    label={t.changePassword.atLeast8Characters}
                  />
                  <RequirementRow
                    met={checks.upper}
                    label={t.changePassword.oneUppercaseLetter}
                  />
                  <RequirementRow
                    met={checks.lower}
                    label={t.changePassword.oneLowercaseLetter}
                  />
                  <RequirementRow met={checks.number} label={t.changePassword.oneNumber} />
                </View>
              </View>

              <AnimatedPressable
                disabled={submitting}
                onPress={() => void handleChangePassword()}
                onPressIn={button.onPressIn}
                onPressOut={button.onPressOut}
                style={[
                  styles.buttonShadow,
                  { transform: [{ scale: button.scale }] },
                ]}
              >
                <LinearGradient
                  colors={colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.button, submitting && styles.disabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>
                        {t.changePassword.saveNewPassword}
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>

              <View style={styles.footerNote}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={13}
                  color="#94A3B8"
                />
                <Text style={styles.footerNoteText}>
                  {t.changePassword.securityNote}
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function RequirementRow({
  met,
  label,
}: {
  met: boolean;
  label: string;
}) {
  return (
    <View style={styles.requirementRow}>
      <View
        style={[
          styles.requirementDot,
          met && styles.requirementDotMet,
        ]}
      >
        <Ionicons
          name={met ? "checkmark" : "ellipse"}
          size={met ? 10 : 6}
          color={met ? "#FFFFFF" : "#D6B370"}
        />
      </View>

      <Text
        style={[
          styles.requirementText,
          met && styles.requirementTextMet,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function PasswordField({
  label,
  icon,
  value,
  onChangeText,
  visible,
  statusIcon,
  statusColor,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  statusIcon?: keyof typeof Ionicons.glyphMap;
  statusColor?: string;
}) {

    const { t } = useLanguage();
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputBox}>
        <View style={styles.inputIconChip}>
          <Ionicons name={icon} size={16} color="#64748B" />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          style={styles.input}
          placeholder={t.changePassword.enterPassword}
          placeholderTextColor="#B4BEC9"
        />

        {statusIcon ? (
          <Ionicons
            name={statusIcon}
            size={17}
            color={statusColor}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },

  decoCircleOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -90,
    right: -70,
  },

  decoCircleTwo: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: 40,
    left: -60,
  },

  decoCircleThree: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.045)",
    top: "38%",
    right: -30,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
    paddingBottom: 40,
  },

  iconRingOuter: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    position: "relative",
  },

  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.24)",
  },

  iconBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 18,
    letterSpacing: -0.3,
  },

  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10.5,
    lineHeight: 17,
    textAlign: "center",
    maxWidth: 320,
    alignSelf: "center",
    marginTop: 7,
    marginBottom: 22,
  },

  card: {
    borderRadius: 26,
    padding: 19,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cardHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  cardHeaderTextArea: {
    flex: 1,
  },

  cardHeaderTitle: {
    color: "#1F2937",
    fontSize: 12.5,
    fontWeight: "800",
  },

  cardHeaderSubtitle: {
    color: "#94A3B8",
    fontSize: 8.5,
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginTop: 14,
    marginBottom: 16,
  },

  fieldWrap: {
    marginBottom: 15,
  },

  label: {
    color: "#374151",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 7,
  },

  inputBox: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 11,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  inputIconChip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2F7",
  },

  input: {
    flex: 1,
    color: "#1F2937",
    fontSize: 11,
    paddingVertical: 0,
  },

  showRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-end",
    marginTop: -2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },

  showText: {
    color: "#64748B",
    fontSize: 8.5,
    fontWeight: "700",
  },

  requirements: {
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginTop: 15,
  },

  requirementHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  requirementTitle: {
    color: "#92400E",
    fontSize: 9,
    fontWeight: "900",
  },

  requirementChecklist: {
    marginTop: 9,
    gap: 7,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  requirementDot: {
    width: 17,
    height: 17,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(217,119,6,0.14)",
  },

  requirementDotMet: {
    backgroundColor: "#16A34A",
  },

  requirementText: {
    color: "#A16207",
    fontSize: 9,
    fontWeight: "600",
  },

  requirementTextMet: {
    color: "#166534",
    fontWeight: "800",
  },

  buttonShadow: {
    borderRadius: 15,
    marginTop: 18,
    shadowColor: "#14532D",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  button: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },

  disabled: {
    opacity: 0.7,
  },

  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 14,
  },

  footerNoteText: {
    color: "#94A3B8",
    fontSize: 8.5,
    fontWeight: "600",
  },

  passwordBackButton: {
    position: "absolute",
    top: 22,
    left: 20,
    zIndex: 10,

    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.12)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
});