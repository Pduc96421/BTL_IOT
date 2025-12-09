#include <SPI.h>
#include <MFRC522.h>
#define SS_PIN 16
#define RST_PIN 17
MFRC522 rfid(SS_PIN, RST_PIN);
String uidString;
String chipId;

#include "WiFi.h"
#include <PubSubClient.h>  // ⭐ MQTT

// WIFI
const char* ssid = "Duc";
const char* password = "vuthikhanhlinh";

// MQTT ⭐
// const char* mqtt_server = "192.168.24.103";
const char* mqtt_server = "172.20.10.8";
const int mqtt_port = 1883;
WiFiClient espClient;
PubSubClient client(espClient);

const int btnIO = 15;
bool btnIOState = HIGH;
unsigned long timeDelay = millis();
unsigned long timeDelay2 = millis();
bool InOutState = 0;
const int ledIO = 2;   // LED on-board (nếu cần)
const int buzzer = 5;  // D5 -> GPIO5 -> buzzer

// Relay điều khiển khóa và cảm biến từ cửa
// Theo wiring bạn mô tả:
// - Rơ-le: VIN, GND, D26 -> GPIO26
// - Cảm biến từ: 3V, GND, D4 -> GPIO4 (reed switch kiểu NO + pullup)
const int relayPin = 26;      // D26
const int doorSensorPin = 4;  // D4, dùng INPUT_PULLUP
bool doorClosed = false;      // true = cửa/khóa đang đóng
bool lastDoorClosed = false;
unsigned long lastDoorCheck = 0;
unsigned long relayOpenedAt = 0;                 // millis khi rơ-le được bật
const unsigned long RELAY_OPEN_DURATION = 5000;  // 5s

// ---------------- MQTT CALLBACK --------------------
void mqttCallback(char* topic, byte* message, unsigned int length) {
  Serial.print("MQTT message from topic: ");
  Serial.println(topic);

  String msg;
  for (int i = 0; i < length; i++) msg += (char)message[i];
  msg.trim();

  Serial.print("Message: ");
  Serial.println(msg);

  // Lệnh đơn giản từ server: OPEN / CLOSE / TOGGLE
  if (msg.equalsIgnoreCase("OPEN")) {
    digitalWrite(relayPin, HIGH);  // tùy loại rơ-le, có thể phải đảo lại
    Serial.println("MQTT CMD: OPEN lock");
    beep(1, 150);              // kêu khi mở
    relayOpenedAt = millis();  // bắt đầu tính thời gian auto-close
  } else if (msg.equalsIgnoreCase("CLOSE")) {
    digitalWrite(relayPin, LOW);
    Serial.println("MQTT CMD: CLOSE lock");
  } else if (msg.equalsIgnoreCase("TOGGLE")) {
    digitalWrite(relayPin, !digitalRead(relayPin));
    Serial.println("MQTT CMD: TOGGLE lock");
  }
}

// ---------------- MQTT RECONNECT -------------------
void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");
    if (client.connect("esp32_rfid_client")) {
      Serial.println("connected!");
      client.subscribe("iot/rfid/command");  // optional
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

// ---------------- SEND UID OVER MQTT ----------------
void publishMQTT(String uid) {
  // Gửi cả UID của thẻ và chip_id của thiết bị
  String payload = "{\"uid\":\"" + uid + "\",\"chip_id\":\"" + chipId + "\"}";
  client.publish("iot/rfid/card", payload.c_str());
  Serial.println("📤 MQTT Published: " + payload);
}

// ---------------- BEEP -------------------
void beep(int n, int d) {
  for (int i = 0; i < n; i++) {
    digitalWrite(buzzer, HIGH);
    delay(d);
    digitalWrite(buzzer, LOW);
    delay(d);
  }
}

// ---------------- SETUP -------------------
void setup() {
  Serial.begin(115200);

  pinMode(buzzer, OUTPUT);
  digitalWrite(buzzer, LOW);
  pinMode(btnIO, INPUT_PULLUP);
  pinMode(ledIO, OUTPUT);

  // Relay & cảm biến cửa
  pinMode(relayPin, OUTPUT);
  digitalWrite(relayPin, LOW);  // mặc định khóa đóng (tùy wiring của bạn)
  pinMode(doorSensorPin, INPUT_PULLUP);
  doorClosed = (digitalRead(doorSensorPin) == LOW);  // LOW = có từ, giả sử là đóng
  lastDoorClosed = doorClosed;

  Serial.println("Connecting WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi connected!");
  Serial.println(WiFi.localIP());

  // Lấy chip ID duy nhất của ESP32 (dùng để nhận diện thiết bị)
  uint64_t rawId = ESP.getEfuseMac();
  chipId = String((uint32_t)(rawId >> 32), HEX) + String((uint32_t)rawId, HEX);
  chipId.toUpperCase();
  Serial.println("ESP32 CHIP ID: " + chipId);

  // ⭐ MQTT setup
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);

  SPI.begin();
  rfid.PCD_Init();
}

// ---------------- LOOP -------------------
void loop() {
  if (!client.connected()) reconnectMQTT();
  client.loop();  // ⭐ MQTT background

  // Theo dõi trạng thái cửa từ cảm biến từ, nếu đổi trạng thái thì in log (và có thể gửi MQTT)
  if (millis() - lastDoorCheck > 200) {
    lastDoorCheck = millis();
    doorClosed = (digitalRead(doorSensorPin) == LOW);
    if (doorClosed != lastDoorClosed) {
      lastDoorClosed = doorClosed;
      Serial.println(doorClosed ? "Door CLOSED" : "Door OPEN");
      // Gửi trạng thái cửa về server nếu muốn
      String payload = "{\"chip_id\":\"" + chipId + "\",\"door\":\"" + String(doorClosed ? "CLOSED" : "OPEN") + "\"}";
      client.publish("iot/door/status", payload.c_str());
      Serial.println("📤 Door status: " + payload);
    }
  }

  // Auto-close: sau 5s kể từ khi mở thì tự đóng rơ-le
  if (relayOpenedAt > 0 && millis() - relayOpenedAt >= RELAY_OPEN_DURATION) {
    digitalWrite(relayPin, LOW);
    Serial.println("Auto CLOSE lock after 5s");
    relayOpenedAt = 0;
  }

  if (millis() - timeDelay2 > 500) {
    readUID();
    timeDelay2 = millis();
  }

  if (digitalRead(btnIO) == LOW) {
    if (btnIOState == HIGH) {
      if (millis() - timeDelay > 500) {
        InOutState = !InOutState;
        digitalWrite(ledIO, InOutState);
        timeDelay = millis();
      }
      btnIOState = LOW;
    }
  } else btnIOState = HIGH;
}

// ---------------- READ UID -------------------
void readUID() {
  MFRC522::MIFARE_Key key;
  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uidString.concat(String(rfid.uid.uidByte[i] < 0x10 ? "0" : ""));
    uidString.concat(String(rfid.uid.uidByte[i], HEX));
  }

  uidString.toUpperCase();
  Serial.println("Card UID: " + uidString);
  beep(1, 200);

  // ⭐ SEND MQTT HERE
  publishMQTT(uidString);
}
