import { Ionicons as VectorIonicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator as RNActivityIndicator,
  Animated as RNAnimated,
  FlatList as RNFlatList,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Modal as RNModal,
  Pressable as RNPressable,
  RefreshControl as RNRefreshControl,
  ScrollView as RNScrollView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableOpacity as RNTouchableOpacity,
  View as RNView,
  StyleSheet,
  type ActivityIndicatorProps,
  type FlatListProps,
  type KeyboardAvoidingViewProps,
  type ModalProps,
  type PressableProps,
  type RefreshControlProps,
  type ScrollViewProps,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type TouchableOpacityProps,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

import { useMarketplaceAppearanceOptional } from "@/contexts/c03-marketplace/MarketplaceAppearanceContext";

export {
  Alert,
  Dimensions,
  Easing,
  Image,
  Keyboard,
  LayoutAnimation,
  Linking,
  PanResponder,
  Platform,
  Share,
  StyleSheet,
  UIManager,
  useWindowDimensions,
} from "react-native";

export type {
  KeyboardTypeOptions,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

const PAGE_DARK = "#0F172A";
const CARD_DARK = "#1E293B";
const TEXT_LIGHT = "#F8FAFC";
const MUTED_LIGHT = "#94A3B8";
const BORDER_DARK = "#334155";

const NAMED_HEX: Record<string, string> = {
  white: "#FFFFFF",
  black: "#000000",
};

function parseColor(
  value: string,
): { r: number; g: number; b: number; a: number } | null {
  const named = NAMED_HEX[value.trim().toLowerCase()];
  const raw = named ?? value.trim();

  if (raw.toLowerCase() === "transparent") {
    return null;
  }

  const hexMatch = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }

    const hasAlpha = hex.length === 8;
    const body = hasAlpha ? hex.slice(0, 6) : hex;
    const alphaHex = hasAlpha ? hex.slice(6, 8) : "FF";

    return {
      r: parseInt(body.slice(0, 2), 16),
      g: parseInt(body.slice(2, 4), 16),
      b: parseInt(body.slice(4, 6), 16),
      a: parseInt(alphaHex, 16) / 255,
    };
  }

  const rgbMatch = raw.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] == null ? 1 : Number(rgbMatch[4]),
    };
  }

  return null;
}

function relativeLuminance(r: number, g: number, b: number) {
  const toLinear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  return (
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  );
}

function saturation(r: number, g: number, b: number) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) {
    return 0;
  }
  return (max - min) / max;
}

function hue(r: number, g: number, b: number) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  if (delta === 0) {
    return 0;
  }

  let next = 0;
  if (max === red) {
    next = ((green - blue) / delta) % 6;
  } else if (max === green) {
    next = (blue - red) / delta + 2;
  } else {
    next = (red - green) / delta + 4;
  }

  return (next * 60 + 360) % 360;
}

function mapTextColor(value: unknown, isDark: boolean): unknown {
  if (!isDark || typeof value !== "string") {
    return value;
  }

  const parsed = parseColor(value);
  if (!parsed || parsed.a < 0.4) {
    return value;
  }

  const { r, g, b } = parsed;
  const lum = relativeLuminance(r, g, b);
  const sat = saturation(r, g, b);
  const colorHue = hue(r, g, b);

  if (lum >= 0.58) {
    return value;
  }

  if (sat < 0.22) {
    return lum < 0.18 ? TEXT_LIGHT : MUTED_LIGHT;
  }

  if (lum >= 0.22 && sat >= 0.35) {
    return value;
  }

  if (colorHue >= 70 && colorHue <= 165) {
    return "#86EFAC";
  }

  if (colorHue >= 20 && colorHue <= 55) {
    return "#FCD34D";
  }

  return TEXT_LIGHT;
}

function tintedDarkSurface(colorHue: number) {
  if (colorHue >= 70 && colorHue <= 165) {
    return "#052E16";
  }
  if (colorHue >= 20 && colorHue <= 55) {
    return "#1C1410";
  }
  if (colorHue <= 20 || colorHue >= 345) {
    return "#450A0A";
  }
  if (colorHue >= 190 && colorHue <= 260) {
    return "#0C1A2E";
  }
  return PAGE_DARK;
}

function mapBackgroundColor(value: unknown, isDark: boolean): unknown {
  if (!isDark || typeof value !== "string") {
    return value;
  }

  const parsed = parseColor(value);
  if (!parsed || parsed.a < 0.4) {
    return value;
  }

  const { r, g, b } = parsed;
  const lum = relativeLuminance(r, g, b);
  const sat = saturation(r, g, b);
  const colorHue = hue(r, g, b);

  if (lum <= 0.28) {
    return value;
  }

  if (lum >= 0.72 && sat >= 0.18) {
    return value;
  }

  if (lum >= 0.85 && sat >= 0.05) {
    return tintedDarkSurface(colorHue);
  }

  if (lum >= 0.93 && sat < 0.06) {
    return CARD_DARK;
  }

  if (lum >= 0.88) {
    return PAGE_DARK;
  }

  if (lum >= 0.72 && sat < 0.16) {
    return CARD_DARK;
  }

  return value;
}

