/*
 * ================================================================
 * SMART PADDY IoT SENSOR SYSTEM
 * ESP32 + DHT22 + Soil Moisture + Firebase
 *
 * INTERNET CONNECTION PRIORITY:
 *
 * 1. Wi-Fi
 * 2. A7670C 4G LTE SIM module
 *
 * If Wi-Fi is available:
 *      Firebase upload -> Wi-Fi
 *
 * If Wi-Fi is unavailable:
 *      Firebase upload -> A7670C 4G LTE
 *
 * ================================================================
 */

#include <WiFi.h>
#include <DHT.h>
#include <time.h>

#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define TINY_GSM_MODEM_A7670

#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>

// ================================================================
// WIFI CONFIGURATION
// ================================================================

const char* ssid = "Redmi Note 11 Pro 5G";
const char* password = "22222222";

// ================================================================
// A7670C 4G CONFIGURATION
// ================================================================

// ESP32 UART2
#define MODEM_RX 16
#define MODEM_TX 17

// A7670C baud rate
#define MODEM_BAUDRATE 115200

// IMPORTANT:
// Change this according to your SIM network provider.
//
// Examples:
//
// Dialog       -> "dialogbb"
// Mobitel      -> "mobitel"
// Hutch        -> "hutch3g"
// Airtel       -> "airtel"
//
// Check your SIM provider's APN.
const char* APN = "YOUR_APN";

const char* GPRS_USER = "";
const char* GPRS_PASS = "";

// ================================================================
// MODEM SERIAL
// ================================================================

HardwareSerial SerialAT(2);

TinyGsm modem(SerialAT);

// ================================================================
// FIREBASE CONFIGURATION
// ================================================================

#define API_KEY "AIzaSyDOCSmSVyobKE5ZUZAqGCst2BtoHuGh6-k"
#define DATABASE_URL "https://research-4y2s-default-rtdb.firebaseio.com/"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// ================================================================
// SENSOR CONFIGURATION
// ================================================================

#define DHTPIN 4
#define DHTTYPE DHT22
#define SOIL_PIN 34
DHT dht(DHTPIN, DHTTYPE);

// ================================================================
// DATA COLLECTION INTERVAL
// ================================================================
// 5  = 5 minutes
// 30 = 30 minutes
// 60 = 1 hour

#define SEND_INTERVAL_MINUTES 30

unsigned long sendInterval = SEND_INTERVAL_MINUTES * 60UL * 1000UL;
unsigned long previousMillis = 0;

// ================================================================
// NTP TIME CONFIGURATION
// ================================================================

const char* ntpServer = "pool.ntp.org";

// Sri Lanka UTC +5:30
const long gmtOffset_sec = 19800;
const int daylightOffset_sec = 0;

// ================================================================
// NETWORK MODE
// ================================================================

enum ConnectionMode
{
    CONNECTION_NONE,
    CONNECTION_WIFI,
    CONNECTION_4G
};

ConnectionMode currentConnection = CONNECTION_NONE;

// ================================================================
// FUNCTION DECLARATIONS
// ================================================================

bool connectWiFi();
bool connect4G();
bool uploadViaWiFi(float temperature, float humidity, int soilPercent, String timestamp);
bool uploadVia4G(float temperature, float humidity, int soilPercent, String timestamp);
void uploadSensorData();
String getTimestamp();
void initializeFirebase();
void printConnectionMode();

// ================================================================
// SETUP
// ================================================================

