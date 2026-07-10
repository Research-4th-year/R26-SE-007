import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';

interface VarietyCardProps {
  name: string;
  duration: string;
  yieldRange: string;
  water: string;
  confidence: number;
  theme: any;
}

const VarietyCard: React.FC<VarietyCardProps> = ({ name, duration, yieldRange, water, confidence, theme }) => {
  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{name}</Text>
          <View style={styles.confidenceContainer}>
            <Text style={[styles.confidenceLabel, { color: theme.colors.placeholder }]}>Confidence</Text>
            <Text style={[styles.confidenceVal, { color: theme.colors.primary }]}>{confidence}%</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={[styles.gridLbl, { color: theme.colors.placeholder }]}>Duration</Text>
            <Text style={[styles.gridVal, { color: theme.colors.text }]}>{duration} days</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={[styles.gridLbl, { color: theme.colors.placeholder }]}>Yield</Text>
            <Text style={[styles.gridVal, { color: theme.colors.text }]}>{yieldRange} t/ha</Text>
          </View>
          <View style={styles.gridCol}>
            <Text style={[styles.gridLbl, { color: theme.colors.placeholder }]}>Water Need</Text>
            <Text style={[styles.gridVal, { color: theme.colors.text }]}>{water}</Text>
          </View>
        </View>

        <ProgressBar progress={confidence / 100} color={theme.colors.primary} style={styles.progressBar} />
      </Card.Content>
    </Card>
  );
};

export const VarietyScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Recommended Varieties</Text>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
          AI Analysis Mapping Climate Suitability
        </Text>
      </View>

      <View style={styles.cardsContainer}>
        <VarietyCard name="Samba" duration="120-135" yieldRange="4.8 - 5.5" water="Medium" confidence={92} theme={theme} />
        <VarietyCard name="Nadu" duration="115-120" yieldRange="4.5 - 5.0" water="Medium" confidence={88} theme={theme} />
        <VarietyCard name="Keeri Samba" duration="130-135" yieldRange="5.0 - 5.8" water="Medium-High" confidence={85} theme={theme} />
        <VarietyCard name="Bg 357" duration="110-115" yieldRange="4.0 - 4.8" water="Low-Medium" confidence={80} theme={theme} />
      </View>

      <Card style={styles.tipCard}>
        <Card.Content style={styles.tipContent}>
          <Icon name="info" size={20} color="#ffa000" />
          <Text style={styles.tipText}>
            <Text style={{ fontWeight: 'bold' }}>AI Recommendation Tip: </Text>
            Samba variety is best suited for your clay loam soil profile during the upcoming Yala season based on rainfall models.
          </Text>
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
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceContainer: {
    alignItems: 'flex-end',
  },
  confidenceLabel: {
    fontSize: 9,
    fontWeight: '600',
  },
  confidenceVal: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  gridCol: {
    alignItems: 'center',
    flex: 1,
  },
  gridLbl: {
    fontSize: 10,
    marginBottom: 2,
  },
  gridVal: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  tipCard: {
    backgroundColor: '#fffde7',
    borderWidth: 1,
    borderColor: '#ffa000',
    borderStyle: 'dashed',
    borderRadius: 16,
    elevation: 0,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5d4037',
    flex: 1,
  },
});
