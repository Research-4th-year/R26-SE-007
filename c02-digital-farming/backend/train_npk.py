import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# Create models dir if not exists
os.makedirs(MODELS_DIR, exist_ok=True)

PROCESSED_FILE = os.path.join(DATA_DIR, 'processed_npk_data.csv')

def train_npk_model():
    print(f"Loading processed NPK data from {PROCESSED_FILE}...")
    if not os.path.exists(PROCESSED_FILE):
        print("Data not found. Please run data_preprocessing.py first.")
        return
        
    df = pd.read_csv(PROCESSED_FILE)
    
    # Features and Target
    X = df[['temperature', 'humidity', 'rainfall']]
    y = df[['N', 'P', 'K']]
    
    # Split the dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor for NPK Prediction...")
    # Using RandomForestRegressor for multi-output regression
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\n--- NPK Model Evaluation ---")
    print(f"Mean Absolute Error (MAE): {mae:.4f}")
    print(f"R² Score: {r2:.4f}")
    
    # Save the model
    model_path = os.path.join(MODELS_DIR, 'npk_model.pkl')
    joblib.dump(model, model_path)
    print(f"\nModel saved to {model_path}")

if __name__ == "__main__":
    train_npk_model()
