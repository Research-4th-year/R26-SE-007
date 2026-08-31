#include <WiFi.h>
#include <NetworkClientSecure.h>
#include <DHT.h>
#include <time.h>
#include <ArduinoHttpClient.h>

#define TINY_GSM_MODEM_A7672X
#include <TinyGsmClient.h>

// Wi-Fi
#define WIFI_SSID "Redmi Note 11 Pro 5G"
#define WIFI_PASSWORD "22222222"

// Firebase
#define FIREBASE_HOST "esp32-project01-1641b-default-rtdb.firebaseio.com"

// 4G
#define MODEM_RX 16
#define MODEM_TX 17
#define MODEM_BAUD 115200
#define APN "mobitel"
#define GPRS_USER ""
#define GPRS_PASS ""

// Sensors
#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
#define SOIL_DRY_RAW 3200
#define SOIL_WET_RAW 1400

#define SEND_INTERVAL 60000UL

// Time
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
bool getModemClock(int&, int&, int&, int&, int&, int&);
bool uploadViaWiFi(float, float, int, String);
bool uploadVia4G(float, float, int, String);
bool sendATCommand(String, String, unsigned long);
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
    if (!connect4G()) Serial.println("4G connection failed.");
  }

  bool timeOK = WiFi.status() == WL_CONNECTED ?
                syncTimeWiFi() : syncTime4G();

  if (!timeOK && WiFi.status() != WL_CONNECTED) {
    Serial.println("Retrying 4G time synchronization...");
    if (connect4G()) timeOK = syncTime4G();
  }

  Serial.println(timeOK ?
    "Time Ready: " + getTimestamp() :
    "Time Sync Failed");

  Serial.println("--- SYSTEM READY ---");
}

void loop() {
  if (previousMillis == 0 ||
      millis() - previousMillis >= SEND_INTERVAL) {
    previousMillis = millis();
    readAndUpload();
  }
  delay(100);
}

// Wi-Fi connection
bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting Wi-Fi");
  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - start < 15000) {
    Serial.print(".");
    delay(500);
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Wi-Fi Connected: " + WiFi.localIP().toString());
    return true;
  }

  return false;
}

// 4G connection
bool connect4G() {
  Serial.println("Checking 4G Modem...");

  if (!modem.testAT(10000)) {
    Serial.println("4G modem not responding.");
    return false;
  }

  if (modem.getSimStatus() != SIM_READY) {
    Serial.println("SIM card not ready.");
    return false;
  }

  if (!modem.waitForNetwork(60000L)) {
    Serial.println("4G network unavailable.");
    return false;
  }

  if (!modem.isGprsConnected()) {
    if (!modem.gprsConnect(APN, GPRS_USER, GPRS_PASS)) {
      Serial.println("Mobile data connection failed.");
      return false;
    }
  }

  Serial.println("4G Connected IP: " + modem.getLocalIP());
  return true;
}

// Wi-Fi NTP
bool syncTimeWiFi() {
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);

  struct tm timeinfo;

  for (int i = 0; i < 15; i++) {
    if (getLocalTime(&timeinfo, 1000) &&
        timeinfo.tm_year + 1900 >= 2024)
      return true;

    delay(500);
  }

  return false;
}

// 4G NTP
bool syncTime4G() {
  if (!modem.isGprsConnected()) return false;

  Serial.println("Synchronizing time using 4G...");

  while (SerialAT.available()) SerialAT.read();

  SerialAT.println("AT+CNTP=\"pool.ntp.org\",22");
  delay(1000);
  SerialAT.println("AT+CNTP");

  String response;
  unsigned long start = millis();

  while (millis() - start < 20000) {
    while (SerialAT.available())
      response += (char)SerialAT.read();

    if (response.indexOf("+CNTP: 0") >= 0) {
      Serial.println("4G NTP synchronization successful.");
      break;
    }

    delay(10);
  }

  int y, m, d, h, min, s;

  if (!getModemClock(y, m, d, h, min, s)) {
    Serial.println("Could not read modem clock.");
    return false;
  }

  struct tm timeinfo = {
    s, min, h, d, m - 1, y - 1900
  };

  time_t epoch = mktime(&timeinfo);
  if (epoch <= 0) return false;

  struct timeval tv = {epoch, 0};
  settimeofday(&tv, nullptr);

  return true;
}