void setup()
{
    Serial.begin(115200);

    delay(1000);

    Serial.println();
    Serial.println("==============================================");
    Serial.println("      SMART PADDY IoT SENSOR SYSTEM");
    Serial.println("==============================================");
    Serial.println();

    // ------------------------------------------------------------
    // SENSOR INITIALIZATION
    // ------------------------------------------------------------

    Serial.println("[1] Initializing sensors...");
    dht.begin();
    pinMode(SOIL_PIN, INPUT);
    Serial.println("DHT22       : READY");
    Serial.println("Soil Sensor : READY");
    Serial.println();

    // ------------------------------------------------------------
    // TRY WIFI
    // ------------------------------------------------------------

    Serial.println("[2] Checking Wi-Fi...");

    // --------------------------------------------------------
    // START A7670C SERIAL (Always initialized)
    // --------------------------------------------------------

    SerialAT.begin(
        MODEM_BAUDRATE,
        SERIAL_8N1,
        MODEM_RX,
        MODEM_TX
    );

    delay(3000);

    if (connectWiFi())
    {
        currentConnection = CONNECTION_WIFI;

        Serial.println();
        Serial.println("****************************************");
        Serial.println(" CONNECTION MODE: WIFI");
        Serial.println("****************************************");
    }
    else
    {
        Serial.println();
        Serial.println("Wi-Fi unavailable.");
        Serial.println("Switching to A7670C 4G LTE...");
        Serial.println();

        if (connect4G())
        {
            currentConnection = CONNECTION_4G;

            Serial.println();
            Serial.println("****************************************");
            Serial.println(" CONNECTION MODE: 4G LTE SIM");
            Serial.println("****************************************");
        }
        else
        {
            currentConnection = CONNECTION_NONE;

            Serial.println();
            Serial.println("****************************************");
            Serial.println(" NO INTERNET CONNECTION");
            Serial.println("****************************************");
        }
    }

    // ------------------------------------------------------------
    // TIME INITIALIZATION
    // ------------------------------------------------------------

    Serial.println();
    Serial.println("[3] Synchronizing time...");

    configTime(
        gmtOffset_sec,
        daylightOffset_sec,
        ntpServer
    );

    struct tm timeinfo;

    if (getLocalTime(&timeinfo, 10000))
    {
        Serial.println("NTP Time : READY");
        Serial.println(getTimestamp());
    }
    else
    {
        Serial.println("NTP Time : FAILED");
    }

    // ------------------------------------------------------------
    // FIREBASE INITIALIZATION
    // ------------------------------------------------------------

    Serial.println();
    Serial.println("[4] Initializing Firebase...");

    initializeFirebase();

    // ------------------------------------------------------------
    // SYSTEM INFORMATION
    // ------------------------------------------------------------

    Serial.println();
    Serial.println("==============================================");
    Serial.print("Upload Interval : ");
    Serial.print(SEND_INTERVAL_MINUTES);
    Serial.println(" minutes");
    Serial.println("Sensors         : DHT22 + Soil Moisture");
    Serial.println("==============================================");
    Serial.println();
}

// ================================================================
// MAIN LOOP
// ================================================================

void loop()
{
    // Note: Connection state switching is handled efficiently
    // inside the uploadSensorData() function when the interval is reached.

    // ------------------------------------------------------------
    // DATA UPLOAD TIMER
    // ------------------------------------------------------------

    if (
        millis() - previousMillis >= sendInterval ||
        previousMillis == 0
    )
    {
        previousMillis = millis();
        uploadSensorData();
    }

    // ------------------------------------------------------------
    // SMALL DELAY
    // ------------------------------------------------------------
    delay(100);
}

// ================================================================
// CONNECT WIFI
// ================================================================

bool connectWiFi()
{
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    Serial.print("Connecting Wi-Fi");
    unsigned long startTime = millis();

    while (
        WiFi.status() != WL_CONNECTED &&
        millis() - startTime < 15000
    )
    {
        Serial.print(".");
        delay(500);
    }

    Serial.println();

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("Wi-Fi Connected");
        Serial.print("ESP32 IP : ");
        Serial.println(WiFi.localIP());

        return true;
    }

    Serial.println("Wi-Fi connection failed.");
    WiFi.disconnect(true);

    return false;
}

// ================================================================
// CONNECT A7670C 4G LTE
// ================================================================

bool connect4G()
{
    Serial.println();
    Serial.println("----------------------------------------------");
    Serial.println("A7670C 4G LTE INITIALIZATION");
    Serial.println("----------------------------------------------");

    // ------------------------------------------------------------
    // Check modem
    // ------------------------------------------------------------

    Serial.println("Checking modem...");

    if (!modem.testAT())
    {
        Serial.println("A7670C did not respond.");
        return false;
    }

    Serial.println("A7670C : OK");

    // ------------------------------------------------------------
    // SIM CHECK
    // ------------------------------------------------------------

    Serial.println("Checking SIM...");

    if (!modem.isSimReady())
    {
        Serial.println("SIM card is NOT ready.");
        return false;
    }

    Serial.println("SIM : READY");

    // ------------------------------------------------------------
    // NETWORK REGISTRATION
    // ------------------------------------------------------------

    Serial.println("Waiting for cellular network...");

    if (
        !modem.waitForNetwork(60000L)
    )
    {
        Serial.println("Cellular network registration FAILED.");
        return false;
    }

    Serial.println("Cellular network : REGISTERED");

    // ------------------------------------------------------------
    // SIGNAL QUALITY
    // ------------------------------------------------------------

    int signal = modem.getSignalQuality();

    Serial.print("Signal Quality : ");
    Serial.println(signal);

    // ------------------------------------------------------------
    // CONNECT INTERNET
    // ------------------------------------------------------------

    Serial.println("Connecting to APN...");

    if (
        !modem.gprsConnect(
            APN,
            GPRS_USER,
            GPRS_PASS
        )
    )
    {
        Serial.println("APN connection FAILED.");
        return false;
    }

    Serial.println("4G Internet : CONNECTED");

    // ------------------------------------------------------------
    // LOCAL IP
    // ------------------------------------------------------------

    String localIP = modem.getLocalIP();
    Serial.print("4G IP : ");
    Serial.println(localIP);
    return true;
}

