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

# Model paths
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
NPK_MODEL_PATH = os.path.join(MODELS_DIR, "npk_model.pkl")
YIELD_MODEL_PATH = os.path.join(MODELS_DIR, "yield_model.pkl")
CNN_MODEL_PATH = os.path.join(MODELS_DIR, "disease_model.h5")

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
    except Exception as e:
        print(f"Error loading models: {e}")

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
                
                # Check for low confidence
                if confidence < 0.5:
                    cnn_disease = "Uncertain"
                    category = "Uncertain"
                    treatment = "Confidence is too low to determine disease. Please capture a clearer image."
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
    return VARIETIES

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
    # Dynamically generate the timeline-based plan
    var_info = VARIETIES.get(variety, VARIETIES["Samba_BG300"])
    
    return {
        "variety": var_info,
        "fertilizer_schedule": FERTILIZER_PLAN,
        "water_schedule": WATER_PLAN
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
