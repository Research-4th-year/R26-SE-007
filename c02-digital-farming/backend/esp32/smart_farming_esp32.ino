/*
 * SMART PADDY IoT SENSOR SYSTEM
 * ESP32 + DHT22 + Capacitive Soil Moisture + Firebase
 *
 * INTERNET CONNECTION PRIORITY:
 * 1. Wi-Fi
 * 2. A7670C 4G LTE SIM module
 */

#include <WiFi.h>
#include <DHT.h>
#include <time.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define TINY_GSM_MODEM_A7672X

#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>

// ================= SECRETS =================
const char* ssid     = "Redmi Note 11 Pro 5G";
const char* password = "22222222";

#define API_KEY          "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE"
#define DATABASE_URL     "https://esp32-project01-1641b-default-rtdb.firebaseio.com/"
#define FIREBASE_HOST    "esp32-project01-1641b-default-rtdb.firebaseio.com"

// Add your Firebase Database Secret here (Project Settings -> Service accounts -> Database secrets)
#define FIREBASE_SECRET  "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE" 

// ================= 4G CONFIG =================
#define MODEM_RX 16
#define MODEM_TX 17
#define MODEM_BAUDRATE 115200
const char* APN = "mobitel3g";
const char* GPRS_USER = "";
const char* GPRS_PASS = "";

HardwareSerial SerialAT(2);
TinyGsm modem(SerialAT);

// ================= FIREBASE =================
FirebaseData fbdo;
FirebaseConfig config;
// No FirebaseAuth needed when using legacy token (Database Secret)

// ================= SENSORS =================
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
DHT dht(DHTPIN, DHTTYPE);

#define SOIL_DRY_RAW 3200
#define SOIL_WET_RAW 1400

#define SEND_INTERVAL_MINUTES 1
unsigned long sendInterval = SEND_INTERVAL_MINUTES * 60UL * 1000UL;
unsigned long previousMillis = 0;

// ================= NTP TIME =================
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 19800; // Sri Lanka UTC +5:30
const int daylightOffset_sec = 0;

enum ConnectionMode { CONNECTION_NONE, CONNECTION_WIFI, CONNECTION_4G };
ConnectionMode currentConnection = CONNECTION_NONE;

// Function Declarations
bool connectWiFi();
bool connect4G();
bool uploadViaWiFi(float temperature, float humidity, int soilPercent, String timestamp);
bool uploadVia4G(float temperature, float humidity, int soilPercent, String timestamp);
void uploadSensorData();
String getTimestamp();
void initializeFirebase();

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- SMART PADDY IoT SENSOR SYSTEM ---");

    Serial.println("[1] Initializing sensors...");
    dht.begin();
    pinMode(SOIL_PIN, INPUT);

    Serial.println("[2] Checking Wi-Fi...");
    SerialAT.begin(MODEM_BAUDRATE, SERIAL_8N1, MODEM_RX, MODEM_TX);
    delay(3000);

    if (connectWiFi()) {
        currentConnection = CONNECTION_WIFI;
        Serial.println("\n>>> CONNECTION MODE: WIFI");
    } else {
        Serial.println("\nWi-Fi unavailable. Switching to 4G LTE...");
        if (connect4G()) {
            currentConnection = CONNECTION_4G;
            Serial.println("\n>>> CONNECTION MODE: 4G LTE SIM");
        } else {
            currentConnection = CONNECTION_NONE;
            Serial.println("\n>>> NO INTERNET CONNECTION");
        }
    }

    Serial.println("\n[3] Synchronizing time...");
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 10000)) {
        Serial.println("NTP Time : READY");
    } else {
        Serial.println("NTP Time : FAILED");
    }

    Serial.println("\n[4] Initializing Firebase...");
    initializeFirebase();

    Serial.println("\n--- SYSTEM READY ---");
}

void loop() {
    if (millis() - previousMillis >= sendInterval || previousMillis == 0) {
        previousMillis = millis();
        uploadSensorData();
    }
    delay(100);
}

bool connectWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.print("Connecting Wi-Fi");
    unsigned long startTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTime < 15000) {
        Serial.print(".");
        delay(500);
    }
    Serial.println();
    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("Wi-Fi Connected IP: ");
        Serial.println(WiFi.localIP());
        return true;
    }
    WiFi.disconnect(true);
    return false;
}

