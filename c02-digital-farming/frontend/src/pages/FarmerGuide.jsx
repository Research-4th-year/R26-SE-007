import React, { useState, useEffect } from 'react';
import { Cpu, Map, Droplet, Sprout, CheckCircle, ArrowRight, ArrowLeft, Loader, BarChart, Activity, Beaker, Search, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { autoPredict, getLatestData } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

const FarmerGuideContent = () => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [setupData, setSetupData] = useState({
    field_area_hectares: 1,
    season: 'Maha'
  });
  
  const [sensorData, setSensorData] = useState(null);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const data = await getLatestData();
        if (data && data.sensors) setSensorData(data.sensors);
        else setSensorData({ temperature: 29, humidity: 75, soil1: 45, soil2: 40, light: 850, rain: 1 });
      } catch (e) {
        setSensorData({ temperature: 29, humidity: 75, soil1: 45, soil2: 40, light: 850, rain: 1 });
      }
    };
    fetchSensors();
  }, []);

  const runAutoPredict = async () => {
    if (!sensorData) return;
    setIsAnalyzing(true);
    try {
      const payload = {
        field_area_hectares: setupData.field_area_hectares,
        season: setupData.season,
        sensor_data: sensorData
      };
      const result = await autoPredict(payload);
      setPlan(result);
      setStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const workflowSteps = [
    { id: 1, label: "IoT Device Field Analysis", desc: "Collect real-time field data", icon: Cpu },
    { id: 2, label: "AI Soil Condition Prediction", desc: "AI analyzes soil health", icon: Beaker },
    { id: 3, label: "Paddy Variety Recommendation", desc: "Best variety for your field", icon: Sprout },
    { id: 4, label: "Water Availability Analysis", desc: "Assess water resources", icon: Droplet },
    { id: 5, label: "Fertilizer Recommendation", desc: "Smart fertilizer suggestions", icon: Activity },
    { id: 6, label: "Disease Prevention Plan", desc: "Protect your crop", icon: Search },
    { id: 7, label: "Harvest & Yield Prediction", desc: "Predict your final yield", icon: TrendingUp },
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2 style={{ fontSize: '1.5rem' }}>Smart Farming Workflow</h2>
        <p style={{ opacity: 0.7 }}>AI + IoT Driven Process</p>
      </header>

      {step === 1 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {workflowSteps.map((s) => (
            <div key={s.id} className="glass-panel" style={{ 
              padding: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              borderLeft: s.id === 1 ? '4px solid var(--primary-green)' : '1px solid var(--current-border)'
            }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: s.id === 1 ? 'var(--primary-green)' : 'rgba(0,0,0,0.05)',
                color: s.id === 1 ? 'white' : 'var(--current-text-sec)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '800'
              }}>{s.id}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem', color: s.id === 1 ? 'var(--primary-green)' : 'inherit' }}>{s.label}</h4>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>{s.desc}</p>
              </div>
              <s.icon size={20} color={s.id === 1 ? 'var(--primary-green)' : 'var(--current-text-sec)'} />
            </div>
          ))}

          <div style={{ 
            background: 'rgba(0, 109, 50, 0.05)', 
            padding: '1.5rem', 
            borderRadius: '16px', 
            textAlign: 'center',
            marginTop: '1rem'
          }}>
            <Sprout size={40} color="var(--primary-green)" style={{ marginBottom: '1rem' }} />
            <h4 style={{ marginBottom: '0.5rem' }}>AI Working for Your Success</h4>
            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Minimal input. Maximum output. <br/> Smart farming made simple.</p>
            <button 
              className="btn btn-primary" 
              onClick={runAutoPredict} 
              disabled={isAnalyzing}
              style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}
            >
              {isAnalyzing ? <Loader className="animate-spin" /> : "Start Workflow Analysis"}
            </button>
          </div>
        </section>
      )}

      {step === 2 && plan && (
        <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', borderTop: '6px solid var(--primary-green)' }}>
              <CheckCircle size={64} color="var(--primary-green)" style={{ marginBottom: '1rem' }} />
              <h3>Analysis Complete</h3>
              <p style={{ opacity: 0.7 }}>Your smart cultivation plan is ready.</p>
           </div>

           <div className="grid-2">
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 <p style={{ fontSize: '0.8rem', color: 'var(--current-text-sec)' }}>Selected Variety</p>
                 <h4 style={{ fontSize: '1.25rem', color: 'var(--primary-green)' }}>{plan.variety_details.name}</h4>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                 <p style={{ fontSize: '0.8rem', color: 'var(--current-text-sec)' }}>Yield Prediction</p>
                 <h4 style={{ fontSize: '1.25rem', color: 'var(--primary-green)' }}>{plan.yield_prediction_kg_per_ha} kg/ha</h4>
              </div>
           </div>

           <button className="btn btn-primary" style={{ padding: '1.25rem' }} onClick={() => setStep(1)}>
              Restart Analysis
           </button>
        </section>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

const FarmerGuide = () => (
  <ErrorBoundary>
    <FarmerGuideContent />
  </ErrorBoundary>
);

export default FarmerGuide;
