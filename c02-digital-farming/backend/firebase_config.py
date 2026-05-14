import os
# pyrefly: ignore [missing-import]
import firebase_admin

# pyrefly: ignore [missing-import]
from firebase_admin import credentials, db


# =========================================================
# FIREBASE INITIALIZATION
# =========================================================

def initialize_firebase():

    # Prevent multiple initialization
    if firebase_admin._apps:
        print("Firebase already initialized")
        return

    try:

        # Path to service account JSON
        cred_path = os.path.join(
            os.path.dirname(__file__),
            "firebase_service_account.json"
        )

        print("Checking Firebase service account file...")
        print("Path:", cred_path)

        # Check file exists
        if not os.path.exists(cred_path):

            print("\nERROR:")
            print("firebase_service_account.json NOT FOUND")
            print("Place the file inside backend folder\n")

            return

        # Load credentials
        cred = credentials.Certificate(cred_path)

        # Initialize Firebase
        firebase_admin.initialize_app(cred, {
            "databaseURL":
            "https://esp32-project01-1641b-default-rtdb.firebaseio.com/"
        })

        print("\n===================================")
        print("Firebase initialized successfully")
        print("Connected to Realtime Database")
        print("===================================\n")

    except Exception as e:

        print("\n===================================")
        print("Firebase Initialization Failed")
        print("===================================")

        print("Error:")
        print(e)
        print()


# =========================================================
# GET DATABASE REFERENCE
# =========================================================

def get_firebase_db():

    if firebase_admin._apps:
        return db.reference('/')

    print("Firebase not initialized")

    return None


# =========================================================
# TEST FIREBASE CONNECTION
# =========================================================

def test_firebase_connection():

    print("\nTesting Firebase connection...\n")

    ref = get_firebase_db()

    if ref is None:

        print("Database reference is NULL")
        return

    try:

        # Test write
        test_data = {
            "status": "working",
            "message": "Firebase connected successfully",
            "value": 123
        }

        ref.child("test").set(test_data)

        print("Test data uploaded successfully")

        # Test read
        data = ref.child("test").get()

        print("\nData read from Firebase:")
        print(data)

        print("\n===================================")
        print("Firebase Working Properly")
        print("===================================\n")

    except Exception as e:

        print("\nFirebase Database Error:")
        print(e)


# =========================================================
# MAIN
# =========================================================

if __name__ == "__main__":

    print("\n===================================")
    print("ESP32 Firebase Backend")
    print("===================================\n")

    # Initialize Firebase
    initialize_firebase()

    # Test database connection
    test_firebase_connection()