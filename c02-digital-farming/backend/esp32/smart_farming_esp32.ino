#include <WiFi.h>
#include <DHT.h>
#include <time.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define TINY_GSM_MODEM_A7672X
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>

// ================= SECRETS & CONFIGURATIONS =================
const char* ssid     = "Redmi Note 11 Pro 5G";
const char* password = "22222222";

#define API_KEY          "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE"
#define DATABASE_URL     "https://esp32-project01-1641b-default-rtdb.firebaseio.com/"
#define FIREBASE_HOST    "esp32-project01-1641b-default-rtdb.firebaseio.com"
#define FIREBASE_SECRET  "AIzaSyBqs9kHOCJ5nBlRoGuWaPxuPRkBoUmXcmE"

// ================= 4G LTE MODEM CONFIG (A7672X) =================
#define MODEM_RX       16
#define MODEM_TX       17
#define MODEM_BAUDRATE 115200

const char* APN       = "mobitel";
const char* GPRS_USER = "";
const char* GPRS_PASS = "";

HardwareSerial SerialAT(2);
TinyGsm modem(SerialAT);

// ================= FIREBASE HANDLES =================
FirebaseData fbdo;
FirebaseConfig config;

// ================= SENSOR DEFINITIONS =================
// DHT22 Temperature & Humidity Sensor
#define DHTPIN  4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Analog Soil Moisture Sensor
#define SOIL_PIN      34
#define SOIL_DRY_RAW  3200
#define SOIL_WET_RAW  1400

// RS485 / Modbus 7-in-1 NPK Sensor
#define NPK_RX_PIN    25
#define NPK_TX_PIN    26
#define NPK_DE_RE_PIN 27 // Direction Control Pin
#define NPK_BAUDRATE  9600
#define NPK_SLAVE_ID  1

HardwareSerial SerialNPK(1);

// NPK Global Variables
float npkMoisture = 0.0, npkTemperature = 0.0, npkEC = 0.0, npkPH = 0.0;
float nitrogen = 0.0, phosphorus = 0.0, potassium = 0.0;
bool npkReadingValid = false;

// ================= TIMING & SCHEDULING =================
#define SEND_INTERVAL_MINUTES 1
unsigned long sendInterval   = SEND_INTERVAL_MINUTES * 60UL * 1000UL;
unsigned long previousMillis = 0;

// ================= NTP TIME CONFIGURATION =================
const char* ntpServer       = "pool.ntp.org";
const long gmtOffset_sec    = 19800; // GMT+5:30
const int daylightOffset_sec = 0;

// ================= CONNECTION MODES =================
enum ConnectionMode { CONNECTION_NONE, CONNECTION_WIFI, CONNECTION_4G };
ConnectionMode currentConnection = CONNECTION_NONE;

// ================= FUNCTION PROTOTYPES =================
bool connectWiFi();
bool connect4G();
void initializeFirebase();
void uploadSensorData();
bool uploadViaWiFi(float t, float h, int sm, float n, float p, float k, float ph, float ec, String ts);
bool uploadVia4G(float t, float h, int sm, float n, float p, float k, float ph, float ec, String ts);

void initializeNPK();
bool readNPKSensor();
bool readModbusRegisters(uint8_t slaveID, uint16_t startReg, uint16_t numRegs, uint16_t* data);
uint16_t modbusCRC16(uint8_t* buffer, uint8_t length);
void setRS485Transmit();
void setRS485Receive();
String getTimestamp();

// ================= SETUP =================
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n--- SMART PADDY IoT SENSOR SYSTEM ---");

    // Initialize Local Sensors
    Serial.println("[1] Initializing sensors...");
    dht.begin();
    pinMode(SOIL_PIN, INPUT);
    initializeNPK();

    // Setup Serial for 4G Modem
    SerialAT.begin(MODEM_BAUDRATE, SERIAL_8N1, MODEM_RX, MODEM_TX);
    delay(3000);

    // Network Connectivity Setup (WiFi Primary, 4G Fallback)
    Serial.println("[2] Checking Connectivity...");
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

    // NTP Time Sync
    Serial.println("\n[3] Synchronizing time...");
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    struct tm timeinfo;
    if (getLocalTime(&timeinfo, 10000)) {
        Serial.println("NTP Time : READY");
    } else {
        Serial.println("NTP Time : FAILED");
    }

    // Initialize Firebase Services
    Serial.println("\n[4] Initializing Firebase...");
    initializeFirebase();

    Serial.println("\n--- SYSTEM READY ---");
}

// ================= MAIN LOOP =================
void loop() {
    if (millis() - previousMillis >= sendInterval || previousMillis == 0) {
        previousMillis = millis();
        uploadSensorData();
    }
    delay(100);
}

// ================= NETWORK HELPERS =================
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
        Serial.print("Wi-Fi Connected. IP: ");
        Serial.println(WiFi.localIP());
        return true;
    }
    WiFi.disconnect(true);
    return false;
}

