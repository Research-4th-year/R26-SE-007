import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { districtData } from '../data/constants';

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '12px',
  marginBottom: '15px'
};

const findClosestLocation = (lat, lon) => {
  let closestDist = Infinity;
  let bestMatch = null;
  
  for (const [district, cities] of Object.entries(districtData)) {
    for (const city of cities) {
      const dist = Math.pow(city.lat - lat, 2) + Math.pow(city.lon - lon, 2);
      if (dist < closestDist) {
        closestDist = dist;
        bestMatch = {
          District: district,
          City: city.name,
          lat: city.lat,
          lon: city.lon
        };
      }
    }
  }
  return bestMatch;
};

function YieldPrediction() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    // googleMapsApiKey: "AIzaSyCfNslBQ-Q_czbhuPrr0oqmbMPbGZmoARc"
  });

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState(null);
  const [yieldResult, setYieldResult] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);

  const [yieldData, setYieldData] = useState({
    District: 'Anuradhapura',
    City: 'Anuradhapura City',
    lat: districtData["Anuradhapura"][0].lat,
    lon: districtData["Anuradhapura"][0].lon,
    Total_Land_Size: 1000,
    Land_Size_Unit: 'Hectares',
    Paddy_Type: 'Bg 352',
    field_id: 'field_001',
    useFirebase: false
  });

  const handleYieldChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'District') {
      const defaultCity = districtData[value][0];
      setYieldData({
        ...yieldData,
        District: value,
        City: defaultCity.name,
        lat: defaultCity.lat,
        lon: defaultCity.lon
      });
    } else if (name === 'City') {
      const selectedCityObj = districtData[yieldData.District].find(c => c.name === value);
      if (selectedCityObj) {
        setYieldData({
          ...yieldData,
          City: value,
          lat: selectedCityObj.lat,
          lon: selectedCityObj.lon
        });
      }
    } else {
      setYieldData({
        ...yieldData,
        [name]: value
      });
    }
  };

  const onMapClick = (e) => {
    const clickedLat = e.latLng.lat();
    const clickedLon = e.latLng.lng();
    const match = findClosestLocation(clickedLat, clickedLon);
    
    if (match) {
      setYieldData({
        ...yieldData,
        District: match.District,
        City: match.City,
        lat: clickedLat,
        lon: clickedLon
      });
    } else {
      setYieldData({
        ...yieldData,
        lat: clickedLat,
        lon: clickedLon
      });
    }
  };

  useEffect(() => {
    const fetchEnvironmentData = async () => {
      setFetchingData(true);
      setError(null);
      try {
        const response = await fetch('http://127.0.0.1:8000/api/environment_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: yieldData.lat,
            lon: yieldData.lon,
            use_firebase: yieldData.useFirebase
          }),
        });
        if (!response.ok) throw new Error('Failed to fetch environmental data');
        const data = await response.json();
        setEnvironmentalData(data);
      } catch (err) {
        console.error("Auto-fetch error:", err.message);
      } finally {
        setFetchingData(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchEnvironmentData();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [yieldData.lat, yieldData.lon, yieldData.field_id, yieldData.useFirebase]);

  const handleYieldSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setYieldResult(null);

    try {
      let final_land_size_ha = parseFloat(yieldData.Total_Land_Size);
      if (yieldData.Land_Size_Unit === 'Acres') {
        final_land_size_ha = final_land_size_ha * 0.404686;
      } else if (yieldData.Land_Size_Unit === 'Perches') {
        final_land_size_ha = final_land_size_ha * 0.00252929;
      }

      const response = await fetch('http://127.0.0.1:8000/predict_yield_production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          District: yieldData.District,
          Total_Land_Size: final_land_size_ha,
          Paddy_Type: yieldData.Paddy_Type,
          lat: yieldData.lat,
          lon: yieldData.lon,
          use_firebase: yieldData.useFirebase
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get yield prediction from the server');
      }

      const data = await response.json();
      setYieldResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalYieldKg = (val_per_ha) => {
    let final_land_size_ha = parseFloat(yieldData.Total_Land_Size || 0);
    if (yieldData.Land_Size_Unit === 'Acres') {
      final_land_size_ha = final_land_size_ha * 0.404686;
    } else if (yieldData.Land_Size_Unit === 'Perches') {
      final_land_size_ha = final_land_size_ha * 0.00252929;
    }
    return val_per_ha * final_land_size_ha;
  };

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h2>Yield Prediction</h2>
        <p>Estimate Harvest Production using IoT Sensor Data</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleYieldSubmit} className="prediction-form glass-panel">
        {/* Replaced top redundant District dropdown with nothing, moved to map section */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="Total_Land_Size">Land Size</label>
            <input type="number" step="0.01" name="Total_Land_Size" id="Total_Land_Size" value={yieldData.Total_Land_Size} onChange={handleYieldChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="Land_Size_Unit">Unit</label>
            <select name="Land_Size_Unit" id="Land_Size_Unit" value={yieldData.Land_Size_Unit} onChange={handleYieldChange}>
              <option value="Hectares">Hectares</option>
              <option value="Acres">Acres</option>
              <option value="Perches">Perches</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="Paddy_Type">Paddy Variety</label>
            <select name="Paddy_Type" id="Paddy_Type" value={yieldData.Paddy_Type} onChange={handleYieldChange}>
              <option value="Bg 352">Bg 352</option>
              <option value="At 362">At 362</option>
              <option value="Samba">Samba</option>
              <option value="Keeri Samba">Keeri Samba</option>
              <option value="Nadu">Nadu</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Select Location via Map</label>
          
          {isLoaded && (
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '15px' }}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: yieldData.lat, lng: yieldData.lon }}
                zoom={9}
                onClick={onMapClick}
              >
                <Marker position={{ lat: yieldData.lat, lng: yieldData.lon }} />
              </GoogleMap>
            </div>
          )}
          
          <div style={{ 
            background: '#f8fafc', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.85rem', display: 'block' }}>Nearest City (Auto-detected)</span>
              <strong style={{ color: '#1e293b', fontSize: '1.1rem' }}>{yieldData.City}, {yieldData.District}</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#64748b', fontSize: '0.75rem', display: 'block' }}>Coordinates</span>
              <code style={{ color: '#3b82f6', fontSize: '0.85rem' }}>{yieldData.lat.toFixed(4)}, {yieldData.lon.toFixed(4)}</code>
            </div>
          </div>
        </div>

        <div className="form-group checkbox-group" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0, fontWeight: 'bold' }}>
            <input
              type="checkbox"
              name="useFirebase"
              checked={yieldData.useFirebase}
              onChange={(e) => handleYieldChange({ target: { name: 'useFirebase', value: e.target.checked } })}
              style={{ marginRight: '10px', width: '20px', height: '20px' }}
            />
            Data Get From IoT Device
          </label>
        </div>


        {environmentalData && (
          <div className="variety-details fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#34d399' }}>Live Environmental Factors</h4>
              {fetchingData && <span className="pulsing-dot" style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#34d399', borderRadius: '50%' }}></span>}
            </div>
            <div className="detail-item" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="label">Temp</span>
              <span className="value">{environmentalData.Temperature_C.toFixed(2)}°C</span>
            </div>
            <div className="detail-item" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <span className="label">Humidity</span>
              <span className="value">{environmentalData.Humidity.toFixed(2)}%</span>
            </div>
            <div className="detail-item" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.05)' }}>
              <span className="label">Soil Moisture</span>
              <span className="value">{environmentalData.Soil_Moisture.toFixed(2)} m³/m³</span>
            </div>
            <p style={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: '#94a3b8', margin: '5px 0 0 0', textAlign: 'center' }}>
              {yieldData.useFirebase ? 'Fetched directly from IoT Device' : 'Fetched from 14-day Weather Forecast'}
            </p>
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Predicting Yield...' : 'Predict Yield & Production'}
        </button>
      </form>

      {yieldResult && (
        <div className="result-card fade-in merged-results-card">
          <div className="merged-variety-section" style={{ width: '100%' }}>
            <h2>Production Estimate</h2>
            <div className="variety-highlight" style={{ fontSize: '3rem', marginBottom: '10px', color: '#10b981' }}>
              {yieldResult.total_estimated_production_mt.toFixed(2)} <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>Metric Tons</span>
            </div>
            
            <div className="yield-insights" style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#10b981' }}>Automated Environmental Data</h3>
              <div className="variety-details" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="detail-item">
                  <span className="label">Temp</span>
                  <span className="value">{yieldResult.environmental_factors.Temperature_C.toFixed(2)}°C</span>
                </div>
                <div className="detail-item">
                  <span className="label">Humidity</span>
                  <span className="value">{yieldResult.environmental_factors.Humidity.toFixed(2)}%</span>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="label">Soil Moisture</span>
                  <span className="value">{yieldResult.environmental_factors.Soil_Moisture.toFixed(2)} m³/m³</span>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                <span style={{ color: '#cbd5e1' }}>Yield per Hectare</span>
                <span style={{ fontWeight: 'bold' }}>{yieldResult.predicted_yield_kg_per_ha.toFixed(2)} kg/ha</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#cbd5e1' }}>Total Expected Yield</span>
                <span style={{ fontWeight: 'bold', color: '#34d399' }}>{getTotalYieldKg(yieldResult.predicted_yield_kg_per_ha).toFixed(2)} kg</span>
              </div>
            </div>

            <div className="reasoning-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', fontSize: '0.95rem', color: '#e2e8f0', textAlign: 'left' }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.1rem', color: '#10b981' }}>Agronomic Recommendations</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {yieldResult.agronomic_recommendations && yieldResult.agronomic_recommendations.map((insight, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default YieldPrediction;
