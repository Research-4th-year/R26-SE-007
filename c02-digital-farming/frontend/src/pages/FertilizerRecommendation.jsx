import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Droplets,
  Leaf,
  Sparkles,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import { getLatestData } from '../services/api';
import { FERTILIZER_GUIDE } from '../data/fertilizerGuideData';

const defaultNpk = { N: 55, P: 35, K: 45 };
const defaultSensorState = {
  temperature: 28.5,
  humidity: 75,
  rain: 5,
  soil1: 40,
  soil2: 45,
};

const getNpkStatus = (npk) => {
  if (!npk) return { primary: 'balanced', label: 'Balanced', color: '#16a34a' };
  const values = [
    { key: 'N', label: 'Nitrogen', threshold: 50 },
    { key: 'P', label: 'Phosphorus', threshold: 30 },
    { key: 'K', label: 'Potassium', threshold: 30 },
  ];

  const lowest = values.reduce((best, current) => {
    const currentValue = npk[current.key] ?? 0;
    const bestValue = npk[best.key] ?? 0;
    return currentValue < bestValue ? current : best;
  });

  if (lowest.key === 'N' && npk.N < 50) {
    return { primary: 'nitrogen', label: 'Low Nitrogen', color: '#f59e0b' };
  }
  if (lowest.key === 'P' && npk.P < 30) {
    return { primary: 'phosphorus', label: 'Low Phosphorus', color: '#dc2626' };
  }
  if (lowest.key === 'K' && npk.K < 30) {
    return { primary: 'potassium', label: 'Low Potassium', color: '#2563eb' };
  }
  return { primary: 'balanced', label: 'Balanced', color: '#16a34a' };
};

