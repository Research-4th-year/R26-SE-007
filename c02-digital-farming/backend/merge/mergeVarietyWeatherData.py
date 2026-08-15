import os
import pandas as pd

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VARIETY_FILE = os.path.join(BASE_DIR, 'dataset', 'SL_Rice_Varietal_District_Dataset.csv')
WEATHER_FILE = os.path.join(BASE_DIR, 'dataset', 'weather-data', 'Open-meteo-WeatherData-2019-to-2026.csv')
OUTPUT_DIR = os.path.join(BASE_DIR, 'dataset', 'Rice-Variety')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'RiceDistrictVariety.csv')

# District to location_id mapping based on coordinates
DISTRICT_MAP = {
    'Ampara': 10,
    'Anuradhapura': 8,
    'Badulla': 13,
    'Batticaloa': 11,
    'Galle': 5,
    'Gampaha': 7,
    'Hambantota': 3,
    'Kalutara': 6,
    'Killinochchi': 2,
    'Kurunegala': 9,
    'Matale': 14,
    'Matara': 4,
    'Monaragala': 12,
    'Trincomalee': 1
}

def merge_data():
    print(f"Loading variety dataset: {VARIETY_FILE}")
    variety_df = pd.read_csv(VARIETY_FILE)
    
    print(f"Loading weather dataset: {WEATHER_FILE}")
    # Skip the first 17 lines (header info for locations) when reading the actual weather data
    weather_df = pd.read_csv(WEATHER_FILE, skiprows=17)
    
    # Extract year from time column
    weather_df['Year'] = pd.to_datetime(weather_df['time']).dt.year
    
    # Calculate yearly averages per location
    print("Aggregating weather data by Year and Location...")
    yearly_weather = weather_df.groupby(['location_id', 'Year']).agg({
        'temperature_2m_mean (°C)': 'mean',
        'relative_humidity_2m_mean (%)': 'mean',
        'soil_moisture_0_to_100cm_mean (m³/m³)': 'mean'
    }).reset_index()
    
    # Rename columns for clarity
    yearly_weather.rename(columns={
        'temperature_2m_mean (°C)': 'Temperature',
        'relative_humidity_2m_mean (%)': 'Humidity',
        'soil_moisture_0_to_100cm_mean (m³/m³)': 'Soil_Moisture'
    }, inplace=True)
    
    # Map district to location_id in variety_df
    variety_df['location_id'] = variety_df['District'].map(DISTRICT_MAP)
    
    # Merge datasets
    print("Merging datasets...")
    merged_df = pd.merge(variety_df, yearly_weather, on=['location_id', 'Year'], how='left')
    
    # Drop the temporary location_id column
    merged_df.drop(columns=['location_id'], inplace=True)
    
    # Fill any NaNs resulting from missing years with overall average for that district
    merged_df['Temperature'] = merged_df.groupby('District')['Temperature'].transform(lambda x: x.fillna(x.mean()))
    merged_df['Humidity'] = merged_df.groupby('District')['Humidity'].transform(lambda x: x.fillna(x.mean()))
    merged_df['Soil_Moisture'] = merged_df.groupby('District')['Soil_Moisture'].transform(lambda x: x.fillna(x.mean()))
    
    # If still NaNs, fill with global average
    merged_df['Temperature'] = merged_df['Temperature'].fillna(merged_df['Temperature'].mean())
    merged_df['Humidity'] = merged_df['Humidity'].fillna(merged_df['Humidity'].mean())
    merged_df['Soil_Moisture'] = merged_df['Soil_Moisture'].fillna(merged_df['Soil_Moisture'].mean())
    
    # Save the output
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    merged_df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"Merge successful! Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    merge_data()
