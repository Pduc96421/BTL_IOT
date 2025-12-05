// Pin điều khiển relay
const int RELAY_PIN = 26;

// Thời gian mở khóa (ms)
const unsigned long UNLOCK_TIME = 3000; // 3 giây

void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);

  // Đặt relay ở trạng thái TẮT (khóa đóng)
  // Nếu relay của bạn là: IN = LOW -> bật, IN = HIGH -> tắt
  // thì HIGH ở đây là "khóa", LOW là "mở".
  digitalWrite(RELAY_PIN, HIGH);

  Serial.println("ESP32 Lock Controller Ready.");
  Serial.println("Gõ 'o' rồi Enter trong Serial Monitor để mở khóa 3 giây.");
}

void loop() {
  // Nếu nhận được dữ liệu từ Serial
  if (Serial.available()) {
    char c = Serial.read();

    if (c == 'o' || c == 'O') {
      unlockDoor();
    }
  }

  // Ở đây bạn có thể thêm các logic khác:
  // - nhận lệnh từ WiFi / MQTT
  // - nhận lệnh từ Node.js qua UART
  // - đọc nút nhấn...
}

void unlockDoor() {
  Serial.println("Dang mo khoa...");

  // BẬT relay -> cấp điện cho chốt khóa
  // ACTIVE LOW: ghi LOW để bật (nếu module bạn như vậy)
  digitalWrite(RELAY_PIN, LOW);

  delay(UNLOCK_TIME);

  // TẮT relay -> ngắt điện, khóa lại
  digitalWrite(RELAY_PIN, HIGH);

  Serial.println("Da khoa lai.");
}
