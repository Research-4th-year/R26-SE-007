import React, { useState, useEffect } from 'react';
import { Cpu, Map, Droplet, Sprout, CheckCircle, ArrowRight, ArrowLeft, Loader, BarChart, Activity, Search, TrendingUp, Sun, DollarSign, Calendar, AlertTriangle, Cloud, Globe, Database, Wind, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { recommendVariety, generateCultivationPlan } from '../services/api';
import ErrorBoundary from '../components/ErrorBoundary';

const DISTRICTS_BY_ZONE = {
  "Dry Zone": ["Anuradhapura", "Polonnaruwa", "Kurunegala", "Hambantota", "Monaragala", "Ampara", "Trincomalee"],
  "Wet Zone": ["Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Kalutara", "Colombo", "Ratnapura", "Kegalle", "Badulla"]
};

// Weather mapping for UI pre-display
const DISTRICT_WEATHER_PREVIEW = {
  "Anuradhapura": {
    "Yala": { temp: 32.5, humidity: 65, rain: 50, sunlight: 8.5 },
    "Maha": { temp: 28.0, humidity: 78, rain: 180, sunlight: 6.0 }
  },
  "Polonnaruwa": {
    "Yala": { temp: 33.0, humidity: 63, rain: 45, sunlight: 8.8 },
    "Maha": { temp: 27.5, humidity: 80, rain: 195, sunlight: 5.8 }
  },
  "Kurunegala": {
    "Yala": { temp: 31.0, humidity: 72, rain: 110, sunlight: 7.5 },
    "Maha": { temp: 27.0, humidity: 82, rain: 160, sunlight: 6.2 }
  },
  "Hambantota": {
    "Yala": { temp: 31.5, humidity: 70, rain: 40, sunlight: 8.2 },
    "Maha": { temp: 28.5, humidity: 75, rain: 120, sunlight: 6.8 }
  },
  "Monaragala": {
    "Yala": { temp: 32.0, humidity: 68, rain: 65, sunlight: 8.0 },
    "Maha": { temp: 27.8, humidity: 80, rain: 170, sunlight: 6.0 }
  },
  "Ampara": {
    "Yala": { temp: 33.2, humidity: 64, rain: 50, sunlight: 8.6 },
    "Maha": { temp: 27.4, humidity: 82, rain: 210, sunlight: 5.5 }
  },
  "Trincomalee": {
    "Yala": { temp: 34.0, humidity: 62, rain: 55, sunlight: 8.9 },
    "Maha": { temp: 27.0, humidity: 84, rain: 220, sunlight: 5.4 }
  },
  "Kandy": {
    "Yala": { temp: 27.5, humidity: 78, rain: 150, sunlight: 6.5 },
    "Maha": { temp: 24.5, humidity: 85, rain: 220, sunlight: 5.2 }
  },
  "Matale": {
    "Yala": { temp: 29.0, humidity: 75, rain: 120, sunlight: 7.0 },
    "Maha": { temp: 25.5, humidity: 83, rain: 200, sunlight: 5.5 }
  },
  "Nuwara Eliya": {
    "Yala": { temp: 19.0, humidity: 84, rain: 210, sunlight: 5.0 },
    "Maha": { temp: 15.5, humidity: 90, rain: 280, sunlight: 4.0 }
  },
  "Galle": {
    "Yala": { temp: 29.5, humidity: 80, rain: 230, sunlight: 6.8 },
    "Maha": { temp: 27.0, humidity: 85, rain: 250, sunlight: 5.6 }
  },
  "Matara": {
    "Yala": { temp: 29.8, humidity: 79, rain: 220, sunlight: 7.0 },
    "Maha": { temp: 27.2, humidity: 84, rain: 240, sunlight: 5.8 }
  },
  "Kalutara": {
    "Yala": { temp: 29.0, humidity: 83, rain: 290, sunlight: 6.2 },
    "Maha": { temp: 26.5, humidity: 88, rain: 310, sunlight: 5.0 }
  },
  "Colombo": {
    "Yala": { temp: 30.5, humidity: 77, rain: 200, sunlight: 7.2 },
    "Maha": { temp: 27.8, humidity: 82, rain: 240, sunlight: 6.0 }
  },
  "Ratnapura": {
    "Yala": { temp: 28.5, humidity: 84, rain: 280, sunlight: 6.0 },
    "Maha": { temp: 25.8, humidity: 89, rain: 320, sunlight: 4.8 }
  },
  "Kegalle": {
    "Yala": { temp: 28.8, humidity: 82, rain: 270, sunlight: 6.3 },
    "Maha": { temp: 26.0, humidity: 87, rain: 300, sunlight: 5.1 }
  },
  "Badulla": {
    "Yala": { temp: 26.0, humidity: 76, rain: 110, sunlight: 7.0 },
    "Maha": { temp: 22.5, humidity: 84, rain: 190, sunlight: 5.5 }
  }
};

const FarmerGuideContent = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Form states
  const [fieldArea, setFieldArea] = useState(1.5);
  const [season, setSeason] = useState("Maha");
  const [zone, setZone] = useState("Dry Zone");
  const [district, setDistrict] = useState("Anuradhapura");

  // Weather Intelligence state
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Output recommendation list
  const [recommendations, setRecommendations] = useState([]);
  const [topVariety, setTopVariety] = useState(null);
  
  // Cultivation Plan states
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [chosenVariety, setChosenVariety] = useState(null);

  // Synchronize district selection when zone changes
  useEffect(() => {
    const districts = DISTRICTS_BY_ZONE[zone];
    if (districts && !districts.includes(district)) {
      setDistrict(districts[0]);
    }
  }, [zone]);

  // Fetch current weather dynamically when district changes
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
        console.error("Error loading weather details:", err);
      } finally {
        setLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [district]);

  // Load preview weather
  const currentPreviewWeather = DISTRICT_WEATHER_PREVIEW[district]?.[season] || { temp: 28, humidity: 75, rain: 120, sunlight: 7 };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const payload = {
        season,
        zone,
        district,
        field_area_hectares: parseFloat(fieldArea) || 1.0
      };
      const res = await recommendVariety(payload);
      if (res && res.ranked_recommendations) {
        setRecommendations(res.ranked_recommendations);
        setTopVariety(res.ranked_recommendations[0]);
        setStep(2);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating recommendations. Please ensure the backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartCultivationPlan = async (varietyId) => {
    setIsGeneratingPlan(true);
    try {
      const payload = {
        variety: varietyId,
        season,
        district,
        field_area_hectares: parseFloat(fieldArea) || 1.0
      };
      const res = await generateCultivationPlan(payload);
      if (res) {
        setSelectedPlan(res);
        setChosenVariety(varietyId);
        setStep(3);
      }
    } catch (e) {
      console.error(e);
      alert("Error generating cultivation plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Stepper timeline steps list helper
  const progressSteps = [
    { num: 1, title: i18n.language === 'si' ? "ක්‍ෂේත්‍ර පරාමිතීන්" : "Field Inputs" },
    { num: 2, title: i18n.language === 'si' ? "AI නිර්දේශය" : "AI Variety Recommendation" },
    { num: 3, title: i18n.language === 'si' ? "වගා සැලැස්ම" : "Smart Cultivation Plan" }
  ];

  // Bilingual shorthand
  const isSi = i18n.language === 'si';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header with language toggler */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--current-border)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-green)', fontWeight: 'bold' }}>
            {i18n.language === 'si' ? "AI වී ප්‍රභේද නිර්දේශය සහ වගා සැලසුම්කරු" : "AI Paddy Variety Recommendation & Cultivation Planner"}
          </h2>
          <p style={{ opacity: 0.7 }}>
            {i18n.language === 'si' ? "භූගෝලීය දේශගුණය සහ කෘෂි දත්ත මත පදනම් වූ තාක්ෂණික සැලසුම්කරු" : "Precision variety matching and dynamic crop scheduling driven by local climate data"}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => i18n.changeLanguage('en')} 
            className={`btn ${i18n.language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            English
          </button>
          <button 
            onClick={() => i18n.changeLanguage('si')} 
            className={`btn ${i18n.language === 'si' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            සිංහල
          </button>
        </div>
      </header>

      {/* Process Stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px' }}>
        {progressSteps.map((s) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: step >= s.num ? 1 : 0.4 }}>
            <span style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: step === s.num ? 'var(--primary-green)' : step > s.num ? '#006D32' : '#ccc',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}>
              {s.num}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: step === s.num ? 'bold' : 'normal' }}>{s.title}</span>
          </div>
        ))}
      </div>

      {/* STEP 1: Inputs and historical weather data loader */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Form Container */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ borderBottom: '2px solid var(--primary-green)', paddingBottom: '0.5rem' }}>
              {i18n.language === 'si' ? "ක්‍ෂේත්‍රයේ විස්තර ඇතුලත් කරන්න" : "Cultivation Setup"}
            </h3>

            {/* Field Size */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                {i18n.language === 'si' ? "කුඹුරේ ප්‍රමාණය (හෙක්ටයාර)" : "Paddy Field Size (Hectares)"}
              </label>
              <input 
                type="number"
                value={fieldArea}
                onChange={(e) => setFieldArea(Math.max(0.1, parseFloat(e.target.value) || 0))}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--current-border)', background: 'var(--current-bg)' }}
                step="0.1"
              />
            </div>

            {/* Season */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                {i18n.language === 'si' ? "වගා කන්නය" : "Cultivation Season"}
              </label>
              <select 
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--current-border)', background: 'var(--current-bg)' }}
              >
                <option value="Maha">Maha Season (September - March)</option>
                <option value="Yala">Yala Season (May - August)</option>
              </select>
            </div>

            {/* Agricultural Zone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                {i18n.language === 'si' ? "කෘෂි දේශගුණික කලාපය" : "Agricultural Zone"}
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="zone"
                    value="Dry Zone"
                    checked={zone === "Dry Zone"}
                    onChange={() => setZone("Dry Zone")}
                  />
                  Dry Zone
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="zone"
                    value="Wet Zone"
                    checked={zone === "Wet Zone"}
                    onChange={() => setZone("Wet Zone")}
                  />
                  Wet Zone
                </label>
              </div>
            </div>

            {/* District dropdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                {i18n.language === 'si' ? "දිස්ත්‍රික්කය" : "Select District"}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--current-border)', background: 'var(--current-bg)' }}
              >
                {DISTRICTS_BY_ZONE[zone].map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleRunAnalysis}
              className="btn btn-primary"
              disabled={isAnalyzing}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem', marginTop: '1rem' }}
            >
              {isAnalyzing ? (
                <>
            {/* Weather Intelligence Section */}
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '6px solid var(--primary-green)' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-green)', margin: 0 }}>
                {district} {isSi ? "කාලගුණ බුද්ධි තොරතුරු" : "Weather Intelligence"}
              </h3>
              <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '4px' }}>
                {isSi ? "සම්බන්ධිත උපාංග සහ API මඟින් තත්‍ය කාලීන දත්ත ලබා ගැනීම" : "Real-time crop-climate tracking from IoT & WeatherAPI backup"}
              </p>
            </div>

            {/* Smart Weather Status Card */}
            {loadingWeather ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-green)' }}>
                <Loader className="animate-spin" size={16} />
                <span style={{ fontSize: '0.85rem' }}>Synchronizing local climate metrics...</span>
              </div>
            ) : (
              <div style={{
                background: weatherInfo?.weather?.source === 'IOT_DEVICE' ? 'rgba(16, 185, 129, 0.08)' : weatherInfo?.weather?.source === 'WEATHER_API' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${weatherInfo?.weather?.source === 'IOT_DEVICE' ? '#10b981' : weatherInfo?.weather?.source === 'WEATHER_API' ? '#3b82f6' : '#f59e0b'}`,
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                {weatherInfo?.weather?.source === 'IOT_DEVICE' ? <Activity size={20} color="#10b981" /> : weatherInfo?.weather?.source === 'WEATHER_API' ? <Globe size={20} color="#3b82f6" /> : <Database size={20} color="#f59e0b" />}
                <div>
                  <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--current-text)' }}>
                    {weatherInfo?.weather?.source === 'IOT_DEVICE' 
                      ? (isSi ? "📡 IoT උපාංගය සම්බන්ධිතයි" : "📡 IoT Device Connected") 
                      : weatherInfo?.weather?.source === 'WEATHER_API' 
                        ? (isSi ? "🌐 කාලගුණ API බැකප් ක්‍රමය" : "🌐 WeatherAPI Backup Mode") 
                        : (isSi ? "📦 නොබැඳි කැෂේ ක්‍රමය" : "📦 Offline Cache Mode")}
                  </strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7, color: 'var(--current-text-sec)' }}>
                    {weatherInfo?.weather?.source === 'IOT_DEVICE' 
                      ? (isSi ? "කුඹුරේ සැබෑ මිනුම් දත්ත" : "Real-time field measurements") 
                      : weatherInfo?.weather?.source === 'WEATHER_API' 
                        ? (isSi ? `${district} සඳහා කාලගුණ සේවා දත්ත` : `Estimated weather for ${district}`) 
                        : (isSi ? "අවසන් වරට සුරැකි දත්ත" : "Last successfully saved coordinates")}
                  </span>
                </div>
              </div>
            )}

            {/* Weather parameters grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block' }}>Temperature</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--current-text)' }}>
                  {weatherInfo?.weather?.temperature || currentPreviewWeather.temp}°C
                </strong>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block' }}>Humidity</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--current-text)' }}>
                  {weatherInfo?.weather?.humidity || currentPreviewWeather.humidity}%
                </strong>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block' }}>Rainfall</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--current-text)' }}>
                  {weatherInfo?.weather?.rainfall || currentPreviewWeather.rain} mm
                </strong>
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6, display: 'block' }}>Wind Speed</span>
                <strong style={{ fontSize: '1.2rem', color: 'var(--current-text)' }}>
                  {weatherInfo?.weather?.windSpeed || 10} km/h {weatherInfo?.weather?.windDirection || "SW"}
                </strong>
              </div>
            </div>

            {/* Environmental Disease Risk Card */}
            <div style={{ background: 'rgba(0,0,0,0.01)', border: '1px solid var(--current-border)', padding: '1rem', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem', color: 'var(--current-text)' }}>
                <Shield size={14} color="var(--primary-green)" />
                {isSi ? "දේශගුණික රෝග අවදානම් පුරෝකථනය" : "Environmental Disease Risk Forecast"}
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* Rice Blast */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                    <span style={{ opacity: 0.8 }}>Rice Blast Risk</span>
                    <strong style={{ color: (weatherInfo?.disease_risks?.rice_blast_pct || 15) > 70 ? '#ef4444' : (weatherInfo?.disease_risks?.rice_blast_pct || 15) > 40 ? '#f59e0b' : '#10b981' }}>
                      {weatherInfo?.disease_risks?.rice_blast_pct || 15}%
                    </strong>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${weatherInfo?.disease_risks?.rice_blast_pct || 15}%`, background: (weatherInfo?.disease_risks?.rice_blast_pct || 15) > 70 ? '#ef4444' : (weatherInfo?.disease_risks?.rice_blast_pct || 15) > 40 ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>

                {/* Brown Spot */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                    <span style={{ opacity: 0.8 }}>Brown Spot Risk</span>
                    <strong style={{ color: (weatherInfo?.disease_risks?.brown_spot_pct || 20) > 70 ? '#ef4444' : (weatherInfo?.disease_risks?.brown_spot_pct || 20) > 40 ? '#f59e0b' : '#10b981' }}>
                      {weatherInfo?.disease_risks?.brown_spot_pct || 20}%
                    </strong>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${weatherInfo?.disease_risks?.brown_spot_pct || 20}%`, background: (weatherInfo?.disease_risks?.brown_spot_pct || 20) > 70 ? '#ef4444' : (weatherInfo?.disease_risks?.brown_spot_pct || 20) > 40 ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>

                {/* BLB */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '2px' }}>
                    <span style={{ opacity: 0.8 }}>Bacterial Leaf Blight Risk</span>
                    <strong style={{ color: (weatherInfo?.disease_risks?.bacterial_blight_pct || 12) > 70 ? '#ef4444' : (weatherInfo?.disease_risks?.bacterial_blight_pct || 12) > 40 ? '#f59e0b' : '#10b981' }}>
                      {weatherInfo?.disease_risks?.bacterial_blight_pct || 12}%
                    </strong>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${weatherInfo?.disease_risks?.bacterial_blight_pct || 12}%`, background: (weatherInfo?.disease_risks?.bacterial_blight_pct || 12) > 70 ? '#ef4444' : (weatherInfo?.disease_risks?.bacterial_blight_pct || 12) > 40 ? '#f59e0b' : '#10b981' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Pro-tip */}
            <div style={{ background: 'rgba(0, 109, 50, 0.05)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.75rem', opacity: 0.9 }}>
              <strong>AI Pro-tip:</strong> {season === "Maha" 
                ? "Maha season has sufficient water distribution. High-yielding varieties respond best in this window." 
                : "Yala season is dry with elevated solar radiation. Cultivating shorter-cycle or drought-tolerant varieties is optimal."
              }
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Variety recommendation comparison */}
      {step === 2 && recommendations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Smart Decision Card */}
          <div className="glass-panel" style={{ padding: '2rem', borderTop: '6px solid #006D32', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ background: 'rgba(0,109,50,0.1)', padding: '1rem', borderRadius: '50%' }}>
              <CheckCircle size={48} color="#006D32" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="badge" style={{ backgroundColor: '#006D32', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  AI BEST CHOICE
                </span>
                <h3 style={{ margin: 0 }}>{topVariety.name} recommended</h3>
              </div>
              <p style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>
                Based on <strong>{season}</strong> season in <strong>{district} ({zone})</strong>, typical climate indicators (temp {currentPreviewWeather.temp}°C, {currentPreviewWeather.sunlight} hrs sunlight), and NPK forecasts, the AI engine classified <strong>{topVariety.name}</strong> as the absolute highest matches.
              </p>
              <p style={{ opacity: 0.8, fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                Reason: {topVariety.reason}
              </p>
            </div>
            <button 
              onClick={() => handleStartCultivationPlan(topVariety.id)}
              disabled={isGeneratingPlan}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 1.5rem' }}
            >
              {isGeneratingPlan ? <Loader className="animate-spin" size={18} /> : (
                <>
                  <span>Start Cultivation Plan</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>

          {/* Comparison Table */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>
              {i18n.language === 'si' ? "ප්‍රශස්ත වී ප්‍රභේද සන්සන්දනය" : "Ranked Paddy Varieties Comparison"}
            </h3>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--current-border)', paddingBottom: '0.5rem' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>Variety</th>
                    <th>Grain Type</th>
                    <th>Growing Period</th>
                    <th>Expected Yield</th>
                    <th>Suitable Season</th>
                    <th>Disease Resistance</th>
                    <th style={{ textAlign: 'right' }}>Score</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recommendations.map((v, index) => (
                    <tr 
                      key={v.id} 
                      style={{ 
                        borderBottom: '1px solid var(--current-border)', 
                        backgroundColor: index === 0 ? 'rgba(0, 109, 50, 0.03)' : 'transparent',
                        fontWeight: index === 0 ? 'bold' : 'normal'
                      }}
                    >
                      <td style={{ padding: '1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{v.name}</span>
                        {index === 0 && (
                          <span style={{ fontSize: '0.65rem', background: '#006D32', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            AI Pick
                          </span>
                        )}
                      </td>
                      <td>{v.grain_type}</td>
                      <td>{v.growing_days} Days ({v.growing_period_months} mo)</td>
                      <td style={{ color: 'var(--primary-green)' }}>{v.predicted_yield_t_ha} t/ha</td>
                      <td>{v.suitable_season}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          Blast: {v.disease_resistance["Rice Blast"] || "Medium"}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: index === 0 ? '#006D32' : 'inherit' }}>
                        {v.score}%
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          onClick={() => handleStartCultivationPlan(v.id)}
                          className={`btn ${index === 0 ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          disabled={isGeneratingPlan}
                        >
                          Select & Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={() => setStep(1)}
            style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={16} />
            Change Inputs
          </button>
        </div>
      )}

      {/* STEP 3: Cultivation planner details */}
      {step === 3 && selectedPlan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Header Action card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Cultivation Dashboard: {selectedPlan.variety.name} ({chosenVariety})</h3>
              <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                Customized for {fieldArea} Hectares in {district} during {season}
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              Back to Varieties
            </button>
          </div>

          {/* Harvest & Financial Forecast */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', borderTop: '4px solid #1e88e5' }}>
              <TrendingUp size={28} color="#1e88e5" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Expected Yield</span>
              <h4 style={{ fontSize: '1.4rem', margin: '0.2rem 0 0' }}>{selectedPlan.harvest_estimation.expected_yield_tons} Tons</h4>
            </div>
            <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', borderTop: '4px solid #43a047' }}>
              <DollarSign size={28} color="#43a047" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Estimated Income</span>
              <h4 style={{ fontSize: '1.4rem', margin: '0.2rem 0 0' }}>
                LKR {selectedPlan.harvest_estimation.expected_income_lkr.toLocaleString()}
              </h4>
            </div>
            <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', borderTop: '4px solid #ff9800' }}>
              <Calendar size={28} color="#ff9800" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Maturity Duration</span>
              <h4 style={{ fontSize: '1.4rem', margin: '0.2rem 0 0' }}>{selectedPlan.harvest_estimation.estimated_harvest_days} Days</h4>
            </div>
            <div className="glass-panel" style={{ padding: '1.2rem', textAlign: 'center', borderTop: '4px solid #9c27b0' }}>
              <Cpu size={28} color="#9c27b0" style={{ margin: '0 auto 0.5rem' }} />
              <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Model Confidence</span>
              <h4 style={{ fontSize: '1.4rem', margin: '0.2rem 0 0' }}>{selectedPlan.harvest_estimation.confidence_pct}%</h4>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* Left: Dynamic Timeline Step-by-Step Stepper */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sprout color="var(--primary-green)" />
                <span>Weekly Cultivation Timeline</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {selectedPlan.timeline.map((t, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '1rem', borderLeft: '2px dashed var(--current-border)', paddingLeft: '1.5rem', position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: '-9px',
                      top: '2px',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-green)',
                      border: '3px solid var(--current-bg)'
                    }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary-green)', background: 'rgba(0, 109, 50, 0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {t.week}
                      </span>
                      <h4 style={{ fontSize: '1rem', marginTop: '0.4rem', marginBottom: '0.2rem' }}>{t.phase}</h4>
                      <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: 0 }}>{t.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Fertilizer Schedule & Disease Warnings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Fertilizer Schedule */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={18} color="var(--primary-green)" />
                  <span>Fertilizer Allocation</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {selectedPlan.fertilizer_schedule.map((f, idx) => (
                    <div key={idx} style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{f.week} - {f.fertilizer}</span>
                        <h5 style={{ margin: '0.2rem 0', fontSize: '0.85rem' }}>{f.purpose}</h5>
                      </div>
                      <span className="badge" style={{ backgroundColor: 'var(--primary-green)', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                        {f.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disease Guide */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color="#eab308" />
                  <span>Variety Specific Disease Guide</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {selectedPlan.diseases.map((d, idx) => (
                    <div key={idx} style={{ padding: '0.8rem', border: '1px solid var(--current-border)', borderRadius: '8px' }}>
                      <h5 style={{ margin: '0 0 0.4rem', color: '#c62828', fontSize: '0.85rem' }}>{d.name}</h5>
                      <p style={{ fontSize: '0.75rem', margin: '0 0 0.3rem', opacity: 0.9 }}>
                        <strong>Symptoms:</strong> {d.symptoms}
                      </p>
                      <p style={{ fontSize: '0.75rem', margin: '0 0 0.3rem', opacity: 0.9 }}>
                        <strong>Fungicide:</strong> {d.recommended_fungicide}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          <button 
            className="btn btn-secondary" 
            onClick={() => setStep(2)}
            style={{ alignSelf: 'flex-start' }}
          >
            Restart Cultivation Plan
          </button>
        </div>
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
