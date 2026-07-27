# pyrefly: ignore [missing-import]
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import Optional
import datetime
# pyrefly: ignore [missing-import]
import joblib
# pyrefly: ignore [missing-import]
import numpy as np
import os
import io
# pyrefly: ignore [missing-import]
from PIL import Image
from digital_twin import analyze_farm_state
from firebase_config import initialize_firebase, get_firebase_db
from knowledge_base import VARIETIES, FERTILIZER_PLAN, WATER_PLAN, DISEASE_GUIDE, SOIL_TYPES
from fertilizer_recommendation import recommend_fertilizer
from fungicide_recommendation import get_fungicide_recommendation
from auto_prediction import predict_soil_type, predict_water_condition, suggest_paddy_variety
from services.weather_service import WeatherService

# Try importing TF, handle gracefully if not installed yet
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

app = FastAPI(title="Smart Paddy Farming API")

# Setup CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase on startup
initialize_firebase()

# Global variables for models
npk_model = None
yield_model = None
cnn_model = None
variety_advisory_model = None
yield_advisory_model = None
advisory_metadata = {}
sri_lankan_paddy_varieties_db = {}
historical_district_weather_db = {}

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
NPK_MODEL_PATH = os.path.join(MODELS_DIR, "npk_model.pkl")
YIELD_MODEL_PATH = os.path.join(MODELS_DIR, "yield_model.pkl")
CNN_MODEL_PATH = os.path.join(MODELS_DIR, "disease_model.h5")
VARIETY_ADVISORY_MODEL_PATH = os.path.join(MODELS_DIR, "variety_advisory_model.pkl")
YIELD_ADVISORY_MODEL_PATH = os.path.join(MODELS_DIR, "yield_advisory_model.pkl")

# Class names for disease detection mapped to categories
DISEASE_MAPPING = {
    'Bacterial Blight': {'category': 'Bacterial Disease', 'treatment': 'Use copper-based bactericides, avoid excess nitrogen.'},
    'Brown Spot': {'category': 'Fungal Disease', 'treatment': 'Apply fungicides containing edifenphos or mancozeb. Ensure proper soil nutrition.'},
    'Leaf Blast': {'category': 'Fungal Disease', 'treatment': 'Apply tricyclazole or isoprothiolane. Reduce humidity and avoid late planting.'},
    'Healthy': {'category': 'Healthy', 'treatment': 'No treatment needed. Keep up the good work!'}
}
DISEASE_CLASSES = list(DISEASE_MAPPING.keys())

# Let's dynamically load classes if JSON exists
import json
try:
    with open(os.path.join(MODELS_DIR, 'disease_classes.json'), 'r') as f:
        classes_dict = json.load(f)
        # Sort by value to get ordered classes
        DISEASE_CLASSES = [k for k, v in sorted(classes_dict.items(), key=lambda item: item[1])]
except:
    pass

@app.on_event("startup")
def load_models():
    global npk_model, yield_model, cnn_model
    global variety_advisory_model, yield_advisory_model, advisory_metadata
    global sri_lankan_paddy_varieties_db, historical_district_weather_db
    try:
        if os.path.exists(NPK_MODEL_PATH):
            npk_model = joblib.load(NPK_MODEL_PATH)
            print("NPK model loaded.")
        if os.path.exists(YIELD_MODEL_PATH):
            yield_model = joblib.load(YIELD_MODEL_PATH)
            print("Yield model loaded.")
        if TF_AVAILABLE and os.path.exists(CNN_MODEL_PATH):
            cnn_model = tf.keras.models.load_model(CNN_MODEL_PATH)
            print("CNN model loaded.")
            
        # Load new advisory models and metadata
        if os.path.exists(VARIETY_ADVISORY_MODEL_PATH):
            variety_advisory_model = joblib.load(VARIETY_ADVISORY_MODEL_PATH)
            print("Variety Advisory model loaded.")
        if os.path.exists(YIELD_ADVISORY_MODEL_PATH):
            yield_advisory_model = joblib.load(YIELD_ADVISORY_MODEL_PATH)
            print("Yield Advisory model loaded.")
        if os.path.exists(os.path.join(MODELS_DIR, 'advisory_metadata.json')):
            with open(os.path.join(MODELS_DIR, 'advisory_metadata.json'), 'r') as f:
                advisory_metadata = json.load(f)
                
        # Load JSON databases
        if os.path.exists(os.path.join(DATA_DIR, 'sri_lankan_paddy_varieties.json')):
            with open(os.path.join(DATA_DIR, 'sri_lankan_paddy_varieties.json'), 'r') as f:
                sri_lankan_paddy_varieties_db = json.load(f)
        if os.path.exists(os.path.join(DATA_DIR, 'historical_district_weather.json')):
            with open(os.path.join(DATA_DIR, 'historical_district_weather.json'), 'r') as f:
                historical_district_weather_db = json.load(f)
                
    except Exception as e:
        print(f"Error loading models: {e}")

