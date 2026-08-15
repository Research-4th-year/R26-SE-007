import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { districtData } from '../data/constants';
import './Profile.css';

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    location: '',
    farm_size: '',
    farm_unit: 'Acres'
  });
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
      fetchHistory();
    }
  }, [currentUser]);

  async function fetchProfile() {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/profile/${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.message) {
          setProfile({
            name: data.name || '',
            phone: data.phone || '',
            location: data.location || '',
            farm_size: data.farm_size || '',
            farm_unit: data.farm_unit || 'Acres'
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/history/${currentUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
      const profileData = {
        user_id: currentUser.uid,
        ...profile,
        farm_size: parseFloat(profile.farm_size) || 0
      };

      const res = await fetch('http://127.0.0.1:8000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      
      if (res.ok) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to update profile.');
    }
  }

  async function handleDeleteAccount() {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone and will delete all your history.")) {
      try {
        // Delete from backend SQLite
        await fetch(`http://127.0.0.1:8000/api/profile/${currentUser.uid}`, {
          method: 'DELETE'
        });
        
        // Delete Firebase user
        await currentUser.delete();
        
        navigate('/login');
      } catch (error) {
        console.error(error);
        setMessage('Failed to delete account. You may need to re-login before deleting.');
      }
    }
  }

  if (loading) return <div className="page-container"><div className="loading-spinner"></div></div>;

  return (
    <div className="page-container profile-container">
      <div className="profile-header">
        <h1>Farmer Profile & Settings</h1>
        <p className="subtitle">Manage your personal details and view your farming history</p>
      </div>

      {message && <div className="profile-message">{message}</div>}

      <div className="profile-content">
        <div className="profile-card settings-card">
          <div className="card-header">
            <h2>Account Details</h2>
            {!isEditing && (
              <button className="btn-edit" onClick={() => setIsEditing(true)}>Edit</button>
            )}
          </div>
          
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="profile-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Location (District)</label>
                <select value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} required>
                  {Object.keys(districtData).map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Farm Size</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" step="0.1" value={profile.farm_size} onChange={e => setProfile({...profile, farm_size: e.target.value})} required style={{ flex: 2 }} />
                  <select value={profile.farm_unit} onChange={e => setProfile({...profile, farm_unit: e.target.value})} style={{ flex: 1 }}>
                    <option value="Acres">Acres</option>
                    <option value="Perch">Perch</option>
                    <option value="Hectares">Hectares</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{currentUser.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{profile.name || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{profile.phone || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location:</span>
                <span className="info-value">{profile.location || 'Not set'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Farm Size:</span>
                <span className="info-value">{profile.farm_size ? `${profile.farm_size} ${profile.farm_unit}` : 'Not set'}</span>
              </div>
            </div>
          )}

          <div className="danger-zone">
            <h3>Danger Zone</h3>
            <button onClick={handleDeleteAccount} className="btn-delete">Delete Account & Data</button>
          </div>
        </div>

        <div className="profile-card history-card">
          <h2>Your Advisory History</h2>
          {history.length === 0 ? (
            <p className="no-history">You have no advisory history yet. Try generating a prediction!</p>
          ) : (
            <div className="history-list">
              {history.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-item-header">
                    <span className="history-date">{new Date(item.created_at).toLocaleString()}</span>
                    <span className={`suitability-badge score-${item.suitability_score}`}>
                      Score: {item.suitability_score}/5
                    </span>
                  </div>
                  <div className="history-item-body">
                    <p><strong>Field:</strong> {item.field_id}</p>
                    <p><strong>Location:</strong> {item.city}, {item.district}</p>
                    <p><strong>Variety Predicted:</strong> <span className="highlight-variety">{item.predicted_variety}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
