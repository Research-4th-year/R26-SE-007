import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Button, TextInput, SegmentedButtons, ActivityIndicator, List, Portal, Modal } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';
import { recommendVariety, generateCultivationPlan, getCurrentWeather } from '../services/api';

const DISTRICTS_BY_ZONE: Record<string, string[]> = {
  "Dry Zone": ["Anuradhapura", "Polonnaruwa", "Kurunegala", "Hambantota", "Monaragala", "Ampara", "Trincomalee"],
  "Wet Zone": ["Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Kalutara", "Colombo", "Ratnapura", "Kegalle", "Badulla"]
};

const DISTRICT_WEATHER_PREVIEW: Record<string, Record<string, { temp: number; humidity: number; rain: number; sunlight: number }>> = {
  "Anuradhapura": {
    "Yala": { temp: 32.5, humidity: 65, rain: 50, sunlight: 8.5 },
    "Maha": { temp: 28.0, humidity: 78, rain: 180, sunlight: 6.0 }
  },
  "Polonnaruwa": {
    "Yala": { temp: 33.0, humidity: 63, rain: 45, sunlight: 8.8 },
    "Maha": { temp: 27.5, humidity: 80, rain: 195, sunlight: 5.8 }
  },
  "Kurunegala": {
    "Yala": { temp: 31.0, humidity: 72, rain: 110, sunlight: 7.5 },
    "Maha": { temp: 27.0, humidity: 82, rain: 160, sunlight: 6.2 }
  },
  "Hambantota": {
    "Yala": { temp: 31.5, humidity: 70, rain: 40, sunlight: 8.2 },
    "Maha": { temp: 28.5, humidity: 75, rain: 120, sunlight: 6.8 }
  },
  "Monaragala": {
    "Yala": { temp: 32.0, humidity: 68, rain: 65, sunlight: 8.0 },
    "Maha": { temp: 27.8, humidity: 80, rain: 170, sunlight: 6.0 }
  },
  "Ampara": {
    "Yala": { temp: 33.2, humidity: 64, rain: 50, sunlight: 8.6 },
    "Maha": { temp: 27.4, humidity: 82, rain: 210, sunlight: 5.5 }
  },
  "Trincomalee": {
    "Yala": { temp: 34.0, humidity: 62, rain: 55, sunlight: 8.9 },
    "Maha": { temp: 27.0, humidity: 84, rain: 220, sunlight: 5.4 }
  },
  "Kandy": {
    "Yala": { temp: 27.5, humidity: 78, rain: 150, sunlight: 6.5 },
    "Maha": { temp: 24.5, humidity: 85, rain: 220, sunlight: 5.2 }
  },
  "Matale": {
    "Yala": { temp: 29.0, humidity: 75, rain: 120, sunlight: 7.0 },
    "Maha": { temp: 25.5, humidity: 83, rain: 200, sunlight: 5.5 }
  },
  "Nuwara Eliya": {
    "Yala": { temp: 19.0, humidity: 84, rain: 210, sunlight: 5.0 },
    "Maha": { temp: 15.5, humidity: 90, rain: 280, sunlight: 4.0 }
  },
  "Galle": {
    "Yala": { temp: 29.5, humidity: 80, rain: 230, sunlight: 6.8 },
    "Maha": { temp: 27.0, humidity: 85, rain: 250, sunlight: 5.6 }
  },
  "Matara": {
    "Yala": { temp: 29.8, humidity: 79, rain: 220, sunlight: 7.0 },
    "Maha": { temp: 27.2, humidity: 84, rain: 240, sunlight: 5.8 }
  },
  "Kalutara": {
    "Yala": { temp: 29.0, humidity: 83, rain: 290, sunlight: 6.2 },
    "Maha": { temp: 26.5, humidity: 88, rain: 310, sunlight: 5.0 }
  },
  "Colombo": {
    "Yala": { temp: 30.5, humidity: 77, rain: 200, sunlight: 7.2 },
    "Maha": { temp: 27.8, humidity: 82, rain: 240, sunlight: 6.0 }
  },
  "Ratnapura": {
    "Yala": { temp: 28.5, humidity: 84, rain: 280, sunlight: 6.0 },
    "Maha": { temp: 25.8, humidity: 89, rain: 320, sunlight: 4.8 }
  },
  "Kegalle": {
    "Yala": { temp: 28.8, humidity: 82, rain: 270, sunlight: 6.3 },
    "Maha": { temp: 26.0, humidity: 87, rain: 300, sunlight: 5.1 }
  },
  "Badulla": {
    "Yala": { temp: 26.0, humidity: 76, rain: 110, sunlight: 7.0 },
    "Maha": { temp: 22.5, humidity: 84, rain: 190, sunlight: 5.5 }
  }
};

