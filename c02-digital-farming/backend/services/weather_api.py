import requests
import datetime

def fetch_forecast_weather(latitude, longitude):
    """
    Fetches the 7-day weather forecast from Open-Meteo for the given coordinates.
    Returns aggregated metrics (mean temp, humidity) for the upcoming period.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": ["temperature_2m_mean", "precipitation_sum", "wind_speed_10m_max"],
        "hourly": ["relative_humidity_2m"],
        "timezone": "auto"
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        # Aggregate daily temperature
        daily_temps = data.get("daily", {}).get("temperature_2m_mean", [])
        avg_temp = sum(daily_temps) / len(daily_temps) if daily_temps else 0
        
        # Aggregate hourly humidity to get an overall average
        hourly_hum = data.get("hourly", {}).get("relative_humidity_2m", [])
        avg_hum = sum(hourly_hum) / len(hourly_hum) if hourly_hum else 0
        
        return {
            "forecast_temp_mean": avg_temp,
            "forecast_humidity_mean": avg_hum
        }
        
    except Exception as e:
        print(f"Error fetching forecast data: {e}")
        return None

if __name__ == "__main__":
    # Test for a location in Sri Lanka
    print(fetch_forecast_weather(7.8731, 80.7718))
