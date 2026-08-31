import json
import uuid

# Base URL for the Postman collection
BASE_URL = "http://localhost:8000"

def create_item(name, method, url_path, json_body=None, formdata=None):
    request = {
        "method": method,
        "header": [],
        "url": {
            "raw": f"{BASE_URL}{url_path}",
            "host": ["{{base_url}}"],
            "path": url_path.strip("/").split("/")
        }
    }
    
    if json_body:
        request["header"].append({
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
        })
        request["body"] = {
            "mode": "raw",
            "raw": json.dumps(json_body, indent=4),
            "options": {
                "raw": {
                    "language": "json"
                }
            }
        }
    elif formdata:
        request["body"] = {
            "mode": "formdata",
            "formdata": formdata
        }
        
    return {
        "name": name,
        "request": request,
        "response": []
    }

# 1. Variety Prediction (10 cases)
variety_cases = [
    ("Valid: Dry Zone, Maha", {"District": "Anuradhapura", "Zone": "Dry Zone", "Season": "Maha", "Salinity_Prone": "No", "Iron_Toxicity_Prone": "No"}),
    ("Valid: Wet Zone, Yala", {"District": "Kalutara", "Zone": "Wet Zone", "Season": "Yala", "Salinity_Prone": "Yes", "Iron_Toxicity_Prone": "No"}),
    ("Valid: Intermediate Zone", {"District": "Kurunegala", "Zone": "Intermediate Zone", "Season": "Maha", "Salinity_Prone": "No", "Iron_Toxicity_Prone": "Yes"}),
    ("Edge: High Salinity Dry Zone", {"District": "Polonnaruwa", "Zone": "Dry Zone", "Season": "Yala", "Salinity_Prone": "Yes", "Iron_Toxicity_Prone": "No"}),
    ("Edge: Both Toxicities", {"District": "Galle", "Zone": "Wet Zone", "Season": "Maha", "Salinity_Prone": "Yes", "Iron_Toxicity_Prone": "Yes"}),
    ("Valid: Ampara Maha", {"District": "Ampara", "Zone": "Dry Zone", "Season": "Maha", "Salinity_Prone": "No", "Iron_Toxicity_Prone": "No"}),
    ("Valid: Hambantota Yala", {"District": "Hambantota", "Zone": "Dry Zone", "Season": "Yala", "Salinity_Prone": "Yes", "Iron_Toxicity_Prone": "No"}),
    ("Invalid: Missing District", {"Zone": "Dry Zone", "Season": "Maha", "Salinity_Prone": "No", "Iron_Toxicity_Prone": "No"}),
    ("Invalid: Wrong Data Types", {"District": 123, "Zone": "Dry Zone", "Season": "Maha", "Salinity_Prone": "No", "Iron_Toxicity_Prone": "No"}),
    ("Invalid: Empty Payload", {}),
]

# 2. Yield Prediction (10 cases)
yield_cases = [
    ("Valid: Colombo Bg 300", {"District": "Colombo", "Total_Land_Size": 5.5, "Paddy_Type": "Bg 300", "lat": 6.9271, "lon": 79.8612}),
    ("Valid: Anuradhapura Bg 352", {"District": "Anuradhapura", "Total_Land_Size": 2.0, "Paddy_Type": "Bg 352", "lat": 8.3114, "lon": 80.4037}),
    ("Valid: Kurunegala Ld 368", {"District": "Kurunegala", "Total_Land_Size": 10.0, "Paddy_Type": "Ld 368", "lat": 7.4818, "lon": 80.3609}),
    ("Valid: Polonnaruwa At 306", {"District": "Polonnaruwa", "Total_Land_Size": 1.5, "Paddy_Type": "At 306", "lat": 7.9403, "lon": 81.0188}),
    ("Valid: Small Land Size", {"District": "Gampaha", "Total_Land_Size": 0.5, "Paddy_Type": "Bg 300", "lat": 7.0873, "lon": 79.9997}),
    ("Valid: Huge Land Size", {"District": "Ampara", "Total_Land_Size": 50.0, "Paddy_Type": "Bg 352", "lat": 7.2833, "lon": 81.6667}),
    ("Valid: Hambantota Bg 366", {"District": "Hambantota", "Total_Land_Size": 4.2, "Paddy_Type": "Bg 366", "lat": 6.1248, "lon": 81.1185}),
    ("Invalid: Missing Coordinates", {"District": "Colombo", "Total_Land_Size": 5.5, "Paddy_Type": "Bg 300"}),
    ("Invalid: Negative Land Size", {"District": "Colombo", "Total_Land_Size": -5.5, "Paddy_Type": "Bg 300", "lat": 6.9271, "lon": 79.8612}),
    ("Invalid: Empty Payload", {}),
]