export const FarmerGuideScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  // Bilingual shorthand
  const isSi = i18n.language === 'si';
  const { theme } = useAppTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);

  // Form parameters
  const [fieldArea, setFieldArea] = useState('1.5');
  const [season, setSeason] = useState('Maha');
  const [zone, setZone] = useState('Dry Zone');
  const [district, setDistrict] = useState('Anuradhapura');
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [topVariety, setTopVariety] = useState<any>(null);

  // Cultivation plan state
  const [cultivationPlan, setCultivationPlan] = useState<any>(null);

  // Sync district when zone changes
  useEffect(() => {
    const list = DISTRICTS_BY_ZONE[zone];
    if (list && !list.includes(district)) {
      setDistrict(list[0]);
    }
  }, [zone]);

  // Weather state
  const [weather, setWeather] = useState<any>(null);
  const [weatherStatus, setWeatherStatus] = useState('');

  // Fetch weather when district changes
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getCurrentWeather(district);
        setWeather(data);
        setWeatherStatus(data.weather?.source || '');
      } catch (e) {
        console.error('Failed to fetch weather', e);
        setWeatherStatus('ERROR');
      }
    };
    fetchWeather();
  }, [district]);

  const currentPreview = DISTRICT_WEATHER_PREVIEW[district]?.[season] || { temp: 28, humidity: 75, rain: 120, sunlight: 7 };

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const payload = {
        season,
        zone,
        district,
        field_area_hectares: parseFloat(fieldArea) || 1.0
      };
      const res = await recommendVariety(payload);
      if (res && res.ranked_recommendations) {
        setRecommendations(res.ranked_recommendations);
        setTopVariety(res.ranked_recommendations[0]);
        setStep(2);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Error fetching recommendation. Please ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVariety = async (varietyId: string) => {
    setLoadingPlan(true);
    try {
      const payload = {
        variety: varietyId,
        season,
        district,
        field_area_hectares: parseFloat(fieldArea) || 1.0
      };
      const res = await generateCultivationPlan(payload);
      if (res) {
        setCultivationPlan(res);
        setStep(3);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate cultivation plan.');
    } finally {
      setLoadingPlan(false);
    }
  };
  return (
    <Portal.Host>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {i18n.language === 'si' ? 'ස්මාර්ට් වගා සැලසුම්කරු' : 'Smart Cultivation Planner'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
            {i18n.language === 'si' ? 'දේශගුණ සහ AI පාදක වී ප්‍රභේද නිර්දේශ' : 'AI-Driven Paddy Variety and Crop Planner'}
          </Text>
        </View>

        {/* STEP 1: PARAMETERS INPUT FORM */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            
            {/* Input fields Card */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.formContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Field Parameters</Text>
                
                {/* Land size */}
                <Text style={[styles.label, { color: theme.colors.text }]}>Land Size (Hectares)</Text>
                <TextInput
                  mode="outlined"
                  value={fieldArea}
                  onChangeText={setFieldArea}
                  keyboardType="numeric"
                  style={styles.textInput}
                  outlineColor={theme.colors.placeholder}
                  activeOutlineColor={theme.colors.primary}
                />

                {/* Season selection */}
                <Text style={[styles.label, { color: theme.colors.text }]}>Cultivation Season</Text>
                <SegmentedButtons
                  value={season}
                  onValueChange={setSeason}
                  buttons={[
                    { value: 'Maha', label: 'Maha' },
                    { value: 'Yala', label: 'Yala' },
                  ]}
                  style={styles.segmentedBtn}
                />

                {/* Zone selection */}
                <Text style={[styles.label, { color: theme.colors.text }]}>Climate Zone</Text>
                <SegmentedButtons
                  value={zone}
                  onValueChange={setZone}
                  buttons={[
                    { value: 'Dry Zone', label: 'Dry Zone' },
                    { value: 'Wet Zone', label: 'Wet Zone' },
                  ]}
                  style={styles.segmentedBtn}
                />

                {/* District selector button */}
                <Text style={[styles.label, { color: theme.colors.text }]}>District</Text>
                <TouchableOpacity 
                  onPress={() => setShowDistrictModal(true)}
                  style={[styles.pickerButton, { borderColor: theme.colors.placeholder }]}
                >
                  <Text style={{ color: theme.colors.text, fontSize: 13 }}>{district}</Text>
                  <Icon name="chevron-down" size={16} color={theme.colors.placeholder} />
                </TouchableOpacity>

                <Button
                  mode="contained"
                  onPress={handleRunAnalysis}
                  disabled={loading}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.primary, marginTop: 12 }]}
                >
                  {loading ? <ActivityIndicator size="small" color="#ffffff" /> : 'Run AI Recommendation'}
                </Button>
              </Card.Content>
            </Card>

            {/* Weather Intelligence Card */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface, marginTop: 12 }]}>
              <Card.Title title={isSi ? 'කාලගුණ බුද්ධි තොරතුරු' : 'Weather Intelligence'} subtitle={district} />
              <Card.Content>
                {weather ? (
                  <View>
                    <Text style={{ color: theme.colors.text }}>{isSi ? 'උෂ්ණත්වය' : 'Temperature'}: {weather.weather.temperature}°C</Text>
                    <Text style={{ color: theme.colors.text }}>{isSi ? 'ආතතිය' : 'Humidity'}: {weather.weather.humidity}%</Text>
                    <Text style={{ color: theme.colors.text }}>{isSi ? 'වර්ෂාපාලන' : 'Rainfall'}: {weather.weather.rainfall} mm</Text>
                    <Text style={{ color: theme.colors.text }}>{isSi ? 'සුළං' : 'Wind'}: {weather.weather.windSpeed} km/h</Text>
                    <Text style={{ color: theme.colors.text }}>{isSi ? 'තත්ත්වය' : 'Source'}: {weather.weather.source}</Text>
                    <Text style={{ marginTop: 8, fontWeight: 'bold', color: theme.colors.text }}>{isSi ? 'රෝග අවදානම්' : 'Disease Risks'}:</Text>
                    <Text style={{ color: theme.colors.text }}>Rice Blast: {weather.disease_risks.rice_blast_pct}%</Text>
                    <Text style={{ color: theme.colors.text }}>Brown Spot: {weather.disease_risks.brown_spot_pct}%</Text>
                    <Text style={{ color: theme.colors.text }}>Bacterial Blight: {weather.disease_risks.bacterial_blight_pct}%</Text>
                  </View>
                ) : (
                  <ActivityIndicator animating={true} />
                )}
              </Card.Content>
            </Card>

            {/* Historical weather parameters box */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 4, borderLeftColor: '#43a047' }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{district} Historical Weather</Text>
                
                <View style={styles.weatherGrid}>
                  <View style={styles.weatherItem}>
                    <Text style={styles.weatherLabel}>Temperature</Text>
                    <Text style={[styles.weatherValue, { color: theme.colors.primary }]}>{currentPreview.temp}°C</Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <Text style={styles.weatherLabel}>Humidity</Text>
                    <Text style={[styles.weatherValue, { color: theme.colors.primary }]}>{currentPreview.humidity}%</Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <Text style={styles.weatherLabel}>Avg Rainfall</Text>
                    <Text style={[styles.weatherValue, { color: theme.colors.primary }]}>{currentPreview.rain}mm</Text>
                  </View>
                  <View style={styles.weatherItem}>
                    <Text style={styles.weatherLabel}>Sunlight Hours</Text>
                    <Text style={[styles.weatherValue, { color: theme.colors.primary }]}>{currentPreview.sunlight}h/d</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* STEP 2: RANKED VARIETY COMPARISON */}
        {step === 2 && topVariety && (
          <View style={styles.stepContainer}>
            
            {/* AI Choice Banner */}
            <Card style={[styles.successBanner, { backgroundColor: '#006D32' }]}>
              <Card.Content style={styles.successContent}>
                <View style={styles.badgeRow}>
                  <Icon name="check-circle" size={32} color="#ffffff" />
                  <View style={styles.successTextContainer}>
                    <Text style={styles.successTitle}>AI Best Match: {topVariety.name}</Text>
                    <Text style={styles.successSub}>Score: {topVariety.score}% | Yield: {topVariety.predicted_yield_t_ha} t/ha</Text>
                  </View>
                </View>
                <Text style={styles.reasonText}>{topVariety.reason}</Text>
                <Button 
                  mode="contained" 
                  onPress={() => handleSelectVariety(topVariety.id)}
                  disabled={loadingPlan}
                  style={styles.planBtn}
                >
                  {loadingPlan ? <ActivityIndicator size="small" color="#000" /> : 'Start Cultivation Plan'}
                </Button>
              </Card.Content>
            </Card>

            {/* List of alternative variety cards */}
            <Text style={[styles.sectionHeading, { color: theme.colors.text }]}>Ranked Recommendations</Text>
            {recommendations.map((v) => (
              <Card key={v.id} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <View style={styles.vHeader}>
                    <View>
                      <Text style={[styles.vName, { color: theme.colors.text }]}>{v.name}</Text>
                      <Text style={{ fontSize: 11, color: theme.colors.placeholder }}>Grain: {v.grain_type}</Text>
                    </View>
                    <View style={styles.vScoreBadge}>
                      <Text style={styles.vScoreText}>{v.score}%</Text>
                    </View>
                  </View>

                  <View style={styles.vSpecsRow}>
                    <View>
                      <Text style={styles.specLabel}>Maturity</Text>
                      <Text style={[styles.specVal, { color: theme.colors.text }]}>{v.growing_days} Days</Text>
                    </View>
                    <View>
                      <Text style={styles.specLabel}>Expected Yield</Text>
                      <Text style={[styles.specVal, { color: theme.colors.primary }]}>{v.predicted_yield_t_ha} t/ha</Text>
                    </View>
                    <View>
                      <Text style={styles.specLabel}>Season</Text>
                      <Text style={[styles.specVal, { color: theme.colors.text }]}>{v.suitable_season}</Text>
                    </View>
                  </View>

                  <Text style={[styles.vDesc, { color: theme.colors.placeholder }]}>{v.description}</Text>

                  <Button 
                    mode="outlined" 
                    onPress={() => handleSelectVariety(v.id)}
                    disabled={loadingPlan}
                    style={styles.vSelectBtn}
                    labelStyle={{ fontSize: 11 }}
                  >
                    Select & Generate Plan
                  </Button>
                </Card.Content>
              </Card>
            ))}

            <Button mode="text" onPress={() => setStep(1)} style={{ marginTop: 8 }}>
              Change Setup Parameters
            </Button>
          </View>
        )}

        {/* STEP 3: CULTIVATION TIMELINE & SCHEDULES */}
        {step === 3 && cultivationPlan && (
          <View style={styles.stepContainer}>
            
            {/* Target Header */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={{ fontSize: 11, color: theme.colors.placeholder, textTransform: 'uppercase' }}>Selected Variety</Text>
                <Text style={[styles.planTitle, { color: theme.colors.text }]}>{cultivationPlan.variety.name}</Text>
                <Text style={{ fontSize: 12, opacity: 0.8, color: theme.colors.text, marginTop: 2 }}>
                  Configured for {fieldArea} Hectares in {district} ({season})
                </Text>
              </Card.Content>
            </Card>

            {/* Financial Estimates Grid */}
            <View style={styles.gridContainer}>
              <Card style={[styles.gridItemCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={{ alignItems: 'center' }}>
                  <Icon name="trending-up" size={24} color="#1e88e5" />
                  <Text style={styles.gridLabel}>Expected Yield</Text>
                  <Text style={[styles.gridValue, { color: theme.colors.text }]}>
                    {cultivationPlan.harvest_estimation.expected_yield_tons} T
                  </Text>
                </Card.Content>
              </Card>

              <Card style={[styles.gridItemCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={{ alignItems: 'center' }}>
                  <Icon name="dollar-sign" size={24} color="#43a047" />
                  <Text style={styles.gridLabel}>Est Income</Text>
                  <Text style={[styles.gridValue, { color: theme.colors.text, fontSize: 11 }]}>
                    LKR {cultivationPlan.harvest_estimation.expected_income_lkr.toLocaleString()}
                  </Text>
                </Card.Content>
              </Card>
            </View>

            {/* Timesteps Timeline list */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cultivation Timeline</Text>
                
                {cultivationPlan.timeline.map((item: any, idx: number) => (
                  <View key={idx} style={styles.timelineRow}>
                    <View style={styles.timelineIndicators}>
                      <View style={[styles.timelineNode, { backgroundColor: theme.colors.primary }]} />
                      {idx < cultivationPlan.timeline.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineTexts}>
                      <Text style={[styles.timelineWeek, { color: theme.colors.primary }]}>{item.week}</Text>
                      <Text style={[styles.timelinePhase, { color: theme.colors.text }]}>{item.phase}</Text>
                      <Text style={[styles.timelineAction, { color: theme.colors.placeholder }]}>{item.action}</Text>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>

            {/* Fertilizer Plan */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Fertilizer Allocation</Text>
                
                {cultivationPlan.fertilizer_schedule.map((item: any, idx: number) => (
                  <List.Item
                    key={idx}
                    title={item.fertilizer}
                    description={`${item.week} - ${item.purpose}`}
                    right={() => <Text style={[styles.fertilizerAmt, { color: theme.colors.primary }]}>{item.amount}</Text>}
                    left={() => <List.Icon icon={() => <Icon name="beaker" color="#43a047" />} />}
                  />
                ))}
              </Card.Content>
            </Card>

            {/* Disease guide warnings */}
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <Card.Content>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Disease Prevention Guide</Text>
                
                {cultivationPlan.diseases.map((item: any, idx: number) => (
                  <View key={idx} style={styles.diseaseCard}>
                    <Text style={styles.diseaseName}>{item.name}</Text>
                    <Text style={styles.diseaseText}>Symptoms: {item.symptoms}</Text>
                    <Text style={styles.diseaseText}>Recommended: {item.recommended_fungicide}</Text>
                  </View>
                ))}
              </Card.Content>
            </Card>

            <Button mode="outlined" onPress={() => setStep(2)}>
              Back to Variety Choice
            </Button>
          </View>
        )}

        {/* DISTRICT PICKER MODAL */}
        <Modal
          visible={showDistrictModal}
          onDismiss={() => setShowDistrictModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select District</Text>
          <ScrollView style={styles.modalScroll}>
            {DISTRICTS_BY_ZONE[zone].map((dist) => (
              <TouchableOpacity
                key={dist}
                style={styles.modalOption}
                onPress={() => {
                  setDistrict(dist);
                  setShowDistrictModal(false);
                }}
              >
                <Text style={{ color: theme.colors.text, fontSize: 14 }}>{dist}</Text>
                {district === dist && <Icon name="check" size={16} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Modal>

      </ScrollView>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
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
  stepContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  formContent: {
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  textInput: {
    marginBottom: 12,
    height: 44,
    backgroundColor: 'transparent',
  },
  segmentedBtn: {
    marginBottom: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 6,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 4,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  weatherItem: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  weatherLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  weatherValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  successBanner: {
    borderRadius: 16,
    padding: 12,
    elevation: 2,
  },
  successContent: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successTextContainer: {
    marginLeft: 12,
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  successSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
  },
  reasonText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  planBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    marginTop: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  vHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 8,
    marginBottom: 12,
  },
  vName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  vScoreBadge: {
    backgroundColor: 'rgba(67, 160, 71, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vScoreText: {
    color: '#43a047',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vSpecsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  specLabel: {
    fontSize: 9,
    opacity: 0.6,
  },
  specVal: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 1,
  },
  vDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  vSelectBtn: {
    borderRadius: 6,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItemCard: {
    width: '48%',
    borderRadius: 12,
    elevation: 1,
  },
  gridLabel: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
  },
  gridValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  timelineIndicators: {
    alignItems: 'center',
    width: 16,
  },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginTop: 4,
  },
  timelineTexts: {
    flex: 1,
  },
  timelineWeek: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  timelinePhase: {
    fontSize: 12,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  timelineAction: {
    fontSize: 11,
    lineHeight: 16,
  },
  fertilizerAmt: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
  diseaseCard: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginBottom: 8,
  },
  diseaseName: {
    color: '#d32f2f',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  diseaseText: {
    fontSize: 10,
    opacity: 0.8,
    marginTop: 1,
  },
  modalContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalScroll: {
    gap: 8,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
});
