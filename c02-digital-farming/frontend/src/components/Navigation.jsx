import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="navbar glass-nav">
      <div className="nav-brand">
        <h1>🌾 Digital Goviyam</h1>
      </div>
      <div className="nav-links">
        <Link 
          to="/" 
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          Advisory Guidance
        </Link>
        <Link 
          to="/yield" 
          className={`nav-item ${location.pathname === '/yield' ? 'active' : ''}`}
        >
          Yield Prediction
        </Link>
        <Link 
          to="/disease" 
          className={`nav-item ${location.pathname === '/disease' ? 'active' : ''}`}
        >
          Disease Detection
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;
