import pandas as pd
import numpy as np
import os
import joblib
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Create models dir if not exists
os.makedirs(MODELS_DIR, exist_ok=True)

PROCESSED_FILE = os.path.join(DATA_DIR, 'processed_yield_data.csv')

def train_yield_model():
    print(f"Loading processed Yield data from {PROCESSED_FILE}...")
    if not os.path.exists(PROCESSED_FILE):
        print("Data not found. Please run data_preprocessing.py first.")
        return
        
    df = pd.read_csv(PROCESSED_FILE)
    
    # Features and Target
    # Based on preprocessing: N, P, K, temperature, humidity, rainfall, yield
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'rainfall']
    target = 'yield'
    
    X = df[features]
    y = df[target]
    
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor for Yield Prediction...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    
    mse = mean_squared_error(y_test, y_pred)
    rmse = float(np.sqrt(mse))
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))
    
    metrics = {
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "r2_score": round(r2, 4)
    }
    
    print(f"\n--- Yield Model Evaluation ---")
    print(f"Root Mean Squared Error (RMSE): {metrics['rmse']}")
    print(f"Mean Absolute Error (MAE): {metrics['mae']}")
    print(f"R² Score: {metrics['r2_score']}")
    
    # Save the model
    model_path = os.path.join(MODELS_DIR, 'yield_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    # Save the metrics for the Gradio UI
    metrics_path = os.path.join(MODELS_DIR, 'yield_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    train_yield_model()
