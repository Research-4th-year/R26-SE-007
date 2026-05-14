import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sprout, Beaker, ClipboardList, ChevronRight, Info } from 'lucide-react';

const AdvisorStep = ({ to, icon: Icon, color, title, desc, step }) => (
  <NavLink to={to} className="glass-panel" style={{ 
    padding: '1.5rem', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '1.25rem', 
    textDecoration: 'none', 
    color: 'inherit',
    borderLeft: `6px solid ${color}`
  }}>
    <div style={{ 
      width: '40px', 
      height: '40px', 
      borderRadius: '50%', 
      background: color, 
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '900',
      flexShrink: 0
    }}>
      {step}
    </div>
    <div style={{ flex: 1 }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{title}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--current-text-sec)' }}>{desc}</p>
    </div>
    <Icon size={24} color={color} style={{ opacity: 0.5 }} />
  </NavLink>
);

const AITools = () => {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2>Farmer Advisory Guidance</h2>
        <p style={{ opacity: 0.7 }}>Personalized cultivation plan based on your field</p>
      </header>

      {/* Seasonal Flow */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AdvisorStep 
          step="1"
          to="/ai/variety" 
          icon={Sprout} 
          color="#10b981" 
          title="Seed & Variety Selection" 
          desc="Choose the most resilient paddy for your soil type." 
        />
        <AdvisorStep 
          step="2"
          to="/ai/npk" 
          icon={Beaker} 
          color="#3b82f6" 
          title="Soil Nutrient Analysis" 
          desc="Real-time check of your field's chemical health." 
        />
        <AdvisorStep 
          step="3"
          to="/ai/yield" 
          icon={ClipboardList} 
          color="#f59e0b" 
          title="Farmer Advisory Guidance" 
          desc="Full cultivation roadmap from land prep to harvest." 
        />
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', gap: '1rem' }}>
         <Info size={20} color="#3b82f6" />
         <p style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
            <strong>How it works:</strong> our system uses your land size and season inputs to generate a data-driven flow for your crop.
         </p>
      </div>

      <section>
         <h3 style={{ marginBottom: '1rem' }}>Instant Tools</h3>
         <NavLink to="/disease" className="btn btn-primary" style={{ width: '100%', padding: '1.25rem', gap: '0.75rem' }}>
            Open Disease Scanner
         </NavLink>
      </section>
    </div>
  );
};

export default AITools;
