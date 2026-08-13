# pyrefly: ignore [missing-import]
import firebase_admin
# pyrefly: ignore [missing-import]
from firebase_admin import credentials
# pyrefly: ignore [missing-import]
from firebase_admin import db
import os

# Initialize Firebase App
def init_firebase():        
    if not firebase_admin._apps:
        # Assuming the service account key is in the backend root directory
        cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'firebase_service_account.json')
        try:
            cred = credentials.Certificate(cred_path)
            # You might need to update the databaseURL depending on your Firebase project settings
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://esp32-project01-1641b-default-rtdb.firebaseio.com/'
            })
            print("Firebase initialized successfully.")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")

def fetch_iot_data(field_id):
    """
    Fetches the latest sensor readings for a specific field_id from Firebase RTDB.
    Expected structure: /sensor_data/{field_id} -> { timestamp1: { temp, hum, moisture }, ... }
    """
    try:
        ref = db.reference(f'sensor_data/{field_id}')
        # Fetch the most recent 10 readings to average them
        snapshot = ref.order_by_key().limit_to_last(10).get()
        
        if not snapshot:
            return None
            
        temp_sum = 0
        hum_sum = 0
        moisture_sum = 0
        count = 0
        
        for key, val in snapshot.items():
            temp_sum += val.get('temperature', 0)
            hum_sum += val.get('humidity', 0)
            moisture_sum += val.get('soil_moisture', 0)
            count += 1
            
        if count == 0:
            return None
            
        return {
            'temp_mean': temp_sum / count,
            'humidity_mean': hum_sum / count,
            'soil_moisture_7': moisture_sum / count # Using moisture as the top layer moisture
        }
    except Exception as e:
        print(f"Error fetching IoT data: {e}")
        return None

if __name__ == "__main__":
    init_firebase()
    # Test fetch
    # print(fetch_iot_data("field_001"))
