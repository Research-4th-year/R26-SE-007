import React from 'react';

const DistrictCard = ({ district, isSi, onSelect, activeZone }) => (
  <button
    type="button"
    onClick={() => onSelect(district)}
    style={{
      width: '100%',
      textAlign: 'left',
      border: activeZone === district.zone ? `2px solid ${district.color}` : '1px solid var(--current-border)',
      borderRadius: '16px',
      padding: '0.95rem',
      background: activeZone === district.zone ? district.bg : 'var(--current-card)',
      color: 'inherit',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
      <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0 }}>{isSi ? district.zone_si : district.zone}</h4>
      <span style={{ fontSize: '1rem' }}>{district.icon}</span>
    </div>
    <p style={{ fontSize: '0.78rem', color: 'var(--current-text-sec)', marginBottom: '0.5rem' }}>
      {isSi ? district.climate_si : district.climate_en}
    </p>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      {district.districts.slice(0, 4).map((item) => (
        <span key={item.name} style={{ fontSize: '0.68rem', padding: '3px 8px', borderRadius: '999px', background: `${district.color}14`, color: district.color }}>
          {isSi ? item.si : item.name}
        </span>
      ))}
    </div>
  </button>
);

export default DistrictCard;