// Read modem clock
bool getModemClock(
  int &y, int &m, int &d,
  int &h, int &min, int &s
) {
  while (SerialAT.available()) SerialAT.read();

  SerialAT.println("AT+CCLK?");

  String response;
  unsigned long start = millis();

  while (millis() - start < 3000) {
    while (SerialAT.available())
      response += (char)SerialAT.read();

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

  return y >= 2024 && m >= 1 && m <= 12 &&
         d >= 1 && d <= 31;
}

// Read sensors + upload
void readAndUpload() {
  Serial.println("\n--- SENSOR READING ---");

  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (isnan(t) || isnan(h)) {
    Serial.println("DHT22 Reading Failed.");
    return;
  }

  int soilRaw = analogRead(SOIL_PIN);

  int soilPercent = constrain(
    map(soilRaw, SOIL_DRY_RAW, SOIL_WET_RAW, 0, 100),
    0, 100
  );

  String timestamp = getTimestamp();

  Serial.printf(
    "Temp: %.1f C | Hum: %.1f %% | Soil: %d %% | Time: %s\n",
    t, h, soilPercent, timestamp.c_str()
  );

  bool success = false;

  // Wi-Fi first
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(">>> UPLOADING VIA WIFI");

    success = uploadViaWiFi(
      t, h, soilPercent, timestamp
    );

    if (!success) {
      Serial.println("Wi-Fi upload failed. Switching to 4G...");
      WiFi.disconnect(true);
      delay(500);

      if (connect4G())
        success = uploadVia4G(
          t, h, soilPercent, timestamp
        );
    }

  } else {
    // 4G fallback
    Serial.println(">>> UPLOADING VIA 4G");

    if (connect4G())
      success = uploadVia4G(
        t, h, soilPercent, timestamp
      );
  }

  Serial.println(
    success ? ">>> UPLOAD SUCCESSFUL" :
              ">>> UPLOAD FAILED"
  );
}

// Wi-Fi Firebase upload
bool uploadViaWiFi(
  float t, float h, int s, String ts
) {
  NetworkClientSecure client;
  client.setInsecure();

  HttpClient http(client, FIREBASE_HOST, 443);

  String json =
    "{\"temperature\":" + String(t, 2) +
    ",\"humidity\":" + String(h, 2) +
    ",\"soilMoisture\":" + String(s) +
    ",\"timestamp\":\"" + ts + "\"}";

  http.beginRequest();
  http.put("/sensor.json");
  http.sendHeader("Content-Type", "application/json");
  http.sendHeader("Content-Length", json.length());
  http.beginBody();
  http.print(json);
  http.endRequest();

  int statusCode = http.responseStatusCode();

  Serial.print("Wi-Fi Firebase HTTP status: ");
  Serial.println(statusCode);

  http.stop();

  return statusCode >= 200 && statusCode < 300;
}

// Send AT command
bool sendATCommand(
  String command,
  String expected,
  unsigned long timeout
) {
  while (SerialAT.available()) SerialAT.read();

  SerialAT.println(command);

  String response;
  unsigned long start = millis();

  while (millis() - start < timeout) {
    while (SerialAT.available()) {
      char c = SerialAT.read();
      response += c;

      if (response.indexOf(expected) >= 0)
        return true;

      if (response.indexOf("ERROR") >= 0)
        return false;
    }

    delay(5);
  }

  return false;
}