class RecommendVarietyRequest(BaseModel):
    season: str
    zone: str
    district: str
    field_area_hectares: float
    sensor_data: Optional[dict] = None

class PredictYieldRequest(BaseModel):
    variety: str
    season: str
    district: str
    zone: str
    field_area_hectares: float
    temperature: float
    humidity: float
    rainfall: float
    light: float
    n: float
    p: float
    k: float

class GeneratePlanRequest(BaseModel):
    variety: str
    season: str
    district: str
    field_area_hectares: float


class SensorData(BaseModel):
    temperature: float
    humidity: float
    soil1: int
    soil2: int
    rain: float
    light: float
    district_encoded: Optional[int] = 0
    season_encoded: Optional[int] = 0

class FarmerProfile(BaseModel):
    selected_variety: str
    field_area_hectares: float
    soil_type: str
    planting_date: str
    current_soil_moisture: Optional[str] = "Normal"
    water_availability: Optional[str] = "Good"
    previous_crop: Optional[str] = "None"
    season: Optional[str] = "Maha"

def predict_npk_yield(temperature, humidity, rain, avg_soil, district_encoded=0, season_encoded=0):
    npk_pred = {'N': 0, 'P': 0, 'K': 0}
    # Our trained model takes [temperature, humidity, rainfall]
    npk_features = pd.DataFrame({'temperature': [temperature], 'humidity': [humidity], 'rainfall': [rain]}) if 'pandas' in globals() else np.array([[temperature, humidity, rain]])
    
    if npk_model:
        # In case the model was trained without feature names
        pred = npk_model.predict(npk_features.values if hasattr(npk_features, 'values') else npk_features)[0]
        npk_pred = {'N': round(pred[0], 2), 'P': round(pred[1], 2), 'K': round(pred[2], 2)}
        
    yield_pred_value = 0
    if yield_model and npk_model:
        # Yield input features: ['N', 'P', 'K', 'temperature', 'humidity', 'rainfall']
        yield_features = np.array([[npk_pred['N'], npk_pred['P'], npk_pred['K'], 
                                   temperature, humidity, rain]])
        yield_pred_value = round(yield_model.predict(yield_features)[0], 2)
        
    return npk_pred, yield_pred_value

import pandas as pd

@app.post("/sensor-data")
async def receive_sensor_data(data: SensorData):
    avg_soil = (data.soil1 + data.soil2) / 2
    
    # 1. NPK & Yield Prediction
    npk_pred, yield_pred_value = predict_npk_yield(data.temperature, data.humidity, data.rain, avg_soil, data.district_encoded, data.season_encoded)

    # 3. Get latest disease status from Firebase
    disease_status = None
    db_ref = get_firebase_db()
    if db_ref is not None:
        try:
            latest_disease = db_ref.child("latest_disease_scan").get()
            if latest_disease and isinstance(latest_disease, dict):
                disease_status = latest_disease.get('result')
            elif hasattr(latest_disease, 'val'): 
                val = latest_disease.val()
                if val:
                    disease_status = val.get('result')
        except Exception as e:
            print(f"Error fetching latest disease: {e}")

    # 4. Fetch active farmer profile
    farmer_profile = None
    if db_ref is not None:
        try:
            profile_data = db_ref.child("farmer_profile").get()
            if profile_data and isinstance(profile_data, dict):
                farmer_profile = profile_data
            elif hasattr(profile_data, 'val'): 
                val = profile_data.val()
                if val:
                    farmer_profile = val
        except Exception as e:
            print(f"Error fetching farmer profile: {e}")

    # 5. Get Digital Twin recommendations
    sensor_dict = data.dict()
    recommendations = analyze_farm_state(sensor_dict, npk_pred, disease_status, farmer_profile)

    # Extract category for top-level payload from nested structure
    top_level_category = "Healthy"
    if disease_status and 'disease' in disease_status:
        top_level_category = disease_status['disease'].get('category', "Healthy")

    # 5. Construct payload
    timestamp = datetime.datetime.now().isoformat()
    payload = {
        "timestamp": timestamp,
        "sensors": sensor_dict,
        "predictions": {
            "npk": npk_pred,
            "yield_prediction_kg_per_ha": yield_pred_value
        },
        "recommendations": recommendations,
        "disease_category": top_level_category
    }

    # 5. Store in Firebase under a nested timestamp structure
    if db_ref is not None:
        try:
            db_ref.child("farm_data").child(timestamp.replace('.', '_').replace(':', '-')).set(payload)
            # Keeping the latest node up to date for easy reading
            db_ref.child("farm_data_latest").set(payload)
        except Exception as e:
            print(f"Firebase save error: {e}")

    return {"status": "success", "data": payload}

