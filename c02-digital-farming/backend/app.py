# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, File, UploadFile
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
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
    field_id: str
    use_firebase: bool = False
    
class EnvironmentDataRequest(BaseModel):
    lat: float
    lon: float
    field_id: str
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
    print(f"{C_CYAN}🚀 STARTING FARMER ADVISORY BACKEND SERVICES...{C_END}")
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
    input_df = pd.DataFrame([input_data.dict()])
    
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
        
        if input_data.use_firebase and input_data.field_id:
            init_firebase()
            iot_data = fetch_iot_data(input_data.field_id)
            if iot_data:
                combined_temp = (iot_data['temp_mean'] + forecast_data['forecast_temp_mean']) / 2
                combined_hum = (iot_data['humidity_mean'] + forecast_data['forecast_humidity_mean']) / 2
                combined_moisture = iot_data['soil_moisture_7']
            else:
                print(f"Warning: No IoT data found for field {input_data.field_id}. Falling back to default soil moisture.")
        
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
        
        if input_data.use_firebase and input_data.field_id:
            init_firebase()
            iot_data = fetch_iot_data(input_data.field_id)
            if iot_data:
                combined_temp = (iot_data['temp_mean'] + forecast_data['forecast_temp_mean']) / 2
                combined_hum = (iot_data['humidity_mean'] + forecast_data['forecast_humidity_mean']) / 2
                combined_moisture = iot_data['soil_moisture_7']
            else:
                print(f"Warning: No IoT data found for field {input_data.field_id}.")
        
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
def predict_suitability(field_id: str, lat: float, lon: float):
    """
    Predicts the suitability of the yield for a specific field based on 
    real-time IoT metrics (via Firebase) and forecast weather data.
    """
    try:
        result = predict_yield_suitability(field_id, lat, lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Welcome to the Farmer Advisory Guidance System API"}

disease_model = None
disease_class_names = None

@app.post("/predict_disease")
async def predict_disease(file: UploadFile = File(...)):
    global disease_model, disease_class_names
    
    try:
        import tensorflow as tf
        from PIL import Image
        import numpy as np
        import io
        import json
    except ImportError:
        raise HTTPException(status_code=500, detail="TensorFlow or Pillow is not installed.")
        
    try:
        # Load model and classes lazily
        if disease_model is None:
            models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
            model_path = os.path.join(models_dir, 'disease_prediction_model.keras')
            classes_path = os.path.join(models_dir, 'disease_classes.json')
            
            if not os.path.exists(model_path):
                raise HTTPException(status_code=500, detail="Disease prediction model not found. Please train it first.")
                
            disease_model = tf.keras.models.load_model(model_path)
            with open(classes_path, 'r') as f:
                disease_class_names = json.load(f)
                
        # Read and preprocess the image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary (e.g. RGBA)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        # Resize to 224x224 for MobileNetV2
        image = image.resize((224, 224))
        img_array = tf.keras.preprocessing.image.img_to_array(image)
        img_array = tf.expand_dims(img_array, 0) # Create batch axis
        
        # Predict
        predictions = disease_model.predict(img_array)
        score = tf.nn.softmax(predictions[0]) if not isinstance(predictions[0], np.ndarray) else predictions[0]
        
        max_confidence = np.max(score)
        predicted_class_index = np.argmax(score)
        predicted_class = disease_class_names[predicted_class_index]
        
        # Safety net: if confidence is extremely low (<50%), fallback to "Another Type"
        if max_confidence < 0.50:
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
from database import get_db_connection
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

class AdvisoryHistoryItem(BaseModel):
    field_id: str
    district: str
    city: str
    zone: str
    season: str
    predicted_variety: str
    suitability_score: int

@app.post("/api/history")
def save_history(item: AdvisoryHistoryItem):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM advisory_history WHERE field_id = ?', (item.field_id,))
        existing_row = cursor.fetchone()
        
        if existing_row:
            cursor.execute('''
                UPDATE advisory_history 
                SET district = ?, city = ?, zone = ?, season = ?, predicted_variety = ?, suitability_score = ?, created_at = CURRENT_TIMESTAMP
                WHERE field_id = ?
            ''', (item.district, item.city, item.zone, item.season, item.predicted_variety, item.suitability_score, item.field_id))
            new_id = existing_row['id']
            msg = "Updated successfully"
        else:
            cursor.execute('''
                INSERT INTO advisory_history 
                (field_id, district, city, zone, season, predicted_variety, suitability_score) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (item.field_id, item.district, item.city, item.zone, item.season, item.predicted_variety, item.suitability_score))
            new_id = cursor.lastrowid
            msg = "Saved successfully"
            
        conn.commit()
        conn.close()
        return {"message": msg, "id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM advisory_history ORDER BY id DESC')
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/history/{id}")
def update_history(id: int, field_id: str):
    # For now, just updating the field_id as requested
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE advisory_history SET field_id = ? WHERE id = ?', (field_id, id))
        conn.commit()
        conn.close()
        return {"message": "Updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/history/{id}")
def delete_history(id: int):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM advisory_history WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
