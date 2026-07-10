import React from 'react';
import { StyleSheet, View, ScrollView, Dimensions } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../contexts/ThemeContext';
import { Icon } from '../components/Icon';

const screenWidth = Dimensions.get('window').width;

const yieldData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      data: [3200, 3400, 3800, 4100, 4500, 4800],
      color: (opacity = 1) => `rgba(52, 211, 153, ${opacity})`,
      strokeWidth: 2,
    },
  ],
};

const npkData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      data: [65, 60, 55, 75, 80, 78, 75],
    },
  ],
};

const soilData = {
  labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
  datasets: [
    {
      data: [45, 43, 40, 35, 32, 55],
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    },
  ],
};

export const AnalyticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme, isDark } = useAppTheme();

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.text,
    labelColor: (opacity = 1) => theme.colors.placeholder,
    propsForDots: {
      r: '4',
      strokeWidth: '1.5',
      stroke: theme.colors.primary,
    },
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Cultivation Analytics</Text>
        <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>
          Historical Trends and AI Estimations
        </Text>
      </View>

      {/* Overview Metric Row */}
      <View style={styles.gridRow}>
        <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={[styles.metricLabel, { color: theme.colors.placeholder }]}>Predicted Yield</Text>
              <Icon name="trending-up" size={16} color="#34d399" />
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>4.8 t/ha</Text>
            <Text style={styles.metricSub}>+12% vs last season</Text>
          </Card.Content>
        </Card>

        <Card style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={[styles.metricLabel, { color: theme.colors.placeholder }]}>Health Index</Text>
              <Icon name="activity" size={16} color="#2196f3" />
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>92%</Text>
            <Text style={styles.metricSub}>Optimal Condition</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Yield Curve Chart */}
      <Text style={[styles.chartSectionTitle, { color: theme.colors.text }]}>Yield Trajectory (kg/ha)</Text>
      <View style={[styles.chartWrapper, { backgroundColor: theme.colors.surface }]}>
        <LineChart
          data={yieldData}
          width={screenWidth - 32}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* NPK Level Chart */}
      <Text style={[styles.chartSectionTitle, { color: theme.colors.text }]}>Nitrogen (N) Content Trend</Text>
      <View style={[styles.chartWrapper, { backgroundColor: theme.colors.surface }]}>
        <BarChart
          data={npkData}
          width={screenWidth - 32}
          height={180}
          chartConfig={chartConfig}
          yAxisLabel=""
          yAxisSuffix=""
          style={styles.chart}
        />
      </View>

      {/* Soil Moisture Chart */}
      <Text style={[styles.chartSectionTitle, { color: theme.colors.text }]}>Soil Moisture Curve (%)</Text>
      <View style={[styles.chartWrapper, { backgroundColor: theme.colors.surface }]}>
        <LineChart
          data={soilData}
          width={screenWidth - 32}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
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
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  metricSub: {
    fontSize: 10,
    color: '#006D32',
    fontWeight: '600',
    marginTop: 2,
  },
  chartSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chartWrapper: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  chart: {
    borderRadius: 16,
  },
});
