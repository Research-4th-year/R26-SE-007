import React, { useMemo, useState } from 'react';
import { generateCropTimeline } from '../utils/cropGuidance';

const FarmerGuidance = ({ variety, ageGroup, zone, irrigation, cultivationDate }) => {
  const guidanceData = useMemo(() => {
    if (!variety || !ageGroup || !zone) return null;
    return generateCropTimeline(variety, ageGroup, zone, irrigation || "Irrigated", cultivationDate);
  }, [variety, ageGroup, zone, irrigation, cultivationDate]);

  if (!guidanceData) return null;

  const [expandedStage, setExpandedStage] = useState(guidanceData.stages[0]?.id);

  const toggleStage = (id) => {
    if (expandedStage === id) {
      setExpandedStage(null); // Optional: close if clicked again
    } else {
      setExpandedStage(id);
    }
  };

  return (
    <div className="farmer-guidance-container" style={{ marginTop: '20px' }}>
      <div className="result-card fade-in" style={{ background: 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)', padding: '25px', borderRadius: '16px', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '15px' }}>
          <div style={{ background: '#d1fae5', padding: '12px', borderRadius: '12px', fontSize: '1.8rem' }}>
            🌾
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#065f46', fontSize: '1.5rem' }}>Farmer Crop Guidance (වගා උපදෙස්)</h2>
            <span style={{ color: '#059669', fontSize: '0.9rem', fontWeight: '500' }}>Timeline & Actions</span>
          </div>
        </div>
        
        <p style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '25px', lineHeight: '1.6', background: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          Your recommended variety (<strong style={{ color: '#10b981' }}>{guidanceData.variety}</strong>) has an approximate crop duration of <strong style={{ color: '#10b981' }}>{guidanceData.ageGroup}</strong>. 
          The following guidance is organized according to crop age and Sri Lankan agricultural recommendations for the <strong style={{ color: '#10b981' }}>{guidanceData.zone}</strong> ({guidanceData.irrigation}).
        </p>

        <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {guidanceData.stages.map((stage) => (
            <div key={stage.id} className="timeline-stage" style={{
              background: expandedStage === stage.id ? '#ffffff' : '#f8fafc',
              borderRadius: '12px',
              padding: '15px 20px',
              border: expandedStage === stage.id ? '1px solid #6ee7b7' : '1px solid #e2e8f0',
              borderLeft: expandedStage === stage.id ? '6px solid #10b981' : '6px solid #94a3b8',
              position: 'relative',
              boxShadow: expandedStage === stage.id ? '0 10px 15px -3px rgba(16, 185, 129, 0.15)' : '0 1px 2px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} onClick={() => toggleStage(stage.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{stage.icon}</span>
                  <span>{stage.title}</span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', background: expandedStage === stage.id ? '#10b981' : '#e2e8f0', color: expandedStage === stage.id ? '#ffffff' : '#475569', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', transition: 'all 0.3s ease' }}>
                    {stage.date}
                  </span>
                  <span style={{ color: expandedStage === stage.id ? '#10b981' : '#94a3b8', fontSize: '1.2rem', transform: expandedStage === stage.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                    ▼
                  </span>
                </div>
              </div>

              {expandedStage === stage.id && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '0.9rem', marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                {/* Activities */}
                <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <strong style={{ color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>⚙️ Action:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#1e3a8a' }}>
                    {stage.activities.map((act, i) => <li key={i} style={{marginBottom:'4px'}}>{act}</li>)}
                  </ul>
                </div>

                {/* Water */}
                <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                  <strong style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>💧 Water:</strong>
                  <p style={{ margin: '8px 0 0 0', color: '#0c4a6e', lineHeight: '1.5' }}>{stage.water}</p>
                </div>

                {/* Fertilizers */}
                {stage.fertilizers.length > 0 && (
                  <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                    <strong style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>🧪 Fertilizer:</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#78350f' }}>
                      {stage.fertilizers.map((fert, i) => (
                        <li key={i} style={{marginBottom:'4px'}}><strong style={{ color: '#92400e' }}>{fert.type}</strong>: {fert.quantity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {stage.warnings.length > 0 && (
                  <div style={{ background: '#fef2f2', padding: '15px', borderRadius: '12px', gridColumn: '1 / -1', border: '1px solid #fecaca' }}>
                    <strong style={{ color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem' }}>⚠️ Warning:</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#7f1d1d' }}>
                      {stage.warnings.map((warn, i) => <li key={i} style={{marginBottom:'4px'}}>{warn}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', padding: '10px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.8rem', color: '#475569', border: '1px solid #e2e8f0' }}>
          <strong style={{ color: '#334155' }}>Source:</strong> {guidanceData.source} <br/>
        </div>
      </div>
    </div>
  );
};

export default FarmerGuidance;