@app.post("/predict-disease")
async def predict_disease(
    file: Optional[UploadFile] = File(None),
    temperature: float = Form(...),
    humidity: float = Form(...),
    rain: float = Form(...),
    soil1: float = Form(...),
    soil2: float = Form(...),
    district_encoded: int = Form(0),
    season_encoded: int = Form(0)
):
    if not cnn_model:
        raise HTTPException(status_code=503, detail="CNN Model not loaded or available.")
    
    try:
        # Defaults
        cnn_disease = "Healthy"
        category = "Healthy"
        confidence = 1.0
        treatment = "No treatment needed. Keep up the good work!"
        fertilizer_rec = "N/A"
        fungicide_rec = "N/A"

        # Image Prediction (CNN)
        if file and file.filename and cnn_model:
            contents = await file.read()
            if contents:
                image = Image.open(io.BytesIO(contents)).convert('RGB')
                image = image.resize((224, 224))
                img_array = np.array(image) / 255.0
                img_array = np.expand_dims(img_array, axis=0)
                
                predictions = cnn_model.predict(img_array)
                predicted_class_idx = np.argmax(predictions[0])
                confidence = float(np.max(predictions[0]))
                
                # Check for low confidence or non-leaf images (High threshold for out-of-distribution)
                if confidence < 0.90:
                    cnn_disease = "Other Disease / Not Related"
                    category = "Uncertain"
                    treatment = "The image is not recognized as a known paddy disease with high confidence. It may be another disease, not a paddy leaf, or too blurry."
                else:
                    cnn_disease = DISEASE_CLASSES[predicted_class_idx]
                    category = DISEASE_MAPPING.get(cnn_disease, {}).get('category', 'Healthy')
                    treatment = DISEASE_MAPPING.get(cnn_disease, {}).get('treatment', 'No treatment needed.')

        # NPK Prediction
        avg_soil = (soil1 + soil2) / 2
        npk_pred, yield_pred_value = predict_npk_yield(temperature, humidity, rain, avg_soil, district_encoded, season_encoded)

        # Hybrid Logic implementation
        # Thresholds: N < 50, P < 30, K < 30 -> Nutrient Deficiency
        if cnn_disease == 'Healthy' or cnn_disease == 'Uncertain' or not file:
            if npk_pred['N'] < 50:
                category = "Nutrient Deficiency"
                cnn_disease = "Nitrogen deficiency"
            elif npk_pred['P'] < 30:
                category = "Nutrient Deficiency"
                cnn_disease = "Phosphorus deficiency"
            elif npk_pred['K'] < 30:
                category = "Nutrient Deficiency"
                cnn_disease = "Potassium deficiency"

        if category == "Nutrient Deficiency":
            fertilizer_rec = recommend_fertilizer(npk_pred)
            treatment = f"Apply recommended fertilizer ({fertilizer_rec}) to address nutrient deficiency."
        elif category == "Fungal Disease":
            fungicide_rec = get_fungicide_recommendation(cnn_disease)
            treatment = f"Apply {fungicide_rec} and adjust water levels."
        elif category == "Bacterial Disease":
            fungicide_rec = get_fungicide_recommendation(cnn_disease)
            treatment = "Apply Bactericide and improve drainage."

        result = {
            "category": category,
            "disease": cnn_disease,
            "confidence": round(confidence, 4),
            "npk": npk_pred,
            "yield": yield_pred_value,
            "fertilizer": fertilizer_rec,
            "fungicide": fungicide_rec,
            "recommendation": treatment
        }
        
        # Store in Firebase
        db_ref = get_firebase_db()
        if db_ref is not None:
            db_ref.child("latest_disease_scan").set({
                "timestamp": datetime.datetime.now().isoformat(),
                "result": {
                    "disease": {
                        "category": category,
                        "name": cnn_disease,
                        "confidence": round(confidence, 4)
                    }
                }
            })
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/latest-data")
async def get_latest_data():
    db_ref = get_firebase_db()
    if db_ref is not None:
        try:
            # Get the most recent entry from farm_data_latest
            query = db_ref.child("farm_data_latest").get()
            if query:
                if isinstance(query, dict):
                    return query
                elif hasattr(query, 'val'):
                    return query.val()
        except Exception as e:
             raise HTTPException(status_code=500, detail=str(e))
    
    # Return mock data if firebase is not connected
    return {
        "sensors": {"temperature": 28.5, "humidity": 75, "soil1": 40, "soil2": 45, "light": 800, "rain": 5},
        "predictions": {"npk": {"N": 55, "P": 35, "K": 45}, "yield_prediction_kg_per_ha": 4200.5},
        "recommendations": {
            "irrigation": "Moderate: Consider irrigation soon.",
            "fertilizer": "Nutrient levels are optimal.",
            "disease_alert": "No disease detected"
        },
        "disease_category": "Healthy"
    }