function mapBorderColor(value: unknown, isDark: boolean): unknown {
  if (!isDark || typeof value !== "string") {
    return value;
  }

  const parsed = parseColor(value);
  if (!parsed || parsed.a < 0.4) {
    return value;
  }

  const lum = relativeLuminance(parsed.r, parsed.g, parsed.b);
  const sat = saturation(parsed.r, parsed.g, parsed.b);

  if (sat >= 0.18) {
    return value;
  }

  if (lum >= 0.7) {
    return BORDER_DARK;
  }

  return value;
}

const TEXT_COLOR_KEYS = new Set(["color", "tintColor"]);

const BACKGROUND_KEYS = new Set(["backgroundColor"]);

const BORDER_KEYS = new Set([
  "borderColor",
  "borderTopColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRightColor",
  "outlineColor",
]);

function scaleFontValue(value: unknown, fontScale: number) {
  if (typeof value !== "number" || fontScale === 1) {
    return value;
  }
  return value * fontScale;
}

function mapFlatStyle(
  style: Record<string, unknown>,
  isDark: boolean,
  fontScale: number,
  kind: "text" | "view",
) {
  const next: Record<string, unknown> = { ...style };

  for (const key of Object.keys(next)) {
    const value = next[key];

    if (TEXT_COLOR_KEYS.has(key)) {
      next[key] = mapTextColor(value, isDark);
    } else if (BACKGROUND_KEYS.has(key)) {
      next[key] = mapBackgroundColor(value, isDark);
    } else if (BORDER_KEYS.has(key)) {
      next[key] = mapBorderColor(value, isDark);
    } else if (kind === "text" && (key === "fontSize" || key === "lineHeight")) {
      next[key] = scaleFontValue(value, fontScale);
    }
  }

  return next;
}

function themeStyle(
  style: unknown,
  isDark: boolean,
  fontScale: number,
  kind: "text" | "view",
): unknown {
  if (style == null || typeof style === "boolean") {
    return style;
  }

  if (typeof style === "function") {
    return (...args: unknown[]) =>
      themeStyle(style(...args), isDark, fontScale, kind);
  }

  if (Array.isArray(style)) {
    return style.map((item) => themeStyle(item, isDark, fontScale, kind));
  }

  const flat = StyleSheet.flatten(style as ViewStyle | TextStyle);
  if (!flat || typeof flat !== "object") {
    return style;
  }

  return mapFlatStyle(flat as Record<string, unknown>, isDark, fontScale, kind);
}

function themeViewStyle(style: unknown, isDark: boolean, fontScale: number) {
  return themeStyle(style, isDark, fontScale, "view") as ViewStyle | undefined;
}

function themeTextStyle(style: unknown, isDark: boolean, fontScale: number) {
  return themeStyle(style, isDark, fontScale, "text") as TextStyle | undefined;
}

export const View = React.forwardRef<RNView, ViewProps>(function View(
  { style, ...props },
  ref,
) {
  const { isDark, fontScale } = useMarketplaceAppearanceOptional();
  return (
    <RNView
      ref={ref}
      {...props}
      style={themeViewStyle(style, isDark, fontScale)}
    />
  );
});

export const Text = React.forwardRef<RNText, TextProps>(function Text(
  { style, ...props },
  ref,
) {
  const { isDark, fontScale } = useMarketplaceAppearanceOptional();
  return (
    <RNText
      ref={ref}
      {...props}
      style={themeTextStyle(style, isDark, fontScale)}
    />
  );
});

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  function TextInput({ style, placeholderTextColor, selectionColor, ...props }, ref) {
    const { isDark, fontScale } = useMarketplaceAppearanceOptional();
    return (
      <RNTextInput
        ref={ref}
        {...props}
        placeholderTextColor={
          mapTextColor(
            placeholderTextColor ?? (isDark ? MUTED_LIGHT : "#94A3B8"),
            isDark,
          ) as string | undefined
        }
        selectionColor={
          (mapTextColor(selectionColor, isDark) as string | undefined) ??
          selectionColor
        }
        style={themeTextStyle(style, isDark, fontScale)}
      />
    );
  },
);

export const ScrollView = React.forwardRef<RNScrollView, ScrollViewProps>(
  function ScrollView({ style, contentContainerStyle, ...props }, ref) {
    const { isDark, fontScale } = useMarketplaceAppearanceOptional();
    return (
      <RNScrollView
        ref={ref}
        {...props}
        style={themeViewStyle(style, isDark, fontScale)}
        contentContainerStyle={themeViewStyle(
          contentContainerStyle,
          isDark,
          fontScale,
        )}
      />
    );
  },
);

export const Pressable = React.forwardRef<RNView, PressableProps>(
  function Pressable({ style, ...props }, ref) {
    const { isDark, fontScale } = useMarketplaceAppearanceOptional();
    return (
      <RNPressable
        ref={ref}
        {...props}
        style={themeStyle(style, isDark, fontScale, "view") as PressableProps["style"]}
      />
    );
  },
);

