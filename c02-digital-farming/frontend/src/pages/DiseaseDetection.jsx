import { useState } from 'react';

function DiseaseDetection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diseaseFile, setDiseaseFile] = useState(null);
  const [diseasePreview, setDiseasePreview] = useState(null);
  const [diseaseResult, setDiseaseResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDiseaseFile(file);
      setDiseasePreview(URL.createObjectURL(file));
      setDiseaseResult(null);
    }
  };

  const handleDiseaseSubmit = async (e) => {
    e.preventDefault();
    if (!diseaseFile) {
      setError("Please select an image first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setDiseaseResult(null);

    const formData = new FormData();
    formData.append('file', diseaseFile);

    try {
      const response = await fetch('http://127.0.0.1:8000/predict_disease', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to predict disease from the server');
      }

      const data = await response.json();
      setDiseaseResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <header className="page-header">
        <h2>Disease Detection</h2>
        <p>Upload a paddy leaf image to diagnose diseases</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleDiseaseSubmit} className="prediction-form glass-panel">
        <div className="form-group">
          <label>Upload Paddy Leaf Image</label>
          <div className="image-upload-container">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange} 
              id="disease-image-upload" 
              className="file-input"
            />
            <label htmlFor="disease-image-upload" className="file-upload-label">
              <span className="upload-icon">📷</span>
              <span>{diseaseFile ? diseaseFile.name : 'Choose an image'}</span>
            </label>
          </div>
          
          {diseasePreview && (
            <div className="image-preview" style={{ marginTop: '15px', textAlign: 'center' }}>
              <img 
                src={diseasePreview} 
                alt="Leaf preview" 
                style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} 
              />
            </div>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading || !diseaseFile}>
          {loading ? 'Analyzing Image...' : 'Diagnose Disease'}
        </button>
      </form>

      {diseaseResult && (
        <div className="result-card fade-in merged-results-card">
          <div className="merged-variety-section" style={{ width: '100%', textAlign: 'center' }}>
            <h2>Diagnosis Result</h2>
            
            <div className="variety-highlight" style={{ 
              fontSize: '2.5rem', 
              marginBottom: '5px', 
              color: diseaseResult.disease.toLowerCase() === 'healthy' ? '#10b981' : '#ef4444' 
            }}>
              {diseaseResult.disease}
            </div>
            
            <div style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '20px' }}>
              Type: {diseaseResult.disease_type}
            </div>
            
            <div className="confidence-meter" style={{ marginBottom: '25px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#cbd5e1' }}>Confidence Level</span>
                <span style={{ fontWeight: 'bold' }}>{diseaseResult.confidence.toFixed(2)}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${diseaseResult.confidence}%`,
                  background: diseaseResult.confidence > 80 ? '#10b981' : (diseaseResult.confidence > 50 ? '#fbbf24' : '#ef4444'),
                  transition: 'width 1s ease-in-out'
                }}></div>
              </div>
            </div>

            {diseaseResult.all_scores && Object.keys(diseaseResult.all_scores).length > 1 && (
              <div className="reasoning-box" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', color: '#e2e8f0', textAlign: 'left' }}>
                <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '1rem', color: '#fff' }}>Other Possibilities</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(diseaseResult.all_scores)
                    .filter(([name]) => name !== diseaseResult.disease)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3) // Show top 3 alternatives
                    .map(([name, score]) => (
                      <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{name}</span>
                        <span style={{ color: '#94a3b8' }}>{score.toFixed(1)}%</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DiseaseDetection;
