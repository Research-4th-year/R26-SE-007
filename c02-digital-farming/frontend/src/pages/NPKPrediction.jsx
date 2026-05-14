import React, { useState, useEffect } from 'react';
import { Beaker, TrendingUp, Info, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getLatestData } from '../services/api';

const NutrientCircle = ({ label, value, color, status }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
    <div style={{ 
      width: '80px', 
      height: '80px', 
      borderRadius: '50%', 
      border: `4px solid ${color}20`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{ 
        position: 'absolute', 
        inset: '0', 
        borderRadius: '50%', 
        border: `4px solid ${color}`, 
        clipPath: `inset(0 0 ${100 - value}% 0)` // Simple mock gauge
      }} />
      <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--current-text-sec)' }}>{label}</span>
      <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>{value}%</span>
    </div>
    <span style={{ fontSize: '0.7rem', color: color, fontWeight: '600' }}>{status}</span>
  </div>
);

const NPKPrediction = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestData().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const mockTrend = [
    { name: 'Apr 20', n: 60, p: 40, k: 70 },
    { name: 'May 05', n: 65, p: 38, k: 72 },
    { name: 'May 18', n: 68, p: 35, k: 72 },
  ];

  if (loading) return <div>Loading...</div>;

  const npk = data?.predictions?.npk || { N: 68, P: 38, K: 72 };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
           <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
              <Beaker color="#3b82f6" />
           </div>
           <div>
              <h2>Predicted NPK Status</h2>
              <p style={{ opacity: 0.7 }}>AI Based Soil Nutrient Analysis</p>
           </div>
        </div>
      </header>

      {/* Nutrient Gauges */}
      <section className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1.5rem' }}>
          <NutrientCircle label="NITROGEN" value={npk.N} color="#3b82f6" status="Optimal" />
          <NutrientCircle label="PHOSPHORUS" value={npk.P} color="#ef4444" status="Low" />
          <NutrientCircle label="POTASSIUM" value={npk.K} color="#10b981" status="Good" />
        </div>
        
        <div style={{ 
          background: 'rgba(0,0,0,0.03)', 
          padding: '1rem', 
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
           <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>Soil Health Score</p>
              <p style={{ fontSize: '1.25rem', fontWeight: '800' }}>78 <span style={{ fontSize: '0.8rem', fontWeight: '500' }}>/ 100</span></p>
           </div>
           <span className="badge badge-success">Good</span>
        </div>
      </section>

      {/* Nutrient Trend Chart */}
      <section>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <h3>Nutrient Trend <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--current-text-sec)' }}>(Last 30 Days)</span></h3>
          <TrendingUp size={18} color="var(--primary-green)" />
        </div>
        <div className="glass-panel" style={{ padding: '1rem', height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line type="monotone" dataKey="n" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="p" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="k" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* AI Confidence */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.6 }}>
        <Activity size={16} />
        <span style={{ fontSize: '0.75rem' }}>AI Confidence: 86% based on field sensors & model</span>
      </div>
    </div>
  );
};

export default NPKPrediction;
