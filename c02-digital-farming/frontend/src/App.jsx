import { useState, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import './App.css'

const districtData = {
  "Anuradhapura": [
    { name: "Anuradhapura City", lat: 8.3114, lon: 80.4037 },
    { name: "Kekirawa", lat: 8.0411, lon: 80.5925 },
    { name: "Tambuttegama", lat: 8.1492, lon: 80.2981 }
  ],
  "Polonnaruwa": [
    { name: "Polonnaruwa City", lat: 7.9403, lon: 81.0188 },
    { name: "Hingurakgoda", lat: 8.0551, lon: 80.9806 },
    { name: "Medirigiriya", lat: 8.1444, lon: 80.9866 }
  ],
  "Ampara": [
    { name: "Ampara City", lat: 7.2840, lon: 81.6747 },
    { name: "Akkaraipattu", lat: 7.2198, lon: 81.8485 },
    { name: "Dehiattakandiya", lat: 7.6409, lon: 81.0253 }
  ],
  "Kurunegala": [
    { name: "Kurunegala City", lat: 7.4818, lon: 80.3609 },
    { name: "Kuliyapitiya", lat: 7.4674, lon: 80.0401 }
  ],
  "Hambantota": [
    { name: "Hambantota City", lat: 6.1248, lon: 81.1185 },
    { name: "Tangalle", lat: 6.0246, lon: 80.7963 },
    { name: "Tissamaharama", lat: 6.2785, lon: 81.2863 }
  ],
  "Trincomalee": [
    { name: "Trincomalee City", lat: 8.5711, lon: 81.2330 },
    { name: "Kinniya", lat: 8.5146, lon: 81.1830 },
    { name: "Mutur", lat: 8.4552, lon: 81.2662 }
  ],
  "Batticaloa": [
    { name: "Batticaloa City", lat: 7.7102, lon: 81.6924 },
    { name: "Kattankudy", lat: 7.6746, lon: 81.7225 }
  ],
  "Puttalam": [
    { name: "Puttalam City", lat: 8.0362, lon: 79.8283 },
    { name: "Chilaw", lat: 7.5755, lon: 79.7993 }
  ],
  "Mannar": [
    { name: "Mannar City", lat: 8.9810, lon: 79.9044 },
    { name: "Murunkan", lat: 8.8184, lon: 80.0261 }
  ],
  "Vavuniya": [
    { name: "Vavuniya City", lat: 8.7542, lon: 80.4982 },
    { name: "Cheddikulam", lat: 8.6811, lon: 80.2588 }
  ],
  "Kilinochchi": [
    { name: "Kilinochchi City", lat: 9.3803, lon: 80.3770 },
    { name: "Pallai", lat: 9.5393, lon: 80.3444 }
  ],
  "Mullaitivu": [
    { name: "Mullaitivu City", lat: 9.2671, lon: 80.8142 },
    { name: "Puthukkudiyiruppu", lat: 9.3179, lon: 80.6698 }
  ],
  "Jaffna": [
    { name: "Jaffna City", lat: 9.6615, lon: 80.0255 },
    { name: "Chavakachcheri", lat: 9.6586, lon: 80.1601 }
  ],
  "Moneragala": [
    { name: "Moneragala City", lat: 6.8728, lon: 81.3507 },
    { name: "Bibile", lat: 7.1659, lon: 81.2319 },
    { name: "Wellawaya", lat: 6.7371, lon: 81.1039 }
  ],
  "Badulla": [
    { name: "Badulla City", lat: 6.9819, lon: 81.0559 },
    { name: "Bandarawela", lat: 6.8301, lon: 80.9982 }
  ],
  "Matale": [
    { name: "Matale City", lat: 7.4675, lon: 80.6234 },
    { name: "Dambulla", lat: 7.8596, lon: 80.6517 }
  ],
  "Kandy": [
    { name: "Kandy City", lat: 7.2906, lon: 80.6337 },
    { name: "Gampola", lat: 7.1633, lon: 80.5739 }
  ],
  "Nuwara Eliya": [
    { name: "Nuwara Eliya City", lat: 6.9497, lon: 80.7828 },
    { name: "Hatton", lat: 6.8893, lon: 80.5968 }
  ],
  "Kegalle": [
    { name: "Kegalle City", lat: 7.2513, lon: 80.3464 },
    { name: "Mawanella", lat: 7.2515, lon: 80.4449 }
  ],
  "Ratnapura": [
    { name: "Ratnapura City", lat: 6.7055, lon: 80.3847 },
    { name: "Balangoda", lat: 6.6508, lon: 80.6974 },
    { name: "Embilipitiya", lat: 6.3458, lon: 80.8407 }
  ],
  "Colombo": [
    { name: "Colombo City", lat: 6.9271, lon: 79.8612 },
    { name: "Avissawella", lat: 6.9530, lon: 80.2078 }
  ],
  "Gampaha": [
    { name: "Gampaha City", lat: 7.0840, lon: 80.0098 },
    { name: "Negombo", lat: 7.2091, lon: 79.8358 }
  ],
  "Kalutara": [
    { name: "Kalutara City", lat: 6.5854, lon: 79.9607 },
    { name: "Mathugama", lat: 6.5167, lon: 80.1167 }
  ],
  "Galle": [
    { name: "Galle City", lat: 6.0535, lon: 80.2210 },
    { name: "Elpitiya", lat: 6.2709, lon: 80.1419 }
  ],
  "Matara": [
    { name: "Matara City", lat: 5.9549, lon: 80.5469 },
    { name: "Akuressa", lat: 6.0963, lon: 80.4853 }
  ]
}

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '12px',
  marginBottom: '15px'
}

