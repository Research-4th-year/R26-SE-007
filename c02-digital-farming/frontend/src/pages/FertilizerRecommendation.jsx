import React from 'react';
import { Beaker, Calendar, Clock, AlertCircle, ArrowDown } from 'lucide-react';

const FertilizerBag = ({ name, formula, dosage, timing, instructions, color, icon: Icon }) => (
  <div className="glass-panel" style={{ 
    padding: '1.5rem', 
    marginBottom: '1.5rem', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '1.25rem',
    borderTop: `8px solid ${color}`,
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Realistic Background Pattern Mock */}
    <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05 }}>
       <Icon size={120} color={color} />
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: color }}>{name}</h3>
        <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--current-text-sec)', letterSpacing: '1px' }}>{formula}</p>
      </div>
      <div style={{ 
        background: `${color}15`, 
        padding: '0.5rem 1rem', 
        borderRadius: '20px',
        color: color,
        fontWeight: '800',
        fontSize: '0.9rem'
      }}>
        {dosage} Kg / Ha
      </div>
    </div>

    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
       <div style={{ flex: 1, minWidth: '140px', background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--current-text-sec)' }}>
             <Clock size={16} />
             <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>BEST TIMING</span>
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{timing}</p>
       </div>
       <div style={{ flex: 1, minWidth: '140px', background: 'rgba(0,0,0,0.03)', padding: '1rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--current-text-sec)' }}>
             <Beaker size={16} />
             <span style={{ fontSize: '0.7rem', fontWeight: '700' }}>DOSAGE PLAN</span>
          </div>
          <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Split Application</p>
       </div>
    </div>

    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed var(--current-border)' }}>
       <p style={{ fontSize: '0.85rem', lineHeight: '1.6', opacity: 0.8 }}>
          <strong>How to apply:</strong> {instructions}
       </p>
    </div>
  </div>
);

const FertilizerRecommendation = () => {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2 style={{ fontSize: '1.75rem' }}>Fertilizer Expert Guide</h2>
        <p style={{ opacity: 0.7 }}>Personalized dosage based on soil NPK status</p>
      </header>

      {/* Bag Grid */}
      <section>
        <FertilizerBag 
          name="UREA" 
          formula="46-0-0 (Nitrogen Source)" 
          dosage="75" 
          timing="14-21 Days after sowing" 
          instructions="Broadcast uniformly across the field. Best applied when the soil is moist but not flooded. Apply in the early morning."
          color="#3b82f6"
          icon={Beaker}
        />
        <FertilizerBag 
          name="TSP" 
          formula="0-46-0 (Phosphorus Source)" 
          dosage="50" 
          timing="Basal Application" 
          instructions="Mix with soil during final land preparation (mudding). This helps in strong root development early on."
          color="#ef4444"
          icon={Beaker}
        />
        <FertilizerBag 
          name="MOP" 
          formula="0-0-60 (Potassium Source)" 
          dosage="40" 
          timing="Panicle Initiation stage" 
          instructions="Helps in grain filling and disease resistance. Apply near the stems for better absorption."
          color="#10b981"
          icon={Beaker}
        />
      </section>

      {/* Nutrient Deficiency Warning */}
      <section className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid #f59e0b' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
           <AlertCircle color="#f59e0b" />
           <div>
              <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>Nutrient Warning</h4>
              <p style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
                 Your field currently shows **Low Phosphorus (P)**. Please prioritize **TSP application** to avoid stunted growth in the next stage.
              </p>
           </div>
        </div>
      </section>

      {/* Simple Table for quick reference */}
      <section>
         <h3 style={{ marginBottom: '1rem' }}>Dosage Summary Table</h3>
         <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
               <thead>
                  <tr style={{ borderBottom: '1px solid var(--current-border)', textAlign: 'left' }}>
                     <th style={{ padding: '0.75rem' }}>Fertilizer</th>
                     <th style={{ padding: '0.75rem' }}>Amount</th>
                     <th style={{ padding: '0.75rem' }}>Timing</th>
                  </tr>
               </thead>
               <tbody>
                  <tr style={{ borderBottom: '1px solid var(--current-border)' }}>
                     <td style={{ padding: '0.75rem', fontWeight: '700' }}>Urea</td>
                     <td style={{ padding: '0.75rem' }}>75 Kg</td>
                     <td style={{ padding: '0.75rem' }}>Tillering</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--current-border)' }}>
                     <td style={{ padding: '0.75rem', fontWeight: '700' }}>TSP</td>
                     <td style={{ padding: '0.75rem' }}>50 Kg</td>
                     <td style={{ padding: '0.75rem' }}>Basal</td>
                  </tr>
                  <tr>
                     <td style={{ padding: '0.75rem', fontWeight: '700' }}>MOP</td>
                     <td style={{ padding: '0.75rem' }}>40 Kg</td>
                     <td style={{ padding: '0.75rem' }}>PI Stage</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </section>
    </div>
  );
};

export default FertilizerRecommendation;
