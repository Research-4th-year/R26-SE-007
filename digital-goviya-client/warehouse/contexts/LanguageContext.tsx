import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  translations,
  Language,
} from "../i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: typeof translations.en;
};

const LanguageContext =
  createContext<LanguageContextType | undefined>(
    undefined
  );

const LANGUAGE_KEY = "@digital_goviya_language";

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("en");

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(
          LANGUAGE_KEY
        );

      if (
        saved === "en" ||
        saved === "si"
      ) {
        setLanguageState(saved);
      }
    } catch (error) {
      console.error(
        "Failed to load language:",
        error
      );
    }
  };

  const setLanguage = async (
    newLanguage: Language
  ) => {
    try {
      setLanguageState(newLanguage);

      await AsyncStorage.setItem(
        LANGUAGE_KEY,
        newLanguage
      );
    } catch (error) {
      console.error(
        "Failed to save language:",
        error
      );
    }
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}