import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Advisory from './pages/Advisory';
import YieldPrediction from './pages/YieldPrediction';
import DiseaseDetection from './pages/DiseaseDetection';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Advisory />} />
            <Route path="/yield" element={<YieldPrediction />} />
            <Route path="/disease" element={<DiseaseDetection />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