// ================================================================
// INITIALIZE FIREBASE
// ================================================================

void initializeFirebase()
{
    config.api_key = API_KEY;
    config.database_url = DATABASE_URL;


    // ------------------------------------------------------------
    // Anonymous Firebase authentication
    // ------------------------------------------------------------

    if (
        Firebase.signUp(
            &config,
            &auth,
            "",
            ""
        )
    )
    {
        Serial.println("Firebase Authentication : SUCCESS");
    }
    else
    {
        Serial.println("Firebase Authentication : FAILED");
        Serial.println(
            config.signer.signupError.message.c_str()
        );
    }

    Firebase.begin(
        &config,
        &auth
    );

    Firebase.reconnectWiFi(true);
    Serial.println("Firebase : READY");
}

// ================================================================
// SENSOR DATA UPLOAD
// ================================================================

void uploadSensorData()
{
    Serial.println();
    Serial.println("==============================================");
    Serial.println("              SENSOR READING");
    Serial.println("==============================================");


    // ------------------------------------------------------------
    // READ DHT22
    // ------------------------------------------------------------

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    if (
        isnan(temperature) ||
        isnan(humidity)
    )
    {
        Serial.println("DHT22 Reading Failed.");
        return;
    }

    // ------------------------------------------------------------
    // READ SOIL SENSOR
    // ------------------------------------------------------------

    int soilRaw = analogRead(SOIL_PIN);

    int soilPercent =
        map(
            soilRaw,
            4095,
            1500,
            0,
            100
        );

    soilPercent =
        constrain(
            soilPercent,
            0,
            100
        );

    // ------------------------------------------------------------
    // GET TIMESTAMP
    // ------------------------------------------------------------

    String timestamp = getTimestamp();

    // ------------------------------------------------------------
    // DISPLAY SENSOR VALUES
    // ------------------------------------------------------------

    Serial.print("Temperature   : ");
    Serial.print(temperature);
    Serial.println(" °C");
    Serial.print("Humidity      : ");
    Serial.print(humidity);
    Serial.println(" %");
    Serial.print("Soil Moisture : ");
    Serial.print(soilPercent);
    Serial.print(" %");
    Serial.print("  Raw: ");
    Serial.println(soilRaw);
    Serial.print("Timestamp     : ");
    Serial.println(timestamp);

    // ------------------------------------------------------------
    // SELECT CONNECTION
    // ------------------------------------------------------------

    bool uploadSuccess = false;

    // ============================================================
    // PRIORITY 1: WIFI
    // ============================================================

    if (WiFi.status() == WL_CONNECTED)
    {
        currentConnection = CONNECTION_WIFI;

        Serial.println();
        Serial.println("==============================================");
        Serial.println(">>> UPLOADING VIA WIFI");
        Serial.println("==============================================");

        uploadSuccess = uploadViaWiFi(temperature, humidity, soilPercent, timestamp);


        // --------------------------------------------------------
        // If Wi-Fi upload failed, try 4G
        // --------------------------------------------------------

        if (!uploadSuccess)
        {
            Serial.println();
            Serial.println("Wi-Fi Firebase upload failed.");
            Serial.println("Trying 4G LTE fallback...");

            if (connect4G())
            {
                currentConnection = CONNECTION_4G;
                Serial.println();
                Serial.println(">>> UPLOADING VIA 4G SIM");
                uploadSuccess = uploadVia4G(temperature, humidity, soilPercent, timestamp);
            }
        }
    }

    // ============================================================
    // PRIORITY 2: 4G LTE
    // ============================================================

    else
    {
        currentConnection = CONNECTION_4G;
        Serial.println();
        Serial.println("==============================================");
        Serial.println(">>> UPLOADING VIA 4G SIM");
        Serial.println("==============================================");

        if (!modem.isGprsConnected())
        {
            if (!connect4G())
            {
                Serial.println("4G connection unavailable.");
                return;
            }
        }
        uploadSuccess = uploadVia4G(temperature, humidity, soilPercent, timestamp);
    }

    // ------------------------------------------------------------
    // RESULT
    // ------------------------------------------------------------

    Serial.println();

    if (uploadSuccess)
    {
        Serial.println("****************************************");
        Serial.println(" FIREBASE UPLOAD SUCCESSFUL");
        Serial.println("****************************************");
    }
    else
    {
        Serial.println("****************************************");
        Serial.println(" FIREBASE UPLOAD FAILED");
        Serial.println("****************************************");
    }
    Serial.println("==============================================");
}


