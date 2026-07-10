import React, { useState } from 'react';
import ricePlantImg from '../../assets/images/rice-plant.png';
import paddySeedImg from '../../assets/images/paddy-seed.png';
import { X, Clock, TrendingUp, Leaf, MapPin } from 'lucide-react';

const IMG_MAP = { 'rice-plant': ricePlantImg, 'paddy-seed': paddySeedImg };

// ── Variety Detail Modal ───────────────────────────────────────────────────────
const VarietyModal = ({ variety, isSi, onClose }) => {
  if (!variety) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--current-bg)', borderRadius: '20px', maxWidth: '520px', width: '100%',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.3)'
      }} onClick={e => e.stopPropagation()}>
        {/* Header image */}
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden', borderRadius: '20px 20px 0 0' }}>
          <img src={IMG_MAP[variety.image] || ricePlantImg} alt={variety.english_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
          <button onClick={onClose} style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
            width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', backdropFilter: 'blur(4px)'
          }}><X size={16} /></button>
          <div style={{ position: 'absolute', bottom: '16px', left: '16px' }}>
            <h2 style={{ color: 'white', fontWeight: '800', fontSize: '1.5rem', margin: 0 }}>{variety.code}</h2>
            <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9rem' }}>{isSi ? variety.sinhala_name : variety.english_name}</p>
          </div>
          {variety.badge && (
            <span style={{
              position: 'absolute', top: '12px', left: '12px',
              background: variety.accent, color: 'white', fontSize: '0.65rem', fontWeight: '800',
              padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>{variety.badge}</span>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ color: 'var(--current-text-sec)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
            {isSi ? variety.description_si : variety.description_en}
          </p>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.7rem', marginBottom: '1.25rem' }}>
            {[
              { icon: <Clock size={14} />, label: isSi ? 'කාලය' : 'Duration', value: `${variety.duration_days}d` },
              { icon: <TrendingUp size={14} />, label: isSi ? 'අස්වැන්න' : 'Yield', value: `${variety.yield_t_ha} t/ha` },
              { icon: <Leaf size={14} />, label: isSi ? 'රෝග ඔරොත්තු' : 'Disease Res.', value: isSi ? 'මධ්‍යම' : variety.disease_resistance },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--current-surface)', borderRadius: '10px', padding: '0.7rem', textAlign: 'center' }}>
                <div style={{ color: variety.accent, marginBottom: '4px' }}>{s.icon}</div>
                <p style={{ fontSize: '0.6rem', color: 'var(--current-text-sec)', textTransform: 'uppercase', marginBottom: '2px' }}>{s.label}</p>
                <p style={{ fontSize: '0.85rem', fontWeight: '800' }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Fertilizer */}
          <div style={{ background: 'var(--current-surface)', borderRadius: '12px', padding: '0.9rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', color: variety.accent, marginBottom: '0.5rem' }}>🌾 {isSi ? 'පොහොර නිර්දේශය (kg/ha)' : 'Fertilizer Recommendation (kg/ha)'}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {Object.entries(variety.fertilizer_kg_ha).map(([k, v]) => (
                <span key={k} style={{ fontSize: '0.8rem', fontWeight: '600' }}>{k.toUpperCase()}: <strong>{v}</strong></span>
              ))}
            </div>
          </div>

          {/* Districts */}
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} color={variety.accent} /> {isSi ? 'සුදුසු දිස්ත්‍රික්ක' : 'Suitable Districts'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {variety.districts.map(d => (
                <span key={d} style={{ background: `${variety.accent}18`, color: variety.accent, fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${variety.accent}33` }}>{d}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
            {variety.suitable_season.map(s => (
              <span key={s} style={{ background: 'rgba(46,125,50,0.12)', color: '#2E7D32', fontSize: '0.7rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>
                {s === 'Maha' ? (isSi ? '🌧️ මහ' : '🌧️ Maha') : (isSi ? '☀️ යල' : '☀️ Yala')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Variety Card ──────────────────────────────────────────────────────────────
const PaddyVarietyCard = ({ variety, isSi }) => {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div style={{
        background: 'var(--current-surface)', border: '1px solid var(--current-border)',
        borderRadius: '16px', overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer', flexShrink: 0, width: '200px'
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        onClick={() => setShowModal(true)}
      >
        {/* Card Image */}
        <div style={{ height: '120px', overflow: 'hidden', position: 'relative' }}>
          <img src={IMG_MAP[variety.image] || ricePlantImg} alt={variety.code}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${variety.accent}99, transparent 55%)` }} />
          {variety.badge && (
            <span style={{
              position: 'absolute', top: '8px', left: '8px',
              background: variety.accent, color: 'white', fontSize: '0.58rem', fontWeight: '800',
              padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase'
            }}>{variety.badge}</span>
          )}
          <p style={{ position: 'absolute', bottom: '8px', left: '10px', color: 'white', fontWeight: '800', fontSize: '1rem', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {variety.code}
          </p>
        </div>

        {/* Card Body */}
        <div style={{ padding: '0.75rem 0.9rem' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '2px' }}>
            {isSi ? variety.sinhala_name : variety.english_name}
          </p>
          <p style={{ fontSize: '0.68rem', color: 'var(--current-text-sec)', marginBottom: '0.5rem' }}>
            {isSi ? variety.rice_type_si : variety.rice_type_en}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--current-text-sec)', marginBottom: '0.6rem' }}>
            <span>⏱ {variety.duration_days}d</span>
            <span>📊 {variety.yield_t_ha} t/ha</span>
          </div>
          <span style={{
            display: 'block', textAlign: 'center', fontSize: '0.65rem', fontWeight: '700',
            color: variety.accent, background: `${variety.accent}15`,
            padding: '4px 0', borderRadius: '8px', border: `1px solid ${variety.accent}33`
          }}>
            {isSi ? 'විස්තර බලන්න' : 'View Details'} →
          </span>
        </div>
      </div>
      {showModal && <VarietyModal variety={variety} isSi={isSi} onClose={() => setShowModal(false)} />}
    </>
  );
};

export default PaddyVarietyCard;
