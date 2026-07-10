import React, { useState, useEffect } from 'react';
import {
  Cpu, Map, Sprout, CheckCircle, ArrowRight, ArrowLeft, Loader,
  TrendingUp, Sun, DollarSign, AlertTriangle, Thermometer,
  Droplets, CloudRain, Zap, Star, ChevronDown, ChevronUp, Beaker,
  Activity, Globe, Database, Wind, Shield
} from 'lucide-react';
import { recommendVariety, generateCultivationPlan } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

// ─── Static Data ───────────────────────────────────────────────────────────────

const DISTRICTS_BY_ZONE = {
  "Dry Zone": ["Anuradhapura", "Polonnaruwa", "Kurunegala", "Hambantota", "Monaragala", "Ampara", "Trincomalee"],
  "Wet Zone": ["Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Kalutara", "Colombo", "Ratnapura", "Kegalle", "Badulla"]
};

const DISTRICT_WEATHER = {
  Anuradhapura: { Yala: { temp: 32.5, humidity: 65, rain: 50, sun: 8.5 }, Maha: { temp: 28.0, humidity: 78, rain: 180, sun: 6.0 } },
  Polonnaruwa:  { Yala: { temp: 33.0, humidity: 63, rain: 45,  sun: 8.8 }, Maha: { temp: 27.5, humidity: 80, rain: 195, sun: 5.8 } },
  Kurunegala:   { Yala: { temp: 31.0, humidity: 72, rain: 110, sun: 7.5 }, Maha: { temp: 27.0, humidity: 82, rain: 160, sun: 6.2 } },
  Hambantota:   { Yala: { temp: 31.5, humidity: 70, rain: 40,  sun: 8.2 }, Maha: { temp: 28.5, humidity: 75, rain: 120, sun: 6.8 } },
  Monaragala:   { Yala: { temp: 32.0, humidity: 68, rain: 65,  sun: 8.0 }, Maha: { temp: 27.8, humidity: 80, rain: 170, sun: 6.0 } },
  Ampara:       { Yala: { temp: 33.2, humidity: 64, rain: 50,  sun: 8.6 }, Maha: { temp: 27.4, humidity: 82, rain: 210, sun: 5.5 } },
  Trincomalee:  { Yala: { temp: 34.0, humidity: 62, rain: 55,  sun: 8.9 }, Maha: { temp: 27.0, humidity: 84, rain: 220, sun: 5.4 } },
  Kandy:        { Yala: { temp: 27.5, humidity: 78, rain: 150, sun: 6.5 }, Maha: { temp: 24.5, humidity: 85, rain: 220, sun: 5.2 } },
  Matale:       { Yala: { temp: 29.0, humidity: 75, rain: 120, sun: 7.0 }, Maha: { temp: 25.5, humidity: 83, rain: 200, sun: 5.5 } },
  "Nuwara Eliya":{ Yala:{ temp: 19.0, humidity: 84, rain: 210, sun: 5.0 }, Maha: { temp: 15.5, humidity: 90, rain: 280, sun: 4.0 } },
  Galle:        { Yala: { temp: 29.5, humidity: 80, rain: 230, sun: 6.8 }, Maha: { temp: 27.0, humidity: 85, rain: 250, sun: 5.6 } },
  Matara:       { Yala: { temp: 29.8, humidity: 79, rain: 220, sun: 7.0 }, Maha: { temp: 27.2, humidity: 84, rain: 240, sun: 5.8 } },
  Kalutara:     { Yala: { temp: 29.0, humidity: 83, rain: 290, sun: 6.2 }, Maha: { temp: 26.5, humidity: 88, rain: 310, sun: 5.0 } },
  Colombo:      { Yala: { temp: 30.5, humidity: 77, rain: 200, sun: 7.2 }, Maha: { temp: 27.8, humidity: 82, rain: 240, sun: 6.0 } },
  Ratnapura:    { Yala: { temp: 28.5, humidity: 84, rain: 280, sun: 6.0 }, Maha: { temp: 25.8, humidity: 89, rain: 320, sun: 4.8 } },
  Kegalle:      { Yala: { temp: 28.8, humidity: 82, rain: 270, sun: 6.3 }, Maha: { temp: 26.0, humidity: 87, rain: 300, sun: 5.1 } },
  Badulla:      { Yala: { temp: 26.0, humidity: 76, rain: 110, sun: 7.0 }, Maha: { temp: 22.5, humidity: 84, rain: 190, sun: 5.5 } },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StepBadge = ({ num, active, done }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%',
    background: done ? '#10b981' : active ? 'var(--primary-green)' : 'rgba(0,0,0,0.1)',
    color: done || active ? '#fff' : 'var(--current-text-sec)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
    transition: 'all 0.3s ease'
  }}>
    {done ? <CheckCircle size={16} /> : num}
  </div>
);

