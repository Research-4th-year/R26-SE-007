import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLatestData } from '../services/api';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Bot, Moon, Sun, Sprout, ShieldCheck, TrendingUp } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import SmartHeader from '../components/home/SmartHeader';
import FieldConditionCard from '../components/home/FieldConditionCard';
import PaddyVarietyCard from '../components/home/PaddyVarietyCard';
import FertilizerCard from '../components/home/FertilizerCard';
import SeasonCard from '../components/home/SeasonCard';
import DistrictCard from '../components/home/DistrictCard';
import AIInsightCard from '../components/home/AIInsightCard';
import { HOME_VARIETIES, HOME_FERTILIZERS, HOME_SEASONS, HOME_DISTRICTS, QUICK_ACCESS } from '../data/homeData';

const DashboardContent = () => {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isSi = i18n.language?.startsWith('si');

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('smart_paddy_last_data');
    return saved ? JSON.parse(saved) : {
      sensors: { temperature: 30, humidity: 75, soil1: 65, soil2: 65, rain: 1, light: 800 },
      predictions: { yield_prediction_kg_per_ha: 6800, npk: { N: 65, P: 48, K: 60 } },
      recommendations: { water_action: 'Soil moisture is within the ideal band for paddy growth.', fertilizer: 'Balanced NPK nutrition is recommended for the current field state.' },
      disease_category: 'Healthy'
    };
  });

  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(HOME_DISTRICTS[0].zone);

  useEffect(() => {
    let mounted = true;
    let unsub;

    const fetchInitial = async () => {
      try {
        const res = await getLatestData();
        if (mounted && res) {
          setData(prev => {
            const newData = { ...prev, ...res };
            localStorage.setItem('smart_paddy_last_data', JSON.stringify(newData));
            return newData;
          });
        }
      } catch (e) {
        console.warn('Dashboard: Could not fetch latest data, using offline cache.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchInitial();

    import('firebase/database').then(({ ref, onValue }) => {
      import('../firebase').then(({ db }) => {
        if (!mounted) return;
        const sensorRef = ref(db, 'sensor');
        unsub = onValue(sensorRef, (snapshot) => {
          const val = snapshot.val();
          if (mounted && val) {
            setData(prev => {
              const newData = { ...prev, sensors: { ...prev.sensors, ...val } };
              localStorage.setItem('smart_paddy_last_data', JSON.stringify(newData));
              return newData;
            });
          }
        });
      });
    });

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, []);

  const { sensors, predictions, recommendations, disease_category } = data;
  const avgSoil = Math.round((Number(sensors?.soil1 || 0) + Number(sensors?.soil2 || 0)) / 2);
  const yieldKg = Math.round(predictions?.yield_prediction_kg_per_ha || 6800);

  const seasonInfo = useMemo(() => {
    const month = new Date().getMonth() + 1;
    const isYala = month >= 5 && month <= 8;
    const season = isYala ? HOME_SEASONS[1] : HOME_SEASONS[0];
    const weather = Number(sensors?.rain || 1) === 0 ? (isSi ? 'වර්ෂාපතනයක් ඇති' : 'Rainy Conditions') : (isSi ? 'පොහොසත් ආලෝකය' : 'Bright Conditions');
    return {
      season,
      weatherLabel: weather,
      seasonLabelEn: isYala ? 'Yala' : 'Maha',
      seasonLabelSi: isYala ? 'යල කන්නය' : 'මහ කන්නය'
    };
  }, [isSi, sensors?.rain]);

  const aiRecommendation = useMemo(() => {
    const rain = Number(sensors?.rain || 1);
    const humidity = Number(sensors?.humidity || 70);
    const selected = rain === 0 || humidity > 80 ? HOME_VARIETIES[1] : humidity < 60 ? HOME_VARIETIES[2] : HOME_VARIETIES[0];

    return {
      variety: selected.code,
      reason_en: `Excellent fit for ${seasonInfo.seasonLabelEn} conditions with ${rain === 0 ? 'high rainfall compatibility' : 'balanced irrigation needs'} and strong disease resistance.`,
      reason_si: `${seasonInfo.seasonLabelSi} කන්නය සඳහා ${rain === 0 ? 'ඉහළ වර්ෂාජීවී ගැලපීම' : 'සමාන්‍ය වාරි අවශ්‍යතා'} සහ හොඳ රෝග ප්‍රතිරෝධයක් ඇති නිර්දේශිත ප්‍රභේදය වේ.`
    };
  }, [seasonInfo.seasonLabelEn, seasonInfo.seasonLabelSi, sensors?.humidity, sensors?.rain]);

  const selectedDistrict = HOME_DISTRICTS.find(item => item.zone === selectedZone) || HOME_DISTRICTS[0];

  const healthLabel = disease_category === 'Healthy' ? (isSi ? 'සෞඛ්‍යවත්' : 'Healthy') : (isSi ? 'අවධානය අවශ්‍යයි' : 'Needs attention');
  const healthTone = disease_category === 'Healthy' ? '#2E7D32' : '#D32F2F';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{ border: '1px solid var(--current-border)', background: 'var(--current-card)', color: 'var(--current-text)', borderRadius: '999px', padding: '0.5rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? (isSi ? 'ලාተන් පෙනුම' : 'Light Mode') : (isSi ? 'අඳුරු පෙනුම' : 'Dark Mode')}
        </button>
      </div>

      <SmartHeader isOnline={Boolean(sensors?.temperature || sensors?.humidity)} weather={seasonInfo.weatherLabel} season={isSi ? seasonInfo.seasonLabelSi : seasonInfo.seasonLabelEn} isSi={isSi} />

      <section className="glass-panel" style={{ padding: '1rem', borderRadius: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '0.2rem' }}>
              {isSi ? 'ක්ෂේත්‍ර සාරාංශය' : 'Field Summary'}
            </p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{isSi ? 'AI ගොවිතැන් අවබෝධය' : 'AI Farming Intelligence'}</h3>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.7rem', borderRadius: '999px', background: `${healthTone}16`, color: healthTone, fontSize: '0.8rem', fontWeight: '800' }}>
            <ShieldCheck size={15} />
            {healthLabel}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '18px', background: 'rgba(46,125,50,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
              <Sprout size={18} color="#2E7D32" />
              <p style={{ fontSize: '0.84rem', fontWeight: '800', margin: 0 }}>{isSi ? 'වගා තත්ත්වය' : 'Crop Condition'}</p>
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>{healthLabel}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--current-text-sec)' }}>{isSi ? 'පොහොර හා ජල සැපයුම සෞඛ්‍යවත් මට්ටමේ පවතී.' : 'Nutrition and irrigation appear balanced for the current growth phase.'}</p>
          </div>
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '18px', background: 'rgba(196,154,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={18} color="#C49A00" />
              <p style={{ fontSize: '0.84rem', fontWeight: '800', margin: 0 }}>{isSi ? 'අස්වැන්න' : 'Estimated Yield'}</p>
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.25rem' }}>{yieldKg.toLocaleString()} kg/ha</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--current-text-sec)' }}>{isSi ? 'අදහස් පදනම්ව පුරෝකථනය කළ අස්වැන්නය.' : 'Projected harvest based on current field conditions.'}</p>
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gap: '1.2rem', gridTemplateColumns: '1.1fr 0.9fr' }}>
        <FieldConditionCard sensors={sensors} iotStatus={loading ? 'WEATHER' : 'ONLINE'} isSi={isSi} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <section className="glass-panel" style={{ padding: '1rem', borderRadius: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>{isSi ? 'AI විශ්ලේෂණය' : 'AI Field Analysis'}</h3>
              <span style={{ fontSize: '0.72rem', color: '#2E7D32', fontWeight: '800' }}>{isSi ? 'සජීවී' : 'Live'}</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--current-text-sec)', marginBottom: '0.7rem' }}>{isSi ? 'පොහොර, ජල හා රෝග අවදානම සලකා බලමින්' : 'Reviewing moisture, nutrients and disease pressure for your field.'}</p>
            <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.84rem' }}><strong>{isSi ? 'පොහොර තත්ත්වය' : 'Nutrient Status'}:</strong> {isSi ? 'සමානව සමතුලිත' : 'Balanced'}</div>
              <div style={{ fontSize: '0.84rem' }}><strong>{isSi ? 'ජල තත්ත්වය' : 'Water Condition'}:</strong> {isSi ? 'ප්‍රශස්ත' : 'Optimal'}</div>
              <div style={{ fontSize: '0.84rem' }}><strong>{isSi ? 'රෝග අවදානම' : 'Disease Risk'}:</strong> {isSi ? 'අඩු' : 'Low'}</div>
            </div>
            <button type="button" onClick={() => navigate('/ai/npk')} style={{ border: 'none', background: '#2E7D32', color: 'white', borderRadius: '999px', padding: '0.6rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: '700' }}>
              {isSi ? 'සම්පූර්ණ විශ්ලේෂණය බලන්න' : 'View Detailed Analysis'}
              <ArrowRight size={16} />
            </button>
          </section>

          <section className="glass-panel" style={{ padding: '1rem', borderRadius: '22px', background: 'linear-gradient(135deg, rgba(46,125,50,0.08), rgba(196,154,0,0.08))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <Bot size={18} color="#2E7D32" />
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>{isSi ? 'උපදෙස්' : 'Farmer Guidance'}</h3>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--current-text-sec)', lineHeight: '1.55' }}>
              {recommendations?.water_action || (isSi ? 'අදහස් පදනම්ව පීඩා නොවී සිටීම සඳහා වාරි සැලසුම අනුගමනය කරන්න.' : 'Follow the current irrigation plan to avoid stress and preserve yield quality.')}
            </p>
          </section>
        </div>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ fontSize: '1.08rem', fontWeight: '800' }}>{isSi ? 'ජනප්‍රිය වී ප්‍රභේද' : 'Popular Paddy Varieties'}</h3>
          <span style={{ fontSize: '0.78rem', color: '#2E7D32', fontWeight: '700' }}>{isSi ? 'විස්තර සඳහා ක්ලික් කරන්න' : 'Tap to explore details'}</span>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {HOME_VARIETIES.map(variety => (
            <PaddyVarietyCard key={variety.id} variety={variety} isSi={isSi} />
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ fontSize: '1.08rem', fontWeight: '800' }}>{isSi ? 'පොහොර දැනුම' : 'Fertilizer Knowledge'}</h3>
          <span style={{ fontSize: '0.78rem', color: '#C49A00', fontWeight: '700' }}>{isSi ? 'පොහොර පැලැස්ට' : 'Essential inputs'}</span>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {HOME_FERTILIZERS.map(fertilizer => (
            <FertilizerCard key={fertilizer.id} fertilizer={fertilizer} isSi={isSi} />
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ fontSize: '1.08rem', fontWeight: '800' }}>{isSi ? 'වගා කන්න වර්ග' : 'Cultivation Seasons'}</h3>
          <span style={{ fontSize: '0.78rem', color: '#0288D1', fontWeight: '700' }}>{isSi ? 'කාලානුක්‍රමික උපදෙස්' : 'Season planning'}</span>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {HOME_SEASONS.map(season => (
            <SeasonCard key={season.id} season={season} isSi={isSi} />
          ))}
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ fontSize: '1.08rem', fontWeight: '800' }}>{isSi ? 'ස්ri ලන්කාවේ දිස්ත්‍රික්ක' : 'Sri Lankan Agricultural Districts'}</h3>
          <span style={{ fontSize: '0.78rem', color: '#2E7D32', fontWeight: '700' }}>{isSi ? 'ස්ථානය ඒකක' : 'Interactive zones'}</span>
        </div>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1.2fr' }}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {HOME_DISTRICTS.map(district => (
              <DistrictCard key={district.zone} district={district} isSi={isSi} onSelect={setSelectedZone} activeZone={selectedZone} />
            ))}
          </div>
          <div className="glass-panel" style={{ padding: '1rem', borderRadius: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div>
                <p style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#2E7D32', fontWeight: '800', marginBottom: '0.2rem' }}>{isSi ? 'තෝරාගත් කලාපය' : 'Selected Zone'}</p>
                <h4 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>{isSi ? selectedDistrict.zone_si : selectedDistrict.zone}</h4>
              </div>
              <span style={{ fontSize: '1rem' }}>{selectedDistrict.icon}</span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--current-text-sec)', marginBottom: '0.85rem' }}>{isSi ? selectedDistrict.climate_si : selectedDistrict.climate_en}</p>
            <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '0.85rem' }}>
              <div><strong>{isSi ? 'සාමාන්‍ය වර්ෂාව' : 'Average Rainfall'}:</strong> {selectedDistrict.avg_rainfall_mm} mm</div>
              <div><strong>{isSi ? 'නිර්දේශිත ප්‍රභේද' : 'Suitable Varieties'}:</strong> {selectedDistrict.recommended_varieties.join(', ')}</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {selectedDistrict.districts.map(item => (
                <span key={item.name} style={{ padding: '0.35rem 0.6rem', borderRadius: '999px', fontSize: '0.76rem', fontWeight: '700', background: `${selectedDistrict.color}16`, color: selectedDistrict.color }}>
                  {isSi ? item.si : item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
          <h3 style={{ fontSize: '1.08rem', fontWeight: '800' }}>{isSi ? 'ක්ෂණික ප්‍රවේශය' : 'Quick Access'}</h3>
          <span style={{ fontSize: '0.78rem', color: '#2E7D32', fontWeight: '700' }}>{isSi ? 'ඉක්මන් මෙහෙයුම්' : 'Fast navigation'}</span>
        </div>
        <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          {QUICK_ACCESS.map(item => (
            <button key={item.id} type="button" onClick={() => navigate(item.route)} style={{ border: 'none', borderRadius: '18px', padding: '0.9rem 0.95rem', background: 'var(--current-card)', color: 'inherit', textAlign: 'left', cursor: 'pointer', boxShadow: '0 10px 24px rgba(15,23,42,0.08)' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>{isSi ? item.label_si : item.label_en}</div>
            </button>
          ))}
        </div>
      </section>

      <AIInsightCard recommendation={aiRecommendation} isSi={isSi} />

      <footer className="glass-panel" style={{ padding: '1rem', borderRadius: '22px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.35rem' }}>{isSi ? 'ස්මාර්ට් වී වගාව පිළිබඳ' : 'About Smart Paddy Farming'}</h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--current-text-sec)', lineHeight: '1.55' }}>
          {isSi ? 'AI + IoT + යන්ත්‍ර අධ්‍යාපනය යන තාක්ෂණයන් එකට සම්බන්ධ කර පරිපාලනය කිරීමට සැලසුම් කර ඇත.' : 'A research-grade AI + IoT + machine learning experience designed for modern Sri Lankan paddy farming.'}
        </p>
      </footer>
    </div>
  );
};

const Dashboard = () => (
  <ErrorBoundary>
    <DashboardContent />
  </ErrorBoundary>
);

export default Dashboard;
