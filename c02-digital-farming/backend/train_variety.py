import pandas as pd
import numpy as np
import os
import glob
import json
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, precision_recall_fscore_support
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'datasets')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

# Agro-ecological zones mapping for realistic synthetic data generation
# Average temp range (C) and humidity range (%)
DISTRICT_CLIMATE_MAP = {
    'Anuradhapura': {'temp': (27, 35), 'humidity': (60, 80), 'zone': 'Dry'},
    'Polonnaruwa': {'temp': (26, 34), 'humidity': (65, 85), 'zone': 'Dry'},
    'Ampara': {'temp': (26, 33), 'humidity': (65, 80), 'zone': 'Dry'},
    'Batticaloa': {'temp': (27, 33), 'humidity': (70, 85), 'zone': 'Dry'},
    'Kurunegala': {'temp': (25, 32), 'humidity': (70, 90), 'zone': 'Intermediate'},
    'Puttalam': {'temp': (25, 33), 'humidity': (65, 85), 'zone': 'Intermediate'},
    'Hambantota': {'temp': (26, 33), 'humidity': (65, 85), 'zone': 'Dry'},
    'Trincomalee': {'temp': (27, 34), 'humidity': (70, 85), 'zone': 'Dry'},
    'Kalutara': {'temp': (24, 31), 'humidity': (75, 95), 'zone': 'Wet'},
    'Galle': {'temp': (25, 31), 'humidity': (70, 90), 'zone': 'Wet'},
    'Matara': {'temp': (25, 31), 'humidity': (70, 90), 'zone': 'Wet'},
    'Gampaha': {'temp': (25, 32), 'humidity': (75, 90), 'zone': 'Wet'},
    'Kegalle': {'temp': (24, 31), 'humidity': (75, 95), 'zone': 'Wet'},
    'Ratnapura': {'temp': (23, 30), 'humidity': (75, 95), 'zone': 'Wet'},
    'Badulla': {'temp': (20, 29), 'humidity': (70, 90), 'zone': 'Intermediate'},
    'Moneragala': {'temp': (22, 32), 'humidity': (65, 85), 'zone': 'Intermediate'},
    'Matale': {'temp': (23, 31), 'humidity': (75, 95), 'zone': 'Wet'},
    'Kandy': {'temp': (20, 30), 'humidity': (70, 90), 'zone': 'Wet'},
    'Nuwara Eliya': {'temp': (15, 25), 'humidity': (70, 95), 'zone': 'Wet'},
    'Vavuniya': {'temp': (27, 34), 'humidity': (60, 80), 'zone': 'Dry'},
    'Mullaitivu': {'temp': (26, 34), 'humidity': (60, 80), 'zone': 'Dry'},
    'Kilinochchi': {'temp': (27, 33), 'humidity': (65, 80), 'zone': 'Dry'},
    'Mannar': {'temp': (27, 34), 'humidity': (60, 80), 'zone': 'Dry'},
    'Jaffna': {'temp': (28, 35), 'humidity': (60, 80), 'zone': 'Dry'},
    'Colombo': {'temp': (25, 31), 'humidity': (75, 90), 'zone': 'Wet'}
}

