import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { Pressable, StyleSheet, Text, View } from "@/components/c03-marketplace/themed-native";

import { useLanguage } from "@/contexts/LanguageContext";
import { useMarketplaceAppearance } from "@/contexts/c03-marketplace/MarketplaceAppearanceContext";

export function MarketplaceAppearanceSettings({
  accent,
  accentSoft,
}: {
  accent: string;
  accentSoft: string;
}) {
  const { t } = useLanguage();
  const {
    fontSize,
    colorScheme,
    isDark,
    setFontSize,
    setColorScheme,
  } = useMarketplaceAppearance();

  const cardBorder = isDark ? "#334155" : "#E5E7EB";
  const cardBackground = isDark ? "#1E293B" : "#FFFFFF";
  const titleColor = isDark ? "#F8FAFC" : "#1F2937";
  const subtitleColor = isDark ? "#94A3B8" : "#64748B";
  const chipBorder = isDark ? "#475569" : "#E5E7EB";
  const chipBackground = isDark ? "#0F172A" : "#F8FAFC";

  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <View style={[styles.sectionIcon, { backgroundColor: accentSoft }]}>
          <Ionicons name="color-palette-outline" size={16} color={accent} />
        </View>
        <Text style={[styles.sectionTitle, { color: titleColor }]}>
          {t.c3appearance.title}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBackground,
            borderColor: cardBorder,
          },
        ]}
      >
        <Text style={[styles.groupLabel, { color: subtitleColor }]}>
          {t.c3appearance.fontSize}
        </Text>

        <View style={styles.optionRow}>
          <OptionChip
            label={t.c3appearance.defaultSize}
            selected={fontSize === "default"}
            accent={accent}
            accentSoft={accentSoft}
            borderColor={chipBorder}
            backgroundColor={chipBackground}
            textColor={titleColor}
            onPress={() => void setFontSize("default")}
          />
          <OptionChip
            label={t.c3appearance.largeSize}
            selected={fontSize === "large"}
            accent={accent}
            accentSoft={accentSoft}
            borderColor={chipBorder}
            backgroundColor={chipBackground}
            textColor={titleColor}
            onPress={() => void setFontSize("large")}
          />
        </View>

        <Text
          style={[
            styles.groupLabel,
            styles.themeLabel,
            { color: subtitleColor },
          ]}
        >
          {t.c3appearance.theme}
        </Text>

        <View style={styles.optionRow}>
          <OptionChip
            icon="sunny-outline"
            label={t.c3appearance.light}
            selected={colorScheme === "light"}
            accent={accent}
            accentSoft={accentSoft}
            borderColor={chipBorder}
            backgroundColor={chipBackground}
            textColor={titleColor}
            onPress={() => void setColorScheme("light")}
          />
          <OptionChip
            icon="moon-outline"
            label={t.c3appearance.dark}
            selected={colorScheme === "dark"}
            accent={accent}
            accentSoft={accentSoft}
            borderColor={chipBorder}
            backgroundColor={chipBackground}
            textColor={titleColor}
            onPress={() => void setColorScheme("dark")}
          />
        </View>
      </View>
    </>
  );
}

function OptionChip({
  icon,
  label,
  selected,
  accent,
  accentSoft,
  borderColor,
  backgroundColor,
  textColor,
  onPress,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  accent: string;
  accentSoft: string;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? accentSoft : backgroundColor,
          borderColor: selected ? accent : borderColor,
        },
        pressed && styles.pressed,
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? accent : textColor}
        />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: selected ? accent : textColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    marginTop: 22,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Poppins_800ExtraBold",
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  themeLabel: {
    marginTop: 16,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  pressed: {
    opacity: 0.82,
  },
});
