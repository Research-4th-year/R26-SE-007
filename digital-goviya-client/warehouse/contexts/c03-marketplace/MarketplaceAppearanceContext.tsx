import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type MarketplaceFontSize = "default" | "large";
export type MarketplaceColorScheme = "light" | "dark";

type MarketplaceAppearanceContextValue = {
  fontSize: MarketplaceFontSize;
  colorScheme: MarketplaceColorScheme;
  isDark: boolean;
  fontScale: number;
  setFontSize: (size: MarketplaceFontSize) => Promise<void>;
  setColorScheme: (scheme: MarketplaceColorScheme) => Promise<void>;
};

const STORAGE_KEY = "@c03_marketplace_appearance";

const MarketplaceAppearanceContext =
  createContext<MarketplaceAppearanceContextValue | undefined>(undefined);

export function MarketplaceAppearanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fontSize, setFontSizeState] =
    useState<MarketplaceFontSize>("default");
  const [colorScheme, setColorSchemeState] =
    useState<MarketplaceColorScheme>("light");

  useEffect(() => {
    void loadAppearance();
  }, []);

  async function loadAppearance(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved) as {
        fontSize?: MarketplaceFontSize;
        colorScheme?: MarketplaceColorScheme;
      };

      if (parsed.fontSize === "default" || parsed.fontSize === "large") {
        setFontSizeState(parsed.fontSize);
      }

      if (parsed.colorScheme === "light" || parsed.colorScheme === "dark") {
        setColorSchemeState(parsed.colorScheme);
      }
    } catch (error) {
      console.error("Failed to load marketplace appearance:", error);
    }
  }

  async function persist(next: {
    fontSize: MarketplaceFontSize;
    colorScheme: MarketplaceColorScheme;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save marketplace appearance:", error);
    }
  }

  async function setFontSize(size: MarketplaceFontSize): Promise<void> {
    setFontSizeState(size);
    await persist({ fontSize: size, colorScheme });
  }

  async function setColorScheme(
    scheme: MarketplaceColorScheme,
  ): Promise<void> {
    setColorSchemeState(scheme);
    await persist({ fontSize, colorScheme: scheme });
  }

  const value = useMemo(
    () => ({
      fontSize,
      colorScheme,
      isDark: colorScheme === "dark",
      fontScale: fontSize === "large" ? 1.18 : 1,
      setFontSize,
      setColorScheme,
    }),
    [fontSize, colorScheme],
  );

  return (
    <MarketplaceAppearanceContext.Provider value={value}>
      {children}
    </MarketplaceAppearanceContext.Provider>
  );
}

const DEFAULT_APPEARANCE: MarketplaceAppearanceContextValue = {
  fontSize: "default",
  colorScheme: "light",
  isDark: false,
  fontScale: 1,
  setFontSize: async () => undefined,
  setColorScheme: async () => undefined,
};

export function useMarketplaceAppearance() {
  const context = useContext(MarketplaceAppearanceContext);

  if (!context) {
    throw new Error(
      "useMarketplaceAppearance must be used inside MarketplaceAppearanceProvider",
    );
  }

  return context;
}

export function useMarketplaceAppearanceOptional() {
  return useContext(MarketplaceAppearanceContext) ?? DEFAULT_APPEARANCE;
}
