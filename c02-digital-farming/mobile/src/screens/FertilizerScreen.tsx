import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';

interface FertilizerBagProps {
  name: string;
  formula: string;
  dosage: string;
  timing: string;
  instructions: string;
  color: string;
  theme: any;
}

const FertilizerBag: React.FC<FertilizerBagProps> = ({ name, formula, dosage, timing, instructions, color, theme }) => {
  return (
    <Card style={[styles.bagCard, { backgroundColor: theme.colors.surface, borderTopColor: color }]}>
      <Card.Content>
        <View style={styles.bagHeader}>
          <View>
            <Text style={[styles.bagTitle, { color: color }]}>{name}</Text>
            <Text style={[styles.bagFormula, { color: theme.colors.placeholder }]}>{formula}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: color + '15' }]}>
            <Text style={[styles.badgeText, { color: color }]}>{dosage} Kg / Ha</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.gridBox, { backgroundColor: theme.colors.background }]}>
            <View style={styles.boxHeader}>
              <Icon name="clock" size={14} color={theme.colors.placeholder} />
              <Text style={[styles.boxHeaderLabel, { color: theme.colors.placeholder }]}>BEST TIMING</Text>
            </View>
            <Text style={[styles.boxValue, { color: theme.colors.text }]}>{timing}</Text>
          </View>

          <View style={[styles.gridBox, { backgroundColor: theme.colors.background }]}>
            <View style={styles.boxHeader}>
              <Icon name="beaker" size={14} color={theme.colors.placeholder} />
              <Text style={[styles.boxHeaderLabel, { color: theme.colors.placeholder }]}>DOSAGE PLAN</Text>
            </View>
            <Text style={[styles.boxValue, { color: theme.colors.text }]}>Split Application</Text>
          </View>
        </View>

        <View style={[styles.instructionsContainer, { borderColor: theme.colors.background }]}>
          <Text style={[styles.instructionsText, { color: theme.colors.text }]}>
            <Text style={{ fontWeight: 'bold' }}>How to apply: </Text>
            {instructions}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export const FertilizerScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Fertilizer Expert Guide</Text>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
          Personalized Nutrient Dosages Based on Soil NPK Levels
        </Text>
      </View>

      <View style={styles.bagsContainer}>
        <FertilizerBag
          name="UREA"
          formula="46-0-0 (Nitrogen Source)"
          dosage="75"
          timing="14-21 Days after sowing"
          instructions="Broadcast uniformly across the field. Best applied when the soil is moist but not flooded. Apply in the early morning."
          color="#1e88e5"
          theme={theme}
        />
        <FertilizerBag
          name="TSP"
          formula="0-46-0 (Phosphorus Source)"
          dosage="50"
          timing="Basal Application"
          instructions="Mix with soil during final land preparation (mudding). This helps in strong root development early on."
          color="#e53935"
          theme={theme}
        />
        <FertilizerBag
          name="MOP"
          formula="0-0-60 (Potassium Source)"
          dosage="40"
          timing="Panicle Initiation stage"
          instructions="Helps in grain filling and disease resistance. Apply near the stems for better absorption."
          color="#43a047"
          theme={theme}
        />
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
  bagsContainer: {
    gap: 16,
  },
  bagCard: {
    borderRadius: 16,
    borderTopWidth: 6,
    elevation: 2,
  },
  bagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bagTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  bagFormula: {
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  gridBox: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  boxHeaderLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  boxValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  instructionsContainer: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 10,
  },
  instructionsText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