# 3. Environment Data (6 cases)
env_cases = [
    ("Valid: Fetch Firebase Data", {"lat": 7.8731, "lon": 80.7718, "use_firebase": True, "field_id": "field_001"}),
    ("Valid: Fetch Weather API Only", {"lat": 6.9271, "lon": 79.8612, "use_firebase": False, "field_id": ""}),
    ("Valid: Anuradhapura Coordinates", {"lat": 8.3114, "lon": 80.4037, "use_firebase": True, "field_id": "field_002"}),
    ("Valid: Remote Coordinates", {"lat": 0.0, "lon": 0.0, "use_firebase": False, "field_id": "field_003"}),
    ("Invalid: Missing Lat/Lon", {"use_firebase": True, "field_id": "field_001"}),
    ("Invalid: Empty Payload", {}),
]

# 4. History API (6 cases)
history_cases = [
    ("GET Valid User History", "GET", "/api/history/user_12345"),
    ("GET Empty/Non-existent User", "GET", "/api/history/unknown_999"),
    ("POST Save Valid History", "POST", "/api/history", {
        "user_id": "user_12345", "field_id": "field_01", "district": "Anuradhapura", "city": "Anuradhapura City", "zone": "Dry Zone", "season": "Maha", "predicted_variety": "Bg 300", "suitability_score": 5
    }),
    ("POST Save Minimum History", "POST", "/api/history", {
        "user_id": "user_12345"
    }),
    ("POST Save Missing UserID", "POST", "/api/history", {
        "field_id": "field_01", "district": "Anuradhapura"
    }),
    ("POST Save History with Nulls", "POST", "/api/history", {
        "user_id": "user_999", "district": None, "city": None
    }),
]

# 5. Disease Prediction (5 cases)
disease_cases = [
    ("Valid: Test Image 1", [{"key": "file", "type": "file", "src": "example_leaf_1.jpg"}]),
    ("Valid: Test Image 2", [{"key": "file", "type": "file", "src": "example_leaf_2.jpg"}]),
    ("Valid: Non-leaf Image", [{"key": "file", "type": "file", "src": "random_image.jpg"}]),
    ("Invalid: No File Provided", []),
    ("Invalid: Wrong Field Name", [{"key": "document", "type": "file", "src": "example_leaf_1.jpg"}]),
]

# 6. Suitability Prediction (5 cases)
suitability_cases = [
    ("Valid: Dry Zone Maha", {"District": "Anuradhapura", "Zone": "Dry Zone", "Season": "Maha", "Paddy_Type": "Bg 300"}),
    ("Valid: Wet Zone Yala", {"District": "Kalutara", "Zone": "Wet Zone", "Season": "Yala", "Paddy_Type": "Bg 352"}),
    ("Valid: Intermediate Zone", {"District": "Kurunegala", "Zone": "Intermediate Zone", "Season": "Maha", "Paddy_Type": "Ld 368"}),
    ("Invalid: Missing Paddy Type", {"District": "Kurunegala", "Zone": "Intermediate Zone", "Season": "Maha"}),
    ("Invalid: Empty Payload", {}),
]

# Build Collection
collection = {
    "info": {
        "name": "Digital Goviya Backend Tests (Viva)",
        "description": "Comprehensive test suite for the Digital Goviya FastAPI Backend containing 40+ endpoints for the Viva presentation.",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "variable": [
        {
            "key": "base_url",
            "value": "http://localhost:8000",
            "type": "string"
        }
    ],
    "item": []
}

folders = {
    "Variety Prediction": [create_item(n, "POST", "/predict", json_body=p) for n, p in variety_cases],
    "Yield Prediction": [create_item(n, "POST", "/predict_yield_production", json_body=p) for n, p in yield_cases],
    "Suitability Prediction": [create_item(n, "POST", "/predict_suitability", json_body=p) for n, p in suitability_cases],
    "Environment Data": [create_item(n, "POST", "/api/environment_data", json_body=p) for n, p in env_cases],
    "History": [create_item(n, method, url, json_body=b if method=="POST" else None) for n, method, url, *b in (tuple(c) + (None,) if len(c)==3 else c for c in history_cases)],
    "Disease Prediction": [create_item(n, "POST", "/predict_disease", formdata=f) for n, f in disease_cases],
}

for folder_name, items in folders.items():
    collection["item"].append({
        "name": folder_name,
        "item": items
    })

# Total checks count
total = sum(len(f) for f in folders.values())
print(f"Generated {total} API checks!")

with open("Postman_Digital_Farming_API_Tests.json", "w") as f:
    json.dump(collection, f, indent=4)
