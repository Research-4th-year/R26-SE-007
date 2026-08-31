import pytest
import io

@pytest.mark.integration
def test_predict_variety(client, mock_ml_models):
    """Case 8: POST /predict returns 200 with prediction"""
    payload = {
        "District": "Anuradhapura",
        "Zone": "Dry Zone",
        "Season": "Yala",
        "Salinity_Prone": "No",
        "Iron_Toxicity_Prone": "No"
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    assert "predicted_variety_code" in response.json()
    assert response.json()["predicted_variety_code"] == "Bg 300"

@pytest.mark.integration
def test_predict_yield_production(client, mock_ml_models):
    """Case 9: POST /predict_yield_production returns 200 with yield"""
    payload = {
        "District": "Colombo",
        "Total_Land_Size": 5.5,
        "Paddy_Type": "Bg 300",
        "lat": 6.9271,
        "lon": 79.8612
    }
    response = client.post("/predict_yield_production", json=payload)
    assert response.status_code == 200
    assert "predicted_yield_kg_per_ha" in response.json()
    assert response.json()["predicted_yield_kg_per_ha"] > 0

@pytest.mark.integration
def test_environment_data(client, mock_firebase, mock_weather):
    """Case 10: POST /api/environment_data fetches mock firebase"""
    payload = {
        "lat": 6.9271,
        "lon": 79.8612,
        "use_firebase": True,
        "field_id": "field_001"
    }
    response = client.post("/api/environment_data", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["Temperature_C"] == 28.5  # From firebase mock
    assert data["Humidity"] == 70.0       # From firebase mock
    assert data["Soil_Moisture"] == 0.45  # From firebase mock

@pytest.mark.integration
def test_predict_disease(client, mock_ml_models):
    """Case 11: POST /predict_disease with mock image upload"""
    # Create a dummy image file
    from PIL import Image
    image = Image.new('RGB', (100, 100), color='red')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    response = client.post(
        "/predict_disease",
        files={"file": ("test_image.jpg", img_byte_arr, "image/jpeg")}
    )
    assert response.status_code == 200
    assert "disease" in response.json()

@pytest.mark.integration
def test_history_api(client):
    """Case 12: GET /api/history/{uid} retrieves correctly"""
    # Because we don't have a mocked sqlite DB in conftest, this will hit the actual database.db
    # It might return empty if the user doesn't exist, but it should be 200 OK.
    response = client.get("/api/history/test_nonexistent_user_123")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