// 4G Firebase upload
bool uploadVia4G(
  float t, float h, int s, String ts
) {
  Serial.println("--- 4G FIREBASE UPLOAD ---");

  if (!modem.isGprsConnected()) {
    Serial.println("4G data disconnected.");

    if (!connect4G()) return false;
  }

  String json =
    "{\"temperature\":" + String(t, 2) +
    ",\"humidity\":" + String(h, 2) +
    ",\"soilMoisture\":" + String(s) +
    ",\"timestamp\":\"" + ts + "\"}";

  Serial.println("4G Firebase JSON:");
  Serial.println(json);

  // Stop previous HTTP session
  SerialAT.println("AT+HTTPTERM");
  delay(500);

  while (SerialAT.available()) SerialAT.read();

  // Start HTTP
  if (!sendATCommand("AT+HTTPINIT", "OK", 5000)) {
    Serial.println("HTTPINIT failed.");
    return false;
  }

  // Firebase URL
  String url =
    "https://" + String(FIREBASE_HOST) + "/sensor.json";

  if (!sendATCommand(
    "AT+HTTPPARA=\"URL\",\"" + url + "\"",
    "OK", 5000
  )) {
    Serial.println("URL setting failed.");
    SerialAT.println("AT+HTTPTERM");
    return false;
  }

  // JSON content type
  if (!sendATCommand(
    "AT+HTTPPARA=\"CONTENT\",\"application/json\"",
    "OK", 5000
  )) {
    Serial.println("Content type failed.");
    SerialAT.println("AT+HTTPTERM");
    return false;
  }

  // Tell modem JSON size
  while (SerialAT.available()) SerialAT.read();

  SerialAT.print("AT+HTTPDATA=");
  SerialAT.print(json.length());
  SerialAT.println(",10000");

  // Wait for DOWNLOAD
  String dataResponse;
  unsigned long dataStart = millis();
  bool downloadReady = false;

  while (millis() - dataStart < 12000) {
    while (SerialAT.available()) {
      char c = SerialAT.read();
      dataResponse += c;

      if (dataResponse.indexOf("DOWNLOAD") >= 0) {
        downloadReady = true;
        break;
      }

      if (dataResponse.indexOf("ERROR") >= 0)
        break;
    }

    if (downloadReady) break;
    delay(5);
  }

  if (!downloadReady) {
    Serial.println("HTTPDATA failed.");
    Serial.println(dataResponse);
    SerialAT.println("AT+HTTPTERM");
    return false;
  }

  // Send JSON
  SerialAT.print(json);
  delay(1000);

  // IMPORTANT: 4 = PUT
  Serial.println("Sending Firebase PUT request...");
  while (SerialAT.available()) SerialAT.read();

  SerialAT.println("AT+HTTPACTION=4");

  String response;
  unsigned long start = millis();
  int httpStatus = -1;

  while (millis() - start < 30000) {
    while (SerialAT.available()) {
      char c = SerialAT.read();
      response += c;

      int pos = response.indexOf("+HTTPACTION:");

      if (pos >= 0) {
        int c1 = response.indexOf(',', pos);
        int c2 = response.indexOf(',', c1 + 1);

        if (c1 > 0 && c2 > c1) {
          httpStatus = response.substring(
            c1 + 1, c2
          ).toInt();
          break;
        }
      }
    }

    if (httpStatus >= 0) break;
    delay(10);
  }

  Serial.println("4G HTTP response:");
  Serial.println(response);

  Serial.print("Firebase HTTP status: ");
  Serial.println(httpStatus);

  // Read Firebase response
  if (httpStatus >= 200 && httpStatus < 300) {
    Serial.println("Firebase PUT successful.");

    SerialAT.println("AT+HTTPREAD");

    String body;
    unsigned long readStart = millis();

    while (millis() - readStart < 5000) {
      while (SerialAT.available())
        body += (char)SerialAT.read();

      delay(5);
    }

    Serial.println("Firebase response:");
    Serial.println(body);

    SerialAT.println("AT+HTTPTERM");
    delay(300);

    return true;
  }

  Serial.println("Firebase PUT failed.");

  SerialAT.println("AT+HTTPTERM");
  delay(300);

  return false;
}

// Timestamp
String getTimestamp() {
  struct tm timeinfo;

  if (
    !getLocalTime(&timeinfo, 1000) ||
    timeinfo.tm_year + 1900 < 2024
  )
    return "TIME_ERROR";

  char buf[25];

  sprintf(
    buf,
    "%04d-%02d-%02d %02d:%02d:%02d",
    timeinfo.tm_year + 1900,
    timeinfo.tm_mon + 1,
    timeinfo.tm_mday,
    timeinfo.tm_hour,
    timeinfo.tm_min,
    timeinfo.tm_sec
  );

  return String(buf);
}