@app.post("/farmer-profile")
async def save_farmer_profile(profile: FarmerProfile):
    db_ref = get_firebase_db()
    if db_ref is not None:
        try:
            db_ref.child("farmer_profile").set(profile.dict())
            return {"status": "success", "message": "Profile saved."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"status": "error", "message": "Firebase not connected."}

class AutoPredictRequest(BaseModel):
    field_area_hectares: float
    season: str
    sensor_data: dict

@app.post("/auto-predict")
async def auto_predict(req: AutoPredictRequest):
    sensor_data = req.sensor_data
    
    # 1. Automatic Predictions
    predicted_soil = predict_soil_type(sensor_data)
    predicted_water = predict_water_condition(sensor_data)
    suggested_variety = suggest_paddy_variety(sensor_data, req.season)
    
    # 2. Get static plan for the suggested variety
    var_info = VARIETIES.get(suggested_variety, VARIETIES["Samba_BG300"])
    
    # 3. Predict NPK and Yield for the summary
    avg_soil = (sensor_data.get('soil1', 0) + sensor_data.get('soil2', 0)) / 2
    npk_pred, yield_pred_value = predict_npk_yield(
        sensor_data.get('temperature', 28),
        sensor_data.get('humidity', 75),
        sensor_data.get('rain', 1),
        avg_soil,
        0, 0
    )
    
    # 4. Digital Twin Simulation to get dynamic recommendations based on this new plan
    farmer_profile_mock = {
        "selected_variety": suggested_variety,
        "soil_type": predicted_soil,
        "water_availability": predicted_water,
        "planting_date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "field_area_hectares": req.field_area_hectares,
        "season": req.season
    }
    
    # Passing no disease status to get default recommendations
    dt_recommendations = analyze_farm_state(sensor_data, npk_pred, None, farmer_profile_mock)

    response_payload = {
        "predictions": {
            "soil_type": predicted_soil,
            "water_status": predicted_water,
            "variety": suggested_variety
        },
        "variety_details": var_info,
        "npk": npk_pred,
        "yield_prediction_kg_per_ha": yield_pred_value,
        "cultivation_plan": {
            "fertilizer_schedule": FERTILIZER_PLAN,
            "water_schedule": WATER_PLAN,
            "dynamic_recommendations": dt_recommendations
        }
    }

    # Store in Firebase
    db_ref = get_firebase_db()
    if db_ref is not None:
        try:
            # Save the auto generated profile
            db_ref.child("farmer_profile").set(farmer_profile_mock)
            
            # Save the plan history
            timestamp = datetime.datetime.now().isoformat()
            db_ref.child("auto_predictions").child(timestamp.replace('.', '_').replace(':', '-')).set(response_payload)
        except Exception as e:
            print("Firebase saving error:", e)

    return response_payload