// ================================================================
// FIREBASE UPLOAD THROUGH WIFI
// ================================================================

bool uploadViaWiFi(float temperature, float humidity, int soilPercent, String timestamp)
{
    if (!Firebase.ready())
    {
        Serial.println("Firebase is not ready.");
        return false;
    }

    String path = "/sensor/";
    bool success = true;

    success &= Firebase.RTDB.setFloat(
        &fbdo,
        path + "temperature",
        temperature
    );

    success &= Firebase.RTDB.setFloat(
        &fbdo,
        path + "humidity",
        humidity
    );

    success &= Firebase.RTDB.setInt(
        &fbdo,
        path + "soilMoisture",
        soilPercent
    );

    success &= Firebase.RTDB.setString(
        &fbdo,
        path + "timestamp",
        timestamp
    );

    if (!success)
    {
        Serial.print("Firebase Error: ");
        Serial.println(
            fbdo.errorReason()
        );
    }
    return success;
}

// ================================================================
// FIREBASE UPLOAD THROUGH 4G
//
// NOTE:
// This function is the cellular REST path.
//
// Firebase RTDB REST endpoint:
//
// https://DATABASE_URL/sensor.json
//
// Authentication is handled using the Firebase ID token.
//
// ================================================================

bool uploadVia4G(float temperature, float humidity, int soilPercent, String timestamp)
{
    if (!modem.isGprsConnected())
    {
        Serial.println("4G Internet is not connected.");
        return false;
    }

    Serial.println("Preparing Firebase REST request...");

    /*
     * ------------------------------------------------------------
     * IMPORTANT
     * ------------------------------------------------------------
     *
     * The A7670C is being used as a cellular Internet modem.
     *
     * TinyGSM provides the Internet connection.
     *
     * Firebase REST API receives JSON data.
     *
     * ------------------------------------------------------------
     */

    TinyGsmClientSecure client(modem);
    client.setTimeout(30000);

    HttpClient http(
        client,
        "research-4y2s-default-rtdb.firebaseio.com",
        443
    );

    // ------------------------------------------------------------
    // CREATE JSON
    // ------------------------------------------------------------

    String json = "{";
    json += "\"temperature\":";
    json += String(temperature, 2);
    json += ",\"humidity\":";
    json += String(humidity, 2);
    json += ",\"soilMoisture\":";
    json += String(soilPercent);
    json += ",\"timestamp\":\"";
    json += timestamp;
    json += "\"";
    json += "}";

    Serial.println();
    Serial.println("Firebase JSON:");
    Serial.println(json);

    // ------------------------------------------------------------
    // FIREBASE REST PATH
    // ------------------------------------------------------------

    String path = "/sensor.json";

    // ------------------------------------------------------------
    // START REQUEST
    // ------------------------------------------------------------

    http.beginRequest();
    http.put(path);

    http.sendHeader(
        "Content-Type",
        "application/json"
    );

    http.sendHeader(
        "Content-Length",
        json.length()
    );

    http.beginBody();
    http.print(json);
    http.endRequest();

    // ------------------------------------------------------------
    // RESPONSE
    // ------------------------------------------------------------
    int statusCode =
        http.responseStatusCode();

    String response =
        http.responseBody();

    Serial.print("HTTP Status : ");
    Serial.println(statusCode);

    Serial.print("Response    : ");
    Serial.println(response);

    http.stop();

    // ------------------------------------------------------------
    // SUCCESS
    // ------------------------------------------------------------

    if (
        statusCode >= 200 &&
        statusCode < 300
    )
    {
        Serial.println("4G Firebase REST upload successful.");
        return true;
    }
    Serial.println(
        "4G Firebase REST upload failed."
    );
    return false;
}

// ================================================================
// GET REAL DATE AND TIME
// ================================================================

String getTimestamp()
{
    struct tm timeinfo;
    if (
        !getLocalTime(
            &timeinfo,
            3000
        )
    )
    {
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