const WeatherStat = ({ icon: Icon, label, value, color }) => (
  <div style={{
    flex: 1, minWidth: '45%', padding: '0.85rem 1rem',
    background: 'rgba(0,109,50,0.06)', borderRadius: 14,
    border: '1px solid rgba(0,109,50,0.12)', textAlign: 'center'
  }}>
    <Icon size={18} color={color || 'var(--primary-green)'} />
    <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 4 }}>{label}</div>
    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: color || 'var(--primary-green)' }}>{value}</div>
  </div>
);

const ScoreBar = ({ score }) => (
  <div style={{ marginTop: 6 }}>
    <div style={{ height: 6, borderRadius: 6, background: 'rgba(0,0,0,0.08)' }}>
      <div style={{
        height: '100%', borderRadius: 6,
        width: `${score}%`,
        background: score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444',
        transition: 'width 0.6s ease'
      }} />
    </div>
    <div style={{ fontSize: '0.72rem', marginTop: 3, opacity: 0.6 }}>{score}% match</div>
  </div>
);

const TimelineItem = ({ item, isLast }) => {
  const [open, setOpen] = useState(item.week === 'Week 0' || item.week === 'Week 1');
  return (
    <div style={{ display: 'flex', gap: '1rem', paddingBottom: isLast ? 0 : '0.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24 }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 4,
          background: 'var(--primary-green)', border: '2px solid rgba(0,109,50,0.3)'
        }} />
        {!isLast && <div style={{ width: 2, flex: 1, background: 'rgba(0,109,50,0.15)', marginTop: 4 }} />}
      </div>
      <div style={{
        flex: 1, marginBottom: '1rem', background: 'rgba(0,0,0,0.02)',
        borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden'
      }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-green)', textTransform: 'uppercase' }}>{item.week}</span>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.phase}</div>
          </div>
          {open ? <ChevronUp size={16} opacity={0.5} /> : <ChevronDown size={16} opacity={0.5} />}
        </div>
        {open && (
          <div style={{ padding: '0 1rem 0.75rem', fontSize: '0.85rem', opacity: 0.75, lineHeight: 1.6 }}>
            {item.action}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AdvisoryGuidanceContent = () => {
  const [step, setStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 inputs
  const [fieldArea, setFieldArea] = useState('1.5');
  const [unit, setUnit] = useState('hectare');
  const [season, setSeason] = useState('Maha');
  const [zone, setZone] = useState('Dry Zone');
  const [district, setDistrict] = useState('Anuradhapura');

  // Step 2 results
  const [recommendations, setRecommendations] = useState([]);
  const [topVariety, setTopVariety] = useState(null);

  // Step 3 results
  const [plan, setPlan] = useState(null);
  const [selectedVarietyName, setSelectedVarietyName] = useState('');

  // Sync district when zone changes
  useEffect(() => {
    const list = DISTRICTS_BY_ZONE[zone];
    if (list && !list.includes(district)) setDistrict(list[0]);
  }, [zone]);

  // Weather state
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoadingWeather(true);
      try {
        const response = await fetch(`http://localhost:8000/current-weather?district=${encodeURIComponent(district)}`);
        if (response.ok) {
          const data = await response.json();
          setWeatherInfo(data);
        }
      } catch (err) {
        console.error("Error loading weather details in YieldPrediction:", err);
      } finally {
        setLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [district]);

  const areaHectares = () => unit === 'perch' ? Number(fieldArea) / 395.36 : Number(fieldArea);

  const weather = DISTRICT_WEATHER[district]?.[season] || { temp: 28, humidity: 75, rain: 120, sun: 7 };

  // ── Step 1 → Step 2 ──
  const handleAnalyze = async () => {
    setError('');
    setAnalyzing(true);
    try {
      const res = await recommendVariety({
        season, zone, district,
        field_area_hectares: areaHectares()
      });
      if (res?.ranked_recommendations?.length) {
        setRecommendations(res.ranked_recommendations);
        setTopVariety(res.ranked_recommendations[0]);
        setStep(2);
      } else {
        setError('No recommendations returned. Check backend.');
      }
    } catch (e) {
      setError('Failed to connect to backend. Make sure the server is running on port 8000.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Step 2 → Step 3 ──
  const handleSelectVariety = async (variety) => {
    setError('');
    setPlanLoading(true);
    setSelectedVarietyName(variety.name || variety.id);
    try {
      const res = await generateCultivationPlan({
        variety: variety.id,
        season, district,
        field_area_hectares: areaHectares()
      });
      if (res) {
        setPlan(res);
        setStep(3);
      } else {
        setError('Failed to generate cultivation plan.');
      }
    } catch (e) {
      setError('Error generating plan. Check backend connection.');
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ── */}
      <header>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sprout color="#006D32" size={28} />
          Smart Cultivation Planner
        </h2>
        <p style={{ opacity: 0.6, marginTop: 4 }}>AI-Driven Paddy Variety Recommendation &amp; Cultivation Roadmap</p>
      </header>

      {/* ── Step Indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {[['1','Field Setup'], ['2','AI Recommendation'], ['3','Cultivation Plan']].map(([num, label], i) => (
          <React.Fragment key={num}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StepBadge num={num} active={step === i+1} done={step > i+1} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, display: 'none', opacity: step === i+1 ? 1 : 0.4 }}
                className="step-label">{label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i+1 ? '#10b981' : 'rgba(0,0,0,0.1)', transition: 'background 0.4s', borderRadius: 2 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* ══════════════════════════════════════
          STEP 1 — Field Parameters
      ══════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Input Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderTop: '6px solid var(--primary-green)' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Map size={20} color="var(--primary-green)" /> Field Details
            </h3>

            {/* Field Size */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label>Field Size</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="number" className="input-field" style={{ flex: 1 }}
                  value={fieldArea} onChange={e => setFieldArea(e.target.value)}
                />
                <select className="input-field" style={{ width: 130 }} value={unit} onChange={e => setUnit(e.target.value)}>
                  <option value="hectare">Hectares</option>
                  <option value="perch">Perches</option>
                </select>
              </div>
            </div>

            {/* Season */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label>Cultivation Season (කන්නය)</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {['Maha', 'Yala'].map(s => (
                  <button key={s} onClick={() => setSeason(s)} style={{
                    flex: 1, padding: '0.9rem',
                    background: season === s ? 'var(--primary-green)' : 'rgba(0,0,0,0.05)',
                    color: season === s ? '#fff' : 'inherit',
                    border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    {s === 'Maha' ? 'Maha (මහ)' : 'Yala (යල)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label>Agricultural Zone</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                {['Dry Zone', 'Wet Zone'].map(z => (
                  <button key={z} onClick={() => setZone(z)} style={{
                    flex: 1, padding: '0.9rem',
                    background: zone === z ? '#1d4ed8' : 'rgba(0,0,0,0.05)',
                    color: zone === z ? '#fff' : 'inherit',
                    border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>
                    {z}
                  </button>
                ))}
              </div>
            </div>

            {/* District */}
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>District (දිස්ත්‍රික්කය)</label>
              <select
                className="input-field" style={{ marginTop: '0.5rem', width: '100%' }}
                value={district} onChange={e => setDistrict(e.target.value)}
              >
                {DISTRICTS_BY_ZONE[zone].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '1.25rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? <Loader size={20} className="animate-spin" /> : <Cpu size={20} />}
              {analyzing ? 'Analyzing with AI...' : 'Run AI Variety Recommendation'}
            </button>
          </div>

          {/* Live Weather Preview */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid #10b981', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '1.1rem' }}>
              <Sun size={18} /> {district} — Weather Intelligence
            </h4>

            {/* Smart Weather Status Indicator */}
            {loadingWeather ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-green)' }}>
                <Loader className="animate-spin" size={14} />
                <span style={{ fontSize: '0.8rem' }}>Updating climate data...</span>
              </div>
            ) : (
              <div style={{
                background: weatherInfo?.weather?.source === 'IOT_DEVICE' ? 'rgba(16, 185, 129, 0.08)' : weatherInfo?.weather?.source === 'WEATHER_API' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${weatherInfo?.weather?.source === 'IOT_DEVICE' ? '#10b981' : weatherInfo?.weather?.source === 'WEATHER_API' ? '#3b82f6' : '#f59e0b'}`,
                padding: '0.5rem 0.75rem',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem'
              }}>
                {weatherInfo?.weather?.source === 'IOT_DEVICE' ? <Activity size={16} color="#10b981" /> : weatherInfo?.weather?.source === 'WEATHER_API' ? <Globe size={16} color="#3b82f6" /> : <Database size={16} color="#f59e0b" />}
                <div>
                  <strong style={{ display: 'block', color: 'var(--current-text)' }}>
                    {weatherInfo?.weather?.source === 'IOT_DEVICE' 
                      ? "📡 IoT Device Connected" 
                      : weatherInfo?.weather?.source === 'WEATHER_API' 
                        ? "🌐 WeatherAPI Backup Mode" 
                        : "📦 Offline Cache Mode"}
                  </strong>
                  <span style={{ opacity: 0.7, fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>
                    {weatherInfo?.weather?.source === 'IOT_DEVICE' 
                      ? "Real field measurements" 
                      : weatherInfo?.weather?.source === 'WEATHER_API' 
                        ? `Estimated weather for ${district}` 
                        : "Last successfully saved coordinates"}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <WeatherStat icon={Thermometer} label="Temperature" value={`${weatherInfo?.weather?.temperature || weather.temp}°C`} color="#ef4444" />
              <WeatherStat icon={Droplets} label="Humidity" value={`${weatherInfo?.weather?.humidity || weather.humidity}%`} color="#3b82f6" />
              <WeatherStat icon={CloudRain} label="Rainfall" value={`${weatherInfo?.weather?.rainfall || weather.rain}mm`} color="#6366f1" />
              <WeatherStat icon={Wind} label="Wind Speed" value={`${weatherInfo?.weather?.windSpeed || 10}km/h`} color="#f59e0b" />
            </div>

            {/* Disease risk forecasting summary */}
            {weatherInfo?.disease_risks && (
              <div style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--current-border)', padding: '0.85rem', borderRadius: '10px', fontSize: '0.8rem' }}>
                <span style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem', color: 'var(--current-text)' }}>
                  <Shield size={12} color="var(--primary-green)" />
                  Climate Disease Risk
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.9 }}>
                  <span>Blast: {weatherInfo.disease_risks.rice_blast_pct}%</span>
                  <span>Brown Spot: {weatherInfo.disease_risks.brown_spot_pct}%</span>
                  <span>BLB: {weatherInfo.disease_risks.bacterial_blight_pct}%</span>
                </div>
              </div>
            )}
          </div>

          {error && <div className="glass-panel" style={{ padding: '1rem', background: '#ef444410', color: '#ef4444', borderRadius: 12 }}>{error}</div>}
        </div>
      )}

      {/* ══════════════════════════════════════
          STEP 2 — AI Variety Recommendation
      ══════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Top AI Pick Banner */}
          {topVariety && (
            <div style={{
              padding: '1.75rem', borderRadius: 20,
              background: 'linear-gradient(135deg, #006D32 0%, #004d23 100%)',
              color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.08 }}>
                <Star size={120} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <CheckCircle size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'inline-block', fontSize: '0.65rem', fontWeight: 800,
                    background: 'rgba(255,255,255,0.2)', padding: '2px 10px',
                    borderRadius: 20, letterSpacing: 1, marginBottom: 6
                  }}>✦ AI BEST MATCH</div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>{topVariety.name}</h3>
                  <p style={{ opacity: 0.85, fontSize: '0.85rem', marginTop: 4 }}>
                    Score: <strong>{topVariety.score}%</strong> &nbsp;|&nbsp;
                    Expected: <strong>{topVariety.predicted_yield_t_ha} t/ha</strong> &nbsp;|&nbsp;
                    Grain: <strong>{topVariety.grain_type}</strong>
                  </p>
                  {topVariety.reason && (
                    <p style={{ marginTop: 10, fontSize: '0.82rem', opacity: 0.8, fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{topVariety.reason}"
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSelectVariety(topVariety)}
                disabled={planLoading}
                style={{
                  marginTop: '1.25rem', width: '100%', padding: '0.9rem',
                  background: '#fff', color: '#006D32', border: 'none',
                  borderRadius: 12, fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                {planLoading ? <Loader size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {planLoading ? 'Generating Plan...' : 'Generate Cultivation Plan for This Variety'}
              </button>
            </div>
          )}

          {/* All Ranked Varieties */}
          <h4 style={{ opacity: 0.7 }}>All Ranked Recommendations</h4>
          {recommendations.map((v, i) => (
            <div key={v.id} className="glass-panel" style={{
              padding: '1.25rem 1.5rem',
              borderLeft: i === 0 ? '5px solid #10b981' : '4px solid transparent'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>#{i+1} {v.name}</span>
                    {i === 0 && (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 800, background: '#10b981',
                        color: '#fff', padding: '2px 8px', borderRadius: 20
                      }}>AI PICK</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 2 }}>
                    {v.grain_type} &nbsp;·&nbsp; {v.growing_days} days &nbsp;·&nbsp; {v.suitable_season} season
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary-green)', fontSize: '1.1rem' }}>{v.predicted_yield_t_ha} t/ha</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Expected yield</div>
                </div>
              </div>
              <ScoreBar score={v.score} />
              {v.description && (
                <p style={{ fontSize: '0.8rem', opacity: 0.65, marginTop: '0.5rem', lineHeight: 1.5 }}>{v.description}</p>
              )}
              <button
                onClick={() => handleSelectVariety(v)}
                disabled={planLoading}
                style={{
                  marginTop: '0.75rem', padding: '0.6rem 1.25rem',
                  background: i === 0 ? 'var(--primary-green)' : 'rgba(0,0,0,0.06)',
                  color: i === 0 ? '#fff' : 'inherit',
                  border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                Select &amp; Generate Plan
              </button>
            </div>
          ))}

          {error && <div style={{ padding: '1rem', background: '#ef444410', color: '#ef4444', borderRadius: 12 }}>{error}</div>}
          <button
            onClick={() => setStep(1)}
            style={{ padding: '0.9rem', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} /> Change Field Parameters
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════
          STEP 3 — Cultivation Plan
      ══════════════════════════════════════ */}
      {step === 3 && plan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Summary Header */}
          <div style={{
            padding: '2rem', borderRadius: 20,
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2540 100%)',
            color: '#fff'
          }}>
            <p style={{ fontSize: '0.7rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>Selected Variety</p>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '4px 0' }}>{plan.variety?.name || selectedVarietyName}</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
              {fieldArea} {unit} &nbsp;·&nbsp; {district} &nbsp;·&nbsp; {season} Season
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
              <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.75rem' }}>
                <TrendingUp size={20} color="#10b981" />
                <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: 4 }}>
                  {plan.harvest_estimation?.expected_yield_tons ?? '—'} T
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Expected Yield</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.75rem' }}>
                <DollarSign size={20} color="#f59e0b" />
                <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 4 }}>
                  LKR {plan.harvest_estimation?.expected_income_lkr?.toLocaleString() ?? '—'}
                </div>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Est. Income</div>
              </div>
            </div>
          </div>

          {/* Cultivation Timeline */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={16} color="var(--primary-green)" /> Week-by-Week Cultivation Timeline
            </h4>
            {plan.timeline?.map((item, i) => (
              <TimelineItem key={i} item={item} isLast={i === plan.timeline.length - 1} />
            ))}
          </div>

          {/* Fertilizer Schedule */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Beaker size={16} color="#3b82f6" /> Fertilizer Allocation Plan
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {plan.fertilizer_schedule?.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.85rem 1rem', background: 'rgba(59,130,246,0.06)',
                  borderRadius: 12, border: '1px solid rgba(59,130,246,0.1)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: '#3b82f620',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Beaker size={16} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.fertilizer}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{f.week} — {f.purpose}</div>
                  </div>
                  <div style={{
                    fontWeight: 800, color: '#3b82f6', fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  }}>{f.amount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disease Prevention Guide */}
          {plan.diseases?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} color="#ef4444" /> Disease Prevention Guide
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {plan.diseases.map((d, i) => (
                  <div key={i} style={{
                    padding: '1rem', borderRadius: 12,
                    background: 'rgba(239,68,68,0.04)',
                    border: '1px solid rgba(239,68,68,0.15)'
                  }}>
                    <div style={{ fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>{d.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.75, lineHeight: 1.5 }}>
                      <strong>Symptoms:</strong> {d.symptoms}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.75, lineHeight: 1.5, marginTop: 4 }}>
                      <strong>Treatment:</strong> {d.recommended_fungicide}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div style={{ padding: '1rem', background: '#ef444410', color: '#ef4444', borderRadius: 12 }}>{error}</div>}

          <button
            onClick={() => setStep(2)}
            style={{ padding: '0.9rem', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} /> Back to Variety Selection
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (min-width: 500px) { .step-label { display: inline !important; } }
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
