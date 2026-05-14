import React, { useState, useRef, useCallback } from 'react';
import { predictDisease } from '../services/api';
import { UploadCloud, Camera, Image as ImageIcon, AlertTriangle, CheckCircle, Info, Beaker, Clock, Repeat } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

const DiseaseDetectionContent = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await predictDisease(selectedImage);
      setResult(response);
    } catch (err) {
      console.error("DiseaseDetection: Analysis Error", err);
      setError("Failed to analyze image. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (category) => {
    const safe = String(category || '').toLowerCase();
    if (safe === 'healthy') return '#006D32';
    if (safe.includes('nutrient')) return '#f59e0b';
    return '#ef4444';
  };

  const reset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2>Disease Detection</h2>
        <p style={{ opacity: 0.7 }}>AI Powered Leaf Analysis</p>
      </header>

      {!result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Upload Area */}
          <div 
            className="glass-panel" 
            style={{ 
              padding: '3rem 1.5rem', 
              textAlign: 'center', 
              borderStyle: 'dashed',
              cursor: 'pointer',
              background: previewUrl ? 'none' : 'rgba(0, 109, 50, 0.03)'
            }}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
            
            {previewUrl ? (
              <div style={{ position: 'relative' }}>
                <img 
                  src={previewUrl} 
                  alt="Leaf Preview" 
                  style={{ width: '100%', maxHeight: '300px', borderRadius: '16px', objectFit: 'cover' }} 
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: '1rem', 
                  left: '50%', 
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  backdropFilter: 'blur(4px)'
                }}>
                  Tap to Change
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <div style={{ padding: '1.5rem', background: 'rgba(0, 109, 50, 0.05)', borderRadius: '50%' }}>
                  <ImageIcon size={48} color="var(--primary-green)" />
                </div>
                <h3 style={{ fontSize: '1.25rem' }}>Tap to Upload <br/> or Capture Leaf Image</h3>
              </div>
            )}
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '1.25rem' }}
            onClick={() => !loading && fileInputRef.current?.click()}
          >
            <Camera size={24} />
            Capture Photo
          </button>

          {selectedImage && !loading && (
             <button 
                className="btn" 
                style={{ width: '100%', background: 'var(--primary-green)', color: 'white' }}
                onClick={handleAnalyze}
             >
                Analyze Now
             </button>
          )}

          {loading && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
               <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', border: '4px solid var(--primary-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p>AI Model: MobileNetV2-CNN <br/> Processing Image...</p>
               </div>
            </div>
          )}

          {error && <div className="glass-panel" style={{ padding: '1rem', background: '#ef444410', color: '#ef4444', textAlign: 'center' }}>{error}</div>}

          <section>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>How it works?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               {[
                 { step: 1, text: "Upload or capture leaf image" },
                 { step: 2, text: "AI (MobileNetV2) analyzes features" },
                 { step: 3, text: "Get disease prediction & solution" }
               ].map(s => (
                 <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>{s.step}</div>
                    <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>{s.text}</p>
                 </div>
               ))}
            </div>
          </section>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           {/* Result Header */}
           <div className="glass-panel" style={{ 
             padding: '2rem', 
             textAlign: 'center', 
             background: `linear-gradient(135deg, ${getStatusColor(result.category)}10 0%, ${getStatusColor(result.category)}20 100%)`,
             borderTop: `6px solid ${getStatusColor(result.category)}`
           }}>
              <h3 style={{ color: getStatusColor(result.category), fontSize: '1.5rem', marginBottom: '0.25rem' }}>{result.disease}</h3>
              <p style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.7, marginBottom: '1.5rem' }}>Bipolaris oryzae</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                 <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', fontWeight: '600' }}>CONFIDENCE</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '800' }}>{(result.confidence * 100).toFixed(0)}%</p>
                 </div>
                 <div style={{ height: '30px', width: '1px', background: 'var(--current-border)' }} />
                 <div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', fontWeight: '600' }}>SEVERITY</p>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      fontWeight: '700', 
                      color: 'white', 
                      background: result.category === 'Healthy' ? '#10b981' : '#f59e0b',
                      padding: '4px 12px',
                      borderRadius: '8px'
                    }}>Moderate</span>
                 </div>
              </div>
           </div>

           {/* Image with Heatmap Placeholder */}
           <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
              <img src={previewUrl} alt="Analyzed Leaf" style={{ width: '100%', height: '250px', objectFit: 'cover' }} />
              {/* Bounding box mock */}
              <div style={{ 
                position: 'absolute', 
                top: '30%', 
                left: '20%', 
                width: '60px', 
                height: '40px', 
                border: '2px solid #ef4444',
                boxShadow: '0 0 10px #ef4444',
                background: 'rgba(239, 68, 68, 0.2)'
              }} />
              <div style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '60%', 
                width: '40px', 
                height: '30px', 
                border: '2px solid #ef4444',
                boxShadow: '0 0 10px #ef4444',
                background: 'rgba(239, 68, 68, 0.2)'
              }} />
           </div>

           {/* Treatment Protocol */}
           <section>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Recommended Treatment</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Beaker color="var(--primary-green)" />
                    <div>
                       <p style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)' }}>FUNGICIDE</p>
                       <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{result.fungicide || 'Propiconazole 25 EC'}</p>
                    </div>
                 </div>
                 <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Clock color="#3b82f6" />
                    <div>
                       <p style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)' }}>SPRAY TIMING</p>
                       <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Early morning or late evening</p>
                    </div>
                 </div>
                 <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Repeat color="#f59e0b" />
                    <div>
                       <p style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)' }}>REPEAT</p>
                       <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>Every 10-12 days if needed</p>
                    </div>
                 </div>
              </div>
           </section>

           <button className="btn btn-primary" style={{ width: '100%', padding: '1.25rem' }} onClick={reset}>
              Done & Scan Another
           </button>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const DiseaseDetection = () => (
  <ErrorBoundary>
    <DiseaseDetectionContent />
  </ErrorBoundary>
);

export default DiseaseDetection;
