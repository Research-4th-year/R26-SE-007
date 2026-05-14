import React, { useState, useEffect } from 'react';
import { getLatestData } from '../services/api';
import { Thermometer, Droplets, CloudRain, Sun, Activity, Sprout, Info, CheckCircle, AlertTriangle, TrendingUp, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '../components/ErrorBoundary';

const DashboardContent = () => {
  const { t } = useTranslation();
  
  // Load initial data from localStorage if available (for offline support)
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('smart_paddy_last_data');
    return saved ? JSON.parse(saved) : {
      sensors: { temperature: 0, humidity: 0, soil1: 0, soil2: 0, rain: 1, light: 0 },
      predictions: { yield_prediction_kg_per_ha: 0, npk: { N: 0, P: 0, K: 0 } },
      recommendations: { water_action: 'Connecting...', fertilizer: 'Please wait...' },
      disease_category: 'Checking...'
    };
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let unsub;

    // 1. Initial API Fetch
    const fetchInitial = async () => {
      try {
        const res = await getLatestData();
        if (mounted && res) {
          setData(prev => {
            const newData = { ...prev, ...res };
            localStorage.setItem('smart_paddy_last_data', JSON.stringify(newData));
            return newData;
          });
        }
      } catch (e) {
        console.warn("Dashboard: Could not fetch latest data, using offline cache.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInitial();

    // 2. Real-time Firebase Listeners
    import('firebase/database').then(({ ref, onValue }) => {
      import('../firebase').then(({ db }) => {
        if (!mounted) return;
        const sensorRef = ref(db, 'sensor');
        unsub = onValue(sensorRef, (snapshot) => {
          const val = snapshot.val();
          if (mounted && val) {
            setData(prev => {
              const newData = { ...prev, sensors: { ...prev.sensors, ...val } };
              localStorage.setItem('smart_paddy_last_data', JSON.stringify(newData));
              return newData;
            });
          }
        });
      });
    });

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, []);

  const { sensors, predictions, recommendations, disease_category } = data;

  // Calculate Average Soil Moisture
  const avgSoil = Math.round((Number(sensors?.soil1 || 0) + Number(sensors?.soil2 || 0)) / 2);
  
  // Convert yield to Kg
  const yieldKg = Math.round(predictions?.yield_prediction_kg_per_ha || 5200);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. TOP STATUS BANNER */}
      <div className="glass-panel" style={{ 
        padding: '1.25rem', 
        background: disease_category === 'Healthy' ? 'linear-gradient(135deg, #006D32 0%, #004d23 100%)' : 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        borderRadius: '16px'
      }}>
        {disease_category === 'Healthy' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
        <div>
           <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{disease_category === 'Healthy' ? 'Field Status: Healthy' : 'Action Required'}</h2>
           <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>AI Monitoring Active • Real-time Sync</p>
        </div>
      </div>

      {/* 2. PREDICTED HARVEST */}
      <section>
        {/* <div className="glass-panel" style={{ 
          padding: '2.5rem 1.5rem', 
          textAlign: 'center', 
          background: 'linear-gradient(rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          border: '1px solid var(--current-border)',
          borderRadius: '24px',
          boxShadow: '0 10px 30px -10px rgba(0, 109, 50, 0.2)'
        }}>
           <div style={{ 
             background: 'rgba(0, 109, 50, 0.1)', 
             width: '60px', 
             height: '60px', 
             borderRadius: '50%', 
             display: 'flex', 
             alignItems: 'center', 
             justifyContent: 'center',
             margin: '0 auto 1.5rem'
           }}>
              <TrendingUp size={32} color="var(--primary-green)" />
           </div>
           <p style={{ fontSize: '0.9rem', color: 'var(--current-text-sec)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Expected Harvest
           </p>
           <h2 style={{ fontSize: '4.5rem', fontWeight: '900', color: 'var(--primary-green)', lineHeight: 1, margin: '0.5rem 0' }}>
              {yieldKg.toLocaleString()} 
              <span style={{ fontSize: '1.5rem', fontWeight: '700', marginLeft: '0.5rem' }}>Kg</span>
           </h2>
           <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>Estimated yield for your 1 Hectare field</p>
        </div> */}
      </section>

      {/* 3. LIVE SENSORS */}
      <section>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
           <h3>Field Conditions</h3>
           <span style={{ fontSize: '0.75rem', color: 'var(--primary-green)', fontWeight: '700' }}>LIVE UPDATING</span>
        </div>
        <div className="grid-2">
           <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px' }}><Thermometer size={24} color="#ef4444" /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>Temperature</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800' }}>{sensors?.temperature || 0}°C</p>
              </div>
           </div>
           <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}><Wind size={24} color="#10b981" /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>Humidity</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800' }}>{sensors?.humidity || 0}%</p>
              </div>
           </div>
           <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}><Droplets size={24} color="#3b82f6" /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>Soil Moisture</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800' }}>{avgSoil}%</p>
              </div>
           </div>
           <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}><Sun size={24} color="#f59e0b" /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>Light</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800' }}>{sensors?.light || 0} lx</p>
              </div>
           </div>
           <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', gridColumn: 'span 2' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}><CloudRain size={24} color="#8b5cf6" /></div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>Rain Status</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '800' }}>{sensors?.rain === 0 ? 'Raining' : 'No Rain'}</p>
              </div>
           </div>
        </div>
      </section>

      {/* 4. EXPERT RECOMMENDATION BANNER */}
      <section style={{ marginBottom: '1rem' }}>
        <div className="glass-panel" style={{ 
          padding: '1.25rem', 
          borderLeft: '6px solid var(--primary-green)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
           <Info size={24} color="var(--primary-green)" />
           <div>
              <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary-green)' }}>Farmer Action Guide</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
                 {recommendations?.water_action || 'Sensors show optimal conditions. No immediate irrigation needed.'}
              </p>
              <div style={{ 
                marginTop: '1rem', 
                padding: '0.75rem', 
                background: 'rgba(0, 109, 50, 0.05)', 
                borderRadius: '8px',
                fontSize: '0.85rem'
              }}>
                 <strong>Fertilizer:</strong> {recommendations?.fertilizer || 'Checking nutrient levels...'}
              </div>
           </div>
        </div>
      </section>

    </div>
  );
};

const Dashboard = () => (
  <ErrorBoundary>
    <DashboardContent />
  </ErrorBoundary>
);

export default Dashboard;
