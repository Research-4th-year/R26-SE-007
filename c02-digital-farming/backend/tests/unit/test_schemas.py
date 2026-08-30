import pytest
# pyrefly: ignore [missing-import]
from pydantic import ValidationError
from app import (
    FarmerProfile,
    PredictionInput,
    YieldPredictionInput,
    EnvironmentDataRequest,
    AdvisoryHistoryItem,
    YieldHistoryItem,
    DiseaseHistoryItem,
    FertilizerHistoryItem
)

# --- 10 Unit Tests ---

# Test 1: FarmerProfile valid data
def test_farmer_profile_valid():
    data = {
        "user_id": "test_user_1",
        "name": "Nimal",
        "phone": "0771234567",
        "location": "Ampara",
        "farm_size": 2.5
    }
    profile = FarmerProfile(**data)
    assert profile.name == "Nimal"
    assert profile.farm_unit == "Acres" # Check default value

# Test 2: FarmerProfile missing required fields
def test_farmer_profile_missing_fields():
    data = {"user_id": "test_user_1"}
    with pytest.raises(ValidationError):
        FarmerProfile(**data)

# Test 3: PredictionInput valid data
def test_prediction_input_valid():
    data = {
        "District": "Ampara",
        "Zone": "Dry Zone",
        "Season": "Maha",
        "Salinity_Prone": "No",
        "Iron_Toxicity_Prone": "No"
    }
    pred = PredictionInput(**data)
    assert pred.District == "Ampara"

# Test 4: YieldPredictionInput valid data
def test_yield_prediction_input_valid():
    data = {
        "District": "Kurunegala",
        "Total_Land_Size": 3.0,
        "Paddy_Type": "Bg 300",
        "lat": 7.48,
        "lon": 80.36
    }
    yield_pred = YieldPredictionInput(**data)
    assert yield_pred.Total_Land_Size == 3.0
    assert yield_pred.field_id == "" # Check default
    assert yield_pred.use_firebase is False

# Test 5: EnvironmentDataRequest validation
def test_environment_data_request_validation():
    data = {"lat": 6.92, "lon": 79.86}
    env = EnvironmentDataRequest(**data)
    assert env.lat == 6.92
    
    with pytest.raises(ValidationError):
        EnvironmentDataRequest(lat="invalid_string", lon=79.86)

# Test 6: AdvisoryHistoryItem validation
def test_advisory_history_item_validation():
    data = {
        "user_id": "u1",
        "field_id": "f1",
        "district": "Colombo",
        "city": "Colombo",
        "zone": "Wet",
        "season": "Yala",
        "predicted_variety": "Bg 300",
        "suitability_score": 1
    }
    item = AdvisoryHistoryItem(**data)
    assert item.suitability_score == 1

# Test 7: YieldHistoryItem type constraint validation
def test_yield_history_item_type_conversion():
    data = {
        "user_id": "u1",
        "district": "Galle",
        "land_size": "2.5", # String instead of float
        "paddy_type": "Bg 352",
        "predicted_yield_kg_per_ha": "4500.5",
        "total_yield_kg": "11250.0"
    }
    item = YieldHistoryItem(**data)
    # Pydantic should automatically cast strings to floats
    assert isinstance(item.land_size, float)
    assert item.land_size == 2.5

# Test 8: DiseaseHistoryItem validation
def test_disease_history_item_validation():
    data = {
        "user_id": "u1",
        "disease_name": "Leaf Blast",
        "disease_type": "Fungal",
        "confidence": 95.5
    }
    item = DiseaseHistoryItem(**data)
    assert item.confidence == 95.5

# Test 9: FertilizerHistoryItem validation
def test_fertilizer_history_item_validation():
    data = {
        "user_id": "u1",
        "agro_zone": "Dry",
        "irrigation": "Major",
        "crop_duration": "3 Months",
        "total_urea": 100.5
    }
    item = FertilizerHistoryItem(**data)
    assert item.total_urea == 100.5
    assert item.total_mop == 0.0 # Check default values

# Test 10: Default value assignments test (use_firebase)
def test_yield_prediction_default_assignment():
    data = {
        "District": "Kandy",
        "Total_Land_Size": 1.0,
        "Paddy_Type": "At 362",
        "lat": 7.29,
        "lon": 80.63,
        "use_firebase": True
    }
    item = YieldPredictionInput(**data)
    assert item.use_firebase is True # Override default
