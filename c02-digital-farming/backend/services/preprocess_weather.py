import pandas as pd
import numpy as np
from datetime import datetime

def preprocess_historical_weather(csv_path):
    """
    Reads and preprocesses the Open-Meteo historical dataset for paddy yield prediction.
    It aggregates daily features to a monthly level.
    """
    # The first 17 lines contain location metadata, the actual time-series data starts at line 18
    df = pd.read_csv(csv_path, skiprows=17)

    # Ensure time is datetime
    df['time'] = pd.to_datetime(df['time'])
    
    # Extract month and year for aggregation
    df['year'] = df['time'].dt.year
    df['month'] = df['time'].dt.month
    
    # Rename columns for easier access
    df.rename(columns={
        'temperature_2m_mean (°C)': 'temp_mean',
        'relative_humidity_2m_mean (%)': 'humidity_mean',
        'wind_speed_10m_mean (km/h)': 'wind_speed_mean',
        'soil_moisture_0_to_100cm_mean (m³/m³)': 'soil_moisture_100',
        'soil_moisture_0_to_7cm_mean (m³/m³)': 'soil_moisture_7',
        'soil_temperature_0_to_100cm_mean (°C)': 'soil_temp_100',
        'soil_temperature_0_to_7cm_mean (°C)': 'soil_temp_7'
    }, inplace=True)
    
    # Fill any missing values with median
    cols_to_fill = ['temp_mean', 'humidity_mean', 'wind_speed_mean', 
                    'soil_moisture_100', 'soil_moisture_7', 'soil_temp_100', 'soil_temp_7']
    df[cols_to_fill] = df[cols_to_fill].fillna(df[cols_to_fill].median())

    # Aggregate to monthly level by location
    monthly_agg = df.groupby(['location_id', 'year', 'month']).agg({
        'temp_mean': 'mean',
        'humidity_mean': 'mean',
        'wind_speed_mean': 'mean',
        'soil_moisture_100': 'mean',
        'soil_moisture_7': 'mean',
        'soil_temp_100': 'mean',
        'soil_temp_7': 'mean'
    }).reset_index()

    # Synthetic Labels: 
    # Paddy requires roughly 20-30°C and high soil moisture / humidity.
    # We will generate a suitability score from 1 (Best) to 5 (Worst) based on these parameters.
    def calculate_suitability(row):
        score = 0
        
        # Temperature (ideal 22 - 32)
        if 24 <= row['temp_mean'] <= 30:
            score += 2 # perfect
        elif 20 <= row['temp_mean'] <= 34:
            score += 1 # okay
        
        # Humidity (ideal 70% - 90%)
        if 75 <= row['humidity_mean'] <= 85:
            score += 2
        elif 65 <= row['humidity_mean'] <= 95:
            score += 1
            
        # Soil moisture (ideal > 0.3 for paddy)
        if row['soil_moisture_7'] > 0.4:
            score += 2
        elif row['soil_moisture_7'] > 0.3:
            score += 1

        # Max score is 6, min is 0. Map to 1 (Best) to 5 (Worst)
        if score >= 5: return 1
        elif score >= 4: return 2
        elif score >= 3: return 3
        elif score >= 1: return 4
        else: return 5

    monthly_agg['suitability_score'] = monthly_agg.apply(calculate_suitability, axis=1)

    return monthly_agg

if __name__ == "__main__":
    path = "/Users/nerandadilhara/Desktop/Research/dataset/weather-data/Open-meteo-WeatherData-2019-to-2026.csv"
    try:
        processed_data = preprocess_historical_weather(path)
        print(f"Processed data shape: {processed_data.shape}")
        print(processed_data.head())
    except Exception as e:
        print(f"Error processing dataset: {e}")
