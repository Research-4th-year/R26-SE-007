import React from 'react';
import { Thermometer, Droplets, CloudRain, Sun, Activity, Zap, Wifi, WifiOff } from 'lucide-react';

// Metric tile
const MetricTile = ({ icon, label, value, unit, bg, col }) => (
  <div style={{
    background: 'var(--current-surface)',
    border: '1px solid var(--current-border)',
    borderRadius: '14px',
    padding: '1.1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.9rem',
    gridColumn: col || 'auto',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
  >
    <div style={{ padding: '0.7rem', background: bg, borderRadius: '12px', flexShrink: 0 }}>{icon}</div>
    <div>
      <p style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.15rem' }}>{label}</p>
      <p style={{ fontSize: '1.3rem', fontWeight: '800', lineHeight: 1 }}>{value}<span style={{ fontSize: '0.75rem', fontWeight: '600', marginLeft: '3px', opacity: 0.7 }}>{unit}</span></p>
    </div>
  </div>
);

const FieldConditionCard = ({ sensors, iotStatus, isSi }) => {
  const isOnline = iotStatus === 'ONLINE' || iotStatus === 'IOT';
  const avgSoil = Math.round((Number(sensors?.soil1 || 0) + Number(sensors?.soil2 || 0)) / 2);

  return (
    <section>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
          {isSi ? '🌿 ක්‍ෂේත්‍ර තත්ත්වය – සජීවී' : '🌿 Live Field Conditions'}
        </h3>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '0.72rem', fontWeight: '700', padding: '4px 10px',
          borderRadius: '20px',
          background: isOnline ? 'rgba(46,125,50,0.12)' : 'rgba(2,136,209,0.12)',
          color: isOnline ? '#2E7D32' : '#0288D1',
          border: `1px solid ${isOnline ? '#2E7D32' : '#0288D1'}33`
        }}>
          {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isOnline ? (isSi ? '📡 IoT උපාංගය' : '📡 IoT Device') : (isSi ? '🌐 WeatherAPI' : '🌐 WeatherAPI')}
        </span>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.85rem' }}>
        <MetricTile icon={<Thermometer size={20} color="#ef4444" />} label={isSi ? 'උෂ්ණත්වය' : 'Temperature'} value={sensors?.temperature || '--'} unit="°C" bg="rgba(239,68,68,0.1)" />
        <MetricTile icon={<Droplets size={20} color="#3b82f6" />} label={isSi ? 'ආර්ද්‍රතාවය' : 'Humidity'} value={sensors?.humidity || '--'} unit="%" bg="rgba(59,130,246,0.1)" />
        <MetricTile icon={<Activity size={20} color="#10b981" />} label={isSi ? 'පස් ආර්ද්‍රතාව' : 'Soil Moisture'} value={avgSoil || '--'} unit="%" bg="rgba(16,185,129,0.1)" />
        <MetricTile icon={<Sun size={20} color="#f59e0b" />} label={isSi ? 'ආලෝකය' : 'Light'} value={sensors?.light || '--'} unit="lx" bg="rgba(245,158,11,0.1)" />
        <MetricTile icon={<CloudRain size={20} color="#8b5cf6" />} label={isSi ? 'වර්ෂාව' : 'Rain Status'} value={sensors?.rain === 0 ? (isSi ? 'ඇළ' : 'Raining') : (isSi ? 'නෑ' : 'No Rain')} unit="" bg="rgba(139,92,246,0.1)" col="span 2" />
      </div>

      {/* NPK status */}
      <div style={{
        marginTop: '0.85rem', padding: '0.9rem 1rem',
        background: 'var(--current-surface)', border: '1px solid var(--current-border)', borderRadius: '14px',
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.5rem'
      }}>
        {[
          { label: 'N', name: isSi ? 'නයිට්‍රජන්' : 'Nitrogen', color: '#2E7D32' },
          { label: 'P', name: isSi ? 'පොස්පරස්' : 'Phosphorus', color: '#C49A00' },
          { label: 'K', name: isSi ? 'පොටෑසියම්' : 'Potassium', color: '#7B1FA2' }
        ].map(n => (
          <div key={n.label} style={{ textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${n.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', border: `2px solid ${n.color}44` }}>
              <Zap size={14} color={n.color} />
            </div>
            <p style={{ fontSize: '0.65rem', color: 'var(--current-text-sec)' }}>{n.label}</p>
            <p style={{ fontSize: '0.7rem', fontWeight: '700', color: n.color }}>{isSi ? 'මධ්‍යම' : 'Medium'}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FieldConditionCard;
