import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { Text, Card, List, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-chart-kit';
import { ref, onValue } from 'firebase/database';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { db } from '../services/firebase';

const screenWidth = Dimensions.get('window').width;

export const IoTScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDark } = useAppTheme();

  // IoT Device state
  const [sensors, setSensors] = useState({
    temperature: 28.5,
    humidity: 74,
    soil1: 42,
    soil2: 45,
    rain: 0,
    light: 15400,
    battery: 89,
    solarVoltage: 4.8,
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'connecting'>('connecting');
  const [history, setHistory] = useState<number[]>([40, 42, 45, 43, 44, 43.5]);

  useEffect(() => {
    let active = true;

    try {
      const sensorRef = ref(db, 'sensor');
      const unsubscribe = onValue(sensorRef, (snapshot) => {
        const val = snapshot.val();
        if (val && active) {
          setSensors(prev => {
            const updated = {
              ...prev,
              ...val,
              // Fallbacks/Mocks if hardware doesn't send battery/solar directly yet
              battery: val.battery || prev.battery,
              solarVoltage: val.solarVoltage || prev.solarVoltage,
            };

            // Update chart history
            const avgSoil = ((updated.soil1 || 0) + (updated.soil2 || 0)) / 2;
            setHistory(prevHist => {
              const newHist = [...prevHist.slice(1), avgSoil];
              return newHist;
            });

            return updated;
          });
          setSyncStatus('synced');
        }
      }, (err) => {
        console.warn('Firebase read error:', err);
      });

      return () => {
        active = false;
        unsubscribe();
      };
    } catch (e) {
      console.warn('Firebase initialization failed');
    }
  }, []);

  const avgSoil = Math.round(((sensors.soil1 || 0) + (sensors.soil2 || 0)) / 2);
  const isRaining = Number(sensors.rain) === 1;

  // Chart configuration
  const chartData = {
    labels: ['-5m', '-4m', '-3m', '-2m', '-1m', 'Live'],
    datasets: [
      {
        data: history,
        color: (opacity = 1) => `rgba(0, 109, 50, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => theme.colors.text,
    labelColor: (opacity = 1) => theme.colors.placeholder,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Device Status Header */}
      <Card style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.headerContent}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Node: ESP32-FARM-01</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: syncStatus === 'synced' ? '#43a047' : '#ffa000' }]} />
              <Text style={[styles.statusText, { color: theme.colors.placeholder }]}>
                {syncStatus === 'synced' ? 'Online • Firebase Sync Active' : 'Connecting to Live Feed...'}
              </Text>
            </View>
          </View>
          <View style={styles.powerInfo}>
            <Icon name="clock" size={16} color={theme.colors.placeholder} />
            <Text style={[styles.powerLabel, { color: theme.colors.placeholder }]}>Sync 10s</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Battery & Solar Cards */}
      <View style={styles.batteryRow}>
        <Card style={[styles.batteryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.batteryContent}>
            <Icon name="clock" size={24} color="#43a047" />
            <View style={styles.batteryTexts}>
              <Text style={[styles.batteryValue, { color: theme.colors.text }]}>{sensors.battery}%</Text>
              <Text style={[styles.batteryLabel, { color: theme.colors.placeholder }]}>Battery Level</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.batteryCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.batteryContent}>
            <Icon name="sun" size={24} color="#ffb74d" />
            <View style={styles.batteryTexts}>
              <Text style={[styles.batteryValue, { color: theme.colors.text }]}>{sensors.solarVoltage.toFixed(1)}V</Text>
              <Text style={[styles.batteryLabel, { color: theme.colors.placeholder }]}>Solar Charger</Text>
            </View>
          </Card.Content>
        </Card>
      </View>

      {/* Live Chart */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Soil Moisture Trend (%)</Text>
      <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={200}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Hardware Node Specifications */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Hardware Node Mapping</Text>
      <Card style={{ backgroundColor: theme.colors.surface, borderRadius: 16 }}>
        <Card.Content style={{ padding: 8 }}>
          <List.Item
            title="DHT22 Atmosphere Sensor"
            description="Environment Temp & Air Humidity"
            left={() => <List.Icon icon={() => <Icon name="thermometer" color="#ef4444" />} />}
          />
          <List.Item
            title="Soil Moisture Fork (Dual Zone)"
            description="Root zone moisture sensor"
            left={() => <List.Icon icon={() => <Icon name="droplets" color="#2196f3" />} />}
          />
          <List.Item
            title="Raindrop Grid Sensor"
            description="Detects current rainfall duration"
            left={() => <List.Icon icon={() => <Icon name="cloud-rain" color="#9c27b0" />} />}
          />
          <List.Item
            title="BH1750 Light Meter"
            description="Solar radiation & photosynthetically active light"
            left={() => <List.Icon icon={() => <Icon name="sun" color="#ff9800" />} />}
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
  headerCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  powerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  powerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  batteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  batteryCard: {
    width: '48%',
    borderRadius: 14,
    elevation: 1,
  },
  batteryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  batteryTexts: {
    marginLeft: 12,
  },
  batteryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  batteryLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  chartContainer: {
    borderRadius: 16,
    paddingTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    overflow: 'hidden',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
