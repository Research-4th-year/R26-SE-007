import React from 'react';
import paddyFieldImg from '../../assets/images/paddy-field.jpg';
import { Wifi, CloudSun, Leaf, Sprout } from 'lucide-react';

const SmartHeader = ({ isOnline, weather, season, isSi }) => (
  <section className="glass-panel" style={{ overflow: 'hidden', borderRadius: '28px', position: 'relative', minHeight: '260px' }}>
    <img src={paddyFieldImg} alt="Paddy field" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.55) 55%, rgba(0,0,0,0.15) 100%)' }} />
    <div style={{ position: 'relative', zIndex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '260px', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'white' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={22} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', opacity: 0.85, margin: 0 }}>{isSi ? 'ස්මාර්ට් ගොවිතැන්' : 'Smart Farming'}</p>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>{isSi ? 'AI තාක්ෂණයෙන් ස්මාර්ට් වී වගාව' : 'AI Smart Paddy Farming Assistant'}</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.75rem', borderRadius: '999px', background: isOnline ? 'rgba(46,125,50,0.8)' : 'rgba(2,136,209,0.8)', color: 'white', fontSize: '0.8rem', fontWeight: '700' }}>
          <Wifi size={16} />
          {isOnline ? (isSi ? 'IoT සම්බන්ධයි' : 'IoT Connected') : (isSi ? 'Weather API' : 'Weather API')}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.7rem', maxWidth: '420px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'white' }}>
          <CloudSun size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{isSi ? 'වලාපත' : 'Weather'}: {weather}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'white' }}>
          <Leaf size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{isSi ? 'කන්නය' : 'Season'}: {season}</span>
        </div>
      </div>
    </div>
  </section>
);

export default SmartHeader;
