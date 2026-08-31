import sys
import os
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Add the parent directory to sys.path so we can import 'app' and 'services'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, PredictionInput, YieldPredictionInput

@pytest.fixture
def client():
    # Use FastAPI TestClient
    with TestClient(app) as c:
        yield c

@pytest.fixture
def mock_firebase():
    with patch("app.init_firebase") as mock_init, \
         patch("app.fetch_iot_data") as mock_fetch:
        # Provide a default mock response for IoT fetch
        mock_fetch.return_value = {
            'temp_mean': 28.5,
            'humidity_mean': 70.0,
            'soil_moisture_7': 0.45
        }
        yield mock_init, mock_fetch

@pytest.fixture
def mock_weather():
    with patch("app.fetch_forecast_weather") as mock_forecast:
        # Provide a default mock response for Weather API fetch
        mock_forecast.return_value = {
            'forecast_temp_mean': 30.0,
            'forecast_humidity_mean': 65.0
        }
        yield mock_forecast

@pytest.fixture
def mock_ml_models():
    # Mocking out the ML models in app.py to avoid loading large files or causing memory issues in tests
    with patch("app.model") as mock_variety, \
         patch("app.yield_pipeline") as mock_yield, \
         patch("app.disease_model") as mock_disease:
        
        # Variety Predictor
        mock_variety.predict.return_value = ["Bg 300"]
        
        # Yield Predictor
        mock_yield.predict.return_value = [5000.0]  # Example 5000 kg yield
        
        # Disease Predictor
        import tensorflow as tf
        mock_disease.return_value = [tf.constant([[0.1, 0.8, 0.1]])]  # 80% confidence for class 1
        
        with patch("app.disease_class_names", ["Bacterial leaf blight", "Brown spot", "Leaf smut"]):
            yield mock_variety, mock_yield, mock_disease
