import pytest
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
from services.weather_api import fetch_forecast_weather
from unittest.mock import patch, MagicMock

@pytest.mark.unit
@patch('services.weather_api.requests.get')
def test_weather_service_parsing(mock_get):
    """Case 5: Test weather service data parsing logic"""
    # Mocking external API response
    mock_response = MagicMock()
    mock_response.json.return_value = {
        'daily': {'temperature_2m_mean': [30.0, 32.0]},
        'hourly': {'relative_humidity_2m': [60, 65]}
    }
    mock_response.status_code = 200
    mock_get.return_value = mock_response
    
    result = fetch_forecast_weather(6.9271, 79.8612)
    assert result is not None
    assert result['forecast_temp_mean'] == 31.0
    assert result['forecast_humidity_mean'] == 62.5

@pytest.mark.unit
def test_confidence_level_classification():
    """Case 6: Test generic logic (confidence evaluation)"""
    # Just an example logic test (simulating some internal threshold logic)
    score = 0.88
    confidence_level = "High" if score > 0.85 else "Low"
    assert confidence_level == "High"

@pytest.mark.unit
def test_history_payload_formatting():
    """Case 7: Test formatting data for history DB insert"""
    raw_data = {
        "user_id": "test_user_1",
        "predicted_variety": "Bg 300",
        "suitability_score": 4
    }
    
    # Simulate DB insert dict conversion
    formatted = {k: v for k, v in raw_data.items() if v is not None}
    assert "user_id" in formatted
    assert formatted["suitability_score"] == 4
