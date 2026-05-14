import React, { useState } from 'react';
import { Leaf, User, MapPin, Briefcase, ChevronRight, Globe, Sun, Moon } from 'lucide-react';

export const Login = ({ onLogin, onRegister }) => (
  <div style={{
    height: '100vh',
    width: '100vw',
    background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=2000")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem',
    color: 'white'
  }}>
    <div style={{ marginTop: 'auto', marginBottom: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Welcome Back!</h1>
      <p style={{ opacity: 0.8 }}>Login to continue your smart farming journey</p>
    </div>

    <div className="glass-panel" style={{ padding: '2rem', background: 'rgba(255, 255, 255, 0.1)', border: 'none' }}>
      <div className="input-group">
        <label style={{ color: 'white' }}>Email or Phone</label>
        <input type="text" placeholder="Enter email or phone" className="input-field" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }} />
      </div>
      <div className="input-group" style={{ marginBottom: '1rem' }}>
        <label style={{ color: 'white' }}>Password</label>
        <input type="password" placeholder="Enter password" className="input-field" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }} />
      </div>
      <p style={{ textAlign: 'right', fontSize: '0.8rem', color: '#34d399', marginBottom: '2rem', fontWeight: '600' }}>Forgot Password?</p>
      
      <button className="btn btn-primary" onClick={onLogin} style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem' }}>Login</button>
      
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <p style={{ fontSize: '0.9rem' }}>Don't have an account? <span onClick={onRegister} style={{ color: '#34d399', fontWeight: '700', cursor: 'pointer' }}>Register</span></p>
      </div>
    </div>
  </div>
);

export const Register = ({ onBack, onNext }) => (
  <div style={{ padding: '2rem', background: 'var(--current-bg)', minHeight: '100vh' }}>
    <header style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Your Profile</h2>
      <p style={{ opacity: 0.7 }}>Tell us about yourself</p>
    </header>

    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
      <div style={{ 
        width: '100px', 
        height: '100px', 
        borderRadius: '50%', 
        background: 'rgba(0, 109, 50, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        border: '2px dashed var(--primary-green)'
      }}>
         <User size={40} color="var(--primary-green)" />
         <div style={{ 
           position: 'absolute', 
           bottom: 0, 
           right: 0, 
           background: 'var(--primary-green)', 
           color: 'white', 
           padding: '4px', 
           borderRadius: '50%' 
         }}>
           <Plus size={14} />
         </div>
      </div>
    </div>

    <div className="input-group">
      <label>Full Name</label>
      <input type="text" placeholder="Enter your full name" className="input-field" />
    </div>

    <div className="input-group">
      <label>Role</label>
      <select className="input-field" style={{ appearance: 'none' }}>
        <option>Select your role</option>
        <option>Farmer</option>
        <option>Researcher</option>
        <option>Officer</option>
      </select>
    </div>

    <div className="input-group">
      <label>District</label>
      <select className="input-field" style={{ appearance: 'none' }}>
        <option>Select your district</option>
        <option>Anuradhapura</option>
        <option>Polonnaruwa</option>
        <option>Kurunegala</option>
      </select>
    </div>

    <div className="input-group">
      <label>Farming Experience</label>
      <select className="input-field" style={{ appearance: 'none' }}>
        <option>Select experience</option>
        <option>1-5 Years</option>
        <option>5-10 Years</option>
        <option>10+ Years</option>
      </select>
    </div>

    <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
      <button className="btn btn-primary" onClick={onNext} style={{ width: '100%', padding: '1.25rem' }}>
        Next
      </button>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
         <div style={{ width: '20px', height: '6px', borderRadius: '3px', background: 'var(--primary-green)' }} />
         <div style={{ width: '20px', height: '6px', borderRadius: '3px', background: 'var(--current-border)' }} />
         <div style={{ width: '20px', height: '6px', borderRadius: '3px', background: 'var(--current-border)' }} />
      </div>
    </div>
  </div>
);

export const Preferences = ({ onFinish }) => (
  <div style={{ padding: '2rem', background: 'var(--current-bg)', minHeight: '100vh' }}>
    <header style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Preferences</h2>
      <p style={{ opacity: 0.7 }}>Customize your app experience</p>
    </header>

    <section style={{ marginBottom: '2.5rem' }}>
       <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Language</h3>
       <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '2px solid var(--primary-green)' }}>
          <Globe color="var(--primary-green)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '600' }}>English</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>English</p>
          </div>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '6px solid var(--primary-green)' }} />
       </div>
       <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
          <Globe color="var(--current-text-sec)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '600' }}>සිංහල</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Sinhala</p>
          </div>
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--current-border)' }} />
       </div>
    </section>

    <section style={{ marginBottom: '2.5rem' }}>
       <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Appearance</h3>
       <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', textAlign: 'center', border: '2px solid var(--primary-green)' }}>
             <Sun color="var(--primary-green)" style={{ marginBottom: '0.5rem' }} />
             <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>Light Mode</p>
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', textAlign: 'center' }}>
             <Moon color="var(--current-text-sec)" style={{ marginBottom: '0.5rem' }} />
             <p style={{ fontSize: '0.8rem', fontWeight: '700' }}>Dark Mode</p>
          </div>
       </div>
    </section>

    <div style={{ 
      background: 'rgba(0, 109, 50, 0.05)', 
      padding: '1rem', 
      borderRadius: '16px',
      marginBottom: '2rem'
    }}>
      <p style={{ fontSize: '0.8rem' }}><strong>Why Language & Theme?</strong> <br/> You can change these settings anytime from the app settings.</p>
    </div>

    <button className="btn btn-primary" onClick={onFinish} style={{ width: '100%', padding: '1.25rem' }}>
      Save Preferences
    </button>
  </div>
);

const Plus = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
