import React from 'react';

const SeasonCard = ({ season, isSi }) => (
  <article className="glass-panel" style={{ padding: '1rem', borderRadius: '22px', background: season.gradient }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
      <h4 style={{ fontSize: '1rem', fontWeight: '800', color: 'white', margin: 0 }}>{isSi ? season.sinhala_name : season.name}</h4>
      <span style={{ fontSize: '1.1rem' }}>{season.icon}</span>
    </div>
    <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.86rem', marginBottom: '0.55rem' }}>{isSi ? season.months_si : season.months_en}</p>
    <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.84rem', lineHeight: '1.45', marginBottom: '0.8rem' }}>
      {isSi ? season.description_si : season.description_en}
    </p>
    <div style={{ display: 'grid', gap: '0.3rem', fontSize: '0.79rem', color: 'rgba(255,255,255,0.95)' }}>
      <div><strong>{isSi ? 'වර්ෂාව' : 'Rainfall'}:</strong> {isSi ? season.rainfall_si : season.rainfall}</div>
      <div><strong>{isSi ? 'නිර්දේශිත ප්‍රභේද' : 'Recommended'}:</strong> {season.varieties_recommended.join(', ')}</div>
    </div>
  </article>
);

export default SeasonCard;
