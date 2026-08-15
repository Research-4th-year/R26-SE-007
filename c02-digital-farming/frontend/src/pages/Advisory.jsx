import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { districtData, districtToZoneMap } from '../data/constants';
import FarmerGuidance from '../components/FarmerGuidance';
import FertilizerSummary from '../components/FertilizerSummary';
import wheatIcon from '../assets/icons/wheat.png';
import iotIcon from '../assets/icons/paddy iot.png';

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '12px',
  marginBottom: '15px'
};

const getCurrentSeason = () => {
  const month = new Date().getMonth(); // 0 = Jan, 11 = Dec
  // Yala: April (3) to August (7)
  if (month >= 3 && month <= 7) return 'Yala';
  return 'Maha';
};

const findClosestLocation = (lat, lon) => {
  let closestDist = Infinity;
  let bestMatch = null;
  
  for (const [district, cities] of Object.entries(districtData)) {
    for (const city of cities) {
      // Simple euclidean distance is fine for this scale
      const dist = Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2);
      if (dist < closestDist) {
        closestDist = dist;
        bestMatch = {
          District: district,
          City: city.name,
          Zone: districtToZoneMap[district] || 'Dry Zone',
          lat: city.lat,
          lon: city.lon
        };
      }
    }
  }
  return bestMatch;
};

