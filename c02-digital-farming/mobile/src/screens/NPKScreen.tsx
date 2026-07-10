import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { getLatestData } from '../services/api';

interface NutrientCircleProps {
  label: string;
  value: number;
  color: string;
  status: string;
  theme: any;
}

const NutrientCard: React.FC<NutrientCircleProps> = ({ label, value, color, status, theme }) => {
  return (
    <View style={styles.gaugeContainer}>
      <View style={[styles.gaugeCircle, { borderColor: color + '30' }]}>
        <Text style={[styles.gaugeVal, { color: theme.colors.text }]}>{value}%</Text>
        <Text style={[styles.gaugeLbl, { color: theme.colors.placeholder }]}>{label}</Text>
      </View>
      <Text style={[styles.gaugeStatus, { color: color }]}>{status}</Text>
    </View>
  );
};

export const NPKScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [npk, setNpk] = useState({ N: 68, P: 38, K: 72 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestData().then(res => {
      if (res && res.predictions && res.predictions.npk) {
        setNpk(res.predictions.npk);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Virtual NPK Predictions</Text>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
          AI-Estimated Soil Nitrogen, Phosphorus, and Potassium
        </Text>
      </View>

      {/* Nutrient Panel */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Current Nutrient Concentration</Text>
          
          <View style={styles.gaugesRow}>
            <NutrientCard label="N" value={npk.N} color="#1e88e5" status="Optimal" theme={theme} />
            <NutrientCard label="P" value={npk.P} color="#e53935" status="Low" theme={theme} />
            <NutrientCard label="K" value={npk.K} color="#43a047" status="Good" theme={theme} />
          </View>

          <View style={[styles.healthScoreBox, { backgroundColor: theme.colors.background }]}>
            <View>
              <Text style={[styles.scoreLbl, { color: theme.colors.placeholder }]}>Soil Nutrient Index</Text>
              <Text style={[styles.scoreVal, { color: theme.colors.text }]}>
                78 <Text style={{ fontSize: 13, fontWeight: 'normal' }}>/ 100</Text>
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Stable</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Advice Card */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.adviceContent}>
          <Icon name="info" size={24} color={theme.colors.primary} />
          <View style={styles.adviceTexts}>
            <Text style={[styles.adviceTitle, { color: theme.colors.text }]}>Agronomist AI Advice</Text>
            <Text style={[styles.adviceDesc, { color: theme.colors.placeholder }]}>
              Phosphorus levels are running low (38%). Soil NPK prediction suggests application of TSP fertilizer at basal prep or tillering stage to encourage solid root formation.
            </Text>
          </View>
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
    marginBottom: 16,
  },
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  gaugeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeVal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gaugeLbl: {
    fontSize: 10,
    marginTop: 1,
  },
  gaugeStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 6,
  },
  healthScoreBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  scoreLbl: {
    fontSize: 11,
  },
  scoreVal: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#c8e6c9',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  badgeText: {
    color: '#2e7d32',
    fontSize: 11,
    fontWeight: 'bold',
  },
  adviceContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  adviceTexts: {
    flex: 1,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  adviceDesc: {
    fontSize: 11.5,
    lineHeight: 17,
  },
});
