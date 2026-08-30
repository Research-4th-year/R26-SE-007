# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, File, UploadFile
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware # Allow requests from any frontend domains
# pyrefly: ignore [missing-import]
from pydantic import BaseModel # For Data validation
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd
import os
import requests
import numpy as np
from yield_predictor import predict_yield_suitability
from services.firebase_service import fetch_iot_data, init_firebase
from services.weather_api import fetch_forecast_weather

app = FastAPI(title="Farmer Advisory Guidance System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the input data schema
class PredictionInput(BaseModel):
    District: str
    Zone: str
    Season: str
    Salinity_Prone: str
    Iron_Toxicity_Prone: str

class YieldPredictionInput(BaseModel):
    District: str
    Total_Land_Size: float
    Paddy_Type: str
    lat: float
    lon: float
    field_id: str = ""
    use_firebase: bool = False
    
class EnvironmentDataRequest(BaseModel):
    lat: float
    lon: float
    field_id: str = ""
    use_firebase: bool = False

# Global variables for model and category data
model = None
category_data = None
yield_pipeline = None

import time

@app.on_event("startup")
def load_resources():
    global model, category_data, yield_pipeline
    
    # ANSI Colors
    C_GREEN = '\033[92m'
    C_BLUE = '\033[94m'
    C_CYAN = '\033[96m'
    C_YELLOW = '\033[93m'
    C_END = '\033[0m'

    print(f"\n{C_CYAN}=================================================={C_END}")
    print(f"{C_CYAN} STARTING FARMER ADVISORY BACKEND SERVICES...{C_END}")
    print(f"{C_CYAN}=================================================={C_END}\n")
    
    time.sleep(0.3)
    print(f"{C_BLUE}[STEP 1/3]{C_END} Loading Rice Variety ML Model...")
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'rice_variety_predictor.pkl')
    try:
        model = joblib.load(model_path)
        print(f"   {C_GREEN}✔ Model loaded successfully!{C_END}")
    except FileNotFoundError:
        print(f"   {C_YELLOW}⚠ Warning: Model not found at {model_path}.{C_END}")
    
    time.sleep(0.3)
    print(f"\n{C_BLUE}[STEP 2/3]{C_END} Caching Rice Category Dataset...")
    category_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'SL_Rice_Varietal_CategoryBased_Dataset.csv')
    try:
        category_data = pd.read_csv(category_path)
        category_data.set_index('Variety_Code', inplace=True)
        print(f"   {C_GREEN}✔ Dataset cached into memory!{C_END}")
    except FileNotFoundError:
        print(f"   {C_YELLOW}⚠ Warning: Category dataset not found.{C_END}")
        
    time.sleep(0.3)
    print(f"\n{C_BLUE}[STEP 3/3]{C_END} Loading Yield Prediction Pipeline...")
    yield_model_path = os.path.join(os.path.dirname(__file__), 'models', 'yield_prediction_pipeline.pkl')
    try:
        yield_pipeline = joblib.load(yield_model_path)
        print(f"   {C_GREEN}✔ Yield pipeline ready for predictions!{C_END}")
    except FileNotFoundError:
        print(f"   {C_YELLOW}⚠ Warning: Yield prediction model not found.{C_END}")

    print(f"\n{C_GREEN}✅ SERVER IS LIVE AND LISTENING!{C_END}")
    print(f"{C_CYAN}=================================================={C_END}\n")