def generate_grounded_data():
    """
    Parses historical Yala and Maha CSV files to build a grounded synthetic dataset
    with realistic weather parameters and optimal varieties.
    """
    print("Parsing Yala and Maha historical datasets...")
    np.random.seed(42)
    random.seed(42)
    
    yala_files = glob.glob(os.path.join(DATASETS_DIR, '*Yala.csv'))
    maha_files = glob.glob(os.path.join(DATASETS_DIR, '*Maha.csv'))
    
    all_files = yala_files + maha_files
    if not all_files:
        print("Warning: No Yala/Maha CSV files found. Using fallback generator.")
        return generate_fallback_synthetic_data()
        
    data = []
    
    for file in all_files:
        try:
            df_season = pd.read_csv(file)
            if 'District' not in df_season.columns:
                continue
                
            season_encoded = 0 if 'Yala' in os.path.basename(file) else 1
            
            for _, row in df_season.iterrows():
                district = str(row['District']).strip().title()
                
                # Default to Intermediate if district not found
                climate = DISTRICT_CLIMATE_MAP.get(district, {'temp': (24, 32), 'humidity': (65, 85), 'zone': 'Intermediate'})
                
                # Generate weather grounded in the district's climate profile
                temp = round(np.random.uniform(*climate['temp']), 1)
                humidity = round(np.random.uniform(*climate['humidity']), 1)
                
                # Soil moisture linked to season and yield (if available)
                avg_yield = row.get('Average_Yield', 4000)
                try:
                    if isinstance(avg_yield, str):
                        avg_yield = float(avg_yield.replace(',', '').strip())
                except:
                    avg_yield = 4000
                    
                if pd.isna(avg_yield):
                    avg_yield = 4000
                
                # Higher yield usually means better moisture/rain
                if avg_yield > 4500 or climate['zone'] == 'Wet':
                    soil_moisture = round(np.random.uniform(50.0, 90.0), 1)
                    rain = np.random.choice([0, 1], p=[0.7, 0.3]) # 0 = rain, 1 = dry
                else:
                    soil_moisture = round(np.random.uniform(20.0, 60.0), 1)
                    rain = np.random.choice([0, 1], p=[0.3, 0.7])

                # Determine Ideal Variety using Agricultural Heuristics
                if season_encoded == 0 or (soil_moisture < 40 and rain == 1):
                    # Yala season or Poor water -> Short duration / Hardy
                    if soil_moisture < 30:
                        variety = "Red Rice"
                    else:
                        variety = "Samba_BG300"
                else:
                    # Maha season with adequate water
                    if soil_moisture > 70:
                        variety = np.random.choice(["Keeri Samba", "Nadu_BG366", "Nadu_BG360"])
                    elif 50 <= soil_moisture <= 70:
                        variety = np.random.choice(["Samba_BG352", "White Rice"])
                    else:
                        variety = "Red Rice"
                        
                # Heat tolerance adjustment
                if temp > 33.0 and variety in ["Keeri Samba", "Nadu_BG366"]:
                    variety = "Nadu_BG360"
                    
                data.append([temp, humidity, soil_moisture, rain, season_encoded, variety])
                
        except Exception as e:
            print(f"Error processing file {file}: {e}")
            
    df = pd.DataFrame(data, columns=['temperature', 'humidity', 'soil_moisture', 'rain', 'season_encoded', 'variety'])
    print(f"Generated {len(df)} historically-grounded records.")
    
    # If the historical records are too few (e.g. less than 2000), supplement with fallback data
    if len(df) < 2000:
        print("Supplementing dataset with fallback generator...")
        df_fallback = generate_fallback_synthetic_data(num_samples=2000 - len(df))
        df = pd.concat([df, df_fallback], ignore_index=True)
        
    return df

def generate_fallback_synthetic_data(num_samples=2000):
    np.random.seed(42)
    random.seed(42)
    data = []
    
    for _ in range(num_samples):
        temp = round(np.random.uniform(25.0, 35.0), 1)
        humidity = round(np.random.uniform(60.0, 95.0), 1)
        soil_moisture = round(np.random.uniform(10.0, 90.0), 1)
        rain = np.random.choice([0, 1], p=[0.3, 0.7])
        season_encoded = np.random.choice([0, 1])
        
        variety = "Samba_BG300"
        if season_encoded == 0 or (soil_moisture < 40 and rain == 1):
            if soil_moisture < 30:
                variety = "Red Rice"
            else:
                variety = "Samba_BG300"
        else:
            if soil_moisture > 70:
                variety = np.random.choice(["Keeri Samba", "Nadu_BG366", "Nadu_BG360"])
            elif 50 <= soil_moisture <= 70:
                variety = np.random.choice(["Samba_BG352", "White Rice"])
            else:
                variety = "Red Rice"
                
        if temp > 33.0 and variety in ["Keeri Samba", "Nadu_BG366"]:
            variety = "Nadu_BG360"
            
        data.append([temp, humidity, soil_moisture, rain, season_encoded, variety])
        
    return pd.DataFrame(data, columns=['temperature', 'humidity', 'soil_moisture', 'rain', 'season_encoded', 'variety'])

def train_variety_model():
    print("Building dataset for Variety Prediction...")
    df = generate_grounded_data()
    
    data_path = os.path.join(DATA_DIR, 'grounded_variety_data.csv')
    df.to_csv(data_path, index=False)
    print(f"Grounded dataset saved to {data_path}")
    
    features = ['temperature', 'humidity', 'soil_moisture', 'rain', 'season_encoded']
    target = 'variety'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestClassifier for Variety Prediction...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    
    # Calculate Multi-Factor Evaluation Metrics
    acc = accuracy_score(y_test, y_pred)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted')
    
    metrics = {
        "accuracy": round(acc * 100, 2),
        "precision": round(precision * 100, 2),
        "recall": round(recall * 100, 2),
        "f1_score": round(f1 * 100, 2)
    }
    
    print(f"\n--- Variety Model Evaluation ---")
    print(f"Accuracy: {metrics['accuracy']}%")
    print(f"Precision: {metrics['precision']}%")
    print(f"Recall: {metrics['recall']}%")
    print(f"F1 Score: {metrics['f1_score']}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model
    model_path = os.path.join(MODELS_DIR, 'variety_model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")
    
    # Save the metrics for the Gradio UI
    metrics_path = os.path.join(MODELS_DIR, 'variety_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"Metrics saved to {metrics_path}")

if __name__ == "__main__":
    train_variety_model()
