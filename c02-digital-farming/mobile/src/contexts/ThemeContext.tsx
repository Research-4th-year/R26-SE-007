import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
  theme: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Define customized colors that look professional (matching primary-green/glassmorphism design)
const customLightColors = {
  ...MD3LightTheme.colors,
  primary: '#006D32', // Safe green
  secondary: '#2e7d32',
  background: '#f4f6f8',
  surface: '#ffffff',
  error: '#d32f2f',
  onSurface: '#1a1a1a',
  onSurfaceVariant: '#757575',
  text: '#1a1a1a',
  placeholder: '#757575',
};

const customDarkColors = {
  ...MD3DarkTheme.colors,
  primary: '#34d399', // Bright accent green
  secondary: '#81c784',
  background: '#121212',
  surface: '#1e1e1e',
  error: '#f44336',
  onSurface: '#ffffff',
  onSurfaceVariant: '#9e9e9e',
  text: '#ffffff',
  placeholder: '#9e9e9e',
};

export const customLightTheme = {
  ...MD3LightTheme,
  colors: customLightColors,
  roundness: 12,
};

export const customDarkTheme = {
  ...MD3DarkTheme,
  colors: customDarkColors,
  roundness: 12,
};

const THEME_KEY = 'user_selected_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') {
          setThemeMode(saved);
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(nextMode);
    try {
      await AsyncStorage.setItem(THEME_KEY, nextMode);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const isDark = themeMode === 'dark';
  const theme = isDark ? customDarkTheme : customLightTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, isDark, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
