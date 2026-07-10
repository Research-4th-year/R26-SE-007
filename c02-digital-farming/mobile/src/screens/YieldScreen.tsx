import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, List, Button, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';

export const YieldScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const [landSize, setLandSize] = useState('1.0');
  const [season, setSeason] = useState('Maha');
  const [prediction, setPrediction] = useState<number | null>(null);

  const calculateForecast = () => {
    const area = parseFloat(landSize);
    if (isNaN(area) || area <= 0) return;
    
    // Core yield mathematical forecasting formula matching backend outputs
    const yieldPerHectare = season === 'Maha' ? 5200 : 4700;
    setPrediction(Math.round(yieldPerHectare * area));
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Yield Forecast & Stage Guide</Text>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
          Estimate Crop Harvest Yield Based on Land Profile
        </Text>
      </View>

      {/* Yield Simulator */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Forecast Calculator</Text>
          
          <TextInput
            label="Land Area (Hectares)"
            value={landSize}
            onChangeText={setLandSize}
            keyboardType="numeric"
            mode="outlined"
            style={styles.textInput}
          />

          <Button
            mode="contained"
            onPress={calculateForecast}
            style={[styles.calculateBtn, { backgroundColor: theme.colors.primary }]}
          >
            Run Forecast Analysis
          </Button>

          {prediction !== null && (
            <View style={styles.resultBox}>
              <Text style={styles.resultValue}>{prediction.toLocaleString()} Kg</Text>
              <Text style={styles.resultLabel}>Total Projected Harvest</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Growth Stage Advisories */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 12, marginBottom: 8 }]}>
        Stage Wise Growth Advisories
      </Text>
      
      <List.AccordionGroup>
        <List.Accordion
          title="Stage 1: Seedling & Tillage"
          id="1"
          left={props => <List.Icon {...props} icon={() => <Icon name="sprout" color="#43a047" />} />}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <List.Item
            title="Soil Prep"
            description="Ensure uniform leveling and apply basal TSP fertilizer."
            descriptionNumberOfLines={3}
          />
        </List.Accordion>

        <List.Accordion
          title="Stage 2: Tillering & Weeding"
          id="2"
          left={props => <List.Icon {...props} icon={() => <Icon name="activity" color="#1e88e5" />} />}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <List.Item
            title="Nitrogen Top Dress"
            description="Apply first Urea dose 14-21 days after sowing. Monitor weed growth."
            descriptionNumberOfLines={3}
          />
        </List.Accordion>

        <List.Accordion
          title="Stage 3: Grain Filling & Harvest"
          id="3"
          left={props => <List.Icon {...props} icon={() => <Icon name="trending-up" color="#ff9800" />} />}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <List.Item
            title="Potassium Application"
            description="Apply MOP at panicle initiation. Drain field 10 days before harvest."
            descriptionNumberOfLines={3}
          />
        </List.Accordion>
      </List.AccordionGroup>
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
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  textInput: {
    marginBottom: 16,
    height: 48,
    backgroundColor: 'transparent',
  },
  calculateBtn: {
    borderRadius: 8,
    paddingVertical: 2,
  },
  resultBox: {
    marginTop: 20,
    backgroundColor: 'rgba(0,109,50,0.05)',
    borderWidth: 1.5,
    borderColor: '#006D32',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  resultValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#006D32',
  },
  resultLabel: {
    fontSize: 12,
    color: '#004d23',
    fontWeight: '600',
    marginTop: 4,
  },
});
