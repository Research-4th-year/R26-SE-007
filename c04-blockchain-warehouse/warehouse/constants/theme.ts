/**
 * Shared design tokens for the Paddy Warehouse app.
 * Centralizing colors here avoids re-declaring the same hex values
 * and threshold logic (e.g. "utilization > 80%") in every screen.
 */

export const COLORS = {
  // Brand
  primary: "#16A34A",
  primaryDark: "#15803D",
  primaryLight: "#BBF7D0",
  primaryMuted: "#86EFAC",

  // Neutrals
  bgScreen: "#F9FAFB",
  bgCard: "#FFFFFF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  textPrimary: "#1F2937",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  textFaint: "#9CA3AF",
  textDisabled: "#D1D5DB",

  // Status
  danger: "#EF4444",
  dangerBg: "#FEE2E2",
  dangerText: "#B91C1C",

  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  warningText: "#A16207",

  success: "#16A34A",
  successBg: "#DCFCE7",
  successText: "#15803D",

  info: "#3B82F6",
  infoBg: "#EFF6FF",
  infoText: "#1D4ED8",

  white: "#FFFFFF",
} as const;

/** Utilization thresholds shared by dashboard + warehouses screens. */
export function getUtilizationColors(pct: number) {
  if (pct > 80) {
    return { bar: COLORS.danger, badgeBg: COLORS.dangerBg, badgeText: COLORS.dangerText, text: COLORS.danger };
  }
  if (pct > 50) {
    return { bar: COLORS.warning, badgeBg: COLORS.warningBg, badgeText: COLORS.warningText, text: COLORS.warning };
  }
  return { bar: COLORS.success, badgeBg: COLORS.successBg, badgeText: COLORS.successText, text: COLORS.textPrimary };
}

/** Reliability (GNN score) coloring, shared by dashboard + warehouses screens. */
export function getReliabilityColor(score: number) {
  return score > 0.7 ? COLORS.success : COLORS.danger;
}

/** Disaster status badge coloring, used by the disasters screen. */
export function getStatusColors(status: string) {
  switch (status) {
    case "OPEN":
      return { bg: COLORS.dangerBg, text: COLORS.dangerText };
    case "IN_PROGRESS":
      return { bg: COLORS.warningBg, text: COLORS.warningText };
    case "RESOLVED":
      return { bg: COLORS.successBg, text: COLORS.successText };
    default:
      return { bg: COLORS.borderLight, text: COLORS.textMuted };
  }
}

export const DISASTER_ICONS: Record<string, string> = {
  FLOOD: "🌊",
  CYCLONE: "🌀",
  ELEPHANT_ATTACK: "🐘",
  FIRE: "🔥",
  OTHER: "⚠️",
};