@app.post("/predict")
def predict_yield_type(input_data: PredictionInput):
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded. Please train the model first.")
        
    # Convert input to DataFrame for prediction
    input_df = pd.DataFrame([input_data.model_dump()])
    
    try:
        # Predict the Variety Code
        prediction = model.predict(input_df)[0]
        
        response = {
            "predicted_variety_code": prediction
        }
        
        # Enrich response with category details if available
        if category_data is not None and prediction in category_data.index:
            details = category_data.loc[prediction].to_dict()
            response["details"] = details
            
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/environment_data")
def get_environment_data(input_data: EnvironmentDataRequest):
    try:
        forecast_data = fetch_forecast_weather(input_data.lat, input_data.lon)
        if not forecast_data:
            raise ValueError(f"Failed to fetch forecast for {input_data.lat}, {input_data.lon}")
            
        combined_temp = forecast_data['forecast_temp_mean']
        combined_hum = forecast_data['forecast_humidity_mean']
        
        # Default soil moisture if Firebase is disabled or fails
        combined_moisture = 0.35 
        
        if input_data.use_firebase:
            init_firebase()
            iot_data = fetch_iot_data(input_data.field_id)
            if iot_data:
                combined_temp = iot_data['temp_mean']
                combined_hum = iot_data['humidity_mean']
                combined_moisture = iot_data['soil_moisture_7']
            else:
                print(f"Warning: No IoT data found. Falling back to weather and default soil moisture.")
        
        return {
            "Temperature_C": float(combined_temp),
            "Humidity": float(combined_hum),
            "Soil_Moisture": float(combined_moisture)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict_yield_production")
def predict_yield_production(input_data: YieldPredictionInput):
    if yield_pipeline is None:
        raise HTTPException(status_code=500, detail="Yield prediction model is not loaded. Please train the model first.")
        
    try:
        forecast_data = fetch_forecast_weather(input_data.lat, input_data.lon)
        if not forecast_data:
            raise ValueError(f"Failed to fetch forecast for {input_data.lat}, {input_data.lon}")
            
        combined_temp = forecast_data['forecast_temp_mean']
        combined_hum = forecast_data['forecast_humidity_mean']
        combined_moisture = 0.35
        
        if input_data.use_firebase:
            init_firebase()
            iot_data = fetch_iot_data(input_data.field_id)
            if iot_data:
                combined_temp = iot_data['temp_mean']
                combined_hum = iot_data['humidity_mean']
                combined_moisture = iot_data['soil_moisture_7']
            else:
                print(f"Warning: No IoT data found. Falling back to weather and default soil moisture.")
        
        # Extract components from pipeline
        model_xgb = yield_pipeline['model']
        encoders = yield_pipeline['encoders']
        scaler = yield_pipeline['scaler']
        features = yield_pipeline['feature_names']
        
        # Prepare input dataframe
        input_dict = {
            'District': input_data.District,
            'Total_Land_Size': input_data.Total_Land_Size,
            'Paddy_Type': input_data.Paddy_Type,
            'Temperature_C': combined_temp,
            'Humidity': combined_hum,
            'Soil_Moisture': combined_moisture
        }
        input_df = pd.DataFrame([input_dict])
        
        # Encode categorical features
        for col in ['District', 'Paddy_Type']:
            if col in input_df.columns and col in encoders:
                le = encoders[col]
                val = str(input_df[col].iloc[0]).upper().strip()
                if val in le.classes_:
                    input_df[col] = le.transform([val])
                else:
                    input_df[col] = 0
                    
        # Ensure column order matches training
        input_df = input_df[features]
        
        # Scale
        X_scaled = scaler.transform(input_df)
        
        # Predict yield (kg/ha)
        predicted_yield = model_xgb.predict(X_scaled)[0]
        
        # Calculate total production (Metric Tons)
        total_production = (predicted_yield * input_data.Total_Land_Size) / 1000.0
        
        # Simple agronomic insights
        insights = []
        if combined_moisture < 0.2:
            insights.append("Soil moisture is very low. Consider increasing irrigation immediately to prevent yield loss.")
        elif combined_moisture > 0.4:
            insights.append("Soil moisture is high. Ensure proper drainage to avoid root rot.")
        else:
            insights.append("Soil moisture is optimal for this paddy type.")
            
        if combined_temp > 32:
            insights.append("Temperature is slightly high, which may cause heat stress during flowering stages.")
            
        return {
            "predicted_yield_kg_per_ha": float(predicted_yield),
            "total_estimated_production_mt": float(total_production),
            "environmental_factors": {
                "Temperature_C": float(combined_temp),
                "Humidity": float(combined_hum),
                "Soil_Moisture": float(combined_moisture)
            },
            "confidence_interval": {
                "lower": float(predicted_yield * 0.85),
                "upper": float(predicted_yield * 1.15)
            },
            "agronomic_recommendations": insights,
            "metrics": yield_pipeline.get('metrics', {})
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/predict_suitability")
def predict_suitability(field_id: str, lat: float, lon: float, use_firebase: bool = False):
    """
    Predicts the suitability of the yield for a specific field based on 
    real-time IoT metrics (via Firebase) and forecast weather data.
    """
    try:
        result = predict_yield_suitability(field_id, lat, lon, use_firebase)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to the Farmer Advisory Guidance System API"}

disease_model = None
disease_class_names = None

@app.post("/predict_disease")
def predict_disease(file: UploadFile = File(...)):
    global disease_model, disease_class_names
    
    try:
        import tensorflow as tf
        import keras
        from PIL import Image
        import numpy as np
        import io
        import json
    except ImportError:
        raise HTTPException(status_code=500, detail="TensorFlow, Keras, or Pillow is not installed.")
        
    try:
        # Load model and classes lazily
        if disease_model is None:
            models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
            model_path = os.path.join(models_dir, 'disease_prediction_model.keras')
            classes_path = os.path.join(models_dir, 'disease_classes.json')
            if not os.path.exists(model_path):
                raise HTTPException(status_code=500, detail="Disease prediction model not found. Please train it first.")
            
            disease_model = keras.models.load_model(model_path, compile=False)
                    
            with open(classes_path, 'r') as f:
                disease_class_names = json.load(f)
                
        # Read and preprocess the image
        contents = file.file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary (e.g. RGBA)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Resize to 224x224 for MobileNetV2
        image = image.resize((224, 224))
        img_array = keras.preprocessing.image.img_to_array(image)
        img_array = tf.expand_dims(img_array, 0) # Create batch axis
        
        # Predict (using direct call instead of .predict() to avoid TF threading bugs)
        predictions = disease_model(img_array, training=False)
        
        # If it returns a dict (e.g. from TFSMLayer fallback), extract the tensor
        if isinstance(predictions, dict):
            predictions = list(predictions.values())[0]

        # score = tf.nn.softmax(predictions[0]) if not isinstance(predictions[0], np.ndarray) else predictions[0]
        
        # max_confidence = np.max(score)
        # predicted_class_index = np.argmax(score)
        # predicted_class = disease_class_names[predicted_class_index]
        score = predictions[0]

        # If the model outputs logits (values > 1 or < 0), apply softmax to get probabilities
        if tf.reduce_max(score) > 1.01 or tf.reduce_min(score) < -0.01:
            score = tf.nn.softmax(score)

        max_confidence = float(tf.reduce_max(score))
        predicted_class_index = int(tf.argmax(score))
        predicted_class = disease_class_names[predicted_class_index]
        
        # Safety net: Models with few classes often output 60-80% confidence for random noise.
        # A higher threshold (e.g., 85%) ensures unrelated images are classified as "Another Type".
        if max_confidence < 0.85:
            final_disease = "Another Type"
            disease_type = "Unknown"
        else:
            final_disease = predicted_class
            # Map types
            if final_disease.lower() in ["blast", "brownspot", "riceblast", "brown_spot", "leaf_blast"]:
                disease_type = "Fungal"
            elif final_disease.lower() in ["bacterialblight", "bacterial_leaf_blight"]:
                disease_type = "Bacterial"
            elif final_disease.lower() == "healthy":
                disease_type = "Healthy"
            else:
                disease_type = "Unknown"
                
        return {
            "disease": final_disease,
            "disease_type": disease_type,
            "confidence": float(max_confidence * 100),
            "all_scores": {class_name: float(score[i]*100) for i, class_name in enumerate(disease_class_names)}
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

@app.get("/api/sensor/latest")
def get_latest_sensor_data():
    url = "https://research-4y2s-default-rtdb.firebaseio.com/sensor.json"
    default_data = {
        "temperature": 28.50,
        "humidity": 75.20,
        "soilMoisture": 63,
        "timestamp": "2026-08-10 21:30:00"
    }
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data:
                return data
    except Exception as e:
        print(f"Error fetching Firebase data: {e}")
        
    return default_data

# Advisory History API
from services.firebase_service import (
    save_user_history, get_user_history, delete_user_history,
    save_farmer_profile, get_farmer_profile
)
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

class AdvisoryHistoryItem(BaseModel):
    user_id: str
    field_id: str
    district: str
    city: str
    zone: str
    season: str
    predicted_variety: str
    suitability_score: int

class FarmerProfile(BaseModel):
    user_id: str
    name: str
    phone: str
    location: str
    farm_size: float
    farm_unit: str = "Acres"

@app.post("/api/history")
def save_history(item: AdvisoryHistoryItem):
    try:
        # Save to Firebase under advisory_history category
        result = save_user_history(item.user_id, "advisory_history", item.model_dump())
        if result:
            return {"message": "Saved successfully", "id": result.get("id")}
        raise HTTPException(status_code=500, detail="Failed to save to Firebase")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/{user_id}")
def get_history(user_id: str):
    try:
        records = get_user_history(user_id, "advisory_history")
        # Sort by created_at descending if exists
        records.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/{user_id}/{record_id}")
def delete_history(user_id: str, record_id: str):
    try:
        if delete_user_history(user_id, "advisory_history", record_id):
            return {"message": "Deleted successfully"}
        raise HTTPException(status_code=500, detail="Failed to delete from Firebase")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/{user_id}")
def get_profile(user_id: str):
    try:
        profile = get_farmer_profile(user_id)
        if profile:
            return profile
        return {"message": "Profile not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/profile")
def save_profile(profile: FarmerProfile):
    try:
        result = save_farmer_profile(profile.user_id, profile.model_dump())
        if result:
            return {"message": "Profile saved successfully"}
        raise HTTPException(status_code=500, detail="Failed to save profile")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/profile/{user_id}")
def delete_profile(user_id: str):
    # In a full setup, we would delete the entire user node. 
    # For now, just delete the profile object.
    from services.firebase_service import FIREBASE_RTDB_URL
    import requests
    try:
        requests.delete(f"{FIREBASE_RTDB_URL}/users/{user_id}.json")
        return {"message": "Profile and associated history deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= YIELD HISTORY =================

class YieldHistoryItem(BaseModel):
    user_id: str
    district: str
    land_size: float
    paddy_type: str
    predicted_yield_kg_per_ha: float
    total_yield_kg: float

@app.post("/api/yield_history")
def save_yield_history(item: YieldHistoryItem):
    try:
        result = save_user_history(item.user_id, "yield_history", item.model_dump())
        if result:
            return {"message": "Yield history saved successfully"}
        raise HTTPException(status_code=500, detail="Failed to save yield history")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/yield_history/{user_id}")
def get_yield_history_endpoint(user_id: str):
    try:
        records = get_user_history(user_id, "yield_history")
        records.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/yield_history/{user_id}/{record_id}")
def delete_yield_history_endpoint(user_id: str, record_id: str):
    try:
        if delete_user_history(user_id, "yield_history", record_id):
            return {"message": "Deleted successfully"}
        raise HTTPException(status_code=500, detail="Failed to delete from Firebase")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= DISEASE HISTORY =================

class DiseaseHistoryItem(BaseModel):
    user_id: str
    disease_name: str
    disease_type: str
    confidence: float

@app.post("/api/disease_history")
def save_disease_history(item: DiseaseHistoryItem):
    try:
        result = save_user_history(item.user_id, "disease_history", item.model_dump())
        if result:
            return {"message": "Disease history saved successfully"}
        raise HTTPException(status_code=500, detail="Failed to save disease history")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/disease_history/{user_id}")
def get_disease_history_endpoint(user_id: str):
    try:
        records = get_user_history(user_id, "disease_history")
        records.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/disease_history/{user_id}/{record_id}")
def delete_disease_history_endpoint(user_id: str, record_id: str):
    try:
        if delete_user_history(user_id, "disease_history", record_id):
            return {"message": "Deleted successfully"}
        raise HTTPException(status_code=500, detail="Failed to delete from Firebase")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= FERTILIZER HISTORY =================

class FertilizerHistoryItem(BaseModel):
    user_id: str
    agro_zone: str
    irrigation: str
    crop_duration: str
    total_urea: float = 0
    total_tsp: float = 0
    total_mop: float = 0
    total_zinc: float = 0

@app.post("/api/fertilizer_history")
def save_fertilizer_history(item: FertilizerHistoryItem):
    try:
        result = save_user_history(item.user_id, "fertilizer_history", item.model_dump())
        if result:
            return {"message": "Fertilizer history saved successfully"}
        raise HTTPException(status_code=500, detail="Failed to save fertilizer history")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/fertilizer_history/{user_id}")
def get_fertilizer_history_endpoint(user_id: str):
    try:
        records = get_user_history(user_id, "fertilizer_history")
        records.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/fertilizer_history/{user_id}/{record_id}")
def delete_fertilizer_history_endpoint(user_id: str, record_id: str):
    try:
        if delete_user_history(user_id, "fertilizer_history", record_id):
            return {"message": "Deleted successfully"}
        raise HTTPException(status_code=500, detail="Failed to delete from Firebase")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
