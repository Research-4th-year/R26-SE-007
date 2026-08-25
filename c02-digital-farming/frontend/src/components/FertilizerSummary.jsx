import React, { useMemo } from 'react';
import fertilizerData from '../data/fertilizer.json';

const FertilizerSummary = ({ zone, ageGroup, irrigation = 'Irrigated' }) => {
  const summaryData = useMemo(() => {
    if (!zone || !ageGroup) return null;

    // Map the ML Age_Group string to the JSON key
    let durationKey = '3_5_month'; // Default
    const lowerAge = ageGroup.toLowerCase();
    
    if (lowerAge.includes('4 1/2') || lowerAge.includes('4.5')) durationKey = '4_5_month';
    else if (lowerAge.includes('4')) durationKey = '4_month';
    else if (lowerAge.includes('3 1/2') || lowerAge.includes('3.5')) durationKey = '3_5_month';
    else if (lowerAge.includes('3')) durationKey = '3_month';

    const zData = fertilizerData.recommendations.find(r => 
      r.agro_zone.toLowerCase().includes(zone.toLowerCase()) && 
      r.cultivation_condition.toLowerCase().includes(irrigation.toLowerCase())
    );
    if (!zData) return null;

    return zData.fertilizer_recommendations[durationKey];
  }, [zone, ageGroup, irrigation]);

  if (!summaryData) return null;

  return (
    <div className="fertilizer-summary-card" style={{ 
      background: 'linear-gradient(145deg, #fffbeb 0%, #ffffff 100%)', 
      borderRadius: '16px', 
      padding: '25px', 
      marginTop: '20px',
      border: '1px solid #fde68a',
      boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid rgba(217, 119, 6, 0.2)', paddingBottom: '15px' }}>
        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '12px', fontSize: '1.8rem' }}>
          🧪
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#92400e', fontSize: '1.5rem' }}>RRDI Fertilizer Summary</h2>
          <span style={{ color: '#b45309', fontSize: '0.9rem', fontWeight: '500' }}>Duration: {summaryData.crop_duration}</span>
        </div>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
              <th style={{ padding: '10px', color: '#2563eb' }}>Urea</th>
              <th style={{ padding: '10px', color: '#d97706' }}>TSP</th>
              <th style={{ padding: '10px', color: '#ef4444' }}>MOP</th>
              <th style={{ padding: '10px', color: '#10b981' }}>Zinc</th>
            </tr>
          </thead>
          <tbody>
            {summaryData.schedule.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold', color: '#64748b' }}>{item.time}</td>
                <td style={{ padding: '10px' }}>{item.urea || '-'}</td>
                <td style={{ padding: '10px' }}>{item.tsp || '-'}</td>
                <td style={{ padding: '10px' }}>{item.mop || '-'}</td>
                <td style={{ padding: '10px' }}>{item.zinc_sulphate || '-'}</td>
              </tr>
            ))}
            {summaryData.total && (
              <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                <td style={{ padding: '10px', textAlign: 'left', color: '#1e293b' }}>Total (kg/ha)</td>
                <td style={{ padding: '10px', color: '#2563eb' }}>{summaryData.total.urea}</td>
                <td style={{ padding: '10px', color: '#d97706' }}>{summaryData.total.tsp}</td>
                <td style={{ padding: '10px', color: '#ef4444' }}>{summaryData.total.mop}</td>
                <td style={{ padding: '10px', color: '#10b981' }}>{summaryData.total.zinc_sulphate}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>
        Based on RRDI Guidelines for {zone}
      </div>
    </div>
  );
};

export default FertilizerSummary;
