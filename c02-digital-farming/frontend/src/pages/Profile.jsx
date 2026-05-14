import React from 'react';
import { User, Settings, Bell, Globe, Moon, HelpCircle, Info, ChevronRight, MapPin, Cpu, Battery, Signal, Zap, Sprout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

const SettingsSection = ({ title, children }) => (
  <section style={{ marginBottom: '2rem' }}>
    <h3 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-green)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>{title}</h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {children}
    </div>
  </section>
);

const SettingItem = ({ icon: Icon, label, value, onClick, color = 'var(--current-text-sec)' }) => (
  <div 
    onClick={onClick}
    className="glass-panel" 
    style={{ 
      padding: '1.25rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem', 
      cursor: onClick ? 'pointer' : 'default'
    }}
  >
    <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
      <Icon size={20} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>{label}</p>
    </div>
    {value && <span style={{ fontSize: '0.85rem', color: 'var(--primary-green)', fontWeight: '700' }}>{value}</span>}
    {onClick && <ChevronRight size={18} color="var(--current-border)" />}
  </div>
);

const Profile = () => {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const next = i18n.language === 'en' ? 'si' : 'en';
    i18n.changeLanguage(next);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h2>Settings & Control</h2>
        <p style={{ opacity: 0.7 }}>Manage your field profile and hardware</p>
      </header>

      {/* Field Profile */}
      <SettingsSection title="Your Field Profile">
        <SettingItem icon={Sprout} label="Paddy Variety" value="Samba (125 Days)" />
        <SettingItem icon={MapPin} label="Location" value="Anuradhapura, Zone 3" />
        <SettingItem icon={Zap} label="Season" value="Maha Season 2024" />
        <SettingItem icon={Info} label="Field Area" value="1.0 Hectare" />
      </SettingsSection>

      {/* Hardware Status */}
      <SettingsSection title="IoT Hardware Status">
        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0, 109, 50, 0.03)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                 <Battery size={24} color="#10b981" />
                 <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>BATTERY</p>
                 <p style={{ fontWeight: '800' }}>85%</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                 <Signal size={24} color="#10b981" />
                 <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>SIGNAL</p>
                 <p style={{ fontWeight: '800' }}>Excellent</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                 <Cpu size={24} color="#3b82f6" />
                 <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>SYNC</p>
                 <p style={{ fontWeight: '800' }}>Stable</p>
              </div>
           </div>
           <div style={{ fontSize: '0.75rem', opacity: 0.6, textAlign: 'center', borderTop: '1px solid var(--current-border)', paddingTop: '1rem' }}>
              Last Gateway Sync: 2 minutes ago
           </div>
        </div>
      </SettingsSection>

      {/* App Preferences */}
      <SettingsSection title="App Preferences">
        <SettingItem 
          icon={Globe} 
          label="Language" 
          value={i18n.language === 'en' ? 'English' : 'Sinhala'} 
          onClick={toggleLanguage}
        />
        <SettingItem 
          icon={Moon} 
          label="Dark Mode" 
          value={theme === 'dark' ? 'Enabled' : 'Disabled'} 
          onClick={toggleTheme}
        />
        <SettingItem icon={Bell} label="Notifications" value="Push Only" onClick={() => {}} />
      </SettingsSection>

      {/* System Info */}
      <SettingsSection title="System Information">
         <div style={{ fontSize: '0.85rem', opacity: 0.7, padding: '0.5rem' }}>
            <p>App Version: 1.2.4-stable</p>
            <p>Model ID: MNv2-Paddy-SriLanka</p>
            <p style={{ marginTop: '1rem' }}>Developed for Smart Paddy Agricultural Research Project © 2024</p>
         </div>
      </SettingsSection>

      <button className="btn" style={{ 
        color: '#ef4444', 
        background: 'rgba(239, 68, 68, 0.05)',
        width: '100%',
        marginTop: '1rem',
        padding: '1.25rem'
      }}>
        Reset Application Data
      </button>

      <div style={{ height: '50px' }} /> {/* Padding for bottom nav */}
    </div>
  );
};

export default Profile;
