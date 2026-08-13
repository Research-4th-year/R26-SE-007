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
      <div className="result-card fade-in" style={{ background: 'rgb(255,255,255)' }}>
        <h2 style={{ color: '#10b981', borderBottom: '1px solid rgba(16,185,129,0.2)', paddingBottom: '10px', marginBottom: '20px' }}>
          Farmer Crop Guidance (වගා උපදෙස්)
        </h2>
        
        <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '20px' }}>
          Your recommended variety (<strong style={{ color: '#0f172a' }}>{guidanceData.variety}</strong>) has an approximate crop duration of <strong style={{ color: '#0f172a' }}>{guidanceData.ageGroup}</strong>. 
          The following guidance is organized according to crop age and Sri Lankan agricultural recommendations for the <strong style={{ color: '#0f172a' }}>{guidanceData.zone}</strong> ({guidanceData.irrigation}).
        </p>

        <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {guidanceData.stages.map((stage) => (
            <div key={stage.id} className="timeline-stage" style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '15px',
              borderLeft: '4px solid #10b981',
              position: 'relative',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }} onClick={() => toggleStage(stage.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{stage.icon}</span>
                  <span>{stage.title}</span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', background: '#d1fae5', color: '#047857', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    {stage.date}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '1.2rem', transform: expandedStage === stage.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
                    ▼
                  </span>
                </div>
              </div>

              {expandedStage === stage.id && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.9rem', marginTop: '15px' }}>
                {/* Activities */}
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#2563eb' }}>Action:</strong>
                  <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', color: '#1e293b' }}>
                    {stage.activities.map((act, i) => <li key={i}>{act}</li>)}
                  </ul>
                </div>

                {/* Water */}
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#0284c7' }}>💧 Water:</strong>
                  <p style={{ margin: '5px 0 0 0', color: '#1e293b' }}>{stage.water}</p>
                </div>

                {/* Fertilizers */}
                {stage.fertilizers.length > 0 && (
                  <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ color: '#d97706' }}>🧪 Fertilizer:</strong>
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', color: '#1e293b' }}>
                      {stage.fertilizers.map((fert, i) => (
                        <li key={i}><strong style={{ color: '#0f172a' }}>{fert.type}</strong>: {fert.quantity}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {stage.warnings.length > 0 && (
                  <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '8px', gridColumn: '1 / -1', border: '1px solid #fecaca' }}>
                    <strong style={{ color: '#dc2626' }}>⚠️ Warning:</strong>
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', color: '#991b1b' }}>
                      {stage.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
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
