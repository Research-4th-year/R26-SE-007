import pytest
import io

@pytest.mark.system
def test_end_to_end_variety_and_history(client, mock_ml_models, mock_weather, mock_firebase):
    """Case 13: E2E Variety Prediction -> Yield Prediction -> Save to History"""
    # 1. Predict Variety
    variety_payload = {
        "District": "Kurunegala",
        "Zone": "Intermediate Zone",
        "Season": "Maha",
        "Salinity_Prone": "No",
        "Iron_Toxicity_Prone": "Yes"
    }
    variety_resp = client.post("/predict", json=variety_payload)
    assert variety_resp.status_code == 200
    variety = variety_resp.json()["predicted_variety_code"]
    
    # 2. Predict Yield using predicted variety
    yield_payload = {
        "District": "Kurunegala",
        "Total_Land_Size": 2.0,
        "Paddy_Type": variety,
        "lat": 7.4818,
        "lon": 80.3609
    }
    yield_resp = client.post("/predict_yield_production", json=yield_payload)
    assert yield_resp.status_code == 200
    
    # 3. Save to History (Mocking successful prediction flow saving)
    history_payload = {
        "user_id": "system_test_user_01",
        "field_id": "test_field",
        "district": "Kurunegala",
        "city": "Kurunegala City",
        "zone": "Intermediate Zone",
        "season": "Maha",
        "predicted_variety": variety,
        "suitability_score": 5
    }
    save_resp = client.post("/api/history", json=history_payload)
    assert save_resp.status_code == 200
    
    # 4. Fetch History
    fetch_resp = client.get("/api/history/system_test_user_01")
    assert fetch_resp.status_code == 200
    history_list = fetch_resp.json()
    assert len(history_list) >= 1
    assert any(h["predicted_variety"] == variety for h in history_list)

@pytest.mark.system
def test_disease_detection_workflow(client, mock_ml_models):
    """Case 14: Disease Detection Image Upload Workflow"""
    from PIL import Image
    image = Image.new('RGB', (100, 100), color='green')
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    
    response = client.post(
        "/predict_disease",
        files={"file": ("leaf.jpg", img_byte_arr, "image/jpeg")}
    )
    assert response.status_code == 200
    res_data = response.json()
    assert "disease" in res_data
    assert "confidence" in res_data
    assert "disease_type" in res_data

@pytest.mark.system
def test_environment_suitability_fallback(client, mock_ml_models, mock_firebase, mock_weather):
    """Case 15: Env data + IoT fallback workflow"""
    # Simulate a scenario where IoT is turned off and weather API must take over.
    # When use_firebase is False, mock_weather's forecast (temp=30.0) should be prioritized over Firebase (temp=28.5)
    
    env_payload = {
        "lat": 7.4818,
        "lon": 80.3609,
        "use_firebase": False,
        "field_id": "offline_field"
    }
    
    env_resp = client.post("/api/environment_data", json=env_payload)
    assert env_resp.status_code == 200
    env_data = env_resp.json()
    
    # Because use_firebase is False, it should use the weather mock directly!
    assert env_data["Temperature_C"] == 30.0  # from mock_weather
    assert env_data["Soil_Moisture"] == 0.35  # default fallback since no firebase
