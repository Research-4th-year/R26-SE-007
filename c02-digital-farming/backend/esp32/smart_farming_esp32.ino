#include <WiFi.h>
#include <DHT.h>
#include <time.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// =================================================
// WIFI CONFIGURATION
// =================================================
const char* ssid = "Redmi Note 11 Pro 5G";
const char* password = "22222222";

// =================================================
// FIREBASE CONFIGURATION
// =================================================
#define API_KEY "AIzaSyDOCSmSVYobKE5ZUZAqGCst2BtoHuGh6-k"
#define DATABASE_URL "https://research-4y2s-default-rtdb.firebaseio.com/"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// =================================================
// SENSOR CONFIGURATION
// =================================================
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34

DHT dht(DHTPIN, DHTTYPE);

// =================================================
// DATA COLLECTION INTERVAL
// =================================================
// Example: 5 = 5 mins | 30 = 30 mins | 60 = 1 hour
#define SEND_INTERVAL_MINUTES 30

unsigned long sendInterval = SEND_INTERVAL_MINUTES * 60 * 1000;
unsigned long previousMillis = 0;

// =================================================
// NTP TIME CONFIGURATION
// =================================================
// Sri Lanka UTC +5:30
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800;
const int daylightOffset_sec = 0;

// Function declarations
String getTimestamp();
void uploadSensorData();

// =================================================
// SETUP
// =================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("Smart Paddy IoT Sensor System");
  Serial.println("================================");

  // Sensor initialize
  dht.begin();
  pinMode(SOIL_PIN, INPUT);

  // WiFi Connection
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

  // NTP Time Initialization
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Synchronizing Time...");

  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println("NTP Time Ready");
  } else {
    Serial.println("NTP Time Failed");
  }

  // Firebase Connection
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Authentication Success");
  } else {
    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Firebase Ready");
  Serial.print("Upload Interval: ");
  Serial.print(SEND_INTERVAL_MINUTES);
  Serial.println(" minutes");
}

// =================================================
// LOOP
// =================================================
void loop() {
  if (Firebase.ready() && (millis() - previousMillis >= sendInterval || previousMillis == 0)) {
    previousMillis = millis();
    uploadSensorData();
  }
}

// =================================================
// GET REAL DATE AND TIME
// =================================================
String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "TIME_ERROR";
  }

  char buffer[30];
  sprintf(
    buffer,
    "%04d-%02d-%02d %02d:%02d:%02d",
    timeinfo.tm_year + 1900,
    timeinfo.tm_mon + 1,
    timeinfo.tm_mday,
    timeinfo.tm_hour,
    timeinfo.tm_min,
    timeinfo.tm_sec
  );

  return String(buffer);
}

// =================================================
// READ SENSOR AND UPLOAD
// =================================================
void uploadSensorData() {
  Serial.println();
  Serial.println("==============================");
  Serial.println("Sensor Reading");
  Serial.println("==============================");

  // -----------------------------
  // DHT22
  // -----------------------------
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT22 Reading Failed");
    return;
  }

  // -----------------------------
  // SOIL SENSOR
  // -----------------------------
  int soilRaw = analogRead(SOIL_PIN);
  int soilPercent = map(soilRaw, 4095, 1500, 0, 100);
  soilPercent = constrain(soilPercent, 0, 100);

  String timestamp = getTimestamp();

  // -----------------------------
  // SERIAL DISPLAY
  // -----------------------------
  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Humidity : ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Soil Moisture : ");
  Serial.print(soilPercent);
  Serial.print("%  Raw:");
  Serial.println(soilRaw);

  Serial.print("Time : ");
  Serial.println(timestamp);

  // -----------------------------
  // FIREBASE UPLOAD
  // -----------------------------
  String path = "/sensor/";
  bool success = true;

  success &= Firebase.RTDB.setFloat(&fbdo, path + "temperature", temperature);
  success &= Firebase.RTDB.setFloat(&fbdo, path + "humidity", humidity);
  success &= Firebase.RTDB.setInt(&fbdo, path + "soilMoisture", soilPercent);
  success &= Firebase.RTDB.setString(&fbdo, path + "timestamp", timestamp);

  if (success) {
    Serial.println();
    Serial.println("Firebase Upload Successful");
  } else {
    Serial.println();
    Serial.println("Firebase Upload Failed");
    Serial.println(fbdo.errorReason());
  }

  Serial.println("==============================");
}