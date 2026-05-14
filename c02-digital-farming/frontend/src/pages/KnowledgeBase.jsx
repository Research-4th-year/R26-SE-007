import React, { useState } from 'react';
import { Search, Info, AlertTriangle } from 'lucide-react';

const DiseaseItem = ({ name, scientific, type, risk }) => (
  <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
    <div style={{ 
      width: '60px', 
      height: '60px', 
      borderRadius: '12px', 
      background: 'rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
       {/* Placeholder for disease image */}
       <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #34d399 0%, #006D32 100%)', opacity: 0.2 }} />
    </div>
    <div style={{ flex: 1 }}>
      <div className="flex-between">
        <h4 style={{ fontSize: '0.95rem' }}>{name}</h4>
        <span style={{ 
          fontSize: '0.6rem', 
          fontWeight: '700', 
          color: risk === 'High Risk' ? '#ef4444' : '#f59e0b',
          background: risk === 'High Risk' ? '#ef444415' : '#f59e0b15',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>{risk}</span>
      </div>
      <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--current-text-sec)' }}>{scientific}</p>
      <p style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.7 }}>{type} Disease</p>
    </div>
  </div>
);

const KnowledgeBase = () => {
  const [search, setSearch] = useState('');

  const diseases = [
    { name: 'Brown Spot', scientific: 'Bipolaris oryzae', type: 'Fungal', risk: 'High Risk' },
    { name: 'Blast Disease', scientific: 'Magnaporthe oryzae', type: 'Fungal', risk: 'High Risk' },
    { name: 'Bacterial Leaf Blight', scientific: 'Xanthomonas oryzae', type: 'Bacterial', risk: 'High Risk' },
    { name: 'Leaf Smut', scientific: 'Entyloma oryzae', type: 'Fungal', risk: 'Medium Risk' },
    { name: 'Sheath Blight', scientific: 'Rhizoctonia solani', type: 'Fungal', risk: 'Medium Risk' },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2>Disease Knowledge Base</h2>
        <p style={{ opacity: 0.7 }}>Learn, Identify & Protect</p>
      </header>

      <div className="input-group">
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            type="text" 
            placeholder="Search diseases..." 
            className="input-field" 
            style={{ paddingLeft: '3rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
         {['All', 'Fungal', 'Bacterial', 'Viral', 'Nutrient'].map(filter => (
           <button key={filter} className="btn" style={{ 
             padding: '0.5rem 1rem', 
             fontSize: '0.8rem',
             background: filter === 'All' ? 'var(--primary-green)' : 'transparent',
             color: filter === 'All' ? 'white' : 'inherit',
             borderColor: filter === 'All' ? 'var(--primary-green)' : 'var(--current-border)'
           }}>
             {filter}
           </button>
         ))}
      </div>

      <div>
        {diseases.map((d, i) => (
          <DiseaseItem key={i} {...d} />
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBase;
