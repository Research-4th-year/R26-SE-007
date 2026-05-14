import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from './context/ThemeContext';

// Components
import { Sidebar, BottomNav } from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Dashboard from './pages/Dashboard';
import DiseaseDetection from './pages/DiseaseDetection';
import IoTGuide from './pages/IoTGuide';
import AITools from './pages/AITools';
import NPKPrediction from './pages/NPKPrediction';
import VarietyRecommendation from './pages/VarietyRecommendation';
import FertilizerRecommendation from './pages/FertilizerRecommendation';
import KnowledgeBase from './pages/KnowledgeBase';
import Profile from './pages/Profile';
import YieldPrediction from './pages/YieldPrediction';
import ModelMetrics from './pages/ModelMetrics';

function App() {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <Router>
      <div className="app-container">
        {/* Navigation - Always Visible Sidebar/BottomNav */}
        <Sidebar />
        
        <main className="main-content">
          <ErrorBoundary>
            <Routes>
              {/* Instant Access - No Login, No Splash */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/iot-devices" element={<IoTGuide />} />
              <Route path="/ai-tools" element={<AITools />} />
              <Route path="/ai/npk" element={<NPKPrediction />} />
              <Route path="/ai/variety" element={<VarietyRecommendation />} />
              <Route path="/ai/fertilizer" element={<FertilizerRecommendation />} />
              <Route path="/ai/yield" element={<YieldPrediction />} />
              <Route path="/metrics" element={<ModelMetrics />} />
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/disease" element={<DiseaseDetection />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </main>

        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