function App() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    // googleMapsApiKey: "AIzaSyCfNslBQ-Q_czbhuPrr0oqmbMPbGZmoARc"
  })

  const [activeTab, setActiveTab] = useState('variety') // 'variety' or 'suitability'

  // Form State for Variety Prediction
  const [varietyData, setVarietyData] = useState({
    District: 'Anuradhapura',
    Zone: 'Dry Zone',
    Season: 'Annual',
    Salinity_Prone: 'No',
    Iron_Toxicity_Prone: 'No'
  })

  // Form State for Suitability Prediction
  const [suitabilityData, setSuitabilityData] = useState({
    field_id: 'field_001',
    district: 'Anuradhapura',
    city: 'Anuradhapura City',
    lat: districtData["Anuradhapura"][0].lat,
    lon: districtData["Anuradhapura"][0].lon
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [suitabilityResult, setSuitabilityResult] = useState(null)
  const [error, setError] = useState(null)

  const handleVarietyChange = (e) => {
    setVarietyData({
      ...varietyData,
      [e.target.name]: e.target.value
    })
  }

  const handleSuitabilityChange = (e) => {
    const { name, value } = e.target
    if (name === 'district') {
      // Find the first city in this newly selected district to set as default
      const defaultCity = districtData[value][0]
      setSuitabilityData({
        ...suitabilityData,
        district: value,
        city: defaultCity.name,
        lat: defaultCity.lat,
        lon: defaultCity.lon
      })
    } else if (name === 'city') {
      // Find the selected city in the current district array to get its coordinates
      const selectedCityObj = districtData[suitabilityData.district].find(c => c.name === value)
      if (selectedCityObj) {
        setSuitabilityData({
          ...suitabilityData,
          city: value,
          lat: selectedCityObj.lat,
          lon: selectedCityObj.lon
        })
      }
    } else {
      setSuitabilityData({
        ...suitabilityData,
        [name]: value
      })
    }
  }

  const onMapClick = (e) => {
    setSuitabilityData({
      ...suitabilityData,
      lat: e.latLng.lat(),
      lon: e.latLng.lng()
    })
  }

  const handleVarietySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(varietyData),
      })

      if (!response.ok) {
        throw new Error('Failed to get prediction from the server')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSuitabilitySubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuitabilityResult(null)

    try {
      const queryParams = new URLSearchParams({
        field_id: suitabilityData.field_id,
        lat: suitabilityData.lat,
        lon: suitabilityData.lon
      }).toString()

      const response = await fetch(`http://127.0.0.1:8000/predict_suitability?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get suitability prediction from the server')
      }

      const data = await response.json()
      setSuitabilityResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <div className="glass-panel">
        <header>
          <h1>🌾 Farmer Advisory System</h1>
          <p>Predict optimal Paddy Varieties & Check Field Suitability</p>
        </header>

        <div className="tabs">
          <button
            className={activeTab === 'variety' ? 'active-tab' : 'tab'}
            onClick={() => { setActiveTab('variety'); setError(null); setResult(null); setSuitabilityResult(null); }}
          >
            Variety Prediction
          </button>
          <button
            className={activeTab === 'suitability' ? 'active-tab' : 'tab'}
            onClick={() => { setActiveTab('suitability'); setError(null); setResult(null); setSuitabilityResult(null); }}
          >
            IoT Suitability
          </button>
        </div>

        <main>
          {activeTab === 'variety' ? (
            <>
              <form onSubmit={handleVarietySubmit} className="prediction-form fade-in">
                <div className="form-group">
                  <label htmlFor="District">District</label>
                  <select name="District" id="District" value={varietyData.District} onChange={handleVarietyChange}>
                    {Object.keys(districtData).map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="Zone">Climatic Zone</label>
                  <select name="Zone" id="Zone" value={varietyData.Zone} onChange={handleVarietyChange}>
                    <option value="Dry Zone">Dry Zone</option>
                    <option value="Wet Zone">Wet Zone</option>
                    <option value="Intermediate Zone">Intermediate Zone</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="Season">Cultivation Season</label>
                  <select name="Season" id="Season" value={varietyData.Season} onChange={handleVarietyChange}>
                    <option value="Maha">Maha</option>
                    <option value="Yala">Yala</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="Salinity_Prone">Salinity Prone</label>
                    <select name="Salinity_Prone" id="Salinity_Prone" value={varietyData.Salinity_Prone} onChange={handleVarietyChange}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="Iron_Toxicity_Prone">Iron Toxicity Prone</label>
                    <select name="Iron_Toxicity_Prone" id="Iron_Toxicity_Prone" value={varietyData.Iron_Toxicity_Prone} onChange={handleVarietyChange}>
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Predicting...' : 'Get Recommendation'}
                </button>
              </form>

              {result && (
                <div className="result-card fade-in">
                  <h2>Recommended Variety</h2>
                  <div className="variety-highlight">
                    {result.predicted_variety_code}
                  </div>

                  {result.details && (
                    <div className="variety-details">
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
            </>
          ) : (
            <>
              <form onSubmit={handleSuitabilitySubmit} className="prediction-form fade-in">
                <div className="form-group">
                  <label htmlFor="field_id">ESP32 Field ID (Firebase node)</label>
                  <input type="text" name="field_id" id="field_id" value={suitabilityData.field_id} onChange={handleSuitabilityChange} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="district">District</label>
                    <select name="district" id="district" value={suitabilityData.district} onChange={handleSuitabilityChange}>
                      {Object.keys(districtData).map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City / Area</label>
                    <select name="city" id="city" value={suitabilityData.city} onChange={handleSuitabilityChange}>
                      {districtData[suitabilityData.district].map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isLoaded && (
                  <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '15px' }}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={{ lat: suitabilityData.lat, lng: suitabilityData.lon }}
                      zoom={9}
                      onClick={onMapClick}
                    >
                      <Marker position={{ lat: suitabilityData.lat, lng: suitabilityData.lon }} />
                    </GoogleMap>
                  </div>
                )}
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8', marginTop: '-5px', marginBottom: '15px' }}>
                  Selected Coord: {suitabilityData.lat.toFixed(4)}, {suitabilityData.lon.toFixed(4)}
                  <br />
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>(Click on the map to place custom pin)</span>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Fetching IoT Data & Predicting...' : 'Check Suitability'}
                </button>
              </form>

              {suitabilityResult && (
                <div className="result-card fade-in">
                  <h2>Yield Suitability Score: {suitabilityResult.suitability_score} / 5</h2>
                  <p style={{ fontStyle: 'italic', color: '#555', marginBottom: '15px' }}>(1 is Best, 5 is Worst)</p>

                  <div className="variety-details">
                    <div className="detail-item" style={{ width: '100%' }}>
                      <span className="label">Reasoning</span>
                      <span className="value">{suitabilityResult.reasoning}</span>
                    </div>

                    <div className="detail-item">
                      <span className="label">Combined Temp</span>
                      <span className="value">{suitabilityResult.metrics.temperature}°C</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Combined Humidity</span>
                      <span className="value">{suitabilityResult.metrics.humidity}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Soil Moisture</span>
                      <span className="value">{suitabilityResult.metrics.soil_moisture} m³/m³</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {error && <div className="error-message">{error}</div>}
        </main>
      </div>
    </div>
  )
}

export default App
