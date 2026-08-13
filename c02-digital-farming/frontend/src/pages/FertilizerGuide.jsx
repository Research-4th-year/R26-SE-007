import React, { useState } from 'react';
import fertilizerData from '../data/fertilizer.json';

const FertilizerGuide = () => {
  const [selectedZone, setSelectedZone] = useState('Dry Zone');
  const [selectedDuration, setSelectedDuration] = useState('3_5_month');

  const mainFertilizers = [
    {
      name: 'Urea',
      image: '/dataset/Rice-Fertilizer/urea.jpg',
      description: 'Urea fertilizer is a widely used, synthetic nitrogen source with a high concentration of 46% nitrogen (grade 46-0-0).',
      color: '#2563eb'
    },
    {
      name: 'TSP (Triple Superphosphate)',
      image: '/dataset/Rice-Fertilizer/tsp.jpg',
      description: 'TSP fertilizer is a dry, granular phosphorus source containing roughly 44% to 48% P₂O₅ and 15% calcium.',
      color: '#d97706'
    },
    {
      name: 'MOP (Muriate of Potash)',
      image: '/dataset/Rice-Fertilizer/MOP.jpg',
      description: 'MOP fertilizer (potassium chloride) is a common agricultural product providing roughly 60% potassium oxide (K₂O) and 45% chloride.',
      color: '#ef4444'
    },
    {
      name: 'Zinc Sulphate',
      image: '/dataset/Rice-Fertilizer/zinc.jpg',
      description: 'Zinc sulphate is a dry, cost-effective micronutrient fertilizer used to fix zinc shortages in crops like rice, corn, and fruit trees.',
      color: '#10b981'
    }
  ];

  const zoneData = fertilizerData.recommendations.find(r => r.agro_zone === selectedZone);
  const durationData = zoneData ? zoneData.fertilizer_recommendations[selectedDuration] : null;

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h2>Fertilizer Guide</h2>
        <p>Main Fertilizers and RRDI Zone-based Recommendations</p>
      </header>

      {/* Main Fertilizers Section */}
      <div className="glass-panel" style={{ marginBottom: '30px', padding: '20px' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '20px' }}>Main Fertilizers for Paddy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {mainFertilizers.map((fert, idx) => (
            <div key={idx} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${fert.color}33` }}>
              <div style={{ height: '150px', overflow: 'hidden' }}>
                <img src={fert.image} alt={fert.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '15px' }}>
                <h4 style={{ color: fert.color, margin: '0 0 10px 0' }}>{fert.name}</h4>
                <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>{fert.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ color: '#1e293b', marginBottom: '20px' }}>RRDI Fertilizer Recommendations (kg/ha)</h3>
        
        {/* Selectors */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Agro Climatic Zone</label>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}>
              <option value="Dry Zone">Dry Zone</option>
              <option value="Wet Zone">Wet Zone</option>
              <option value="Intermediate Zone">Intermediate Zone</option>
            </select>
          </div>
          
          <div className="form-group" style={{ flex: '1 1 200px' }}>
            <label>Crop Duration</label>
            <select value={selectedDuration} onChange={(e) => setSelectedDuration(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%' }}>
              <option value="3_month">3 Months</option>
              <option value="3_5_month">3.5 Months</option>
              <option value="4_month">4 Months</option>
              <option value="4_5_month">4.5 Months</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {durationData ? (
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: '#fff' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#334155', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '15px', textAlign: 'left' }}>Time / Age Group</th>
                  <th style={{ padding: '15px', color: '#2563eb' }}>Urea</th>
                  <th style={{ padding: '15px', color: '#d97706' }}>TSP</th>
                  <th style={{ padding: '15px', color: '#ef4444' }}>MOP</th>
                  <th style={{ padding: '15px', color: '#10b981' }}>Zinc Sulphate</th>
                </tr>
              </thead>
              <tbody>
                {durationData.schedule.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: '#475569' }}>{item.time}</td>
                    <td style={{ padding: '15px' }}>{item.urea || '-'}</td>
                    <td style={{ padding: '15px' }}>{item.tsp || '-'}</td>
                    <td style={{ padding: '15px' }}>{item.mop || '-'}</td>
                    <td style={{ padding: '15px' }}>{item.zinc_sulphate || '-'}</td>
                  </tr>
                ))}
                {durationData.total && (
                  <tr style={{ background: '#f1f5f9', fontWeight: 'bold' }}>
                    <td style={{ padding: '15px', textAlign: 'left', color: '#1e293b' }}>TOTAL (kg/ha)</td>
                    <td style={{ padding: '15px', color: '#2563eb' }}>{durationData.total.urea}</td>
                    <td style={{ padding: '15px', color: '#d97706' }}>{durationData.total.tsp}</td>
                    <td style={{ padding: '15px', color: '#ef4444' }}>{durationData.total.mop}</td>
                    <td style={{ padding: '15px', color: '#10b981' }}>{durationData.total.zinc_sulphate}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '20px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', textAlign: 'center' }}>
            Recommendation data not available for this selection.
          </div>
        )}
      </div>
    </div>
  );
};

export default FertilizerGuide;