bool connect4G() {
    Serial.println("Checking modem...");
    if (!modem.testAT()) {
        Serial.println("Modem AT test failed.");
        return false;
    }

    Serial.println("Checking SIM...");
    if (modem.getSimStatus() != SIM_READY) {
        Serial.println("SIM not ready.");
        return false;
    }

    Serial.println("Waiting for network...");
    if (!modem.waitForNetwork(60000L)) {
        Serial.println("Network unavailable.");
        return false;
    }

    Serial.println("Connecting to APN...");
    if (!modem.gprsConnect(APN, GPRS_USER, GPRS_PASS)) {
        Serial.println("GPRS connection failed.");
        return false;
    }

    Serial.print("4G Connected. IP: ");
    Serial.println(modem.getLocalIP());
    return true;
}

void initializeFirebase() {
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;
    config.signer.tokens.legacy_token = FIREBASE_SECRET;

    Firebase.begin(&config, nullptr);
    Firebase.reconnectWiFi(true);
    Serial.println("Firebase : READY");
}

// ================= RS485 / NPK MODBUS IMPLEMENTATION =================
void initializeNPK() {
    Serial.println("Initializing 7-in-1 NPK sensor...");
    pinMode(NPK_DE_RE_PIN, OUTPUT);
    setRS485Receive(); // Default to listening mode

    SerialNPK.begin(NPK_BAUDRATE, SERIAL_8N1, NPK_RX_PIN, NPK_TX_PIN);
    delay(500);
    Serial.println("NPK RS485 : READY");
}

void setRS485Transmit() {
    digitalWrite(NPK_DE_RE_PIN, HIGH);
    delayMicroseconds(100);
}

void setRS485Receive() {
    digitalWrite(NPK_DE_RE_PIN, LOW);
    delayMicroseconds(100);
}