@app.get("/varieties")
async def get_varieties():
    return sri_lankan_paddy_varieties_db if sri_lankan_paddy_varieties_db else VARIETIES

def calculate_disease_risk(weather_data):
    temp = weather_data.get("temperature", 28.5)
    hum = weather_data.get("humidity", 75.0)
    rain = weather_data.get("rainfall", 0.0)
    wind = weather_data.get("windSpeed", 10.0)
    
    # 1. Rice Blast Risk (Fungal)
    # Cool-moderate (20-28°C), high humidity (>85%), wet leaf (rainfall > 0)
    blast_score = 0
    if 20.0 <= temp <= 28.0:
        blast_score += 35
    elif 18.0 <= temp < 20.0 or 28.0 < temp <= 32.0:
        blast_score += 15
        
    if hum >= 85.0:
        blast_score += 40
    elif 75.0 <= hum < 85.0:
        blast_score += 20
        
    if rain > 0.0:
        blast_score += 25
        
    blast_risk = min(95.0, max(10.0, float(blast_score)))
    
    # 2. Brown Spot Risk (Fungal)
    # Warm (25-32°C), high humidity (>80%), nutrient/water stress (rain == 0 is stress)
    brown_score = 0
    if 25.0 <= temp <= 32.0:
        brown_score += 35
    elif 20.0 <= temp < 25.0 or 32.0 < temp <= 35.0:
        brown_score += 15
        
    if hum >= 80.0:
        brown_score += 35
    elif 70.0 <= hum < 80.0:
        brown_score += 15
        
    if rain > 0.0:
        brown_score += 20
    else:
        brown_score += 30
        
    brown_risk = min(95.0, max(15.0, float(brown_score)))
    
    # 3. Bacterial Leaf Blight (BLB) Risk (Bacterial)
    # Warm (25-34°C), high humidity (>80%), heavy rain/wind causing wounds
    blb_score = 0
    if 25.0 <= temp <= 34.0:
        blb_score += 35
        
    if hum >= 80.0:
        blb_score += 35
        
    if rain > 5.0:
        blb_score += 30
    elif rain > 0.0:
        blb_score += 15
        
    if wind > 15.0:
        blb_score += 20
        
    blb_risk = min(95.0, max(10.0, float(blb_score)))
    
    return {
        "rice_blast_pct": round(blast_risk, 1),
        "brown_spot_pct": round(brown_risk, 1),
        "bacterial_blight_pct": round(blb_risk, 1)
    }

