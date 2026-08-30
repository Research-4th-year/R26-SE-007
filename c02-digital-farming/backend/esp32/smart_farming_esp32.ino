#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <DHT.h>
#include <time.h>
#include <ArduinoHttpClient.h>

#define TINY_GSM_MODEM_A7672X
#include <TinyGsmClient.h>

#define WIFI_SSID "Redmi Note 11 Pro 5G"
#define WIFI_PASSWORD "22222222"
#define FIREBASE_HOST "esp32-project01-1641b-default-rtdb.firebaseio.com"

#define MODEM_RX 16
#define MODEM_TX 17
#define MODEM_BAUD 115200
#define APN "mobitel"
#define GPRS_USER ""
#define GPRS_PASS ""

#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
#define SOIL_DRY_RAW 3200
#define SOIL_WET_RAW 1400

#define SEND_INTERVAL 60000UL
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET 19800
#define DAYLIGHT_OFFSET 0

HardwareSerial SerialAT(2);
TinyGsm modem(SerialAT);
DHT dht(DHTPIN, DHTTYPE);

unsigned long previousMillis = 0;

bool connectWiFi();
bool connect4G();
bool syncTimeWiFi();
bool syncTime4G();
bool getModemClock(int &y, int &m, int &d, int &h, int &min, int &s);
bool uploadViaWiFi(float t, float h, int s, String ts);
bool uploadVia4G(float t, float h, int s, String ts);
void readAndUpload();
String getTimestamp();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- SMART PADDY IoT SENSOR SYSTEM ---");

  dht.begin();
  pinMode(SOIL_PIN, INPUT);
  SerialAT.begin(MODEM_BAUD, SERIAL_8N1, MODEM_RX, MODEM_TX);
  delay(3000);

  if (!connectWiFi()) {
    Serial.println("Wi-Fi unavailable. Switching to 4G...");
    connect4G();
  }

  bool timeOK = (WiFi.status() == WL_CONNECTED) ? syncTimeWiFi() : syncTime4G();
  if (!timeOK && WiFi.status() != WL_CONNECTED) {
    if (connect4G()) syncTime4G();
  }
  
  Serial.println(timeOK ? "Time Ready: " + getTimestamp() : "Time Sync Failed");
  Serial.println("--- SYSTEM READY ---");
}

void loop() {
  if (previousMillis == 0 || millis() - previousMillis >= SEND_INTERVAL) {
    previousMillis = millis();
    readAndUpload();
  }
  delay(100);
}

bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting Wi-Fi");
  
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  return (WiFi.status() == WL_CONNECTED);
}

bool connect4G() {
  Serial.println("Checking 4G Modem...");
  if (!modem.testAT(10000) || modem.getSimStatus() != SIM_READY) return false;
  if (!modem.waitForNetwork(60000L)) return false;

  if (!modem.isGprsConnected()) {
    if (!modem.gprsConnect(APN, GPRS_USER, GPRS_PASS)) return false;
  }
  Serial.println("4G Connected IP: " + modem.getLocalIP());
  return true;
}

bool syncTimeWiFi() {
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);
  struct tm timeinfo;
  for (int i = 0; i < 15; i++) {
    if (getLocalTime(&timeinfo, 1000) && (timeinfo.tm_year + 1900 >= 2024)) return true;
    delay(500);
  }
  return false;
}

bool syncTime4G() {
  if (!modem.isGprsConnected()) return false;
  while (SerialAT.available()) SerialAT.read();

  SerialAT.println("AT+CNTP=\"pool.ntp.org\",22");
  delay(1000);
  SerialAT.println("AT+CNTP");
  
  String response = "";
  unsigned long start = millis();
  while (millis() - start < 15000) {
    while (SerialAT.available()) response += (char)SerialAT.read();
    if (response.indexOf("+CNTP: 0") >= 0) break;
    delay(10);
  }

  int y, m, d, h, min, s;
  if (!getModemClock(y, m, d, h, min, s)) return false;

  struct tm timeinfo = {s, min, h, d, m - 1, y - 1900};
  time_t epoch = mktime(&timeinfo);
  if (epoch <= 0) return false;

  struct timeval tv = {epoch, 0};
  settimeofday(&tv, nullptr);
  return true;
}

