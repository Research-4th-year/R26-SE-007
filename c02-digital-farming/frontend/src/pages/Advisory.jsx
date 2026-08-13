import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { districtData, districtToZoneMap } from '../data/constants';
import FarmerGuidance from '../components/FarmerGuidance';

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
    // googleMapsApiKey: "AIzaSyCfNslBQ-Q_czbhuPrr0oqmbMPbGZmoARc"
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

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h2>Advisory & Suitability</h2>
        <p>Predict optimal Paddy Varieties & Check Field Suitability</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleAdvisorySubmit} className="prediction-form glass-panel">
        
        {/* 1. Map Section */}
        <div className="form-group">
          <label>Select Location via Map or Dropdowns</label>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <select name="District" value={advisoryData.District} onChange={handleAdvisoryChange}>
                {Object.keys(districtData).map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <select name="City" value={advisoryData.City} onChange={handleAdvisoryChange}>
                {districtData[advisoryData.District].map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoaded && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '5px' }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: advisoryData.lat, lng: advisoryData.lon }}
                zoom={9}
                onClick={onMapClick}
              >
                <Marker position={{ lat: advisoryData.lat, lng: advisoryData.lon }} />
              </GoogleMap>
            </div>
          )}
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>
            Selected Coord: {advisoryData.lat.toFixed(4)}, {advisoryData.lon.toFixed(4)}
          </div>
        </div>

        {/* 2. Advisory Fields */}
        <div className="form-row">
          <div className="form-group">
            <label>Climatic Zone (Auto-Detected)</label>
            <select name="Zone" value={advisoryData.Zone} onChange={handleAdvisoryChange}>
              <option value="Dry Zone">Dry Zone</option>
              <option value="Wet Zone">Wet Zone</option>
              <option value="Intermediate Zone">Intermediate Zone</option>
            </select>
          </div>
          <div className="form-group">
            <label>Season (Auto-Detected)</label>
            <select name="Season" value={advisoryData.Season} onChange={handleAdvisoryChange}>
              <option value="Maha">Maha (Sept - Mar)</option>
              <option value="Yala">Yala (Apr - Aug)</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Irrigation Method</label>
            <select name="Irrigation" value={advisoryData.Irrigation} onChange={handleAdvisoryChange}>
              <option value="Irrigated">Irrigated (වාරිමාර්ග)</option>
              <option value="Rainfed">Rainfed (වර්ෂාපෝෂිත)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cultivation Date (Optional)</label>
            <input type="date" name="Cultivation_Date" value={advisoryData.Cultivation_Date} onChange={handleAdvisoryChange} />
          </div>
        </div>

        {/* 4. Field ID */}
        <div className="form-group">
          <label htmlFor="field_id">ESP32 Field ID (Firebase node)</label>
          <input type="text" name="field_id" id="field_id" value={advisoryData.field_id} onChange={handleAdvisoryChange} />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Analyzing...' : 'Get Recommendation & Suitability'}
        </button>
      </form>

      {/* Merged Results Card */}
      {(result || suitabilityResult) && (
        <div className="result-card fade-in merged-results-card">
          {result && (
            <div className="merged-variety-section">
              <h2>Optimal Variety</h2>
              <div className="variety-highlight" style={{ fontSize: '2.5rem', marginBottom: '15px', color: '#10b981' }}>
                {result.predicted_variety_code}
              </div>
              {result.details && (
                <div className="variety-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="detail-item">
                    <span className="label">Grain Type</span>
                    <span className="value">{result.details.Grain_Type}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Age Group</span>
                    <span className="value">{result.details.Age_Group}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Category</span>
                    <span className="value">{result.details.Category}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {suitabilityResult && (
            <div className="merged-suitability-section">
              <h2>IoT Field Suitability</h2>
              <div className="suitability-score" style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                color: suitabilityResult.suitability_score <= 2 ? '#34d399' : (suitabilityResult.suitability_score <= 3 ? '#fbbf24' : '#ef4444'),
                marginBottom: '5px'
              }}>
                {suitabilityResult.suitability_score} / 5
              </div>
              <p style={{ fontSize: '0.8rem', color: '#3c4047ff', marginBottom: '15px' }}>
                (1 is Excellent, 5 is Poor)
              </p>
              
              <div className="reasoning-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '15px', color: '#000000ff' }}>
                {suitabilityResult.reasoning}
              </div>

              <div className="variety-details" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                <div className="detail-item">
                  <span className="label">Temp</span>
                  <span className="value">{suitabilityResult.metrics.temperature}°C</span>
                </div>
                <div className="detail-item">
                  <span className="label">Humidity</span>
                  <span className="value">{suitabilityResult.metrics.humidity}%</span>
                </div>
                <div className="detail-item">
                  <span className="label">Soil Moisture</span>
                  <span className="value">{suitabilityResult.metrics.soil_moisture} m³/m³</span>
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
        <FarmerGuidance 
          variety={result.predicted_variety_code}
          ageGroup={result.details.Age_Group}
          zone={advisoryData.Zone}
          irrigation={advisoryData.Irrigation}
          cultivationDate={advisoryData.Cultivation_Date}
        />
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
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>{row.field_id}</td>
                  <td style={{ padding: '12px 8px' }}>{row.city}, {row.district}</td>
                  <td style={{ padding: '12px 8px', color: '#10b981', fontWeight: 'bold' }}>{row.predicted_variety}</td>
                  <td style={{ padding: '12px 8px' }}>{row.suitability_score}/5</td>
                  <td style={{ padding: '12px 8px' }}>
                    <button onClick={() => editFieldId(row.id, row.field_id)} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>✏️</button>
                    <button onClick={() => deleteHistory(row.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Advisory;