// Generates 16-bit Modbus CRC check
uint16_t modbusCRC16(uint8_t* buffer, uint8_t length) {
    uint16_t crc = 0xFFFF;
    for (uint8_t pos = 0; pos < length; pos++) {
        crc ^= (uint16_t)buffer[pos];
        for (uint8_t i = 8; i != 0; i--) {
            if ((crc & 0x0001) != 0) {
                crc >>= 1;
                crc ^= 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}

bool readModbusRegisters(uint8_t slaveID, uint16_t startRegister, uint16_t numberOfRegisters, uint16_t* data) {
    uint8_t request[8];
    request[0] = slaveID;
    request[1] = 0x03; // Read Holding Registers Command
    request[2] = highByte(startRegister);
    request[3] = lowByte(startRegister);
    request[4] = highByte(numberOfRegisters);
    request[5] = lowByte(numberOfRegisters);

    uint16_t crc = modbusCRC16(request, 6);
    request[6] = lowByte(crc);
    request[7] = highByte(crc);

    // Flush rx buffer before sending request
    while (SerialNPK.available()) {
        SerialNPK.read();
    }

    setRS485Transmit();
    SerialNPK.write(request, 8);
    SerialNPK.flush();
    setRS485Receive();

    uint8_t expectedBytes = 5 + (numberOfRegisters * 2);
    uint8_t response[32];
    uint8_t index = 0;
    unsigned long startTime = millis();

    while (millis() - startTime < 1000) {
        if (SerialNPK.available()) {
            response[index++] = SerialNPK.read();
            if (index >= expectedBytes) break;
        }
    }

    // Packet validation checks
    if (index != expectedBytes) return false;
    if (response[0] != slaveID || response[1] != 0x03 || response[2] != numberOfRegisters * 2) return false;

    uint16_t receivedCRC   = response[index - 2] | (response[index - 1] << 8);
    uint16_t calculatedCRC = modbusCRC16(response, index - 2);
    if (receivedCRC != calculatedCRC) return false;

    for (uint8_t i = 0; i < numberOfRegisters; i++) {
        data[i] = ((uint16_t)response[3 + i * 2] << 8) | response[4 + i * 2];
    }
    return true;
}

bool readNPKSensor() {
    uint16_t registers[7];
    Serial.println("\nReading 7-in-1 NPK sensor...");

    if (!readModbusRegisters(NPK_SLAVE_ID, 0x0000, 7, registers)) {
        npkReadingValid = false;
        return false;
    }

    // Register Mapping: 0:Moisture, 1:Temp, 2:EC, 3:pH, 4:N, 5:P, 6:K
    npkMoisture    = registers[0] / 10.0;
    npkTemperature = registers[1] / 10.0;
    npkEC          = registers[2] / 100.0;
    npkPH          = registers[3] / 10.0;
    nitrogen       = registers[4];
    phosphorus     = registers[5];
    potassium      = registers[6];
    npkReadingValid = true;

    Serial.println("--- 7-IN-1 NPK DATA ---");
    Serial.printf("NPK Moisture : %.1f %%\n", npkMoisture);
    Serial.printf("NPK Temp     : %.1f C\n", npkTemperature);
    Serial.printf("EC           : %.2f\n", npkEC);
    Serial.printf("pH           : %.1f\n", npkPH);
    Serial.printf("Nitrogen     : %.1f\n", nitrogen);
    Serial.printf("Phosphorus   : %.1f\n", phosphorus);
    Serial.printf("Potassium    : %.1f\n", potassium);

    return true;
}

// ================= DATA PROCESSING & UPLOAD =================
void uploadSensorData() {
    Serial.println("\n--- SENSOR READING ---");

    // Read DHT22
    float temperature = dht.readTemperature();
    float humidity    = dht.readHumidity();
    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("DHT22 Reading Failed.");
        return;
    }

    // Read Analog Soil Moisture
    int soilRaw     = analogRead(SOIL_PIN);
    int soilPercent = map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100);
    soilPercent     = constrain(soilPercent, 0, 100);

    // Read Modbus RS485 Sensor
    readNPKSensor();

    String timestamp = getTimestamp();

    // Output local readings to Serial
    Serial.printf("DHT Temp: %.1f C\nHumidity: %.1f %%\n", temperature, humidity);
    Serial.printf("Soil Moisture: %d %% (Raw: %d)\n", soilPercent, soilRaw);
    if (!npkReadingValid) Serial.println("NPK: READING FAILED");
    Serial.println("Time: " + timestamp);

    bool uploadSuccess = false;

    // Check Wi-Fi First, fallback to 4G LTE if connection fails
    if (WiFi.status() == WL_CONNECTED) {
        currentConnection = CONNECTION_WIFI;
        Serial.println("\n>>> UPLOADING VIA WIFI");
        uploadSuccess = uploadViaWiFi(temperature, humidity, soilPercent, nitrogen, phosphorus, potassium, npkPH, npkEC, timestamp);

        if (!uploadSuccess) {
            Serial.println("Wi-Fi Firebase upload failed. Trying 4G LTE fallback...");
            if (connect4G()) {
                currentConnection = CONNECTION_4G;
                uploadSuccess = uploadVia4G(temperature, humidity, soilPercent, nitrogen, phosphorus, potassium, npkPH, npkEC, timestamp);
            }
        }
    } else {
        currentConnection = CONNECTION_4G;
        Serial.println("\n>>> UPLOADING VIA 4G SIM");
        if (!modem.isGprsConnected() && !connect4G()) {
            Serial.println("4G connection unavailable.");
            return;
        }
        uploadSuccess = uploadVia4G(temperature, humidity, soilPercent, nitrogen, phosphorus, potassium, npkPH, npkEC, timestamp);
    }

    if (uploadSuccess) {
        Serial.println(">>> FIREBASE UPLOAD SUCCESSFUL");
    } else {
        Serial.println(">>> FIREBASE UPLOAD FAILED");
    }
}

// Native Firebase Library Realtime Database Upload (Wi-Fi)
bool uploadViaWiFi(float t, float h, int sm, float n, float p, float k, float ph, float ec, String ts) {
    if (!Firebase.ready()) {
        Serial.println("Firebase not ready.");
        return false;
    }

    String path = "/sensor/";
    bool success = true;

    success &= Firebase.RTDB.setFloat(&fbdo, path + "temperature", t);
    success &= Firebase.RTDB.setFloat(&fbdo, path + "humidity", h);
    success &= Firebase.RTDB.setInt(&fbdo, path + "soilMoisture", sm);
    success &= Firebase.RTDB.setFloat(&fbdo, path + "nitrogen", n);
    success &= Firebase.RTDB.setFloat(&fbdo, path + "phosphorus", p);
    success &= Firebase.RTDB.setFloat(&fbdo, path + "potassium", k);
    success &= Firebase.RTDB.setFloat(&fbdo, path + "ph", ph);
    success &= Firebase.RTDB.setFloat(&fbdo, path + "ec", ec);
    success &= Firebase.RTDB.setString(&fbdo, path + "timestamp", ts);

    if (!success) {
        Serial.print("Firebase Error: ");
        Serial.println(fbdo.errorReason());
    }
    return success;
}

// REST API HTTP REST Request Upload (4G LTE SIM)
bool uploadVia4G(float t, float h, int sm, float n, float p, float k, float ph, float ec, String ts) {
    if (!modem.isGprsConnected()) return false;

    TinyGsmClientSecure client(modem);
    client.setTimeout(30000);
    HttpClient http(client, FIREBASE_HOST, 443);

    // Build JSON Payload
    String json = "{";
    json += "\"temperature\":" + String(t, 2) + ",";
    json += "\"humidity\":" + String(h, 2) + ",";
    json += "\"soilMoisture\":" + String(sm) + ",";
    json += "\"nitrogen\":" + String(n, 2) + ",";
    json += "\"phosphorus\":" + String(p, 2) + ",";
    json += "\"potassium\":" + String(k, 2) + ",";
    json += "\"ph\":" + String(ph, 2) + ",";
    json += "\"ec\":" + String(ec, 2) + ",";
    json += "\"timestamp\":\"" + ts + "\"";
    json += "}";

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

// Utility: Returns formatted string timestamp from system RTC
String getTimestamp() {
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo, 3000)) {
        return "TIME_ERROR";
    }

    char buffer[30];
    sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
            timeinfo.tm_year + 1900,
            timeinfo.tm_mon + 1,
            timeinfo.tm_mday,
            timeinfo.tm_hour,
            timeinfo.tm_min,
            timeinfo.tm_sec);

    return String(buffer);
}