import React from 'react';
import { Sprout, Info } from 'lucide-react';

const VarietyCard = ({ name, duration, yield: yieldRange, water, confidence }) => (
  <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
    <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
      <h3 style={{ fontSize: '1.1rem' }}>{name}</h3>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--current-text-sec)', fontWeight: '600' }}>Confidence</p>
        <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-green)' }}>{confidence}%</p>
      </div>
    </div>
    
    <div className="grid-3" style={{ gap: '0.5rem', marginBottom: '1rem' }}>
       <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--current-text-sec)' }}>Duration</p>
          <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>{duration} days</p>
       </div>
       <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--current-text-sec)' }}>Yield</p>
          <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>{yieldRange} t/ha</p>
       </div>
       <div style={{ background: 'rgba(0,0,0,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--current-text-sec)' }}>Water Need</p>
          <p style={{ fontSize: '0.75rem', fontWeight: '600' }}>{water}</p>
       </div>
    </div>

    <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${confidence}%`, background: 'var(--primary-green)' }} />
    </div>
  </div>
);

const VarietyRecommendation = () => {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2>Recommended Varieties</h2>
        <p style={{ opacity: 0.7 }}>AI Based on Your Field Conditions</p>
      </header>

      <div>
        <VarietyCard name="Samba" duration="120-135" yield="4.8 - 5.5" water="Medium" confidence={92} />
        <VarietyCard name="Nadu" duration="115-120" yield="4.5 - 5.0" water="Medium" confidence={88} />
        <VarietyCard name="Keeri Samba" duration="130-135" yield="5.0 - 5.8" water="Medium-High" confidence={85} />
        <VarietyCard name="Bg 357" duration="110-115" yield="4.0 - 4.8" water="Low-Medium" confidence={80} />
      </div>

      <div style={{ 
        background: 'rgba(245, 158, 11, 0.05)', 
        padding: '1rem', 
        borderRadius: '16px', 
        border: '1px dashed var(--accent-yellow)',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}>
        <Info size={20} color="var(--accent-yellow)" />
        <p style={{ fontSize: '0.8rem' }}><strong>AI Tip:</strong> Samba variety is best suitable for your soil and climate conditions during this Yala season.</p>
      </div>
    </div>
  );
};

export default VarietyRecommendation;
