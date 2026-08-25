import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { districtData } from '../data/constants';
import './Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Extra profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(Object.keys(districtData)[0]); // Default to first district
  const [farmSize, setFarmSize] = useState('');
  const [farmUnit, setFarmUnit] = useState('Acres');

  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }

    try {
      setError('');
      setLoading(true);
      // Create Firebase user
      const userCredential = await signup(email, password);
      const user_id = userCredential.user.uid;

      // Save additional profile info to backend
      const profileData = {
        user_id,
        name,
        phone,
        location,
        farm_size: parseFloat(farmSize) || 0,
        farm_unit: farmUnit
      };

      await fetch('http://127.0.0.1:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h2 className="auth-title">Register as Farmer</h2>
        <p className="auth-subtitle">Create an account to track your farm's history</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          
          <div className="auth-row">
            <div className="auth-group">
              <label>Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="auth-group">
              <label>Phone</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="auth-row">
            <div className="auth-group">
              <label>Location (District)</label>
              <select required value={location} onChange={e => setLocation(e.target.value)}>
                {Object.keys(districtData).map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
            <div className="auth-group">
              <label>Farm Size</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="number" step="0.1" required value={farmSize} onChange={e => setFarmSize(e.target.value)} style={{ flex: 2 }} />
                <select value={farmUnit} onChange={e => setFarmUnit(e.target.value)} style={{ flex: 1 }}>
                  <option value="Acres">Acres</option>
                  <option value="Perch">Perch</option>
                  <option value="Hectares">Hectares</option>
                </select>
              </div>
            </div>
          </div>

          <div className="auth-group">
            <label>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="auth-row">
            <div className="auth-group">
              <label>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="auth-group">
              <label>Confirm Password</label>
              <input type="password" required value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
            </div>
          </div>
          
          <button disabled={loading} className="auth-btn" type="submit">
            Register
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
