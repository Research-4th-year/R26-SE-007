import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../i18n';
import { generateCropTimeline } from '../utils/cropGuidance';

interface FarmerGuidanceProps {
  variety: string;
  ageGroup: string;
  zone: string;
  irrigation: string;
  cultivationDate: Date;
}

export default function FarmerGuidance({ variety, ageGroup, zone, irrigation, cultivationDate }: FarmerGuidanceProps) {
  const { language } = useLanguage();
  const t = translations[language].c02Farming.farmerGuidance;

  const guidanceData = useMemo(() => {
    if (!variety || !ageGroup || !zone) return null;
    return generateCropTimeline(variety, ageGroup, zone, irrigation || "Irrigated", cultivationDate);
  }, [variety, ageGroup, zone, irrigation, cultivationDate]);

  const [expandedStage, setExpandedStage] = useState<number | null>(guidanceData?.stages[1]?.id || null);

  if (!guidanceData) return null;

  const toggleStage = (id: number) => {
    setExpandedStage(expandedStage === id ? null : id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {t.infoPart1}<Text style={styles.boldGreen}>{guidanceData.variety}</Text>{t.infoPart2}<Text style={styles.boldGreen}>{guidanceData.ageGroup}</Text>
            {t.infoPart3}<Text style={styles.boldGreen}>{guidanceData.zone}</Text> ({guidanceData.irrigation}).
          </Text>
        </View>

        <View style={styles.timeline}>
          {guidanceData.stages.map((stage: any) => {
            const isExpanded = expandedStage === stage.id;
            return (
              <TouchableOpacity
                key={stage.id}
                style={[styles.stageBox, isExpanded && styles.stageBoxExpanded]}
                onPress={() => toggleStage(stage.id)}
                activeOpacity={0.8}
              >
                <View style={styles.stageHeader}>
                  <Text style={styles.stageTitle}>{stage.title}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.dateBadge, isExpanded && styles.dateBadgeExpanded]}>
                      <Text style={[styles.dateText, isExpanded && styles.dateTextExpanded]}>{stage.date}</Text>
                    </View>
                  </View>
                </View>

                {isExpanded && (
                  <View style={styles.stageContent}>
                    <View style={[styles.contentBlock, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                      <Text style={[styles.blockTitle, { color: '#1D4ED8' }]}>{t.action}:</Text>
                      {stage.activities.map((act: string, i: number) => (
                        <Text key={i} style={[styles.blockText, { color: '#1E3A8A' }]}>• {act}</Text>
                      ))}
                    </View>

                    <View style={[styles.contentBlock, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                      <Text style={[styles.blockTitle, { color: '#0369A1' }]}>{t.water}:</Text>
                      <Text style={[styles.blockText, { color: '#0C4A6E' }]}>{stage.water}</Text>
                    </View>

                    {stage.fertilizers.length > 0 && (
                      <View style={[styles.contentBlock, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                        <Text style={[styles.blockTitle, { color: '#B45309' }]}>{t.fertilizer}:</Text>
                        {stage.fertilizers.map((fert: any, i: number) => (
                          <Text key={i} style={[styles.blockText, { color: '#78350F' }]}>
                            <Text style={{ fontWeight: 'bold' }}>{fert.type}</Text>: {fert.quantity}
                          </Text>
                        ))}
                      </View>
                    )}

                    {stage.warnings.length > 0 && (
                      <View style={[styles.contentBlock, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <Text style={[styles.blockTitle, { color: '#B91C1C' }]}>{t.warning}:</Text>
                        {stage.warnings.map((warn: string, i: number) => (
                          <Text key={i} style={[styles.blockText, { color: '#7F1D1D' }]}>• {warn}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sourceBox}>
          <Text style={styles.sourceText}><Text style={{ fontWeight: 'bold' }}>{t.source}:</Text> {guidanceData.source}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  card: { backgroundColor: '#F0FDF4', borderRadius: 16, borderWidth: 1, borderColor: '#BBF7D0', padding: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.2)', paddingBottom: 15 },
  iconBox: { width: 48, height: 48, backgroundColor: '#D1FAE5', borderRadius: 12, marginRight: 15 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#065F46' },
  subtitle: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#059669' },
  infoBox: { backgroundColor: 'rgba(255,255,255,0.6)', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  infoText: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: '#334155', lineHeight: 22 },
  boldGreen: { fontFamily: 'Poppins_700Bold', color: '#10B981' },
  timeline: { flexDirection: 'column', gap: 15 },
  stageBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 6, borderLeftColor: '#94A3B8' },
  stageBoxExpanded: { backgroundColor: '#FFFFFF', borderColor: '#6EE7B7', borderLeftColor: '#10B981', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  stageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageTitle: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#047857', flex: 1, marginRight: 10 },
  dateBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dateBadgeExpanded: { backgroundColor: '#10B981' },
  dateText: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#475569' },
  dateTextExpanded: { color: '#FFFFFF' },
  stageContent: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 15, gap: 10 },
  contentBlock: { padding: 12, borderRadius: 8, borderWidth: 1 },
  blockTitle: { fontSize: 14, fontFamily: 'Poppins_700Bold', marginBottom: 6 },
  blockText: { fontSize: 13, fontFamily: 'Poppins_400Regular', marginBottom: 2, lineHeight: 20 },
  sourceBox: { marginTop: 20, padding: 10, backgroundColor: '#F1F5F9', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  sourceText: { fontSize: 11, color: '#475569', fontFamily: 'Poppins_400Regular' }
});

