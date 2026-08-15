import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navigation() {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  return (
    <nav className="navbar glass-nav">
      <div className="nav-brand">
        <h1>🌾 Digital Goviyam</h1>
      </div>
      <div className="nav-links">
        {currentUser && (
          <>
            <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>Advisory</Link>
            <Link to="/yield" className={`nav-item ${location.pathname === '/yield' ? 'active' : ''}`}>Yield</Link>
            <Link to="/disease" className={`nav-item ${location.pathname === '/disease' ? 'active' : ''}`}>Disease</Link>
            <Link to="/fertilizer" className={`nav-item ${location.pathname === '/fertilizer' ? 'active' : ''}`}>Fertilizer</Link>
            <div className="nav-spacer" style={{ marginLeft: 'auto', flex: 1 }}></div>
            <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>👤 Profile</Link>
            <button onClick={handleLogout} className="nav-item btn-logout" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: '600' }}>Logout</button>
          </>
        )}
        {!currentUser && (
          <>
            <div className="nav-spacer" style={{ marginLeft: 'auto', flex: 1 }}></div>
            <Link to="/login" className="nav-item">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
