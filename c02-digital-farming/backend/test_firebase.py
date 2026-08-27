from services.firebase_service import init_firebase, fetch_iot_data
init_firebase()
print(fetch_iot_data(""))