@app.get("/current-weather")
async def get_current_weather(district: str):
    try:
        weather_data = WeatherService.getCurrentWeather(district)
        risks = calculate_disease_risk(weather_data)
        iot_status = WeatherService.checkIoTStatus()
        return {
            "weather": weather_data,
            "iot_status": iot_status,
            "disease_risks": risks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/fertilizer-plan")
async def get_fertilizer_plan():
    return FERTILIZER_PLAN

@app.get("/water-plan")
async def get_water_plan():
    return WATER_PLAN

@app.get("/disease-guide")
async def get_disease_guide():
    return DISEASE_GUIDE

@app.get("/soil-types")
async def get_soil_types():
    return SOIL_TYPES

@app.get("/cultivation-plan")
async def get_cultivation_plan(variety: str = "Samba_BG300"):
    var_info = VARIETIES.get(variety, VARIETIES["Samba_BG300"])
    return {
        "variety": var_info,
        "fertilizer_schedule": FERTILIZER_PLAN,
        "water_schedule": WATER_PLAN
    }

# ========================================================
# UPGRADED AI ADVISORY & RECOMMENDATION ENDPOINTS
# ========================================================

@app.post("/recommend-variety")
async def recommend_variety(req: RecommendVarietyRequest):
    if not variety_advisory_model or not yield_advisory_model:
        raise HTTPException(status_code=500, detail="Advisory recommendation ML models not loaded.")
        
    # Get dynamic weather details from WeatherService
    weather_data = WeatherService.getCurrentWeather(req.district)
    
    # Retrieve weather statistics from database for sunlight and seasonal averages
    zone_data = historical_district_weather_db.get(req.zone, {})
    dist_weather = zone_data.get(req.district, {}).get(req.season, {
        "temperature": 28.0,
        "humidity": 75.0,
        "rainfall": 120.0,
        "sunlight": 7.0,
        "seasonal_rainfall": 800.0
    })
    
    # If IoT Device is active, use IoT weather data. Otherwise use historical weather.
    if weather_data.get("source") == "IOT_DEVICE":
        temp = weather_data["temperature"]
        hum = weather_data["humidity"]
        rain_val = weather_data["rainfall"]
        rain = 0 if rain_val > 100 else 1
    else:
        temp = dist_weather["temperature"]
        hum = dist_weather["humidity"]
        rain_val = dist_weather["rainfall"]
        rain = 0 if rain_val > 100 else 1
        
    avg_soil = 50.0
    if req.sensor_data:
        temp = req.sensor_data.get("temperature", temp)
        hum = req.sensor_data.get("humidity", hum)
        rain_val = req.sensor_data.get("rain", rain_val)
        rain = 0 if rain_val > 100 else 1
        avg_soil = (req.sensor_data.get("soil1", 50) + req.sensor_data.get("soil2", 50)) / 2
        
    npk_pred, _ = predict_npk_yield(temp, hum, rain_val, avg_soil)
    
    # Encoders lists
    district_list = advisory_metadata.get("districts", [])
    variety_list = advisory_metadata.get("varieties", [])
    
    dist_encoded = district_list.index(req.district) if req.district in district_list else 0
    zone_encoded = 0 if req.zone == "Dry Zone" else 1
    season_encoded = 0 if req.season == "Yala" else 1
    
    # Run variety prediction probabilities
    features_cls = np.array([[
        season_encoded,
        dist_encoded,
        zone_encoded,
        temp,
        hum,
        rain_val,
        dist_weather["sunlight"],
        npk_pred["N"],
        npk_pred["P"],
        npk_pred["K"]
    ]])
    
    proba = variety_advisory_model.predict_proba(features_cls)[0]
    
    ranked_list = []
    for idx, score in enumerate(proba):
        var_id = variety_list[idx]
        var_info = sri_lankan_paddy_varieties_db.get(var_id, {})
        
        # Predict yield for this specific variety
        features_reg = np.array([[
            season_encoded,
            dist_encoded,
            zone_encoded,
            temp,
            hum,
            rain_val,
            dist_weather["sunlight"],
            npk_pred["N"],
            npk_pred["P"],
            npk_pred["K"],
            idx
        ]])
        predicted_yield = round(float(yield_advisory_model.predict(features_reg)[0]), 2)
        
        # Build explanation/reasoning:
        # e.g., "Bg352: Best for current weather, high yield potential"
        reason = ""
        if idx == np.argmax(proba):
            reason = f"Top recommended variety for {req.season} in {req.district}. Best suited for {temp}°C climate with strong NPK utilization."
        else:
            reason = f"Excellent alternative. Good yield potential of {predicted_yield} t/ha under current district weather constraints."
            
        ranked_list.append({
            "id": var_id,
            "name": var_info.get("name", var_id),
            "score": round(float(score) * 100, 1),
            "predicted_yield_t_ha": predicted_yield,
            "growing_period_months": var_info.get("age_group_months", 3.5),
            "growing_days": var_info.get("duration_days", 105),
            "suitable_season": var_info.get("suitable_season", "All"),
            "disease_resistance": var_info.get("disease_resistance", {}),
            "grain_type": var_info.get("grain_type", "White Nadu"),
            "description": var_info.get("description", ""),
            "reason": reason
        })
        
    ranked_list = sorted(ranked_list, key=lambda x: x["score"], reverse=True)
    
    return {
        "ranked_recommendations": ranked_list,
        "inputs": {
            "season": req.season,
            "district": req.district,
            "zone": req.zone,
            "field_area_hectares": req.field_area_hectares,
            "weather": dist_weather,
            "npk": npk_pred
        }
    }

@app.post("/predict-yield")
async def predict_yield(req: PredictYieldRequest):
    if not yield_advisory_model:
        raise HTTPException(status_code=500, detail="Yield model not loaded.")
        
    district_list = advisory_metadata.get("districts", [])
    variety_list = advisory_metadata.get("varieties", [])
    
    dist_encoded = district_list.index(req.district) if req.district in district_list else 0
    variety_encoded = variety_list.index(req.variety) if req.variety in variety_list else 0
    zone_encoded = 0 if req.zone == "Dry Zone" else 1
    season_encoded = 0 if req.season == "Yala" else 1
    
    features = np.array([[
        season_encoded,
        dist_encoded,
        zone_encoded,
        req.temperature,
        req.humidity,
        req.rainfall,
        req.light,
        req.n,
        req.p,
        req.k,
        variety_encoded
    ]])
    
    pred_val = float(yield_advisory_model.predict(features)[0])
    return {"predicted_yield_t_ha": round(pred_val, 2)}

@app.post("/generate-cultivation-plan")
async def generate_cultivation_plan(req: GeneratePlanRequest):
    variety_data = sri_lankan_paddy_varieties_db.get(req.variety)
    if variety_data:
        variety_info = dict(variety_data)
        variety_info["name"] = variety_info.get("english_name", req.variety)
    else:
        variety_info = {
            "name": req.variety,
            "age_group_months": 3.5,
            "duration_days": 105,
            "grain_type": "White Nadu",
            "expected_yield_t_ha": 6.0,
            "suitable_season": "All",
            "suitable_zone": "All"
        }
    
    duration = variety_info.get("duration_days", 105)
    scale = duration / 105.0
    area = req.field_area_hectares
    
    timeline = [
        {"week": "Week 0", "phase": "Land Preparation", "action": f"Begin primary tillage and land preparation. Apply basal organic manure to the {area} hectares."},
        {"week": f"Week {int(2 * scale)}", "phase": "Seed Treatment", "action": f"Soak {variety_info['name']} seeds for 24 hours and incubate for 48 hours. Sow sprouted seeds in nursery bed."},
        {"week": f"Week {int(4 * scale)}", "phase": "First Fertilizer Application", "action": "Apply first top dressing of Nitrogen (Urea) to boost vegetative shoot growth."},
        {"week": f"Week {int(6 * scale)}", "phase": "Water Management", "action": "Maintain shallow water levels (2-3 cm) to promote maximum tillering of roots."},
        {"week": f"Week {int(8 * scale)}", "phase": "Weed Control", "action": "Conduct manual weeding or apply selective post-emergence weed control measures."},
        {"week": f"Week {int(10 * scale)}", "phase": "Disease Monitoring", "action": f"Inspect crop closely for signs of disease or general yellowing."},
        {"week": f"Week {int(12 * scale)}", "phase": "Second Fertilizer Application", "action": "Apply second top dressing of Urea along with Muriate of Potash (MOP) at panicle initiation stage."},
        {"week": f"Week {int(14 * scale)}", "phase": "Pest Monitoring", "action": "Monitor fields for brown plant hoppers (BPH) or stem borers. Set pheromone traps."},
        {"week": f"Week {int(16 * scale)}", "phase": "Harvest Preparation", "action": "Begin draining the paddy field water gradually to accelerate grain drying and hardiness."},
        {"week": f"Week {int(18 * scale)}", "phase": "Harvesting & Milling", "action": f"Reap crop at 80-85% maturity. Thresh and dry paddy grains to 14% moisture level for optimal storage."}
    ]
    
    fertilizer_schedule = [
        {
            "week": f"Week {int(2 * scale)}",
            "fertilizer": "Organic Basal Manure",
            "image": "compost.jpg",
            "purpose": "Improves soil structure and organic matter.",
            "amount": f"{round(1000 * area, 1)} kg"
        },
        {
            "week": f"Week {int(4 * scale)}",
            "fertilizer": "Urea",
            "image": "urea.jpg",
            "purpose": "Nitrogen booster for vegetative shoot growth.",
            "amount": f"{round(50 * area, 1)} kg"
        },
        {
            "week": f"Week {int(8 * scale)}",
            "fertilizer": "TSP (Triple Super Phosphate)",
            "image": "tsp.jpg",
            "purpose": "Phosphorus booster for strong root development.",
            "amount": f"{round(25 * area, 1)} kg"
        },
        {
            "week": f"Week {int(12 * scale)}",
            "fertilizer": "MOP (Muriate of Potash)",
            "image": "mop.jpg",
            "purpose": "Potassium booster for grain size and weight filling.",
            "amount": f"{round(35 * area, 1)} kg"
        }
    ]
    
    diseases = [
        {
            "name": "Rice Blast",
            "symptoms": "Spindle-shaped spots on leaves, grey in center with reddish margins.",
            "image": "rice_blast.jpg",
            "prevention": "Avoid excess Nitrogen fertilizer and maintain optimal water level.",
            "treatment": "Spray Tricyclazole 75 WP or Tebuconazole.",
            "recommended_fungicide": "Tricyclazole (500 g/ha)"
        },
        {
            "name": "Brown Spot",
            "symptoms": "Oval spots on leaves with grey-brown centers. Leads to seed discoloration.",
            "image": "brown_spot.jpg",
            "prevention": "Maintain balanced NPK fertilizer schedule. Avoid silica deficiency.",
            "treatment": "Apply Mancozeb or Propiconazole EC.",
            "recommended_fungicide": "Mancozeb 75 WP (1000 g/ha)"
        },
        {
            "name": "Bacterial Leaf Blight",
            "symptoms": "Yellowing/waving of leaf tips. Prominent white-grey streaks on leaf margins.",
            "image": "bacterial_blight.jpg",
            "prevention": "Cultivate resistant varieties, avoid leaf clipping during transplanting.",
            "treatment": "Apply Copper hydroxide bactericide.",
            "recommended_fungicide": "Copper Hydroxide (1250 g/ha)"
        },
        {
            "name": "Nitrogen Deficiency",
            "symptoms": "Stunted plant growth and general yellowing of older leaves.",
            "image": "nitrogen_deficiency.jpg",
            "prevention": "Apply split doses of Urea correctly based on DOA calendar.",
            "treatment": "Top dress with Urea fertilizer immediately.",
            "recommended_fungicide": "Urea (Soluble foliar spray)"
        }
    ]
    
    expected_yield_total = round(variety_info.get("expected_yield_t_ha", 6.0) * area, 2)
    expected_income = int(expected_yield_total * 1000 * 120)
    
    return {
        "variety": variety_info,
        "timeline": timeline,
        "fertilizer_schedule": fertilizer_schedule,
        "diseases": diseases,
        "harvest_estimation": {
            "expected_yield_tons": expected_yield_total,
            "estimated_harvest_days": duration,
            "expected_income_lkr": expected_income,
            "confidence_pct": 92
        }
    }

@app.get("/get-variety-details")
async def get_variety_details(variety: str):
    var_info = sri_lankan_paddy_varieties_db.get(variety)
    if not var_info:
        raise HTTPException(status_code=404, detail="Variety not found")
    return var_info

@app.get("/get-disease-guide")
async def get_disease_guide_endpoint(variety: str = "Bg352"):
    var_info = sri_lankan_paddy_varieties_db.get(variety, {})
    resistance = var_info.get("disease_resistance", {})
    custom_warnings = []
    for d_name, res in resistance.items():
        if res == "Low":
            custom_warnings.append(f"WARNING: {variety} has low resistance to {d_name}. Early detection is critical.")
            
    return {
        "variety": variety,
        "resistance_profile": resistance,
        "warnings": custom_warnings,
        "general_diseases": DISEASE_GUIDE
    }

@app.get("/get-fertilizer-plan")
async def get_fertilizer_plan_endpoint(variety: str = "Bg352"):
    return {
        "fertilizer_plan": FERTILIZER_PLAN,
        "target_variety": variety
    }

@app.get("/metrics/variety")
async def get_variety_metrics():
    path = os.path.join(MODELS_DIR, 'variety_metrics.json')
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {"error": "Metrics not found"}

@app.get("/metrics/yield")
async def get_yield_metrics():
    path = os.path.join(MODELS_DIR, 'yield_metrics.json')
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {"error": "Metrics not found"}

@app.get("/metrics/disease")
async def get_disease_metrics():
    path = os.path.join(MODELS_DIR, 'disease_metrics.json')
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return {"error": "Metrics not found"}

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