bool getModemClock(int &y, int &m, int &d, int &h, int &min, int &s) {
  while (SerialAT.available()) SerialAT.read();
  SerialAT.println("AT+CCLK?");
  
  String response = "";
  unsigned long start = millis();
  while (millis() - start < 3000) {
    while (SerialAT.available()) response += (char)SerialAT.read();
    delay(10);
  }

  int q1 = response.indexOf('"');
  int q2 = response.indexOf('"', q1 + 1);
  if (q1 < 0 || q2 < 0) return false;

  String clock = response.substring(q1 + 1, q2);
  if (clock.length() < 17) return false;

  y = 2000 + clock.substring(0, 2).toInt();
  m = clock.substring(3, 5).toInt();
  d = clock.substring(6, 8).toInt();
  h = clock.substring(9, 11).toInt();
  min = clock.substring(12, 14).toInt();
  s = clock.substring(15, 17).toInt();

  return (y >= 2024 && m >= 1 && m <= 12 && d >= 1 && d <= 31);
}

void readAndUpload() {
  Serial.println("\n--- SENSOR READING ---");
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (isnan(t) || isnan(h)) {
    Serial.println("DHT22 Reading Failed.");
    return;
  }

  int soilRaw = analogRead(SOIL_PIN);
  int soilPercent = constrain(map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100), 0, 100);
  String timestamp = getTimestamp();

  Serial.printf("Temp: %.1f C | Hum: %.1f %% | Soil: %d %% | Time: %s\n", t, h, soilPercent, timestamp.c_str());

  bool success = false;
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(">>> UPLOADING VIA WIFI");
    success = uploadViaWiFi(t, h, soilPercent, timestamp);
    if (!success) {
      Serial.println("Wi-Fi upload failed. Switching to 4G...");
      WiFi.disconnect();
      if (connect4G()) success = uploadVia4G(t, h, soilPercent, timestamp);
    }
  } else {
    Serial.println(">>> UPLOADING VIA 4G");
    if (connect4G()) success = uploadVia4G(t, h, soilPercent, timestamp);
  }

  Serial.println(success ? ">>> UPLOAD SUCCESSFUL" : ">>> UPLOAD FAILED");
}

bool uploadViaWiFi(float t, float h, int s, String ts) {
  NetworkClientSecure client;
  client.setInsecure();
  HttpClient http(client, FIREBASE_HOST, 443);

  String json = "{\"temperature\":" + String(t, 2) + ",\"humidity\":" + String(h, 2) + 
                ",\"soilMoisture\":" + String(s) + ",\"timestamp\":\"" + ts + "\"}";

  http.beginRequest();
  http.put("/sensor.json");
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("Content-Length", json.length());
  http.beginBody();
  http.print(json);
  http.endRequest();

  int statusCode = http.responseStatusCode();
  http.stop();
  return (statusCode >= 200 && statusCode < 300);
}

bool uploadVia4G(float t, float h, int s, String ts) {
  if (!modem.isGprsConnected()) return false;

  String json = "{\"temperature\":" + String(t, 2) + ",\"humidity\":" + String(h, 2) + 
                ",\"soilMoisture\":" + String(s) + ",\"timestamp\":\"" + ts + "\"}";

  // Reset HTTP Engine
  SerialAT.println("AT+HTTPTERM");
  delay(200);
  while (SerialAT.available()) SerialAT.read();

  SerialAT.println("AT+HTTPINIT");
  delay(300);

  // Set URL (HTTPS)
  SerialAT.println("AT+HTTPPARA=\"URL\",\"https://" + String(FIREBASE_HOST) + "/sensor.json\"");
  delay(300);

  // Set Header for Firebase standard override
  SerialAT.println("AT+HTTPPARA=\"CONTENT\",\"application/json\"");
  delay(300);

  // Pass payload
  SerialAT.println("AT+HTTPDATA=" + String(json.length()) + ",10000");
  delay(500);
  SerialAT.print(json);
  delay(500);

  // Execute Action: Method 1 = POST (Firebase supports POST to push new nodes or write)
  SerialAT.println("AT+HTTPACTION=1");

  bool success = false;
  unsigned long start = millis();
  while (millis() - start < 15000) {
    if (SerialAT.available()) {
      String line = SerialAT.readStringUntil('\n');
      if (line.indexOf("+HTTPACTION:") >= 0) {
        if (line.indexOf(",200,") >= 0 || line.indexOf(",204,") >= 0) {
          success = true;
        }
        break;
      }
    }
  }

  SerialAT.println("AT+HTTPTERM");
  return success;
}

String getTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 1000) || (timeinfo.tm_year + 1900 < 2024)) return "TIME_ERROR";

  char buf[25];
  sprintf(buf, "%04d-%02d-%02d %02d:%02d:%02d", 
          timeinfo.tm_year + 1900, timeinfo.tm_mon + 1, timeinfo.tm_mday, 
          timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
  return String(buf);
}