function Advisory() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyCfNslBQ-Q_czbhuPrr0oqmbMPbGZmoARc"
  });

  const [advisoryData, setAdvisoryData] = useState({
    District: 'Anuradhapura',
    City: 'Anuradhapura City',
    lat: districtData["Anuradhapura"][0].lat,
    lon: districtData["Anuradhapura"][0].lon,
    Zone: 'Dry Zone',
    Season: getCurrentSeason(),
    Salinity_Prone: 'No',
    Iron_Toxicity_Prone: 'No',
    field_id: 'field_001',
    Irrigation: 'Irrigated',
    Cultivation_Date: new Date().toISOString().split('T')[0]
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [suitabilityResult, setSuitabilityResult] = useState(null);
  const [error, setError] = useState(null);
  
  // History State
  const [historyData, setHistoryData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/history');
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const saveToHistory = async () => {
    if (!result || !suitabilityResult) return;
    setSaving(true);
    try {
      const payload = {
        field_id: advisoryData.field_id,
        district: advisoryData.District,
        city: advisoryData.City,
        zone: advisoryData.Zone,
        season: advisoryData.Season,
        predicted_variety: result.predicted_variety_code,
        suitability_score: suitabilityResult.suitability_score
      };
      
      const response = await fetch('http://127.0.0.1:8000/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        fetchHistory(); // refresh table
      }
    } catch (err) {
      console.error("Failed to save history:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteHistory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/history/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) fetchHistory();
    } catch (err) {
      console.error("Failed to delete history:", err);
    }
  };

  const editFieldId = async (id, currentFieldId) => {
    const newFieldId = window.prompt("Enter new Field ID:", currentFieldId);
    if (!newFieldId || newFieldId === currentFieldId) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/history/${id}?field_id=${encodeURIComponent(newFieldId)}`, {
        method: 'PUT'
      });
      if (response.ok) fetchHistory();
    } catch (err) {
      console.error("Failed to update history:", err);
    }
  };

  const handleAdvisoryChange = (e) => {
    const { name, value } = e.target;
    if (name === 'District') {
      const defaultCity = districtData[value][0];
      const defaultZone = districtToZoneMap[value] || 'Dry Zone';
      setAdvisoryData({
        ...advisoryData,
        District: value,
        City: defaultCity.name,
        Zone: defaultZone,
        lat: defaultCity.lat,
        lon: defaultCity.lon
      });
    } else if (name === 'City') {
      const selectedCityObj = districtData[advisoryData.District].find(c => c.name === value);
      if (selectedCityObj) {
        setAdvisoryData({
          ...advisoryData,
          City: value,
          lat: selectedCityObj.lat,
          lon: selectedCityObj.lon
        });
      }
    } else {
      setAdvisoryData({
        ...advisoryData,
        [name]: value
      });
    }
  };

  const onMapClick = (e) => {
    const clickedLat = e.latLng.lat();
    const clickedLon = e.latLng.lng();
    const match = findClosestLocation(clickedLat, clickedLon);
    
    if (match) {
      setAdvisoryData({
        ...advisoryData,
        District: match.District,
        City: match.City,
        Zone: match.Zone,
        lat: clickedLat,
        lon: clickedLon
      });
    } else {
      setAdvisoryData({
        ...advisoryData,
        lat: clickedLat,
        lon: clickedLon
      });
    }
  };

  const handleAdvisorySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setSuitabilityResult(null);

    try {
      const varietyPayload = {
        District: advisoryData.District,
        Zone: advisoryData.Zone,
        Season: advisoryData.Season,
        Salinity_Prone: advisoryData.Salinity_Prone,
        Iron_Toxicity_Prone: advisoryData.Iron_Toxicity_Prone
      };

      const varietyPromise = fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(varietyPayload)
      });

      const queryParams = new URLSearchParams({
        field_id: advisoryData.field_id,
        lat: advisoryData.lat,
        lon: advisoryData.lon
      }).toString();

      const suitabilityPromise = fetch(`http://127.0.0.1:8000/predict_suitability?${queryParams}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const [resVariety, resSuitability] = await Promise.all([varietyPromise, suitabilityPromise]);

      if (!resVariety.ok || !resSuitability.ok) {
        throw new Error('Failed to get predictions from the server');
      }

      const dataVariety = await resVariety.json();
      const dataSuitability = await resSuitability.json();

      setResult(dataVariety);
      setSuitabilityResult(dataSuitability);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const getMetricStatus = (type, value) => {
    let status = 'Optimal';
    let color = '#10b981'; // Green
    
    if (type === 'temp') {
      if (value < 22 || value > 32) {
        if (value < 18 || value > 35) { status = 'Bad'; color = '#ef4444'; }
        else { status = 'Medium'; color = '#f59e0b'; }
      }
    } else if (type === 'hum') {
      if (value < 60 || value > 80) {
        if (value < 50 || value > 90) { status = 'Bad'; color = '#ef4444'; }
        else { status = 'Medium'; color = '#f59e0b'; }
      }
    } else if (type === 'moist') {
      if (value < 0.3 || value > 0.6) {
        if (value < 0.2 || value > 0.7) { status = 'Bad'; color = '#ef4444'; }
        else { status = 'Medium'; color = '#f59e0b'; }
      }
    }
    
    return (
      <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: '600', color: color, background: `${color}20`, padding: '3px 8px', borderRadius: '12px', display: 'inline-block' }}>
        {status}
      </div>
    );
  };

  const getSuitabilityDetails = (score) => {
    switch (score) {
      case 1: return { text: 'Excellent', color: '#10b981', icon: '🌟' };
      case 2: return { text: 'Good', color: '#34d399', icon: '🟢' };
      case 3: return { text: 'Fair', color: '#fbbf24', icon: '🟡' };
      case 4: return { text: 'Poor', color: '#f97316', icon: '🟠' };
      case 5: return { text: 'Critical', color: '#ef4444', icon: '🔴' };
      default: return { text: 'Unknown', color: '#64748b', icon: '❓' };
    }
  };

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h2>Advisory & Suitability</h2>
        <p>Predict optimal Paddy Varieties & Check Field Suitability</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAdvisorySubmit} className="prediction-form glass-panel" style={{ background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }}>
        
        {/* 1. Map Section */}
        <div className="form-group" style={{ marginBottom: '25px' }}>
          <label style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            📍 Select Location via Map
          </label>
          
          {isLoaded && (
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', marginBottom: '15px', transition: 'border-color 0.3s' }}>
              <GoogleMap
                mapContainerStyle={{ ...mapContainerStyle, marginBottom: 0 }}
                center={{ lat: advisoryData.lat, lng: advisoryData.lon }}
                zoom={9}
                onClick={onMapClick}
              >
                <Marker position={{ lat: advisoryData.lat, lng: advisoryData.lon }} />
              </GoogleMap>
            </div>
          )}
          
          <div style={{ 
            background: 'linear-gradient(to right, #eff6ff, #ffffff)', 
            padding: '15px 20px', 
            borderRadius: '12px', 
            border: '1px solid #bfdbfe',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            <div>
              <span style={{ color: '#3b82f6', fontSize: '0.85rem', display: 'block', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nearest City (Auto-detected)</span>
              <strong style={{ color: '#1e3a8a', fontSize: '1.2rem' }}>{advisoryData.City}, {advisoryData.District}</strong>
            </div>
            <div style={{ textAlign: 'right', background: '#dbeafe', padding: '8px 15px', borderRadius: '8px' }}>
              <span style={{ color: '#2563eb', fontSize: '0.75rem', display: 'block', fontWeight: 'bold' }}>COORDINATES</span>
              <code style={{ color: '#1d4ed8', fontSize: '0.95rem', fontWeight: 'bold' }}>{advisoryData.lat.toFixed(4)}, {advisoryData.lon.toFixed(4)}</code>
            </div>
          </div>
        </div>

        {/* 2. Advisory Fields */}
        <div className="form-row" style={{ gap: '20px', marginBottom: '20px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600' }}>🌤️ Climatic Zone</label>
            <select name="Zone" value={advisoryData.Zone} onChange={handleAdvisoryChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '1rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s', cursor: 'pointer' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}>
              <option value="Dry Zone">Dry Zone</option>
              <option value="Wet Zone">Wet Zone</option>
              <option value="Intermediate Zone">Intermediate Zone</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600' }}>📅 Season</label>
            <select name="Season" value={advisoryData.Season} onChange={handleAdvisoryChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '1rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s', cursor: 'pointer' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}>
              <option value="Maha">Maha (Sept - Mar)</option>
              <option value="Yala">Yala (Apr - Aug)</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
        </div>

        <div className="form-row" style={{ gap: '20px', marginBottom: '20px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600' }}>💧 Irrigation Method</label>
            <select name="Irrigation" value={advisoryData.Irrigation} onChange={handleAdvisoryChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '1rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s', cursor: 'pointer' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}>
              <option value="Irrigated">Irrigated (වාරිමාර්ග)</option>
              <option value="Rainfed">Rainfed (වර්ෂාපෝෂිත)</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600' }}>🌱 Cultivation Date</label>
            <input type="date" name="Cultivation_Date" value={advisoryData.Cultivation_Date} onChange={handleAdvisoryChange} style={{ width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '1rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s', cursor: 'pointer' }} onFocus={(e) => e.target.style.borderColor = '#3b82f6'} onBlur={(e) => e.target.style.borderColor = '#cbd5e1'} />
          </div>
        </div>

        {/* 4. Field ID */}
        <div className="form-group" style={{ marginBottom: '30px' }}>
          <label htmlFor="field_id" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: '600' }}>📡 ESP32 Field ID (IoT Node)</label>
          <input type="text" name="field_id" id="field_id" value={advisoryData.field_id} onChange={handleAdvisoryChange} style={{ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '1.1rem', color: '#1e293b', outline: 'none', transition: 'all 0.2s' }} onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)'; }} onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; }} />
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{ 
          width: '100%', 
          padding: '16px', 
          fontSize: '1.2rem', 
          fontWeight: 'bold', 
          borderRadius: '12px', 
          background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          color: 'white', 
          border: 'none', 
          cursor: loading ? 'not-allowed' : 'pointer', 
          boxShadow: loading ? 'none' : '0 10px 15px -3px rgba(16, 185, 129, 0.4)', 
          transition: 'all 0.3s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}
        onMouseEnter={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
        onMouseLeave={(e) => { if(!loading) e.currentTarget.style.transform = 'translateY(0)' }}>
          {loading ? (
            <>⏳ Analyzing Field Data...</>
          ) : (
            <>✨ Get Recommendation & Suitability</>
          )}
        </button>
      </form>

      {/* Merged Results Card */}
      {(result || suitabilityResult) && (
        <div className="result-card fade-in merged-results-card">
          {result && (
            <div className="merged-variety-section" style={{ background: 'linear-gradient(145deg, #f0fdf4 0%, #ffffff 100%)', padding: '25px', borderRadius: '16px', border: '1px solid #bbf7d0', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: '#d1fae5', padding: '10px', borderRadius: '12px' }}>
                  <img src={wheatIcon} alt="Variety" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.4))' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#065f46', fontSize: '1.4rem' }}>Optimal Variety</h2>
                  <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: '500' }}>AI Recommended</span>
                </div>
              </div>
              <div style={{ background: '#10b981', color: 'white', display: 'inline-block', padding: '10px 20px', borderRadius: '30px', fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)' }}>
                {result.predicted_variety_code}
              </div>
              {result.details && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.7)', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>🌾 Grain Type</span>
                    <span style={{ color: '#0f172a', fontWeight: '600' }}>{result.details.Grain_Type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>⏱️ Age Group</span>
                    <span style={{ color: '#0f172a', fontWeight: '600' }}>{result.details.Age_Group}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>🏷️ Category</span>
                    <span style={{ color: '#0f172a', fontWeight: '600' }}>{result.details.Category}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {suitabilityResult && (
            <div className="merged-suitability-section" style={{ background: 'linear-gradient(145deg, #eff6ff 0%, #ffffff 100%)', padding: '25px', borderRadius: '16px', border: '1px solid #bfdbfe', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: '#dbeafe', padding: '10px', borderRadius: '12px' }}>
                  <img src={iotIcon} alt="IoT Suitability" style={{ width: '48px', height: '48px', filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.4))' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.4rem' }}>Field Suitability</h2>
                  <span style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: '500' }}>Real-time IoT Analysis</span>
                </div>
              </div>

              {(() => {
                const suit = getSuitabilityDetails(suitabilityResult.suitability_score);
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                      <span style={{ fontSize: '3rem' }}>{suit.icon}</span>
                      <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: suit.color }}>{suit.text}</span>
                    </div>
                    <div style={{ marginTop: '10px', width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level} style={{ flex: 1, borderRight: level < 5 ? '1px solid white' : 'none', background: level <= suitabilityResult.suitability_score ? suit.color : 'transparent' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px' }}>Score: {suitabilityResult.suitability_score} / 5</span>
                  </div>
                );
              })()}
              
              <div style={{ background: 'rgba(255,255,255,0.7)', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ fontSize: '1.2rem' }}>💡</span>
                  <span>{suitabilityResult.reasoning}</span>
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '5px' }}>🌡️</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Temp</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{suitabilityResult.metrics.temperature}°C</strong>
                  <br/>
                  {getMetricStatus('temp', suitabilityResult.metrics.temperature)}
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '5px' }}>💧</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Humidity</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{suitabilityResult.metrics.humidity}%</strong>
                  <br/>
                  {getMetricStatus('hum', suitabilityResult.metrics.humidity)}
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '5px' }}>🌱</span>
                  <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Moisture</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.1rem' }}>{suitabilityResult.metrics.soil_moisture}</strong>
                  <br/>
                  {getMetricStatus('moist', suitabilityResult.metrics.soil_moisture)}
                </div>
              </div>
            </div>
          )}
          
          <button 
            onClick={saveToHistory} 
            className="submit-btn" 
            style={{ marginTop: '20px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Result to History'}
          </button>
        </div>
      )}

      {/* Farmer Crop Guidance */}
      {result && result.details && (
        <>
          <FarmerGuidance 
            variety={result.predicted_variety_code}
            ageGroup={result.details.Age_Group}
            zone={advisoryData.Zone}
            irrigation={advisoryData.Irrigation}
            cultivationDate={advisoryData.Cultivation_Date}
          />
          <FertilizerSummary 
            zone={advisoryData.Zone} 
            ageGroup={result.details.Age_Group} 
          />
        </>
      )}

      {/* History Table */}
      {historyData.length > 0 && (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Saved Advisory History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)', color: '#64748b' }}>
                <th style={{ padding: '12px 8px' }}>Field ID</th>
                <th style={{ padding: '12px 8px' }}>Location</th>
                <th style={{ padding: '12px 8px' }}>Variety</th>
                <th style={{ padding: '12px 8px' }}>Score</th>
                <th style={{ padding: '12px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map(row => (
                <tr 
                  key={row.id} 
                  onClick={() => setSelectedHistory(row)}
                  style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>{row.field_id}</td>
                  <td style={{ padding: '12px 8px' }}>{row.city}, {row.district}</td>
                  <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: 'bold' }}>{row.predicted_variety}</td>
                  <td style={{ padding: '12px 8px' }}>{row.suitability_score}/5</td>
                  <td style={{ padding: '12px 8px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); editFieldId(row.id, row.field_id); }} 
                      style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                      title="Edit Field ID"
                    >✏️</button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteHistory(row.id); }} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      title="Delete Record"
                    >🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History Details Modal */}
      {selectedHistory && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }} onClick={() => setSelectedHistory(null)}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedHistory(null)}
              style={{
                position: 'absolute',
                top: '15px', right: '15px',
                background: 'none', border: 'none',
                fontSize: '1.5rem', cursor: 'pointer',
                color: '#64748b'
              }}
            >&times;</button>
            
            <h3 style={{ color: '#0f172a', margin: '0 0 20px 0', fontSize: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              Advisory Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.95rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Field ID</span>
                <strong style={{ color: '#1e293b' }}>{selectedHistory.field_id}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Location</span>
                <strong style={{ color: '#1e293b' }}>{selectedHistory.city}, {selectedHistory.district}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Climatic Zone</span>
                <strong style={{ color: '#1e293b' }}>{selectedHistory.zone}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem' }}>Season</span>
                <strong style={{ color: '#1e293b' }}>{selectedHistory.season}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.85rem' }}>Predicted Optimal Variety</span>
                <strong style={{ color: '#10b981', fontSize: '1.5rem' }}>{selectedHistory.predicted_variety}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b', display: 'block', fontSize: '0.85rem' }}>Field Suitability Score (1-5)</span>
                <strong style={{ color: selectedHistory.suitability_score <= 2 ? '#10b981' : (selectedHistory.suitability_score <= 3 ? '#f59e0b' : '#ef4444'), fontSize: '1.5rem' }}>
                  {selectedHistory.suitability_score}
                </strong>
              </div>
              {selectedHistory.created_at && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'right', marginTop: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Saved on: {new Date(selectedHistory.created_at + 'Z').toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Advisory;
