import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Card, Switch, Button, TextInput, List } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { getApiBaseUrl, setApiBaseUrl } from '../services/api';

export const SettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { themeMode, toggleTheme, theme, isDark } = useAppTheme();

  const [apiUrl, setApiUrl] = useState('');
  const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadApiUrl = async () => {
      const url = await getApiBaseUrl();
      setApiUrl(url);
    };
    loadApiUrl();
  }, []);

  const handleSaveApiUrl = async () => {
    setLoading(true);
    await setApiBaseUrl(apiUrl);
    setLoading(false);
    Alert.alert('Success', 'API Base URL saved successfully.');
  };

  const handleToggleLanguage = async () => {
    const nextLang = currentLang === 'en' ? 'si' : 'en';
    await i18n.changeLanguage(nextLang);
    setCurrentLang(nextLang);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Settings & Configuration</Text>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
          Device Configuration and Customizations
        </Text>
      </View>

      {/* Preferences Section */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Theme & Preferences</Text>
          
          <List.Item
            title="Dark Mode"
            description="Toggle application dark color theme"
            left={() => <List.Icon icon={() => <Icon name="settings" color={theme.colors.text} />} />}
            right={() => (
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                color={theme.colors.primary}
              />
            )}
          />

          <List.Item
            title="Language"
            description={currentLang === 'en' ? 'English selected' : 'සිංහල තෝරාගෙන ඇත'}
            left={() => <List.Icon icon={() => <Icon name="globe" color={theme.colors.text} />} />}
            right={() => (
              <Button mode="outlined" onPress={handleToggleLanguage}>
                {currentLang === 'en' ? 'සිංහල' : 'English'}
              </Button>
            )}
          />
        </Card.Content>
      </Card>

      {/* Network Server Settings */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>FastAPI Local IP Settings</Text>
          <Text style={[styles.infoText, { color: theme.colors.placeholder }]}>
            Change this if testing on a physical mobile device to connect to your computer's server IP:
          </Text>
          
          <TextInput
            mode="outlined"
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.1.100:8000"
            style={styles.textInput}
            outlineColor={theme.colors.placeholder}
            activeOutlineColor={theme.colors.primary}
          />

          <Button
            mode="contained"
            onPress={handleSaveApiUrl}
            loading={loading}
            style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
          >
            Save Network Settings
          </Button>
        </Card.Content>
      </Card>

      {/* System info */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>System Diagnostic Info</Text>
          
          <List.Item
            title="Core Version"
            description="v1.0.0-mobile"
            left={() => <List.Icon icon={() => <Icon name="info" color={theme.colors.text} />} />}
          />
          <List.Item
            title="Firebase DB Config"
            description="Realtime synced"
            left={() => <List.Icon icon={() => <Icon name="check-circle" color="#43a047" />} />}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  textInput: {
    height: 48,
    backgroundColor: 'transparent',
    marginBottom: 14,
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 2,
  },
});
