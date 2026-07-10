import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

const AIInsightCard = ({ recommendation, isSi }) => (
  <article className="glass-panel" style={{ padding: '1.1rem', borderRadius: '22px', border: '1px solid rgba(46,125,50,0.16)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(46,125,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={18} color="#2E7D32" />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '800', margin: 0 }}>{isSi ? 'අදහස් මත AI නිර්දේශය' : "Today's AI Recommendation"}</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)', margin: 0 }}>{isSi ? 'වලාපත, IoT සහ පස් තත්ත්වය මත පදනම්ව' : 'Based on weather, IoT and soil condition'}</p>
        </div>
      </div>
      <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#2E7D32', background: 'rgba(46,125,50,0.12)', padding: '4px 8px', borderRadius: '999px' }}>
        AI
      </span>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.7rem' }}>
      <TrendingUp size={16} color="#C49A00" />
      <span style={{ fontSize: '0.84rem', fontWeight: '700' }}>{isSi ? 'නිර්දේශිත ප්‍රභේදය:' : 'Recommended variety:'} {recommendation.variety}</span>
    </div>

    <p style={{ fontSize: '0.86rem', color: 'var(--current-text-sec)', lineHeight: '1.55' }}>
      {isSi ? recommendation.reason_si : recommendation.reason_en}
    </p>
  </article>
);

export default AIInsightCard;
