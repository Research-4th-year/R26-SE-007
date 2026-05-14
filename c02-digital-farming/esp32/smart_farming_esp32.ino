#include <WiFi.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>

#include <Firebase_ESP_Client.h>

// Firebase helper libraries
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// ================= WIFI =================
const char* ssid = "Redmi Note 11 Pro 5G";
const char* password = "22222222";

// ================= FIREBASE =================
#define API_KEY "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE"

#define DATABASE_URL "https://esp32-project01-1641b-default-rtdb.firebaseio.com/"

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ================= SENSOR PINS =================
#define DHTPIN 4
#define DHTTYPE DHT22

#define SOIL1_PIN 34
#define SOIL2_PIN 35
#define RAIN_PIN 32

// ================= SENSOR OBJECTS =================
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

// ================= TIMER =================
unsigned long sendDataPrevMillis = 0;
const long interval = 10000; // 10 seconds in milliseconds

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println("\n================================");
  Serial.println("ESP32 Firebase Sensor System");
  Serial.println("================================");

  // ================= SENSOR INIT =================
  dht.begin();

  Wire.begin();

  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 Initialized");
  } else {
    Serial.println("BH1750 Initialization Failed");
  }

  pinMode(SOIL1_PIN, INPUT);
  pinMode(SOIL2_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);

  // ================= WIFI CONNECT =================
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // ================= FIREBASE CONFIG =================
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Anonymous Sign Up
  if (Firebase.signUp(&config, &auth, "", "")) {

    Serial.println("Firebase SignUp Successful");

  } else {

    Serial.printf("Firebase SignUp Failed: %s\n",
                  config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);

  Firebase.reconnectWiFi(true);

  Serial.println("Firebase Connected");
}

void loop() {

  // Sense and send data every 10 seconds
  if (Firebase.ready() &&
      (millis() - sendDataPrevMillis >= interval || sendDataPrevMillis == 0)) {

    sendDataPrevMillis = millis();

    // ================= READ SENSORS =================

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    int rawSoil1 = analogRead(SOIL1_PIN);
    int rawSoil2 = analogRead(SOIL2_PIN);

    int soil1 = map(rawSoil1, 4095, 1500, 0, 100);
    int soil2 = map(rawSoil2, 4095, 1500, 0, 100);

    soil1 = constrain(soil1, 0, 100);
    soil2 = constrain(soil2, 0, 100);

    int rain = digitalRead(RAIN_PIN);

    float light = lightMeter.readLightLevel();

    // ================= SERIAL OUTPUT =================

    Serial.println("\n================================");
    Serial.println("LIVE SENSOR READINGS");
    Serial.println("================================");

    Serial.print("Temperature : ");
    Serial.print(temperature);
    Serial.println(" °C");

    Serial.print("Humidity    : ");
    Serial.print(humidity);
    Serial.println(" %");

    Serial.print("Soil 1      : ");
    Serial.print(soil1);
    Serial.print(" %  | Raw: ");
    Serial.println(rawSoil1);

    Serial.print("Soil 2      : ");
    Serial.print(soil2);
    Serial.print(" %  | Raw: ");
    Serial.println(rawSoil2);

    Serial.print("Rain Sensor : ");

    if (rain == 0) {
      Serial.println("RAIN DETECTED");
    } else {
      Serial.println("NO RAIN");
    }

    Serial.print("Light Level : ");
    Serial.print(light);
    Serial.println(" lx");

    Serial.println("================================");

    // ================= CHECK DHT =================

    if (isnan(temperature) || isnan(humidity)) {

      Serial.println("DHT Sensor Read Failed");

      return;
    }

    // ================= SEND TO FIREBASE =================

    bool success = true;

    success &= Firebase.RTDB.setFloat(
      &fbdo,
      "/sensor/temperature",
      temperature
    );

    success &= Firebase.RTDB.setFloat(
      &fbdo,
      "/sensor/humidity",
      humidity
    );

    success &= Firebase.RTDB.setInt(
      &fbdo,
      "/sensor/soil1",
      soil1
    );

    success &= Firebase.RTDB.setInt(
      &fbdo,
      "/sensor/soil2",
      soil2
    );

    success &= Firebase.RTDB.setInt(
      &fbdo,
      "/sensor/rain",
      rain
    );

    success &= Firebase.RTDB.setFloat(
      &fbdo,
      "/sensor/light",
      light
    );

    // ================= RESULT =================

    if (success) {

      Serial.println("Firebase Upload Successful");

    } else {

      Serial.println("Firebase Upload Failed");
      Serial.println(fbdo.errorReason());
    }
  }
}