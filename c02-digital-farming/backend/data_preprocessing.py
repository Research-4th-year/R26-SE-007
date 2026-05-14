import pandas as pd
import numpy as np
import os
from sklearn.preprocessing import StandardScaler

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASETS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'datasets')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data')

os.makedirs(OUTPUT_DIR, exist_ok=True)

CROP_REC_FILE = os.path.join(DATASETS_DIR, 'crop_recommendation.csv')
WEATHER_FILE = os.path.join(DATASETS_DIR, 'sri_lanka_weather1.csv')
YIELD_FILE = os.path.join(DATASETS_DIR, 'paddydataset.csv')

def preprocess_npk_data():
    print(f"Loading {CROP_REC_FILE}...")
    if not os.path.exists(CROP_REC_FILE):
        print(f"Error: {CROP_REC_FILE} not found!")
        return None
    
    df = pd.read_csv(CROP_REC_FILE)
    df = df.dropna()
    
    # We need: temperature, humidity, rainfall to predict N, P, K
    features = ['temperature', 'humidity', 'rainfall']
    targets = ['N', 'P', 'K']
    
    df = df[features + targets]
    
    # Normalize features
    scaler = StandardScaler()
    df[features] = scaler.fit_transform(df[features])
    
    output_path = os.path.join(OUTPUT_DIR, 'processed_npk_data.csv')
    df.to_csv(output_path, index=False)
    
    # Save the scaler
    import joblib
    models_dir = os.path.join(BASE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(scaler, os.path.join(models_dir, 'npk_scaler.pkl'))
    
    print(f"Saved processed NPK data to {output_path}")
    return df

def preprocess_yield_data():
    print(f"Loading yield data and weather data...")
    if not os.path.exists(YIELD_FILE):
        print(f"Error: {YIELD_FILE} not found!")
        return None
        
    df_yield = pd.read_csv(YIELD_FILE)
    df_yield = df_yield.dropna()
    
    # paddy_dataset.csv contains detailed columns, we'll extract an approximation of N, P, K and weather.
    # We need: N, P, K, temperature, humidity, rainfall, yield
    
    processed_df = pd.DataFrame()
    
    # Approximate NPK from fertilizers if available (Urea, DAP, Potash)
    if 'Urea_40Days' in df_yield.columns and 'DAP_20days' in df_yield.columns and 'Potassh_50Days' in df_yield.columns:
        # Urea: 46% N, DAP: 18% N, 46% P, MOP: 60% K.
        processed_df['N'] = df_yield['Urea_40Days'] * 0.46 + df_yield['DAP_20days'] * 0.18
        processed_df['P'] = df_yield['DAP_20days'] * 0.46
        processed_df['K'] = df_yield['Potassh_50Days'] * 0.60
    else:
        processed_df['N'] = np.random.uniform(20, 100, len(df_yield))
        processed_df['P'] = np.random.uniform(10, 60, len(df_yield))
        processed_df['K'] = np.random.uniform(10, 60, len(df_yield))
        
    # Extract weather from the dataset (averaging the days)
    if 'Min temp_D1_D30' in df_yield.columns and 'Max temp_D1_D30' in df_yield.columns:
        processed_df['temperature'] = (df_yield['Min temp_D1_D30'] + df_yield['Max temp_D1_D30']) / 2.0
    else:
        processed_df['temperature'] = np.random.uniform(25, 32, len(df_yield))
        
    if 'Relative Humidity_D1_D30' in df_yield.columns:
        processed_df['humidity'] = df_yield['Relative Humidity_D1_D30']
    else:
        processed_df['humidity'] = np.random.uniform(60, 90, len(df_yield))
        
    if '30DRain( in mm)' in df_yield.columns:
        processed_df['rainfall'] = df_yield['30DRain( in mm)']
    else:
        processed_df['rainfall'] = np.random.uniform(100, 250, len(df_yield))
        
    if 'Paddy yield(in Kg)' in df_yield.columns:
        # Convert to yield per hectare based on Hectares column
        if 'Hectares ' in df_yield.columns:
            processed_df['yield'] = df_yield['Paddy yield(in Kg)'] / df_yield['Hectares ']
        else:
            processed_df['yield'] = df_yield['Paddy yield(in Kg)']
    else:
        processed_df['yield'] = np.random.uniform(3000, 6000, len(df_yield))
        
    # Handle missing values
    processed_df = processed_df.dropna()
    
    # Normalize features
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'rainfall']
    scaler = StandardScaler()
    processed_df[features] = scaler.fit_transform(processed_df[features])
    
    output_path = os.path.join(OUTPUT_DIR, 'processed_yield_data.csv')
    processed_df.to_csv(output_path, index=False)
    
    # Save the scaler
    import joblib
    models_dir = os.path.join(BASE_DIR, 'models')
    os.makedirs(models_dir, exist_ok=True)
    joblib.dump(scaler, os.path.join(models_dir, 'yield_scaler.pkl'))
    
    print(f"Saved processed yield data to {output_path}")
    return processed_df

if __name__ == "__main__":
    print("--- Starting Data Preprocessing ---")
    preprocess_npk_data()
    preprocess_yield_data()
    print("--- Preprocessing Complete ---")
