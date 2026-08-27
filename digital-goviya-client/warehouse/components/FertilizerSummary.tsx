import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import fertilizerData from '../app/(c02-farming)/fertilizer.json';

interface FertilizerSummaryProps {
  zone: string;
  ageGroup: string;
  irrigation?: string;
}

export default function FertilizerSummary({ zone, ageGroup, irrigation = "Irrigated paddy fields" }: FertilizerSummaryProps) {
  const summaryData = useMemo(() => {
    if (!zone || !ageGroup) return null;

    let durationKey = '3_5_month';
    const lowerAge = ageGroup.toLowerCase();
    
    if (lowerAge.includes('4 1/2') || lowerAge.includes('4.5')) durationKey = '4_5_month';
    else if (lowerAge.includes('4')) durationKey = '4_month';
    else if (lowerAge.includes('3 1/2') || lowerAge.includes('3.5')) durationKey = '3_5_month';
    else if (lowerAge.includes('3')) durationKey = '3_month';

    const rawData = (fertilizerData as any).default || fertilizerData;
    const recommendationsArray = Array.isArray(rawData) ? rawData : (rawData.recommendations || []);
    const zData = recommendationsArray.find((r: any) => 
      r.agro_zone.toLowerCase().includes(zone.toLowerCase()) && 
      r.cultivation_condition.toLowerCase().includes(irrigation.toLowerCase().replace(' paddy fields', ''))
    );

    if (!zData) return null;
    return zData.fertilizer_recommendations[durationKey];
  }, [zone, ageGroup, irrigation]);

  if (!summaryData) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 24 }}>🧪</Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>RRDI Fertilizer Summary</Text>
          <Text style={styles.subtitle}>Duration: {summaryData.crop_duration}</Text>
        </View>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cellHeader, { flex: 2 }]}>Time</Text>
            <Text style={[styles.cellHeader, { color: '#2563EB' }]}>Urea</Text>
            <Text style={[styles.cellHeader, { color: '#D97706' }]}>TSP</Text>
            <Text style={[styles.cellHeader, { color: '#EF4444' }]}>MOP</Text>
            <Text style={[styles.cellHeader, { color: '#10B981' }]}>Zinc</Text>
          </View>
          
          {/* Table Body */}
          {summaryData.schedule.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', color: '#64748B', textAlign: 'left' }]}>{item.time}</Text>
              <Text style={styles.cell}>{item.urea || '-'}</Text>
              <Text style={styles.cell}>{item.tsp || '-'}</Text>
              <Text style={styles.cell}>{item.mop || '-'}</Text>
              <Text style={styles.cell}>{item.zinc_sulphate || '-'}</Text>
            </View>
          ))}

          {/* Table Footer / Total */}
          {summaryData.total && (
            <View style={[styles.tableRow, styles.tableFooter]}>
              <Text style={[styles.cell, { flex: 2, fontWeight: 'bold', color: '#1E293B', textAlign: 'left' }]}>Total (kg/ha)</Text>
              <Text style={[styles.cell, { color: '#2563EB', fontWeight: 'bold' }]}>{summaryData.total.urea}</Text>
              <Text style={[styles.cell, { color: '#D97706', fontWeight: 'bold' }]}>{summaryData.total.tsp}</Text>
              <Text style={[styles.cell, { color: '#EF4444', fontWeight: 'bold' }]}>{summaryData.total.mop}</Text>
              <Text style={[styles.cell, { color: '#10B981', fontWeight: 'bold' }]}>{summaryData.total.zinc_sulphate}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Text style={styles.sourceText}>Based on RRDI Guidelines for {zone}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFBEB', borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', padding: 20, marginTop: 20, shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(217,119,6,0.2)', paddingBottom: 15 },
  iconBox: { backgroundColor: '#FEF3C7', padding: 12, borderRadius: 12, marginRight: 15 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#92400E' },
  subtitle: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#B45309' },
  table: { width: 450 }, // Fixed width to enable horizontal scroll if needed
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingVertical: 10, alignItems: 'center' },
  tableHeader: { backgroundColor: '#F8FAFC', borderBottomWidth: 2, borderBottomColor: '#E2E8F0', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  tableFooter: { backgroundColor: '#F1F5F9', borderBottomWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  cellHeader: { flex: 1, textAlign: 'center', fontSize: 13, fontFamily: 'Poppins_600SemiBold', color: '#475569' },
  cell: { flex: 1, textAlign: 'center', fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#334155' },
  sourceText: { marginTop: 15, fontSize: 11, fontFamily: 'Poppins_400Regular', color: '#94A3B8', textAlign: 'right' }
});