const FertilizerRecommendation = () => {
  const [latestData, setLatestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getLatestData();
        setLatestData(result);
      } catch (err) {
        setError('Live farm data is temporarily unavailable. Showing the expert baseline instead.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const npk = latestData?.predictions?.npk || defaultNpk;
  const sensors = latestData?.sensors || defaultSensorState;
  const yieldPrediction = latestData?.predictions?.yield_prediction_kg_per_ha || 4200;
  const backendAdvice = latestData?.recommendations?.fertilizer || 'Maintain balanced feeding and monitor leaf color weekly.';
  const npkStatus = useMemo(() => getNpkStatus(npk), [npk]);

  const fertilizerCards = FERTILIZER_GUIDE.map((item) => {
    const nutrientValue = npk[item.id === 'urea' ? 'N' : item.id === 'tsp' ? 'P' : 'K'];
    const baseDose = Number(item.historicalDose.split('–')[0].replace(/[^0-9.]/g, ''));
    const adjustedDose = nutrientValue < (item.id === 'urea' ? 50 : 30)
      ? Math.round(baseDose * 1.15)
      : Math.round(baseDose * 0.95);

    return {
      ...item,
      adjustedDose,
      nutrientValue,
      priority: nutrientValue < (item.id === 'urea' ? 50 : 30) ? 'High priority' : 'Supportive',
    };
  });

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <header className="glass-panel" style={{ padding: '1.5rem 1.25rem', background: 'linear-gradient(135deg, rgba(22, 101, 52, 0.14), rgba(16, 185, 129, 0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.7rem' }}>
          <div style={{ background: 'rgba(22, 101, 52, 0.12)', padding: '0.7rem', borderRadius: '999px' }}>
            <Sprout size={20} color="#15803d" />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--current-text-sec)' }}>
              Smart Fertilizer Expert Guide
            </p>
            <h2 style={{ fontSize: '1.65rem', margin: '0.15rem 0 0' }}>Farmer-first nutrition guidance for healthy paddy fields</h2>
          </div>
        </div>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '860px', opacity: 0.9 }}>
          This view combines historical guidance, live field readings and the trained NPK model to recommend the best fertilizer actions for the current season.
        </p>
      </header>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem 1.25rem', border: '1px solid rgba(245, 158, 11, 0.35)', background: 'rgba(254, 240, 138, 0.16)' }}>
          <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
            <AlertTriangle size={18} color="#b45309" />
            <p style={{ fontSize: '0.9rem', margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      <section style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="glass-panel" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.4rem' }}>
            <GaugeIcon />
            <span style={{ fontSize: '0.74rem', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--current-text-sec)' }}>LIVE SOIL SNAPSHOT</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{npkStatus.label}</h3>
          <p style={{ fontSize: '0.92rem', opacity: 0.8 }}>N {npk.N} · P {npk.P} · K {npk.K}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.4rem' }}>
            <Droplets size={16} color="#0f766e" />
            <span style={{ fontSize: '0.74rem', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--current-text-sec)' }}>WEATHER INPUT</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{sensors.temperature}°C / {sensors.humidity}% RH</h3>
          <p style={{ fontSize: '0.92rem', opacity: 0.8 }}>Rainfall: {sensors.rain} mm and soil moisture is {sensors.soil1}% / {sensors.soil2}%.</p>
        </div>
        <div className="glass-panel" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.4rem' }}>
            <TrendingUp size={16} color="#7c3aed" />
            <span style={{ fontSize: '0.74rem', fontWeight: '700', letterSpacing: '0.12em', color: 'var(--current-text-sec)' }}>MODEL YIELD</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.35rem' }}>{Math.round(yieldPrediction)} kg/ha</h3>
          <p style={{ fontSize: '0.92rem', opacity: 0.8 }}>This estimate helps decide whether to prioritize growth or grain-fill nutrition.</p>
        </div>
      </section>

      <section className="glass-panel" style={{ padding: '1.1rem 1.15rem', border: `1px solid ${npkStatus.color}33`, background: `${npkStatus.color}0d` }}>
        <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
          <Sparkles size={22} color={npkStatus.color} />
          <div>
            <h3 style={{ marginBottom: '0.3rem', color: npkStatus.color }}>Current recommendation</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              {loading ? 'Updating fertilizer guidance from the latest field analysis...' : `${backendAdvice} ${npkStatus.label === 'Balanced' ? 'Continue monitoring and keep the current nutrition balance.' : `Focus your next application on ${npkStatus.label.toLowerCase()} support.`}`}
            </p>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '1rem' }}>
        {fertilizerCards.map((item) => (
          <article key={item.id} className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'minmax(160px, 220px) 1fr', gap: '1rem', padding: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem' }}>
              <img src={`/images/${item.image}`} alt={item.name} style={{ width: '100%', maxWidth: '160px', borderRadius: '16px', objectFit: 'cover', boxShadow: '0 10px 35px rgba(0,0,0,0.16)' }} />
              <span style={{ padding: '0.35rem 0.7rem', borderRadius: '999px', background: `${item.accent}16`, color: item.accent, fontWeight: '700', fontSize: '0.8rem' }}>
                {item.priority}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: '0.15rem' }}>{item.name}</h3>
                  <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--current-text-sec)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.formula}</p>
                </div>
                <div style={{ background: `${item.accent}14`, color: item.accent, fontWeight: '800', padding: '0.4rem 0.7rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                  {item.adjustedDose} kg/ha
                </div>
              </div>

              <p style={{ fontSize: '0.94rem', lineHeight: 1.6, margin: 0 }}>{item.purpose}</p>
              <div style={{ display: 'grid', gap: '0.7rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '12px', padding: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem', color: 'var(--current-text-sec)' }}>
                    <CalendarDays size={14} />
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Best period</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600' }}>{item.bestWindow}</p>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: '12px', padding: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem', color: 'var(--current-text-sec)' }}>
                    <Leaf size={14} />
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Why it matters</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600' }}>{item.note}</p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="glass-panel" style={{ padding: '1rem 1.1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
          <CalendarDays size={16} color="#0f766e" />
          <h3 style={{ margin: 0 }}>Practical schedule for the week</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--current-border)' }}>
                <th style={{ padding: '0.75rem' }}>Stage</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
                <th style={{ padding: '0.75rem' }}>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--current-border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: '700' }}>Land preparation</td>
                <td style={{ padding: '0.75rem' }}>Apply TSP and part of MOP</td>
                <td style={{ padding: '0.75rem' }}>Improves early root anchoring and steady growth.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--current-border)' }}>
                <td style={{ padding: '0.75rem', fontWeight: '700' }}>Vegetative stage</td>
                <td style={{ padding: '0.75rem' }}>Use Urea in split doses</td>
                <td style={{ padding: '0.75rem' }}>Supports leaf vigor and canopy development.</td>
              </tr>
              <tr>
                <td style={{ padding: '0.75rem', fontWeight: '700' }}>Panicle / grain fill</td>
                <td style={{ padding: '0.75rem' }}>Finish MOP and protect the grain filling phase</td>
                <td style={{ padding: '0.75rem' }}>Helps grain quality and better stress tolerance.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const GaugeIcon = () => <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '0.4rem', borderRadius: '999px' }}><Sprout size={16} color="#0f766e" /></div>;

export default FertilizerRecommendation;
