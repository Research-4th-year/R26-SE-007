import os
import json
import urllib.request
import urllib.parse
from datetime import datetime
# pyrefly: ignore [missing-import]
from firebase_config import get_firebase_db

# Load environment variables manually
def load_env_manual():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

load_env_manual()
API_KEY = os.environ.get("WEATHER_API_KEY", "5c6448ac91b34eda964171546260907")
BASE_URL = "https://api.weatherapi.com/v1"

class WeatherService:
    @staticmethod
    def getIoTWeather():
        """Retrieve weather data from Firebase IoT node."""
        db_ref = get_firebase_db()
        if db_ref is None:
            return None
        try:
            iot_data = db_ref.child("iot").child("weather").get()
            if isinstance(iot_data, dict):
                return iot_data
            elif hasattr(iot_data, 'val'):
                return iot_data.val()
        except Exception as e:
            print(f"Error fetching IoT weather: {e}")
        return None

    @staticmethod
    def checkIoTStatus():
        """Check if IoT device is active (last update within 10 minutes)."""
        data = WeatherService.getIoTWeather()
        if not data:
            return "OFFLINE"
        
        timestamp_str = data.get("timestamp")
        status = data.get("deviceStatus")
        
        if not timestamp_str:
            return "OFFLINE"
            
        try:
            last_update = datetime.fromisoformat(timestamp_str)
            diff = datetime.now() - last_update
            # Support absolute difference in case of clock drift
            if abs(diff.total_seconds()) <= 600:
                return "ACTIVE"
        except Exception as e:
            print(f"Error parsing IoT timestamp: {e}")
            
        return "OFFLINE"

    @staticmethod
    def getAPIWeather(location):
        """Fetch current weather from WeatherAPI.com."""
        if not API_KEY:
            return None
        url = f"{BASE_URL}/current.json?key={API_KEY}&q={urllib.parse.quote(location)}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Error calling WeatherAPI current: {e}")
            return None

    @staticmethod
    def getForecastWeather(location, days=7):
        """Fetch weather forecast from WeatherAPI.com."""
        if not API_KEY:
            return None
        url = f"{BASE_URL}/forecast.json?key={API_KEY}&q={urllib.parse.quote(location)}&days={days}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Error calling WeatherAPI forecast: {e}")
            return None

    @staticmethod
    def getHistoricalWeather(location, date_str):
        """Fetch historical weather from WeatherAPI.com."""
        if not API_KEY:
            return None
        url = f"{BASE_URL}/history.json?key={API_KEY}&q={urllib.parse.quote(location)}&dt={date_str}"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Error calling WeatherAPI history: {e}")
            return None

    @staticmethod
    def selectWeatherSource(location):
        """Determine which weather source is available based on priority."""
        if WeatherService.checkIoTStatus() == "ACTIVE":
            return "IOT_DEVICE"
        
        # Test if API is available for the location
        api_data = WeatherService.getAPIWeather(location)
        if api_data:
            return "WEATHER_API"
            
        return "CACHE"

    @staticmethod
    def getCurrentWeather(location):
        """Get unified weather data from the best available source."""
        source = WeatherService.selectWeatherSource(location)
        
        if source == "IOT_DEVICE":
            iot_data = WeatherService.getIoTWeather()
            if iot_data:
                # Map IoT fields to Unified Weather Object
                unified_data = {
                    "temperature": float(iot_data.get("temperature", 28.5)),
                    "humidity": float(iot_data.get("humidity", 75.0)),
                    "rainfall": float(iot_data.get("rainfall", 0.0)),
                    "windSpeed": 8.5, # default / mock since IoT lacks wind
                    "windDirection": "NE",
                    "pressure": 1012.0,
                    "cloud": 20,
                    "uvIndex": 5.0,
                    "visibility": 10.0,
                    "weatherCondition": "Clear" if float(iot_data.get("rainfall", 0.0)) == 0 else "Rainy",
                    "location": location,
                    "source": "IOT_DEVICE",
                    "timestamp": iot_data.get("timestamp", datetime.now().isoformat())
                }
                WeatherService._save_to_cache(location, unified_data)
                return unified_data
                
        if source == "WEATHER_API":
            api_data = WeatherService.getAPIWeather(location)
            if api_data and "current" in api_data:
                curr = api_data["current"]
                loc = api_data.get("location", {})
                unified_data = {
                    "temperature": float(curr.get("temp_c", 28.5)),
                    "humidity": float(curr.get("humidity", 75.0)),
                    "rainfall": float(curr.get("precip_mm", 0.0)),
                    "windSpeed": float(curr.get("wind_kph", 10.0)),
                    "windDirection": str(curr.get("wind_dir", "N/A")),
                    "pressure": float(curr.get("pressure_mb", 1012.0)),
                    "cloud": int(curr.get("cloud", 0)),
                    "uvIndex": float(curr.get("uv", 0.0)),
                    "visibility": float(curr.get("vis_km", 10.0)),
                    "weatherCondition": str(curr.get("condition", {}).get("text", "Clear")),
                    "location": str(loc.get("name", location)),
                    "source": "WEATHER_API",
                    "timestamp": str(loc.get("localtime", datetime.now().isoformat()))
                }
                WeatherService._save_to_cache(location, unified_data)
                return unified_data
                
        # Read from Cache
        cached_data = WeatherService._read_from_cache(location)
        if cached_data:
            cached_data["source"] = "CACHE"
            return cached_data
            
        # Hardcoded fallback
        return WeatherService._get_hardcoded_fallback(location)

    @staticmethod
    def _save_to_cache(location, data):
        cache_path = os.path.join(os.path.dirname(__file__), "..", "data", "weather_cache.json")
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        cache = {}
        if os.path.exists(cache_path):
            try:
                with open(cache_path, 'r') as f:
                    cache = json.load(f)
            except Exception:
                pass
        cache[location] = data
        try:
            with open(cache_path, 'w') as f:
                json.dump(cache, f, indent=2)
        except Exception as e:
            print(f"Error writing cache: {e}")

    @staticmethod
    def _read_from_cache(location):
        cache_path = os.path.join(os.path.dirname(__file__), "..", "data", "weather_cache.json")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, 'r') as f:
                    cache = json.load(f)
                    return cache.get(location)
            except Exception:
                pass
        return None

    @staticmethod
    def _get_hardcoded_fallback(location):
        db_path = os.path.join(os.path.dirname(__file__), "..", "data", "historical_district_weather.json")
        temp = 28.5
        hum = 75.0
        rain = 5.0
        if os.path.exists(db_path):
            try:
                with open(db_path, 'r') as f:
                    h_db = json.load(f)
                    for zone_data in h_db.values():
                        if location in zone_data:
                            stats = zone_data[location].get("Maha", zone_data[location].get("Yala", {}))
                            temp = stats.get("temperature", temp)
                            hum = stats.get("humidity", hum)
                            rain = stats.get("rainfall", rain)
                            break
            except Exception:
                pass
                
        return {
            "temperature": temp,
            "humidity": hum,
            "rainfall": rain,
            "windSpeed": 10.0,
            "windDirection": "SW",
            "pressure": 1011.0,
            "cloud": 20,
            "uvIndex": 6.0,
            "visibility": 10.0,
            "weatherCondition": "Partly Cloudy",
            "location": location,
            "source": "CACHE",
            "timestamp": datetime.now().isoformat()
        }
