import { useState } from 'react';
import { districtData } from '../data/constants';

function YieldPrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [yieldResult, setYieldResult] = useState(null);

  const [yieldData, setYieldData] = useState({
    District: 'Anuradhapura',
    Total_Land_Size: 1000,
    Land_Size_Unit: 'Hectares',
    Paddy_Type: 'Bg 352',
    Temperature_C: 28.5,
    Humidity: 75.0,
    Soil_Moisture: 0.3,
    isLiveIoT: false
  });

  const handleYieldChange = async (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    
    setYieldData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'isLiveIoT' && value) {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/sensor/latest');
        if (response.ok) {
          const data = await response.json();
          setYieldData(prev => ({
            ...prev,
            Temperature_C: data.temperature,
            Humidity: data.humidity,
            Soil_Moisture: data.soilMoisture / 100,
            timestamp: data.timestamp
          }));
        }
      } catch (err) {
        console.error("Failed to fetch live IoT data:", err);
      }
    }
  };

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
          Temperature_C: parseFloat(yieldData.Temperature_C),
          Humidity: parseFloat(yieldData.Humidity),
          Soil_Moisture: parseFloat(yieldData.Soil_Moisture)
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
        <div className="form-group">
          <label htmlFor="yield_district">District</label>
          <select name="District" id="yield_district" value={yieldData.District} onChange={handleYieldChange}>
            {Object.keys(districtData).map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>

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

        <div className="iot-panel">
          <h3>Environmental Factors</h3>
          <div className="toggle-group">
            <label>
              <input 
                type="checkbox" 
                name="isLiveIoT" 
                checked={yieldData.isLiveIoT} 
                onChange={handleYieldChange} 
              /> Use Live IoT Feed
            </label>
          </div>
          
          {!yieldData.isLiveIoT ? (
            <div className="form-row mt-2">
              <div className="form-group">
                <label>Temp (°C)</label>
                <input type="number" step="0.1" name="Temperature_C" value={yieldData.Temperature_C} onChange={handleYieldChange} />
              </div>
              <div className="form-group">
                <label>Humidity (%)</label>
                <input type="number" step="0.1" name="Humidity" value={yieldData.Humidity} onChange={handleYieldChange} />
              </div>
              <div className="form-group">
                <label>Soil Moisture</label>
                <input type="number" step="0.01" name="Soil_Moisture" value={yieldData.Soil_Moisture} onChange={handleYieldChange} />
              </div>
            </div>
          ) : (
            <div className="live-iot-indicator mt-2" style={{ textAlign: 'left' }}>
              <p style={{ marginBottom: '10px' }}><span className="pulsing-dot"></span> <strong>Live Data Connected</strong></p>
              <div className="form-row mt-2">
                <div className="form-group">
                  <label>Temp (°C)</label>
                  <input type="number" value={yieldData.Temperature_C} readOnly style={{ backgroundColor: '#e9ecef', color: '#495057' }} />
                </div>
                <div className="form-group">
                  <label>Humidity (%)</label>
                  <input type="number" value={yieldData.Humidity} readOnly style={{ backgroundColor: '#e9ecef', color: '#495057' }} />
                </div>
                <div className="form-group">
                  <label>Soil Moisture</label>
                  <input type="number" value={yieldData.Soil_Moisture} readOnly style={{ backgroundColor: '#e9ecef', color: '#495057' }} />
                </div>
              </div>
              {yieldData.timestamp && <p style={{ fontSize: '0.85em', color: '#6c757d', marginTop: '10px' }}>Last updated: {yieldData.timestamp}</p>}
            </div>
          )}
        </div>

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
              <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1.1rem', color: '#fff' }}>Agronomic Insights</h3>
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
