import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PADDY_VARIETIES_KB } from '../data/paddy_varieties_kb';
import { recommendVariety } from '../services/api';
import { 
  Sprout, 
  Info, 
  Search, 
  Loader, 
  X, 
  Award, 
  Shield, 
  Star, 
  Sliders, 
  Droplet, 
  TrendingUp, 
  BookOpen, 
  MapPin, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

const DISTRICTS_BY_ZONE = {
  "Dry Zone": ["Anuradhapura", "Polonnaruwa", "Kurunegala", "Hambantota", "Monaragala", "Ampara", "Trincomalee"],
  "Wet Zone": ["Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Kalutara", "Colombo", "Ratnapura", "Kegalle", "Badulla"]
};

const tPage = (key, isSi) => {
  const translations = {
    title: {
      en: "Paddy Variety Knowledge Base & AI Classifier",
      si: "වී ප්‍රභේද විශ්වකෝෂය සහ AI වර්ගීකාරකය"
    },
    subtitle: {
      en: "Explore Sri Lankan paddy varieties and predict suitability using AI classification models.",
      si: "ශ්‍රී ලංකාවේ වී ප්‍රභේද ගවේෂණය කර AI වර්ගීකරණ මාදිලි මඟින් ගැලපීම පුරෝකථනය කරන්න."
    },
    tabKb: {
      en: "Knowledge Base Browser",
      si: "ප්‍රභේද විශ්වකෝෂය"
    },
    tabRec: {
      en: "AI Variety Matcher",
      si: "AI නිර්දේශකය"
    },
    searchPlaceholder: {
      en: "Search by code, name, category, or grain type...",
      si: "කේතය, නම, කාණ්ඩය හෝ සහල් වර්ගය අනුව සොයන්න..."
    },
    filterAll: {
      en: "All Varieties",
      si: "සියලුම ප්‍රභේද"
    },
    duration: {
      en: "Duration",
      si: "වර්ධන කාලය"
    },
    expectedYield: {
      en: "Expected Yield",
      si: "අපේක්ෂිත අස්වැන්න"
    },
    waterNeed: {
      en: "Water Need",
      si: "ජල අවශ්‍යතාවය"
    },
    viewMore: {
      en: "View Details",
      si: "වැඩිදුර විස්තර"
    },
    setupTitle: {
      en: "AI Matching Setup",
      si: "AI ගැලපුම් සැකසුම"
    },
    setupDesc: {
      en: "Enter your cultivation parameters to run the machine learning recommendation model.",
      si: "ප්‍රශස්ත වී නිර්දේශ ලබා ගැනීමට ඔබගේ වගා පරාමිතීන් ඇතුළත් කරන්න."
    },
    seasonLabel: {
      en: "Cultivation Season",
      si: "වගා කන්නය"
    },
    zoneLabel: {
      en: "Agricultural Zone",
      si: "කෘෂිකාර්මික කලාපය"
    },
    districtLabel: {
      en: "District",
      si: "දිස්ත්‍රික්කය"
    },
    fieldAreaLabel: {
      en: "Paddy Field Size (Hectares)",
      si: "කුඹුරේ ප්‍රමාණය (හෙක්ටයාර)"
    },
    btnRecommend: {
      en: "Find Best Varieties",
      si: "ගැලපෙනම ප්‍රභේද සොයන්න"
    },
    recommending: {
      en: "AI Engine Analyzing Climate & Soil...",
      si: "AI පද්ධතිය දේශගුණය සහ පස විශ්ලේෂණය කරයි..."
    },
    bestChoice: {
      en: "Best AI Choice",
      si: "හොඳම AI තේරීම"
    },
    alternativeChoice: {
      en: "Alternative Option",
      si: "විකල්ප ප්‍රභේදය"
    },
    matchConfidence: {
      en: "Match Confidence",
      si: "ගැලපුම් විශ්වාසනීයත්වය"
    },
    predictedYield: {
      en: "Predicted Yield (ML)",
      si: "පුරෝකථනය කළ අස්වැන්න (ML)"
    },
    stationLabel: {
      en: "Research Station",
      si: "පර්යේෂණ මධ්‍යස්ථානය"
    },
    sourceLabel: {
      en: "Official Source",
      si: "නිල මූලාශ්‍රය"
    },
    diseaseResistance: {
      en: "Disease Resistance Profile",
      si: "රෝග ප්‍රතිරෝධතා පැතිකඩ"
    },
    advantagesTitle: {
      en: "Key Advantages",
      si: "ප්‍රධාන වාසි"
    },
    limitationsTitle: {
      en: "Limitations / Challenges",
      si: "සීමාවන් සහ අභියෝග"
    },
    farmerRecTitle: {
      en: "Farmer Guidelines",
      si: "ගොවීන් සඳහා මාර්ගෝපදේශ"
    },
    waterFertilizerTitle: {
      en: "Water & Fertilizer Requirements",
      si: "ජල සහ පොහොර අවශ්‍යතා"
    },
    millingMarketTitle: {
      en: "Milling & Market Profile",
      si: "නිෂ්පාදන සහ වෙළඳපොළ"
    },
    noResults: {
      en: "No varieties found matching your criteria.",
      si: "ඔබ සොයන නිර්ණායකවලට ගැළපෙන වී ප්‍රභේද හමු නොවීය."
    },
    close: {
      en: "Close",
      si: "වසා දමන්න"
    }
  };
  return translations[key]?.[isSi ? 'si' : 'en'] || key;
};

// Compact variety cards for browser
const VarietyCompactCard = ({ variety, onOpenModal, isSi }) => {
  const defaultImage = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=400&q=80";
  const imageSrc = variety.images?.paddy_field || variety.images?.plant || defaultImage;

  return (
    <div className="glass-panel" style={{ 
      borderRadius: '16px', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      border: '1px solid var(--current-border)'
    }}>
      <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
        <img 
          src={imageSrc} 
          alt={variety.english_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
        <div style={{ 
          position: 'absolute', 
          top: '12px', 
          right: '12px', 
          background: 'rgba(0,0,0,0.6)', 
          backdropFilter: 'blur(4px)',
          color: 'white', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          fontSize: '0.75rem', 
          fontWeight: 'bold' 
        }}>
          {variety.category}
        </div>
      </div>

      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--primary-green)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isSi ? variety.rice_type_sinhala : variety.rice_type_english}
          </span>
          <h3 style={{ fontSize: '1.1rem', marginTop: '2px', color: 'var(--current-text)' }}>
            {isSi ? variety.sinhala_name : variety.english_name}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem' }}>
          <div>
            <span style={{ color: 'var(--current-text-sec)', display: 'block', fontSize: '0.7rem' }}>
              {tPage("duration", isSi)}
            </span>
            <strong style={{ color: 'var(--current-text)' }}>{variety.duration_days} Days ({variety.age_group})</strong>
          </div>
          <div>
            <span style={{ color: 'var(--current-text-sec)', display: 'block', fontSize: '0.7rem' }}>
              {tPage("expectedYield", isSi)}
            </span>
            <strong style={{ color: 'var(--current-text)' }}>{variety.expected_yield_t_ha} t/ha</strong>
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <button 
            onClick={() => onOpenModal(variety)}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '8px' }}
          >
            <BookOpen size={14} />
            <span>{tPage("viewMore", isSi)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Rich recommendation card
const RecommendationCard = ({ recommendation, varietyDetail, onOpenModal, index, isSi, isMobile }) => {
  const defaultImage = "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=600&q=80";
  const imageSrc = varietyDetail?.images?.paddy_field || varietyDetail?.images?.plant || defaultImage;
  
  const isBestChoice = index === 0;

  return (
    <div className="glass-panel fade-in" style={{
      borderRadius: '24px',
      overflow: 'hidden',
      border: isBestChoice ? '2px solid var(--primary-green)' : '1px solid var(--current-border)',
      background: isBestChoice ? 'rgba(0, 109, 50, 0.02)' : 'var(--current-card)',
      boxShadow: isBestChoice ? '0 10px 25px -5px rgba(0, 109, 50, 0.1)' : 'var(--shadow-md)',
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '260px 1fr',
      gap: '1.5rem',
      marginBottom: '1.5rem'
    }}>
      {/* Visual Header / Image side */}
      <div style={{ position: 'relative', height: isMobile ? '160px' : '100%', minHeight: isMobile ? '160px' : '260px' }}>
        <img 
          src={imageSrc} 
          alt={recommendation.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {isBestChoice && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            backgroundColor: 'var(--primary-green)',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Award size={14} />
            {tPage("bestChoice", isSi)}
          </div>
        )}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          fontWeight: 'bold'
        }}>
          {varietyDetail?.category || recommendation.id}
        </div>
      </div>

      {/* Info details side */}
      <div style={{ padding: isMobile ? '1rem 1.25rem' : '1.5rem 2rem 1.5rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '0.5rem' : '0' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-green)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isSi ? varietyDetail?.rice_type_sinhala : varietyDetail?.rice_type_english}
              </span>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--current-text)', margin: '4px 0' }}>
                {isSi ? varietyDetail?.sinhala_name : varietyDetail?.english_name}
                <span style={{ fontSize: '0.85rem', color: 'var(--current-text-sec)', marginLeft: '8px', fontWeight: '500' }}>
                  ({recommendation.id})
                </span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--current-text-sec)' }}>
                {isSi ? varietyDetail?.research_station?.sinhala : varietyDetail?.research_station?.english}
              </p>
            </div>
            
            <div style={{ textAlign: isMobile ? 'left' : 'right' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', display: 'block' }}>
                {tPage("matchConfidence", isSi)}
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary-green)' }}>
                {recommendation.score}%
              </span>
            </div>
          </div>

          {/* AI Reason/Explanation */}
          <div style={{ 
            background: 'rgba(0, 109, 50, 0.04)', 
            borderLeft: '4px solid var(--primary-green)',
            padding: '0.75rem 1rem', 
            borderRadius: '0 8px 8px 0',
            fontSize: '0.85rem',
            margin: '1rem 0'
          }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--current-text)' }}>
              <strong>AI Recommendation:</strong> {recommendation.reason}
            </p>
          </div>

          {/* Core Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', margin: '1rem 0' }}>
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem 0.75rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--current-text-sec)', display: 'block' }}>Duration</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--current-text)' }}>{recommendation.growing_days} Days ({varietyDetail?.age_group || '3 Months'})</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem 0.75rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--current-text-sec)', display: 'block' }}>Expected Yield</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--current-text)' }}>{varietyDetail?.expected_yield_t_ha} t/ha</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem 0.75rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--current-text-sec)', display: 'block' }}>{tPage("predictedYield", isSi)}</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--primary-green)' }}>{recommendation.predicted_yield_t_ha} t/ha</strong>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.5rem 0.75rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--current-text-sec)', display: 'block' }}>Water Need</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--current-text)' }}>{isSi ? varietyDetail?.water_requirement?.sinhala : varietyDetail?.water_requirement?.english}</strong>
            </div>
          </div>

          {/* Disease Resistance Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', margin: '1rem 0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--current-text-sec)' }}>Disease Resistance:</span>
            {Object.entries(varietyDetail?.disease_resistance || {}).map(([disease, resLevel]) => {
              const resColor = resLevel === 'High' ? '#10b981' : resLevel === 'Medium' ? '#f59e0b' : '#ef4444';
              const resBg = resLevel === 'High' ? 'rgba(16, 185, 129, 0.1)' : resLevel === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)';
              return (
                <span 
                  key={disease} 
                  style={{
                    backgroundColor: resBg,
                    color: resColor,
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Shield size={10} />
                  {disease}: {isSi ? (varietyDetail.disease_resistance_sinhala?.[disease] || resLevel) : resLevel}
                </span>
              );
            })}
          </div>

          {/* Market demand / Popularity */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--current-text-sec)' }}>Market Demand:</span>
              <strong style={{ color: 'var(--current-text)' }}>{isSi ? varietyDetail?.market_demand?.sinhala : varietyDetail?.market_demand?.english}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--current-text-sec)' }}>Popularity:</span>
              <strong style={{ color: 'var(--current-text)' }}>{isSi ? varietyDetail?.popularity?.sinhala : varietyDetail?.popularity?.english}</strong>
            </div>
          </div>
        </div>

        {/* Action area */}
        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => onOpenModal(varietyDetail)}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', borderRadius: '10px' }}
          >
            <BookOpen size={14} />
            <span>{tPage("viewMore", isSi)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Full-screen Detail Modal component
const DetailModal = ({ variety, onClose, isSi, isMobile }) => {
  const [activeImgTab, setActiveImgTab] = useState('paddy_field');
  
  if (!variety) return null;
  
  const defaultImage = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80";
  const getImgUrl = (tab) => {
    return variety.images?.[tab] || defaultImage;
  };
  
  const imgTabs = [
    { id: 'paddy_field', label: isSi ? 'කුඹුර' : 'Field' },
    { id: 'plant', label: isSi ? 'පැලය' : 'Plant' },
    { id: 'rice', label: isSi ? 'සහල්' : 'Rice' },
    { id: 'seed', label: isSi ? 'බීජ' : 'Seed' },
    { id: 'harvest', label: isSi ? 'අස්වැන්න' : 'Harvest' }
  ].filter(tab => variety.images?.[tab.id]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: isMobile ? '0.75rem' : '1.5rem'
    }}>
      <div className="glass-panel fade-in" style={{
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '95vh',
        overflowY: 'auto',
        borderRadius: '24px',
        background: 'var(--current-card)',
        border: '1px solid var(--current-border)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--current-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'var(--current-card)',
          zIndex: 10
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge" style={{ backgroundColor: 'var(--primary-green)', color: 'white' }}>
                {variety.category}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--current-text-sec)', fontWeight: 'bold' }}>
                {variety.code}
              </span>
            </div>
            <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', color: 'var(--current-text)', marginTop: '4px' }}>
              {isSi ? variety.sinhala_name : variety.english_name}
            </h2>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'rgba(0,0,0,0.05)', 
              border: 'none', 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              color: 'var(--current-text)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: isMobile ? '1.25rem' : '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main Visual & Details section */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '400px 1fr', gap: '2rem' }}>
            
            {/* Gallery area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ height: '240px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--current-border)' }}>
                <img 
                  src={getImgUrl(activeImgTab)} 
                  alt={variety.english_name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              
              {imgTabs.length > 1 && (
                <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
                  {imgTabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveImgTab(t.id)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        background: activeImgTab === t.id ? 'var(--primary-green)' : 'rgba(0,0,0,0.03)',
                        color: activeImgTab === t.id ? 'white' : 'var(--current-text-sec)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Overview / General description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span className="badge" style={{ backgroundColor: 'rgba(0,109,50,0.1)', color: 'var(--primary-green)', marginBottom: '0.5rem', display: 'inline-block' }}>
                  {isSi ? variety.rice_type_sinhala : variety.rice_type_english}
                </span>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--current-text)' }}>
                  {isSi ? variety.short_description_sinhala : variety.short_description_english}
                </p>
              </div>

              {/* Research Station Info */}
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)', display: 'block', fontWeight: 'bold' }}>
                  {tPage("stationLabel", isSi)}
                </span>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'var(--current-text)' }}>
                  {isSi ? variety.research_station?.sinhala : variety.research_station?.english}
                </p>
              </div>

              {/* DOA Source */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>
                  {tPage("sourceLabel", isSi)}: <strong>{variety.official_source || "Department of Agriculture"}</strong>
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--current-border)' }} />

          {/* Quick Specifications Grid */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--current-text)' }}>
              {isSi ? "තාක්ෂණික පිරිවිතරයන්" : "Technical Specifications"}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ border: '1px solid var(--current-border)', padding: '0.85rem 1rem', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', display: 'block' }}>Growing Duration</span>
                <strong style={{ fontSize: '1rem', color: 'var(--current-text)' }}>{variety.duration_days} Days ({variety.age_group})</strong>
              </div>
              <div style={{ border: '1px solid var(--current-border)', padding: '0.85rem 1rem', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', display: 'block' }}>Expected Yield (t/ha)</span>
                <strong style={{ fontSize: '1rem', color: 'var(--current-text)' }}>{variety.expected_yield_t_ha} t/ha</strong>
              </div>
              <div style={{ border: '1px solid var(--current-border)', padding: '0.85rem 1rem', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', display: 'block' }}>Expected Yield (kg/acre)</span>
                <strong style={{ fontSize: '1rem', color: 'var(--current-text)' }}>{variety.expected_yield_kg_acre} kg/Acre</strong>
              </div>
              <div style={{ border: '1px solid var(--current-border)', padding: '0.85rem 1rem', borderRadius: '16px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--current-text-sec)', display: 'block' }}>Suitable Season</span>
                <strong style={{ fontSize: '1rem', color: 'var(--current-text)' }}>
                  {isSi ? variety.season_sinhala?.join(', ') : variety.suitable_season?.join(', ')}
                </strong>
              </div>
            </div>
          </div>

          {/* Disease Resistance Profile */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
            
            {/* Disease Resistance */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--current-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={16} color="var(--primary-green)" />
                {tPage("diseaseResistance", isSi)}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(variety.disease_resistance || {}).map(([disease, resLevel]) => {
                  const resColor = resLevel === 'High' ? '#10b981' : resLevel === 'Medium' ? '#f59e0b' : '#ef4444';
                  const pct = resLevel === 'High' ? 100 : resLevel === 'Medium' ? 60 : 25;
                  return (
                    <div key={disease} style={{ background: 'rgba(0,0,0,0.01)', padding: '0.75rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: '600', color: 'var(--current-text)' }}>{disease}</span>
                        <span style={{ color: resColor, fontWeight: 'bold' }}>
                          {isSi ? (variety.disease_resistance_sinhala?.[disease] || resLevel) : resLevel}
                        </span>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: resColor, borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Advantages and Limitations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#10b981', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} />
                  {tPage("advantagesTitle", isSi)}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(isSi ? variety.advantages_sinhala : variety.advantages || []).map((adv, i) => (
                    <span key={i} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {adv}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#ef4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} />
                  {tPage("limitationsTitle", isSi)}
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(isSi ? variety.limitations_sinhala : variety.limitations || []).map((lim, i) => (
                    <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {lim}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--current-border)' }} />

          {/* Water & Fertilizer & Market details */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
            
            {/* Water and Fertilizer */}
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--current-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplet size={16} color="var(--accent-blue)" />
                {tPage("waterFertilizerTitle", isSi)}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--current-text)' }}>
                <p>
                  <strong>{tPage("waterNeed", isSi)}:</strong> {isSi ? variety.water_requirement?.sinhala : variety.water_requirement?.english}
                </p>
                <p>
                  <strong>Fertilizer Plan:</strong> {isSi ? variety.fertilizer_requirement?.sinhala : variety.fertilizer_requirement?.english}
                </p>
                <p>
                  <strong>Best for:</strong> {isSi ? variety.best_for?.sinhala : variety.best_for?.english}
                </p>
              </div>
            </div>

            {/* Milling & Market */}
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderRadius: '16px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--current-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--accent-yellow)" />
                {tPage("millingMarketTitle", isSi)}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--current-text)' }}>
                <p>
                  <strong>Grain/Rice Quality:</strong> {isSi ? variety.grain_quality?.sinhala : variety.grain_quality?.english}
                </p>
                <p>
                  <strong>Market Demand:</strong> {isSi ? variety.market_demand?.sinhala : variety.market_demand?.english}
                </p>
                <p>
                  <strong>Popularity:</strong> {isSi ? variety.popularity?.sinhala : variety.popularity?.english}
                </p>
              </div>
            </div>

          </div>

          {/* Farmer Guideline Recommendation Text */}
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed var(--primary-green)', padding: '1.25rem 1.5rem', borderRadius: '16px' }}>
            <h4 style={{ color: 'var(--primary-green)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
              <Info size={14} />
              {tPage("farmerRecTitle", isSi)}
            </h4>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--current-text)' }}>
              {isSi ? variety.farmer_recommendation_sinhala : variety.farmer_recommendation}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

const VarietyRecommendation = () => {
  const { i18n } = useTranslation();
  const isSi = i18n.language === 'si';

  const [activeTab, setActiveTab] = useState('kb'); // 'kb' or 'rec'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVariety, setSelectedVariety] = useState(null);
  
  // Recommendation state
  const [recSeason, setRecSeason] = useState("Maha");
  const [recZone, setRecZone] = useState("Dry Zone");
  const [recDistrict, setRecDistrict] = useState("Anuradhapura");
  const [recFieldArea, setRecFieldArea] = useState(1.5);
  const [recommendations, setRecommendations] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update district when zone changes
  useEffect(() => {
    const defaultDistrict = DISTRICTS_BY_ZONE[recZone]?.[0] || "";
    setRecDistrict(defaultDistrict);
  }, [recZone]);

  const handleRunAIRecommendation = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      const payload = {
        season: recSeason,
        zone: recZone,
        district: recDistrict,
        field_area_hectares: parseFloat(recFieldArea) || 1.5
      };
      const res = await recommendVariety(payload);
      if (res && res.ranked_recommendations) {
        setRecommendations(res.ranked_recommendations);
      }
    } catch (err) {
      console.error(err);
      alert(isSi ? "AI නිර්දේශ ලබා ගැනීමේදී දෝෂයක් සිදු විය. කරුණාකර backend එක ක්‍රියාත්මක දැයි පරීක්ෂා කරන්න." : "Error fetching AI recommendations. Please check if backend is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter local KB varieties
  const kbVarieties = Object.values(PADDY_VARIETIES_KB).filter(v => {
    const matchCategory = selectedCategory === 'All' || v.category === selectedCategory;
    const matchSearch = searchQuery.trim() === '' || 
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.english_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sinhala_name.includes(searchQuery) ||
      (v.rice_type_english && v.rice_type_english.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.rice_type_sinhala && v.rice_type_sinhala.includes(searchQuery));
    return matchCategory && matchSearch;
  });

  const categories = [
    { id: 'All', labelEn: 'All Varieties', labelSi: 'සියලුම ප්‍රභේද' },
    { id: 'BG', labelEn: 'BG Series', labelSi: 'බීජී (RRDI)' },
    { id: 'BW', labelEn: 'BW Series', labelSi: 'බීඩබ්ලිව් (Bambalapitiya)' },
    { id: 'LD', labelEn: 'LD Series', labelSi: 'එල්ඩී (Labuduwa)' },
    { id: 'AT', labelEn: 'AT Series', labelSi: 'ඒටී (Ambalantota)' },
    { id: 'Traditional', labelEn: 'Traditional', labelSi: 'සාම්ප්‍රදායික' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header section with Language Toggler */}
      <header style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', borderBottom: '1px solid var(--current-border)', paddingBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--primary-green)', fontWeight: 'bold' }}>
            {tPage("title", isSi)}
          </h2>
          <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '4px' }}>
            {tPage("subtitle", isSi)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignSelf: isMobile ? 'flex-end' : 'auto' }}>
          <button 
            onClick={() => i18n.changeLanguage('en')} 
            className={`btn ${!isSi ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            English
          </button>
          <button 
            onClick={() => i18n.changeLanguage('si')} 
            className={`btn ${isSi ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            සිංහල
          </button>
        </div>
      </header>

      {/* Tabs Control */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--current-border)', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('kb')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'kb' ? '3px solid var(--primary-green)' : '3px solid transparent',
            color: activeTab === 'kb' ? 'var(--primary-green)' : 'var(--current-text-sec)',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={18} />
          {tPage("tabKb", isSi)}
        </button>
        
        <button
          onClick={() => setActiveTab('rec')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'rec' ? '3px solid var(--primary-green)' : '3px solid transparent',
            color: activeTab === 'rec' ? 'var(--primary-green)' : 'var(--current-text-sec)',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sliders size={18} />
          {tPage("tabRec", isSi)}
        </button>
      </div>

      {/* Tab Contents */}
      
      {/* TAB 1: KNOWLEDGE BASE BROWSER */}
      {activeTab === 'kb' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Search and Filters Bar */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', alignItems: 'center', width: '100%' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', width: '100%', maxWidth: isMobile ? '100%' : '400px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--current-text-sec)' }} />
              <input
                type="text"
                placeholder={tPage("searchPlaceholder", isSi)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--current-border)',
                  background: 'var(--current-card)',
                  color: 'var(--current-text)',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            {/* Filter Chips wrapper */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', overflowX: 'auto', width: '100%' }}>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  style={{
                    padding: '6px 14px',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: selectedCategory === c.id ? 'var(--primary-green)' : 'rgba(0,0,0,0.04)',
                    color: selectedCategory === c.id ? 'white' : 'var(--current-text-sec)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isSi ? c.labelSi : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Varieties Grid */}
          {kbVarieties.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.5rem',
              marginTop: '0.5rem'
            }}>
              {kbVarieties.map((v) => (
                <VarietyCompactCard
                  key={v.id}
                  variety={v}
                  onOpenModal={setSelectedVariety}
                  isSi={isSi}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
              <Sprout size={48} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--current-text-sec)' }} />
              <p>{tPage("noResults", isSi)}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI DYNAMIC RECOMMENDATION CLASSIFIER */}
      {activeTab === 'rec' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '2rem', alignItems: 'flex-start' }}>
          
          {/* Setup Inputs Form */}
          <form className="glass-panel" onSubmit={handleRunAIRecommendation} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid var(--primary-green)', paddingBottom: '0.5rem', margin: 0 }}>
              <Sliders size={18} />
              {tPage("setupTitle", isSi)}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--current-text-sec)', margin: 0 }}>
              {tPage("setupDesc", isSi)}
            </p>

            {/* Cultivation Season */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--current-text-sec)' }}>
                {tPage("seasonLabel", isSi)}
              </label>
              <select
                value={recSeason}
                onChange={(e) => setRecSeason(e.target.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--current-border)',
                  background: 'var(--current-bg)',
                  color: 'var(--current-text)',
                  fontSize: '0.9rem'
                }}
              >
                <option value="Maha">Maha (September - March)</option>
                <option value="Yala">Yala (May - August)</option>
              </select>
            </div>

            {/* Agricultural Zone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--current-text-sec)' }}>
                {tPage("zoneLabel", isSi)}
              </label>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="zone"
                    value="Dry Zone"
                    checked={recZone === "Dry Zone"}
                    onChange={(e) => setRecZone(e.target.value)}
                    style={{ accentColor: 'var(--primary-green)' }}
                  />
                  <span>{isSi ? 'වියළි කලාපය' : 'Dry Zone'}</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="zone"
                    value="Wet Zone"
                    checked={recZone === "Wet Zone"}
                    onChange={(e) => setRecZone(e.target.value)}
                    style={{ accentColor: 'var(--primary-green)' }}
                  />
                  <span>{isSi ? 'තෙත් කලාපය' : 'Wet Zone'}</span>
                </label>
              </div>
            </div>

            {/* District */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--current-text-sec)' }}>
                {tPage("districtLabel", isSi)}
              </label>
              <select
                value={recDistrict}
                onChange={(e) => setRecDistrict(e.target.value)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--current-border)',
                  background: 'var(--current-bg)',
                  color: 'var(--current-text)',
                  fontSize: '0.9rem'
                }}
              >
                {(DISTRICTS_BY_ZONE[recZone] || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Field Size */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--current-text-sec)' }}>
                {tPage("fieldAreaLabel", isSi)}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={recFieldArea}
                onChange={(e) => setRecFieldArea(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--current-border)',
                  background: 'var(--current-bg)',
                  color: 'var(--current-text)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="btn btn-primary"
              style={{ padding: '0.875rem 1rem', width: '100%', marginTop: '0.5rem', borderRadius: '10px' }}
            >
              {isAnalyzing ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  <span>{tPage("recommending", isSi)}</span>
                </>
              ) : (
                <>
                  <Sprout size={16} />
                  <span>{tPage("btnRecommend", isSi)}</span>
                </>
              )}
            </button>
          </form>

          {/* Recommendations Output Grid */}
          <div>
            {recommendations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recommendations.map((rec, index) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    varietyDetail={PADDY_VARIETIES_KB[rec.id]}
                    onOpenModal={setSelectedVariety}
                    index={index}
                    isSi={isSi}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--current-border)' }}>
                <Sliders size={48} style={{ color: 'var(--current-text-sec)', opacity: 0.4, margin: '0 auto 1rem', display: 'block' }} />
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.95rem' }}>
                  {isSi ? "නිර්දේශ ජනනය කිරීමට ඔබගේ ක්‍ෂේත්‍ර තොරතුරු ඇතුලත් කර 'ගැලපෙනම ප්‍රභේද සොයන්න' ක්ලික් කරන්න." : "Configure your setup and click 'Find Best Varieties' to execute the ML classifier."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      <DetailModal
        variety={selectedVariety}
        onClose={() => setSelectedVariety(null)}
        isSi={isSi}
        isMobile={isMobile}
      />
    </div>
  );
};

export default VarietyRecommendation;
