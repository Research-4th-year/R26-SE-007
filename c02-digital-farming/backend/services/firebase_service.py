import requests
import datetime
import uuid

# Base URL for the Firebase Realtime Database
FIREBASE_RTDB_URL = "https://esp32-project01-1641b-default-rtdb.firebaseio.com"

def init_firebase():
    # Using REST API directly, no admin initialization required for public DB
    pass

def fetch_iot_data(field_id=""):
    """
    Fetches the latest sensor readings from Firebase RTDB via REST API.
    """
    url = f"{FIREBASE_RTDB_URL}/sensor.json"
    
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

def save_user_history(user_id, category, data):
    """
    Saves a record to the user's history category.
    """
    record_id = str(uuid.uuid4())
    data['id'] = record_id
    data['created_at'] = datetime.datetime.now().isoformat()
    
    url = f"{FIREBASE_RTDB_URL}/users/{user_id}/{category}/{record_id}.json"
    try:
        requests.put(url, json=data)
        return {"id": record_id, **data}
    except Exception as e:
        print(f"Error saving history: {e}")
        return None

def get_user_history(user_id, category):
    """
    Fetches all records for a user's history category.
    """
    url = f"{FIREBASE_RTDB_URL}/users/{user_id}/{category}.json"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data:
                return list(data.values())
        return []
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []

def delete_user_history(user_id, category, record_id):
    """
    Deletes a specific history record.
    """
    url = f"{FIREBASE_RTDB_URL}/users/{user_id}/{category}/{record_id}.json"
    try:
        requests.delete(url)
        return True
    except Exception as e:
        print(f"Error deleting history: {e}")
        return False

def save_farmer_profile(user_id, data):
    """
    Saves or updates a farmer profile.
    """
    data['user_id'] = user_id
    if 'created_at' not in data:
        data['created_at'] = datetime.datetime.now().isoformat()
        
    url = f"{FIREBASE_RTDB_URL}/users/{user_id}/profile.json"
    try:
        requests.put(url, json=data)
        return data
    except Exception as e:
        print(f"Error saving profile: {e}")
        return None

def get_farmer_profile(user_id):
    """
    Fetches a farmer profile.
    """
    url = f"{FIREBASE_RTDB_URL}/users/{user_id}/profile.json"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Error fetching profile: {e}")
        return None

if __name__ == "__main__":
    print(fetch_iot_data())
