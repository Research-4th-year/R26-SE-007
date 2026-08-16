import requests

def init_firebase():
    # No longer using firebase_admin since we can read the public sensor node directly
    pass

def fetch_iot_data(field_id=""):
    """
    Fetches the latest sensor readings from Firebase RTDB via REST API.
    """
    url = "https://esp32-project01-1641b-default-rtdb.firebaseio.com/sensor.json"
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if not data:
                return None
                
            return {
                'temp_mean': data.get('temperature', 0),
                'humidity_mean': data.get('humidity', 0),
                'soil_moisture_7': data.get('soilMoisture', 0) / 100.0 # Convert percentage to decimal 0-1
            }
        else:
            print(f"Error fetching IoT data: HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"Exception fetching IoT data: {e}")
        return None

if __name__ == "__main__":
    print(fetch_iot_data())
