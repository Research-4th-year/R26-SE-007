import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Brain, Cpu, Settings, Leaf, FlaskConical, BarChart3 } from 'lucide-react';

const NavItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/disease', icon: Search, label: 'Scan Leaf' },
  { path: '/ai/fertilizer', icon: FlaskConical, label: 'Fertilizer Guide' },
  { path: '/ai/yield', icon: Brain, label: 'Farmer Guidance' },
  { path: '/metrics', icon: BarChart3, label: 'Model Analysis' }, // New Section
  { path: '/iot-devices', icon: Cpu, label: 'Field Status' },
  { path: '/profile', icon: Settings, label: 'Settings' },
];

export const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
        <Leaf color="#006D32" size={32} />
        <h2 className="text-gradient" style={{ fontSize: '1.25rem' }}>Smart Paddy</h2>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {NavItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '12px',
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: '600'
            }}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1rem', borderRadius: '16px', fontSize: '0.8rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span>Field System Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      {NavItems.map((item) => (
        <NavLink 
          key={item.path} 
          to={item.path} 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
