import os
import pickle
import numpy as np
# pyrefly: ignore [missing-import]
import xgboost as xgb
from services.preprocess_weather import preprocess_historical_weather
from services.firebase_service import fetch_iot_data, init_firebase
from services.weather_api import fetch_forecast_weather

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'yield_predictor.pkl')

def train_and_save_model(csv_path):
    """
    Trains the XGBoost model using historical dataset and saves it to disk.
    """
    print("Preprocessing data for training...")
    df = preprocess_historical_weather(csv_path)
    
    # Features we will train on
    features = ['temp_mean', 'humidity_mean', 'soil_moisture_7']
    X = df[features]
    y = df['suitability_score'] - 1 # XGBoost needs labels to start at 0 (so 0 to 4 instead of 1 to 5)

    print("Training XGBoost Model...")
    model = xgb.XGBClassifier(
        n_estimators=100, 
        learning_rate=0.1,
        max_depth=5, 
        use_label_encoder=False, 
        eval_metric='mlogloss'
    )
    model.fit(X, y)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Model saved to {MODEL_PATH}")

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Please train it first.")
    with open(MODEL_PATH, 'rb') as f:
        return pickle.load(f)

def predict_yield_suitability(field_id, lat, lon):
    """
    Predicts yield suitability (1-5) for a given field based on real-time IoT and forecast weather.
    """
    # 1. Init Firebase and load Model
    init_firebase()
    model = load_model()
    
    # 2. Fetch realtime IoT
    iot_data = fetch_iot_data(field_id)
    if not iot_data:
        print(f"Warning: No IoT data found for field {field_id}. Using sample data.")
        # Fallback to sample data instead of crashing
        iot_data = {
            'temp_mean': 28.5,
            'humidity_mean': 75.0,
            'soil_moisture_7': 0.35
        }
    
    # 3. Fetch Forecast Weather
    forecast_data = fetch_forecast_weather(lat, lon)
    if not forecast_data:
        raise ValueError(f"Failed to fetch forecast for {lat}, {lon}")
        
    # 4. Combine Features
    # We mix realtime and forecast to get an "overall" current state.
    # In a real system, you might weight these differently.
    combined_temp = (iot_data['temp_mean'] + forecast_data['forecast_temp_mean']) / 2
    combined_hum = (iot_data['humidity_mean'] + forecast_data['forecast_humidity_mean']) / 2
    combined_moisture = iot_data['soil_moisture_7'] # Use realtime soil moisture
    
    # Create input vector matching the training features
    X_input = np.array([[combined_temp, combined_hum, combined_moisture]])
    
    # 5. Predict
    prediction_raw = model.predict(X_input)[0]
    suitability_score = int(prediction_raw) + 1 # Convert back to 1-5
    
    # Simple logic for feature importance / reasons
    reasoning = []
    if combined_temp > 32:
        reasoning.append("Temperature is too high.")
    elif combined_temp < 22:
        reasoning.append("Temperature is too low.")
    else:
        reasoning.append("Temperature is optimal.")
        
    if combined_moisture < 0.3:
        reasoning.append("Soil moisture is critically low.")
    else:
        reasoning.append("Soil moisture is optimal.")
        
    return {
        "suitability_score": suitability_score,
        "metrics": {
            "temperature": round(combined_temp, 2),
            "humidity": round(combined_hum, 2),
            "soil_moisture": round(combined_moisture, 2)
        },
        "reasoning": " ".join(reasoning)
    }

if __name__ == "__main__":
    # Test training (if dataset exists)
    dataset_path = "/Users/nerandadilhara/Desktop/Research/dataset/weather-data/Open-meteo-WeatherData-2019-to-2026.csv"
    if os.path.exists(dataset_path):
        train_and_save_model(dataset_path)
    
    # Test Prediction (Needs a valid field_id in Firebase and valid API)
    # print(predict_yield_suitability("field_001", 7.8731, 80.7718))
