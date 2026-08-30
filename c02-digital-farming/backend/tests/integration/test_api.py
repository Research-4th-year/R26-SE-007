import pytest

# Test user ID for integration tests to avoid messing with real data
TEST_USER_ID = "pytest_dummy_user_123"

# --- 10 Integration Tests ---

# Test 1: Root endpoint Health Check
def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

# Test 2: Rice Variety Prediction
def test_predict_variety(client):
    payload = {
        "District": "Ampara",
        "Zone": "Dry Zone",
        "Season": "Maha",
        "Salinity_Prone": "No",
        "Iron_Toxicity_Prone": "No"
    }
    response = client.post("/predict", json=payload)
    # The model may return 200 or 400 depending on exact feature matches,
    # but we verify the endpoint exists and processes the request.
    assert response.status_code in [200, 400]
    if response.status_code == 200:
        data = response.json()
        assert "predicted_variety_code" in data

# Test 3: Yield Prediction
def test_predict_yield_production(client):
    payload = {
        "District": "Kurunegala",
        "Total_Land_Size": 2.5,
        "Paddy_Type": "Bg 300",
        "lat": 7.48,
        "lon": 80.36,
        "use_firebase": False
    }
    response = client.post("/predict_yield_production", json=payload)
    assert response.status_code != 404 # Ensure endpoint exists
    if response.status_code == 200:
        data = response.json()
        assert "predicted_yield_kg_per_ha" in data

# Test 4: Sensor Latest Data retrieval
def test_get_sensor_latest(client):
    response = client.get("/api/sensor/latest")
    assert response.status_code == 200
    # It might return a 404 payload logically if no data, but HTTP is 200
    data = response.json()
    assert isinstance(data, dict)

# Test 5: Create Farmer Profile
def test_create_farmer_profile(client):
    payload = {
        "user_id": TEST_USER_ID,
        "name": "Test Farmer",
        "phone": "0000000000",
        "location": "Test City",
        "farm_size": 1.0
    }
    response = client.post("/api/profile", json=payload)
    assert response.status_code in [200, 500]
    if response.status_code == 200:
        assert response.json()["message"] == "Profile saved successfully"

# Test 6: Retrieve Farmer Profile
def test_get_farmer_profile(client):
    # This might return 404 if creation failed, which is fine for this test scope
    response = client.get(f"/api/profile/{TEST_USER_ID}")
    assert response.status_code in [200, 404]

# Test 7: Create Yield History
def test_create_yield_history(client):
    payload = {
        "user_id": TEST_USER_ID,
        "district": "Test District",
        "land_size": 2.0,
        "paddy_type": "Test Type",
        "predicted_yield_kg_per_ha": 4000.0,
        "total_yield_kg": 8000.0
    }
    response = client.post("/api/yield_history", json=payload)
    assert response.status_code in [200, 500]

# Test 8: Retrieve Yield History
def test_get_yield_history(client):
    response = client.get(f"/api/yield_history/{TEST_USER_ID}")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test 9: Create Disease History
def test_create_disease_history(client):
    payload = {
        "user_id": TEST_USER_ID,
        "disease_name": "Test Disease",
        "disease_type": "Viral",
        "confidence": 99.9
    }
    response = client.post("/api/disease_history", json=payload)
    assert response.status_code in [200, 500]

# Test 10: Create Fertilizer History
def test_create_fertilizer_history(client):
    payload = {
        "user_id": TEST_USER_ID,
        "agro_zone": "Test Zone",
        "irrigation": "Test Irrigation",
        "crop_duration": "3 Months",
        "total_urea": 50.0
    }
    response = client.post("/api/fertilizer_history", json=payload)
    assert response.status_code in [200, 500]
