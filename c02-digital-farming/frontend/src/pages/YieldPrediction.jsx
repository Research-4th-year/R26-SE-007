import React, { useState, useEffect } from 'react';
import { Map, Zap, Cpu, TrendingUp, Loader, CheckCircle, Info, Sprout, Beaker, Clock, Droplets, Tractor, Target, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { autoPredict, getLatestData } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

const AgriCard = ({ icon: Icon, title, content, color, gradient, stage, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="glass-panel fade-in" style={{ 
      marginBottom: '1rem',
      borderRadius: '24px',
      border: 'none',
      background: `linear-gradient(135deg, ${gradient[0]} 0%, ${gradient[1]} 100%)`,
      color: 'white',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: isOpen ? '0 12px 40px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Background Decorative Icon */}
      <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
         <Icon size={100} />
      </div>

      {/* Header (Clickable) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          padding: '1.25rem 1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          cursor: 'pointer',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '16px', 
          background: 'rgba(255,255,255,0.2)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <Icon size={24} />
        </div>
        <div style={{ flex: 1 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: '800', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '8px', textTransform: 'uppercase' }}>
                 Stage {stage}
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '800' }}>{title}</h4>
           </div>
        </div>
        {isOpen ? <ChevronUp size={24} opacity={0.7} /> : <ChevronDown size={24} opacity={0.7} />}
      </div>

      {/* Content (Collapsible) */}
      <div style={{ 
        maxHeight: isOpen ? '500px' : '0',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: isOpen ? '0 1.5rem 1.5rem 1.5rem' : '0 1.5rem',
        opacity: isOpen ? 1 : 0,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ 
          fontSize: '0.95rem', 
          lineHeight: '1.6', 
          opacity: 0.95,
          background: 'rgba(0,0,0,0.1)',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {content}
        </div>
      </div>
    </div>
  );
};

const AdvisoryGuidanceContent = () => {
  const [loading, setLoading] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showFlow, setShowFlow] = useState(false);

  // Form State
  const [landSize, setLandSize] = useState('1');
  const [unit, setUnit] = useState('hectare');
  const [season, setSeason] = useState('Maha');

  useEffect(() => {
    getLatestData().then(res => {
      if (res && res.sensors) setSensorData(res.sensors);
    }).catch(() => {
      const saved = localStorage.getItem('smart_paddy_last_data');
      if (saved) setSensorData(JSON.parse(saved).sensors);
    });
  }, []);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const areaHectares = unit === 'perch' ? Number(landSize) / 395.36 : Number(landSize);
      const payload = {
        field_area_hectares: areaHectares,
        season: season,
        sensor_data: sensorData || { temperature: 29, humidity: 75, soil1: 45, soil2: 40, light: 850, rain: 1 }
      };
      const response = await autoPredict(payload);
      setResult(response);
      setShowFlow(true);
    } catch (err) {
      setError("Analysis failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sprout color="#006D32" size={32} />
          Farmer Advisory Guidance
        </h2>
        <p style={{ opacity: 0.7 }}>Cultivation roadmap for your specific field</p>
      </header>

      {!showFlow ? (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', borderTop: '8px solid var(--primary-green)' }}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
             <Map size={64} color="var(--primary-green)" style={{ marginBottom: '1rem' }} />
             <h3>Your Field Details</h3>
             <p style={{ opacity: 0.6 }}>Tell us about your land to begin the journey</p>
          </div>

          <div className="input-group">
            <label>Field Size</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
               <input 
                 type="number" 
                 className="input-field" 
                 style={{ flex: 1 }} 
                 value={landSize} 
                 onChange={(e) => setLandSize(e.target.value)} 
               />
               <select className="input-field" style={{ width: '130px' }} value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="hectare">Hectares</option>
                  <option value="perch">Perches</option>
               </select>
            </div>
          </div>

          <div className="input-group">
            <label>Current Season (කන්නය)</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
               <button onClick={() => setSeason('Maha')} className={`btn ${season === 'Maha' ? 'btn-primary' : ''}`} style={{ flex: 1, padding: '1rem', background: season === 'Maha' ? 'var(--primary-green)' : 'rgba(0,0,0,0.05)', color: season === 'Maha' ? 'white' : 'inherit' }}>Maha (මහ)</button>
               <button onClick={() => setSeason('Yala')} className={`btn ${season === 'Yala' ? 'btn-primary' : ''}`} style={{ flex: 1, padding: '1rem', background: season === 'Yala' ? 'var(--primary-green)' : 'rgba(0,0,0,0.05)', color: season === 'Yala' ? 'white' : 'inherit' }}>Yala (යල)</button>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', padding: '1.5rem', fontSize: '1.1rem' }} onClick={handlePredict} disabled={loading}>
            {loading ? <Loader className="animate-spin" /> : "Start Agricultural Journey"}
          </button>
        </div>
      ) : (
        <div className="fade-in">
           {/* Harvest Summary Card */}
           <div className="glass-panel" style={{ 
             padding: '2.5rem 1.5rem', 
             marginBottom: '2rem', 
             background: 'linear-gradient(135deg, #006D32 0%, #004d23 100%)',
             color: 'white',
             textAlign: 'center',
             borderRadius: '32px',
             position: 'relative'
           }}>
              <div style={{ position: 'absolute', top: '15px', left: '15px', opacity: 0.2 }}><TrendingUp size={48} /></div>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '2px' }}>Total Expected Harvest</p>
              <h2 style={{ fontSize: '4rem', fontWeight: '900', margin: '0.5rem 0', lineHeight: 1 }}>
                 {Math.round(result.yield_prediction_kg_per_ha * (unit === 'perch' ? Number(landSize) / 395.36 : Number(landSize))).toLocaleString()} 
                 <span style={{ fontSize: '1.5rem', fontWeight: '700', marginLeft: '0.5rem' }}>Kg</span>
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', opacity: 0.8, fontSize: '0.85rem' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Map size={16}/> {landSize} {unit}s</span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={16}/> {season} Season</span>
              </div>
           </div>

           {/* Dropdown Flow */}
           <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AgriCard 
                stage="1"
                defaultOpen={true}
                icon={Sprout}
                title="Paddy Variety Selection"
                gradient={['#10b981', '#059669']}
                content={
                  <>
                    For your <strong>Loam soil</strong>, AI recommends <strong>Red Rice (Rathu Kekulu)</strong>. 
                    This variety is highly resilient to current climate patterns in your area and has a high yield potential.
                  </>
                }
              />
              <AgriCard 
                stage="2"
                icon={Tractor}
                title="Land Preparation"
                gradient={['#78350f', '#451a03']}
                content={
                  <>
                    Start mudding <strong>2 weeks before sowing</strong>. Use <strong>TSP Fertilizer (50kg)</strong> as a 
                    basal application during the final land preparation for optimal root development.
                  </>
                }
              />
              <AgriCard 
                stage="3"
                icon={Beaker}
                title="Nutrient Management"
                gradient={['#3b82f6', '#1d4ed8']}
                content={
                  <>
                    Soil NPK status is <strong>Moderate</strong>. Schedule <strong>Urea application (75kg)</strong> 
                    exactly <strong>3 weeks after sowing</strong> to boost tillering and vegetative growth.
                  </>
                }
              />
              <AgriCard 
                stage="4"
                icon={Droplets}
                title="Water Management"
                gradient={['#06b6d4', '#0891b2']}
                content={
                  <>
                    Keep level at <strong>2 inches</strong> during vegetative stage. AI expects 
                    intermittent showers; monitor rain sensors to save irrigation water.
                  </>
                }
              />
              <AgriCard 
                stage="5"
                icon={Target}
                title="Harvesting Goal"
                gradient={['#f59e0b', '#d97706']}
                content={
                  <>
                    Your target is <strong>{Math.round(result.yield_prediction_kg_per_ha).toLocaleString()} kg/ha</strong>. 
                    Harvest when <strong>85-90%</strong> of panicles turn straw-colored for maximum grain quality.
                  </>
                }
              />
           </div>

           <button className="btn" style={{ width: '100%', marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(0,0,0,0.05)', fontWeight: '700' }} onClick={() => setShowFlow(false)}>
              Back to Field Setup
           </button>
        </div>
      )}

      {error && <div className="glass-panel" style={{ padding: '1rem', background: '#ef444410', color: '#ef4444', textAlign: 'center' }}>{error}</div>}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

const AdvisoryGuidance = () => (
  <ErrorBoundary>
    <AdvisoryGuidanceContent />
  </ErrorBoundary>
);

export default AdvisoryGuidance;
