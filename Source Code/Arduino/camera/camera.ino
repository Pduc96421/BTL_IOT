#include "esp_camera.h"
#include <WiFi.h>
#include <WebSocketsClient.h>
#include <PubSubClient.h>

// ================== WIFI ==================
const char* ssid = "Duc";
const char* password = "vuthikhanhlinh";

// ================== MQTT ==================
const char* mqtt_server = "192.168.24.103";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

const char* CAM_ONLINE_TOPIC = "iot/cam/online";

// ================== WEBSOCKET (NODE) ==================
const char* server_ip = "192.168.24.103";  // IP máy chạy Node
const int server_port = 8081;              // port WebSocket bên Node

WebSocketsClient webSocket;

// ================== CAMERA PIN MAP ==================
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5

#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// ================== GLOBALS ==================
String chipCamId;
unsigned long lastFrameMs = 0;
const unsigned long FRAME_INTERVAL_MS = 200;  // 200ms ~ 5fps

unsigned long lastMqttReconnectAttempt = 0;

// ================== UTIL: GET CHIP ID ==================
String getChipId() {
  uint64_t chipid = ESP.getEfuseMac();
  char buf[17];
  sprintf(buf, "%04X%08X", (uint32_t)(chipid >> 32), (uint32_t)chipid);
  return String(buf);
}

// ================== CAMERA INIT ==================
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  config.frame_size = FRAMESIZE_QVGA;  // 320x240
  config.jpeg_quality = 15;            // 0-63, càng thấp càng nét
  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }
  return true;
}

// ================== WIFI INIT ==================
void initWiFi() {
  Serial.printf("Connecting to WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ================== MQTT RECONNECT (non-blocking) ==================
bool reconnectMQTT() {
  Serial.print("[MQTT] Attempting connection...");
  // "esp32_cam_client" là clientId
  if (mqttClient.connect("esp32_cam_client")) {
    Serial.println("connected.");

    // Gửi mỗi chip_cam_id khi connect
    String payload = String("{\"chip_cam_id\":\"") + chipCamId + "\"}";
    mqttClient.publish(CAM_ONLINE_TOPIC, payload.c_str());
    Serial.println("📤 MQTT cam online: " + payload);

    return true;
  } else {
    Serial.print("failed, rc=");
    Serial.println(mqttClient.state());
    return false;
  }
}

// ================== WEBSOCKET CALLBACK ==================
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      {
        Serial.println("[WS] Connected to Node server");

        // Gửi 1 message text báo chip_cam_id cho Node
        String msg = String("{\"type\":\"cam_hello\",\"chip_cam_id\":\"") + chipCamId + "\"}";
        webSocket.sendTXT(msg);

        Serial.print("[WS] Sent cam_hello: ");
        Serial.println(msg);
        break;
      }
    case WStype_DISCONNECTED:
      Serial.println("[WS] Disconnected from Node server");
      break;
    case WStype_TEXT:
      Serial.printf("[WS] Text: %s\n", payload);
      break;
    case WStype_ERROR:
      Serial.println("[WS] Error");
      break;
    default:
      break;
  }
}

// ================== SETUP ==================
void setup() {
  Serial.begin(115200);
  delay(1000);

  chipCamId = getChipId();
  Serial.print("ESP32-CAM CHIP ID: ");
  Serial.println(chipCamId);

  // 1. Init camera
  if (!initCamera()) {
    Serial.println("Camera init failed, halt.");
    while (true) {
      delay(1000);
    }
  }

  // 2. WiFi
  initWiFi();

  // 3. MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  // Thử connect lần đầu
  reconnectMQTT();

  // 4. WebSocket tới Node
  webSocket.begin(server_ip, server_port, "/");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(2000);  // auto reconnect mỗi 2s nếu mất
}

// ================== LOOP ==================
void loop() {
  // ---- MQTT ----
  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastMqttReconnectAttempt > 2000) {  // 2s thử lại 1 lần
      lastMqttReconnectAttempt = now;
      reconnectMQTT();
    }
  } else {
    mqttClient.loop();
  }

  // ---- WebSocket ----
  webSocket.loop();

  // ---- Gửi frame camera qua WebSocket ----
  unsigned long now = millis();
  if (webSocket.isConnected() && (now - lastFrameMs >= FRAME_INTERVAL_MS)) {
    lastFrameMs = now;

    camera_fb_t* fb = esp_camera_fb_get();
    if (fb) {
      // Gửi nhị phân lên Node
      webSocket.sendBIN(fb->buf, fb->len);
      esp_camera_fb_return(fb);
      // Serial.printf("[WS] Sent frame, size=%d bytes\n", fb->len);
    } else {
      Serial.println("Camera capture failed");
    }
  }
}
