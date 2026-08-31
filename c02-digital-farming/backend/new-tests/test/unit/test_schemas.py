import pytest
# pyrefly: ignore [missing-import]
from pydantic import ValidationError
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
from app import PredictionInput, YieldPredictionInput, EnvironmentDataRequest

@pytest.mark.unit
def test_prediction_input_schema_valid():
    """Case 1: Validate PredictionInput parses valid data properly"""
    payload = {
        "District": "Anuradhapura",
        "Zone": "Dry Zone",
        "Season": "Yala",
        "Salinity_Prone": "No",
        "Iron_Toxicity_Prone": "No"
    }
    model = PredictionInput(**payload)
    assert model.District == "Anuradhapura"
    assert model.Zone == "Dry Zone"

@pytest.mark.unit
def test_prediction_input_schema_invalid():
    """Case 2: Validate PredictionInput rejects missing fields"""
    payload = {
        "District": "Anuradhapura",
        # Missing 'Zone', 'Season', etc.
    }
    with pytest.raises(ValidationError):
        PredictionInput(**payload)

@pytest.mark.unit
def test_yield_prediction_input_schema():
    """Case 3: Validate YieldPredictionInput parses correctly"""
    payload = {
        "District": "Colombo",
        "Total_Land_Size": 5.5,
        "Paddy_Type": "Bg 300",
        "lat": 6.9271,
        "lon": 79.8612
    }
    model = YieldPredictionInput(**payload)
    assert model.Total_Land_Size == 5.5
    assert model.Paddy_Type == "Bg 300"

@pytest.mark.unit
def test_environment_data_request_schema():
    """Case 4: Validate EnvironmentDataRequest parses boolean flag"""
    payload = {
        "lat": 6.9271,
        "lon": 79.8612,
        "use_firebase": True,
        "field_id": "field_01"
    }
    model = EnvironmentDataRequest(**payload)
    assert model.use_firebase is True
    assert model.field_id == "field_01"