bool connect4G() {
    Serial.println("Checking modem...");
    if (!modem.testAT()) return false;
    
    Serial.println("Checking SIM...");
    if (modem.getSimStatus() != SIM_READY) return false;

    Serial.println("Waiting for network...");
    if (!modem.waitForNetwork(60000L)) return false;

    Serial.println("Connecting to APN...");
    if (!modem.gprsConnect(APN, GPRS_USER, GPRS_PASS)) return false;

    Serial.print("4G Connected IP: ");
    Serial.println(modem.getLocalIP());
    return true;
}

void initializeFirebase() {
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    
    // Using Legacy Token (Database Secret) bypasses the need for Email/Anonymous auth entirely
    config.signer.tokens.legacy_token = FIREBASE_SECRET;

    Firebase.begin(&config, nullptr); // nullptr because auth object is not needed
    Firebase.reconnectWiFi(true);
    Serial.println("Firebase : READY");
}

void uploadSensorData() {
    Serial.println("\n--- SENSOR READING ---");

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("DHT22 Reading Failed.");
        return;
    }

    int soilRaw = analogRead(SOIL_PIN);
    int soilPercent = map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100);
    soilPercent = constrain(soilPercent, 0, 100);

    String timestamp = getTimestamp();

    Serial.printf("Temp: %.1f C, Humidity: %.1f %%, Soil: %d %% (Raw: %d)\n", temperature, humidity, soilPercent, soilRaw);
    Serial.println("Time: " + timestamp);

    bool uploadSuccess = false;

    if (WiFi.status() == WL_CONNECTED) {
        currentConnection = CONNECTION_WIFI;
        Serial.println("\n>>> UPLOADING VIA WIFI");
        uploadSuccess = uploadViaWiFi(temperature, humidity, soilPercent, timestamp);

        if (!uploadSuccess) {
            Serial.println("Wi-Fi Firebase upload failed. Trying 4G LTE fallback...");
            if (connect4G()) {
                currentConnection = CONNECTION_4G;
                uploadSuccess = uploadVia4G(temperature, humidity, soilPercent, timestamp);
            }
        }
    } else {
        currentConnection = CONNECTION_4G;
        Serial.println("\n>>> UPLOADING VIA 4G SIM");
        if (!modem.isGprsConnected() && !connect4G()) {
            Serial.println("4G connection unavailable.");
            return;
        }
        uploadSuccess = uploadVia4G(temperature, humidity, soilPercent, timestamp);
    }

    if (uploadSuccess) Serial.println(">>> FIREBASE UPLOAD SUCCESSFUL");
    else Serial.println(">>> FIREBASE UPLOAD FAILED");
}

bool uploadViaWiFi(float temperature, float humidity, int soilPercent, String timestamp) {
    if (!Firebase.ready()) return false;

    String path = "/sensor/";
    bool success = true;

    success &= Firebase.RTDB.setFloat(&fbdo, path + "temperature", temperature);
    success &= Firebase.RTDB.setFloat(&fbdo, path + "humidity", humidity);
    success &= Firebase.RTDB.setInt(&fbdo, path + "soilMoisture", soilPercent);
    success &= Firebase.RTDB.setString(&fbdo, path + "timestamp", timestamp);

    if (!success) {
        Serial.print("Firebase Error: ");
        Serial.println(fbdo.errorReason());
    }
    return success;
}

bool uploadVia4G(float temperature, float humidity, int soilPercent, String timestamp) {
    if (!modem.isGprsConnected()) return false;

    TinyGsmClientSecure client(modem);
    client.setTimeout(30000);
    HttpClient http(client, FIREBASE_HOST, 443);

    String json = "{";
    json += "\"temperature\":" + String(temperature, 2) + ",";
    json += "\"humidity\":" + String(humidity, 2) + ",";
    json += "\"soilMoisture\":" + String(soilPercent) + ",";
    json += "\"timestamp\":\"" + timestamp + "\"";
    json += "}";

    // Use the Database Secret for authentication on the REST API
    String path = "/sensor.json?auth=" + String(FIREBASE_SECRET);

    http.beginRequest();
    http.put(path);
    http.sendHeader("Content-Type", "application/json");
    http.sendHeader("Content-Length", json.length());
    http.beginBody();
    http.print(json);
    http.endRequest();

    int statusCode = http.responseStatusCode();
    Serial.print("HTTP Status: ");
    Serial.println(statusCode);

    http.stop();

    return (statusCode >= 200 && statusCode < 300);
}

String getTimestamp() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 3000)) return "TIME_ERROR";
    char buffer[30];
    sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
            timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday,
            timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
    return String(buffer);
}
