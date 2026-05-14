import React from 'react';
import { Cpu, Thermometer, Droplets, CloudRain, Sun, Zap, Database, Brain, LayoutDashboard, Battery, ShieldCheck } from 'lucide-react';

const SensorItem = ({ icon: Icon, color, name, desc }) => (
  <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
    <div style={{ padding: '0.75rem', background: `${color}15`, borderRadius: '12px' }}>
      <Icon size={24} color={color} />
    </div>
    <div>
      <h4 style={{ fontSize: '0.9rem' }}>{name}</h4>
      <p style={{ fontSize: '0.75rem', color: 'var(--current-text-sec)' }}>{desc}</p>
    </div>
  </div>
);

const IoTGuide = () => {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <div className="flex-center" style={{ 
          background: 'rgba(0, 109, 50, 0.1)', 
          width: '60px', 
          height: '60px', 
          borderRadius: '16px',
          marginBottom: '1rem'
        }}>
          <Cpu size={32} color="#006D32" />
        </div>
        <h2>IoT Device Guide</h2>
        <p style={{ opacity: 0.7 }}>Smart Sensors in Your Field</p>
      </header>

      {/* Our IoT Sensor Network */}
      <section>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Our IoT Sensor Network</h3>
        <SensorItem 
          icon={Thermometer} 
          color="#ef4444" 
          name="DHT22 Sensor" 
          desc="Measures temperature & humidity of the environment" 
        />
        <SensorItem 
          icon={Droplets} 
          color="#3b82f6" 
          name="Soil Moisture Sensor" 
          desc="Measures soil water content in the root zone" 
        />
        <SensorItem 
          icon={CloudRain} 
          color="#8b5cf6" 
          name="Rain Sensor" 
          desc="Detects rainfall intensity and duration" 
        />
        <SensorItem 
          icon={Sun} 
          color="#f59e0b" 
          name="BH1750 Light Sensor" 
          desc="Measures light intensity for photosynthesis" 
        />
      </section>

      {/* Device Working Flow */}
      <section>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Device Working Flow</h3>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          padding: '0 1rem'
        }}>
          {/* Connecting Line */}
          <div style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '40px', 
            right: '40px', 
            height: '2px', 
            background: 'var(--current-border)', 
            zIndex: 0 
          }} />

          {[
            { icon: Thermometer, label: 'Sensors' },
            { icon: Cpu, label: 'ESP32' },
            { icon: Database, label: 'Firebase' },
            { icon: Brain, label: 'AI Model' },
            { icon: LayoutDashboard, label: 'Dashboard' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', zIndex: 1 }}>
              <div style={{ 
                background: 'var(--current-card)', 
                border: '1px solid var(--current-border)',
                padding: '0.5rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <item.icon size={20} color={idx === 4 ? '#006D32' : 'var(--current-text-sec)'} />
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: '600' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Power System */}
      <section>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Power System</h3>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
           <div className="flex-between">
              <div style={{ textAlign: 'center', flex: 1 }}>
                 <Sun size={32} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                 <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Solar Panel</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                 <Zap size={32} color="#3b82f6" style={{ marginBottom: '0.5rem' }} />
                 <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Controller</p>
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                 <Battery size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                 <p style={{ fontSize: '0.8rem', fontWeight: '600' }}>Battery</p>
              </div>
           </div>
           <div style={{ 
             marginTop: '1.5rem', 
             padding: '1rem', 
             background: 'rgba(0, 109, 50, 0.05)', 
             borderRadius: '12px',
             display: 'flex',
             alignItems: 'center',
             gap: '0.75rem'
           }}>
              <ShieldCheck size={20} color="#006D32" />
              <p style={{ fontSize: '0.75rem' }}>Sustainable & Continuous Power for 24/7 Monitoring</p>
           </div>
        </div>
      </section>
    </div>
  );
};

export default IoTGuide;
