# IoT-integrated Digital Twin System for Smart Paddy Farming

This is a production-ready intelligent agriculture platform combining IoT, Machine Learning, Deep Learning, and a Digital Twin concept to provide actionable insights and disease detection for paddy farming.

## Project Structure
- `backend/`: FastAPI application handling ML models, Digital Twin logic, and Firebase Integration.
- `frontend/`: React + Vite dashboard displaying real-time data and AI predictions.
- `esp32/`: Arduino code for the IoT sensor node.

---

## 1. Backend Setup

### Prerequisites
- Python 3.9+
- Firebase Project with Realtime Database enabled

### Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional but recommended) Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Firebase Configuration
1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Create a Realtime Database and note its URL.
3. Generate a new Private Key from Project Settings > Service Accounts.
4. Save the downloaded JSON file as `backend/firebase_service_account.json`.
5. Update `firebase_config.py` with your database URL if you don't use environment variables.

### Running the Backend
1. Train the ML and dummy CNN models to generate `.pkl` and `.h5` files:
   ```bash
   python train_ml.py
   python train_cnn.py
   ```
2. Start the FastAPI server:
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```
   The API docs will be available at `http://localhost:8000/docs`.

---

## 2. Frontend Setup

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

The dashboard will be available at `http://localhost:5173`.

---

## 3. IoT Setup (ESP32)

1. Open `esp32/smart_farming_esp32.ino` in the Arduino IDE.
2. Install the required libraries via the Library Manager:
   - `DHT sensor library` by Adafruit
   - `BH1750`
   - `ArduinoJson`
3. Update the `ssid` and `password` variables with your Wi-Fi credentials.
4. Update `serverUrl` with the IP address of your running FastAPI backend.
5. Flash the code to your ESP32 board.

---

## Example API Requests (Postman)

### 1. Send Sensor Data
**POST** `http://localhost:8000/sensor-data`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "temperature": 29.5,
  "humidity": 78.0,
  "soil1": 45,
  "soil2": 42,
  "rain": 1,
  "light": 15000.5
}
```

### 2. Predict Disease
**POST** `http://localhost:8000/predict-disease`
**Headers:** `Content-Type: multipart/form-data`
**Body:** Key `file`, Type `File`, select a leaf image.

---

## Digital Twin Features
The `digital_twin.py` script acts as the intelligence layer. It assesses current soil moisture against rainfall probability, evaluates predicted NPK values to suggest specific fertilizers, and triggers alerts if the Deep Learning model identifies an infection.
