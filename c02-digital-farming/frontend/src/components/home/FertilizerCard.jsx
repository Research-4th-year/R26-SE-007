import React from 'react';
import ureaImg from '../../assets/images/fertilizer-urea.jpg';
import tspImg from '../../assets/images/fertilizer-tsp.jpg';
import mopImg from '../../assets/images/fertilizer-mop.jpg';

const imageMap = {
  'fertilizer-urea': ureaImg,
  'fertilizer-tsp': tspImg,
  'fertilizer-mop': mopImg,
};

const FertilizerCard = ({ fertilizer, isSi }) => (
  <article className="glass-panel" style={{ overflow: 'hidden', borderRadius: '22px' }}>
    <img
      src={imageMap[fertilizer.image] || ureaImg}
      alt={fertilizer.name}
      style={{ width: '100%', height: '160px', objectFit: 'cover' }}
    />
    <div style={{ padding: '1rem 1rem 1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>{fertilizer.name}</h4>
        <span style={{ fontSize: '0.72rem', fontWeight: '700', padding: '4px 8px', borderRadius: '999px', background: `${fertilizer.accent}16`, color: fertilizer.accent }}>
          {fertilizer.icon}
        </span>
      </div>
      <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2E7D32', marginBottom: '0.4rem' }}>{isSi ? fertilizer.sinhala_name : fertilizer.name}</p>
      <p style={{ fontSize: '0.82rem', color: 'var(--current-text-sec)', marginBottom: '0.6rem', lineHeight: '1.45' }}>
        {isSi ? fertilizer.purpose_si : fertilizer.purpose_en}
      </p>
      <div style={{ display: 'grid', gap: '0.35rem', fontSize: '0.78rem' }}>
        <div style={{ color: 'var(--current-text-sec)' }}>
          <strong>{isSi ? 'අවස්ථාව' : 'Stage'}:</strong> {isSi ? fertilizer.application_stage_si : fertilizer.application_stage_en}
        </div>
        <div style={{ color: 'var(--current-text-sec)' }}>
          <strong>{isSi ? 'පොහොර' : 'Nutrient'}:</strong> {isSi ? fertilizer.nutrient_si : fertilizer.nutrient}
        </div>
      </div>
    </div>
  </article>
);

export default FertilizerCard;
