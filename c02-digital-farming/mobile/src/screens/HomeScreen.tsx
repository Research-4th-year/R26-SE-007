import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue } from 'firebase/database';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { db } from '../services/firebase';
import { getLatestData } from '../services/api';

const CACHE_KEY = 'smart_paddy_last_data';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme, isDark } = useAppTheme();

  const [data, setData] = useState({
    sensors: { temperature: 28, humidity: 75, soil1: 40, soil2: 44, rain: 1, light: 12000 },
    predictions: { yield_prediction_kg_per_ha: 5200, npk: { N: 42, P: 38, K: 45 } },
    recommendations: { water_action: 'Maintain current irrigation', fertilizer: 'Next dosage in 5 days' },
    disease_category: 'Healthy',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let unsubscribeFirebase: (() => void) | undefined;

    // Load offline cache first
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && active) {
          setData(JSON.parse(cached));
        }
      } catch (err) {
        console.warn('Failed to load offline cache', err);
      }
    };

    // Main fetch function
    const fetchInitialData = async () => {
      await loadCache();
      try {
        const res = await getLatestData();
        if (res && active) {
          setData(prev => {
            const updated = { ...prev, ...res };
            AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            return updated;
          });
        }
      } catch (e) {
        console.warn('API error, using cached data');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchInitialData();

    // Firebase real-time listener for IoT sensor node
    try {
      const sensorRef = ref(db, 'sensor');
      unsubscribeFirebase = onValue(sensorRef, (snapshot) => {
        const val = snapshot.val();
        if (val && active) {
          setData(prev => {
            const updated = { ...prev, sensors: { ...prev.sensors, ...val } };
            AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            return updated;
          });
        }
      });
    } catch (e) {
      console.error('Firebase DB connection failed', e);
    }

    return () => {
      active = false;
      if (unsubscribeFirebase) unsubscribeFirebase();
    };
  }, []);

  const { sensors, predictions, recommendations, disease_category } = data;
  const avgSoil = Math.round(((sensors?.soil1 || 0) + (sensors?.soil2 || 0)) / 2);
  const isRaining = Number(sensors?.rain) === 1;

  const isHealthy = disease_category === 'Healthy' || disease_category === 'Checking...';

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Field Status Banner */}
      <Card style={[
        styles.bannerCard, 
        { backgroundColor: isHealthy ? '#006D32' : '#c62828' }
      ]}>
        <Card.Content style={styles.bannerContent}>
          <Icon name={isHealthy ? 'check-circle' : 'alert-triangle'} size={32} color="#ffffff" />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>
              {isHealthy ? t('dashboard.current_status') + ': ' + t('guide.healthy') : t('dashboard.current_status') + ': Action Required'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {isHealthy ? t('dashboard.optimal') : t('dashboard.disease_detected')}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Weather & IoT Live Quick Cards */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('dashboard.sensors')}</Text>
      <View style={styles.sensorsGrid}>
        <Card style={[styles.sensorCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sensorCardContent}>
            <Icon name="thermometer" size={24} color="#e57373" />
            <Text style={[styles.sensorVal, { color: theme.colors.text }]}>{sensors?.temperature}°C</Text>
            <Text style={[styles.sensorLbl, { color: theme.colors.placeholder }]}>{t('dashboard.temp')}</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.sensorCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sensorCardContent}>
            <Icon name="droplets" size={24} color="#64b5f6" />
            <Text style={[styles.sensorVal, { color: theme.colors.text }]}>{sensors?.humidity}%</Text>
            <Text style={[styles.sensorLbl, { color: theme.colors.placeholder }]}>{t('dashboard.humidity')}</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.sensorCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sensorCardContent}>
            <Icon name="sprout" size={24} color="#81c784" />
            <Text style={[styles.sensorVal, { color: theme.colors.text }]}>{avgSoil}%</Text>
            <Text style={[styles.sensorLbl, { color: theme.colors.placeholder }]}>{t('dashboard.soil')}</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.sensorCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.sensorCardContent}>
            <Icon name={isRaining ? 'cloud-rain' : 'sun'} size={24} color={isRaining ? '#90a4ae' : '#ffb74d'} />
            <Text style={[styles.sensorVal, { color: theme.colors.text }]}>
              {isRaining ? t('dashboard.raining') : t('dashboard.dry')}
            </Text>
            <Text style={[styles.sensorLbl, { color: theme.colors.placeholder }]}>{t('dashboard.rain_status')}</Text>
          </Card.Content>
        </Card>
      </View>

      {/* AI Estimations */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('dashboard.ai_predictions')}</Text>
      
      {/* Yield Estimation Card */}
      <Card style={[styles.mainPredictionCard, { backgroundColor: isDark ? '#1e1e1e' : '#e8f5e9' }]}>
        <Card.Content style={styles.predictionRow}>
          <View style={[styles.iconWrapper, { backgroundColor: '#c8e6c9' }]}>
            <Icon name="trending-up" size={32} color="#2e7d32" />
          </View>
          <View style={styles.predictionTexts}>
            <Text style={[styles.predictVal, { color: theme.colors.text }]}>
              {predictions?.yield_prediction_kg_per_ha ? Math.round(predictions.yield_prediction_kg_per_ha) : 5200}
            </Text>
            <Text style={[styles.predictLbl, { color: theme.colors.text }]}>{t('dashboard.est_yield')} ({t('dashboard.yield_unit')})</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Predicted NPK Cards */}
      <Card style={[styles.npkCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.npkTitle, { color: theme.colors.text }]}>{t('dashboard.pred_npk')}</Text>
          <View style={styles.npkValuesContainer}>
            <View style={styles.npkCol}>
              <Text style={[styles.npkNum, { color: '#e53935' }]}>{predictions?.npk?.N || 0}</Text>
              <Text style={[styles.npkName, { color: theme.colors.placeholder }]}>N</Text>
            </View>
            <View style={styles.npkCol}>
              <Text style={[styles.npkNum, { color: '#1e88e5' }]}>{predictions?.npk?.P || 0}</Text>
              <Text style={[styles.npkName, { color: theme.colors.placeholder }]}>P</Text>
            </View>
            <View style={styles.npkCol}>
              <Text style={[styles.npkNum, { color: '#43a047' }]}>{predictions?.npk?.K || 0}</Text>
              <Text style={[styles.npkName, { color: theme.colors.placeholder }]}>K</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions Grid */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
      <View style={styles.quickActionsRow}>
        <Button 
          mode="contained" 
          icon={() => <Icon name="camera" size={20} color="#ffffff" />}
          onPress={() => navigation.navigate('Disease')}
          style={styles.actionBtn}
          labelStyle={styles.btnLabel}
        >
          {t('nav_disease')}
        </Button>
        <Button 
          mode="outlined" 
          icon={() => <Icon name="book-open" size={20} color={theme.colors.primary} />}
          onPress={() => navigation.navigate('Guide')}
          style={[styles.actionBtn, { borderColor: theme.colors.primary }]}
          labelStyle={[styles.btnLabel, { color: theme.colors.primary }]}
        >
          {t('nav_farmer_guide')}
        </Button>
      </View>
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
  bannerCard: {
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  bannerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sensorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sensorCard: {
    width: '48%',
    borderRadius: 14,
    marginBottom: 16,
    elevation: 2,
  },
  sensorCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  sensorVal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sensorLbl: {
    fontSize: 12,
    marginTop: 2,
  },
  mainPredictionCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 1,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    padding: 12,
    borderRadius: 50,
  },
  predictionTexts: {
    marginLeft: 16,
  },
  predictVal: {
    fontSize: 24,
    fontWeight: '800',
  },
  predictLbl: {
    fontSize: 13,
    opacity: 0.8,
  },
  npkCard: {
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
  },
  npkTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  npkValuesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  npkCol: {
    alignItems: 'center',
  },
  npkNum: {
    fontSize: 24,
    fontWeight: '800',
  },
  npkName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionBtn: {
    width: '48%',
    borderRadius: 8,
  },
  btnLabel: {
    fontSize: 12,
    paddingVertical: 2,
  },
});
