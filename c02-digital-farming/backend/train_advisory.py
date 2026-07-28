import os
import json
# pyrefly: ignore [missing-import]
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
MODELS_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# Load JSON databases
with open(os.path.join(DATA_DIR, 'sri_lankan_paddy_varieties.json'), 'r') as f:
    varieties_db = json.load(f)

with open(os.path.join(DATA_DIR, 'historical_district_weather.json'), 'r') as f:
    weather_db = json.load(f)

# Flatten weather db and list districts
districts_info = []
for zone_name, districts in weather_db.items():
    for dist_name, seasons in districts.items():
        districts_info.append({
            "district": dist_name,
            "zone": zone_name,
            "weather": seasons
        })

def generate_advisory_dataset(n_samples=3000):
    np.random.seed(42)
    records = []
    
    for _ in range(n_samples):
        # Pick random district
        dist_item = np.random.choice(districts_info)
        district = dist_item["district"]
        zone = dist_item["zone"]
        zone_val = 0 if zone == "Dry Zone" else 1
        
        # Pick random season
        season = np.random.choice(["Yala", "Maha"])
        season_val = 0 if season == "Yala" else 1
        
        # Get historical base weather
        base = dist_item["weather"][season]
        
        # Add random variations to weather features
        temp = round(base["temperature"] + np.random.uniform(-1.5, 1.5), 1)
        humidity = round(base["humidity"] + np.random.uniform(-5.0, 5.0), 1)
        rainfall = round(base["rainfall"] + np.random.uniform(-15.0, 15.0), 1)
        light = round(base["sunlight"] + np.random.uniform(-0.8, 0.8), 1)
        
        # Limit ranges
        humidity = min(max(humidity, 40.0), 98.0)
        rainfall = max(rainfall, 0.0)
        light = min(max(light, 2.0), 12.0)
        
        # Generate NPK soil parameters
        # Dry zones tend to have slightly different soil profiles, Maha has more nutrients
        n_val = round(np.random.uniform(20.0, 75.0) + (10 if season == "Maha" else 0), 1)
        p_val = round(np.random.uniform(15.0, 55.0) + (5 if zone == "Dry Zone" else 0), 1)
        k_val = round(np.random.uniform(25.0, 65.0), 1)
        
        # Determine the target recommended variety based on agricultural logic:
        # 1. Wet Zone -> Bw367 or Ld368
        # 2. Dry Zone & Maha -> Bg366 (needs water/fertilizer) or Bg352
        # 3. Dry Zone & Yala -> At362 (red, drought tolerant) or Bg300 (short duration)
        
        if zone == "Wet Zone":
            # Wet Zone varieties
            if rainfall > 250.0:
                variety = "Ld368" # flood/acid soil tolerant
            else:
                variety = "Bw367"
        else:
            # Dry/Intermediate Zone varieties
            if season == "Maha":
                if n_val > 55.0 and rainfall > 150.0:
                    variety = "Bg366" # premium high-yielding, fertilizer responsive
                else:
                    variety = "Bg352" # popular all-rounder
            else:
                # Yala / Dry spells
                if rainfall < 45.0:
                    variety = "At362" # Red Kakulu, drought-tolerant
                else:
                    variety = "Bg300" # short-duration 90-day variety
                    
        # Add yield estimation using a realistic formula:
        # Base yield from variety specs
        base_yield = varieties_db[variety]["expected_yield_t_ha"]
        
        # Yield adjustments based on weather and soil NPK:
        # - High NPK boosts yield up to +15%
        # - Searing heat (> 33C) decreases yield by -10%
        # - Sub-optimal light (< 5 hours) decreases yield by -15%
        # - Maha season usually gives +5% yield due to better climate
        adj = 1.0
        npk_avg = (n_val + p_val + k_val) / 3
        if npk_avg > 50:
            adj += 0.10
        elif npk_avg < 35:
            adj -= 0.12
            
        if temp > 33.0:
            adj -= 0.08
        if light < 5.0:
            adj -= 0.10
        if season == "Maha":
            adj += 0.05
            
        expected_yield = round(base_yield * adj, 2)
        # Yield constraint boundaries
        expected_yield = min(max(expected_yield, 3.5), 8.5)
        
        records.append({
            "season": season_val,
            "district": district,
            "zone": zone_val,
            "temperature": temp,
            "humidity": humidity,
            "rainfall": rainfall,
            "light": light,
            "n": n_val,
            "p": p_val,
            "k": k_val,
            "variety": variety,
            "yield": expected_yield
        })
        
    return pd.DataFrame(records)

def train_models():
    print("Generating training dataset...")
    df = generate_advisory_dataset(4000)
    
    # Save the dataset
    df.to_csv(os.path.join(DATA_DIR, 'advisory_training_data.csv'), index=False)
    
    # Label encode the target variety and district name
    le_district = LabelEncoder()
    df['district_encoded'] = le_district.fit_transform(df['district'])
    
    le_variety = LabelEncoder()
    df['variety_encoded'] = le_variety.fit_transform(df['variety'])
    
    # Save label encoders mapping
    encoders_mapping = {
        "districts": list(le_district.classes_),
        "varieties": list(le_variety.classes_)
    }
    with open(os.path.join(MODELS_DIR, 'advisory_metadata.json'), 'w') as f:
        json.dump(encoders_mapping, f, indent=4)
        
    print("Training RandomForestClassifier for Variety Recommendation...")
    X_cls = df[['season', 'district_encoded', 'zone', 'temperature', 'humidity', 'rainfall', 'light', 'n', 'p', 'k']]
    y_cls = df['variety_encoded']
    
    X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(X_cls, y_cls, test_size=0.2, random_state=42)
    
    clf = RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1)
    clf.fit(X_train_c, y_train_c)
    acc = clf.score(X_test_c, y_test_c)
    print(f"Variety Classifier trained with accuracy: {acc * 100:.2f}%")
    
    # Save the Classifier
    joblib.dump(clf, os.path.join(MODELS_DIR, 'variety_advisory_model.pkl'))
    
    print("Training RandomForestRegressor for Expected Yield Estimation...")
    # Regressor inputs include the variety selected (so it estimates yield per variety)
    X_reg = df[['season', 'district_encoded', 'zone', 'temperature', 'humidity', 'rainfall', 'light', 'n', 'p', 'k', 'variety_encoded']]
    y_reg = df['yield']
    
    X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(X_reg, y_reg, test_size=0.2, random_state=42)
    
    reg = RandomForestRegressor(n_estimators=120, random_state=42, n_jobs=-1)
    reg.fit(X_train_r, y_train_r)
    r2 = reg.score(X_test_r, y_test_r)
    print(f"Yield Regressor trained with R2 score: {r2 * 100:.2f}%")
    
    # Save the Regressor
    joblib.dump(reg, os.path.join(MODELS_DIR, 'yield_advisory_model.pkl'))
    print("All models successfully trained and stored!")

if __name__ == "__main__":
    train_models()