export const TouchableOpacity = React.forwardRef<
  RNView,
  TouchableOpacityProps
>(function TouchableOpacity({ style, ...props }, ref) {
  const { isDark, fontScale } = useMarketplaceAppearanceOptional();
  return (
    <RNTouchableOpacity
      ref={ref}
      {...props}
      style={themeViewStyle(style, isDark, fontScale)}
    />
  );
});

export const SafeAreaView = React.forwardRef<RNView, ViewProps>(
  function SafeAreaView({ style, ...props }, ref) {
    const { isDark, fontScale } = useMarketplaceAppearanceOptional();
    return (
      <RNSafeAreaView
        ref={ref}
        {...props}
        style={themeViewStyle(style, isDark, fontScale)}
      />
    );
  },
);

export const KeyboardAvoidingView = React.forwardRef<
  RNKeyboardAvoidingView,
  KeyboardAvoidingViewProps
>(function KeyboardAvoidingView({ style, contentContainerStyle, ...props }, ref) {
  const { isDark, fontScale } = useMarketplaceAppearanceOptional();
  return (
    <RNKeyboardAvoidingView
      ref={ref}
      {...props}
      style={themeViewStyle(style, isDark, fontScale)}
      contentContainerStyle={themeViewStyle(
        contentContainerStyle,
        isDark,
        fontScale,
      )}
    />
  );
});

export const Modal = function Modal(props: ModalProps) {
  return <RNModal {...props} />;
};

export const RefreshControl = function RefreshControl({
  tintColor,
  colors,
  progressBackgroundColor,
  ...props
}: RefreshControlProps) {
  const { isDark } = useMarketplaceAppearanceOptional();
  return (
    <RNRefreshControl
      {...props}
      tintColor={
        (mapTextColor(tintColor, isDark) as string | undefined) ??
        (isDark ? MUTED_LIGHT : tintColor)
      }
      colors={
        colors?.map((color) => mapTextColor(color, isDark) as string) ??
        (isDark ? [MUTED_LIGHT] : colors)
      }
      progressBackgroundColor={
        (mapBackgroundColor(progressBackgroundColor, isDark) as
          | string
          | undefined) ?? (isDark ? CARD_DARK : progressBackgroundColor)
      }
    />
  );
};

export const ActivityIndicator = function ActivityIndicator({
  color,
  ...props
}: ActivityIndicatorProps) {
  const { isDark } = useMarketplaceAppearanceOptional();
  return (
    <RNActivityIndicator
      {...props}
      color={
        (mapTextColor(color, isDark) as string | undefined) ?? color
      }
    />
  );
};

export const FlatList = React.forwardRef(function FlatList(
  {
    style,
    contentContainerStyle,
    columnWrapperStyle,
    ListHeaderComponentStyle,
    ListFooterComponentStyle,
    ...props
  }: FlatListProps<unknown>,
  ref: React.Ref<RNFlatList<unknown>>,
) {
  const { isDark, fontScale } = useMarketplaceAppearanceOptional();
  return (
    <RNFlatList
      ref={ref}
      {...props}
      style={themeViewStyle(style, isDark, fontScale)}
      contentContainerStyle={themeViewStyle(
        contentContainerStyle,
        isDark,
        fontScale,
      )}
      columnWrapperStyle={themeViewStyle(
        columnWrapperStyle,
        isDark,
        fontScale,
      )}
      ListHeaderComponentStyle={themeViewStyle(
        ListHeaderComponentStyle,
        isDark,
        fontScale,
      )}
      ListFooterComponentStyle={themeViewStyle(
        ListFooterComponentStyle,
        isDark,
        fontScale,
      )}
    />
  );
}) as unknown as typeof RNFlatList;

type IoniconsProps = React.ComponentProps<typeof VectorIonicons>;

function ThemedIonicons({ color, size, ...props }: IoniconsProps) {
  const { isDark, fontScale } = useMarketplaceAppearanceOptional();
  const nextSize =
    typeof size === "number" ? size * fontScale : size;
  const nextColor =
    color == null
      ? isDark
        ? TEXT_LIGHT
        : color
      : (mapTextColor(color, isDark) as string | undefined);

  return (
    <VectorIonicons
      {...props}
      size={nextSize}
      color={nextColor}
    />
  );
}

export const Ionicons = Object.assign(ThemedIonicons, {
  glyphMap: VectorIonicons.glyphMap,
}) as unknown as typeof VectorIonicons;

const ThemedAnimatedView = RNAnimated.createAnimatedComponent(View);
const ThemedAnimatedText = RNAnimated.createAnimatedComponent(Text);
const ThemedAnimatedScrollView =
  RNAnimated.createAnimatedComponent(ScrollView);

export const Animated = Object.assign({}, RNAnimated, {
  View: ThemedAnimatedView,
  Text: ThemedAnimatedText,
  ScrollView: ThemedAnimatedScrollView,
}) as typeof RNAnimated;
