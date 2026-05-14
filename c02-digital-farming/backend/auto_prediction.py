import os
# pyrefly: ignore [missing-import]
import joblib
# pyrefly: ignore [missing-import]
import numpy as np

# Load the ML variety model globally
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
variety_model_path = os.path.join(MODELS_DIR, 'variety_model.pkl')

variety_model = None
if os.path.exists(variety_model_path):
    try:
        variety_model = joblib.load(variety_model_path)
    except Exception as e:
        print(f"Failed to load variety model: {e}")

def predict_soil_type(sensor_data):
    """
    Predicts soil type based on sensor data.
    Since we don't have historical moisture retention data right now,
    we use basic heuristic rules based on current moisture and rain.
    """
    avg_soil = (sensor_data.get('soil1', 0) + sensor_data.get('soil2', 0)) / 2
    rain = sensor_data.get('rain', 1) # 1 = dry, 0 = raining
    
    if avg_soil > 70:
        return "Clay" # High retention
    elif avg_soil < 30 and rain == 1:
        return "Sandy" # Low retention, dries fast
    else:
        return "Loam" # Balanced

def predict_water_condition(sensor_data):
    """
    Predicts water availability status based on moisture and rain.
    """
    avg_soil = (sensor_data.get('soil1', 0) + sensor_data.get('soil2', 0)) / 2
    rain = sensor_data.get('rain', 1)
    
    if avg_soil > 60 or rain == 0:
        return "Good"
    elif avg_soil > 30:
        return "Moderate"
    else:
        return "Poor"

def suggest_paddy_variety(sensor_data, season="Maha"):
    """
    Predicts the optimal paddy variety using the trained Machine Learning model.
    """
    if variety_model is None:
        # Fallback to basic heuristics if model isn't loaded
        water_status = predict_water_condition(sensor_data)
        temp = sensor_data.get('temperature', 28)
        if season == "Yala" or water_status == "Poor":
            return "Bg_300"
        else:
            return "At_362" if temp > 30 else "Samba_BG300"
            
    # Extract features for ML model
    temp = sensor_data.get('temperature', 28.0)
    humidity = sensor_data.get('humidity', 75.0)
    avg_soil = (sensor_data.get('soil1', 0) + sensor_data.get('soil2', 0)) / 2
    rain = sensor_data.get('rain', 1)
    season_encoded = 0 if season == "Yala" else 1
    
    # Format exactly as trained: ['temperature', 'humidity', 'soil_moisture', 'rain', 'season_encoded']
    features = np.array([[temp, humidity, avg_soil, rain, season_encoded]])
    
    try:
        prediction = variety_model.predict(features)[0]
        return prediction
    except Exception as e:
        print(f"Variety Prediction Error: {e}")
        return "Samba_BG300" # Safe fallback
