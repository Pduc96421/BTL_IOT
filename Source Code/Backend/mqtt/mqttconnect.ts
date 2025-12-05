// mqtt/mqttconnect.ts

import * as mqtt from "mqtt";
import { MqttClient } from "mqtt";
import RfId from "../api/v1/models/rf_id.model.";
import { getRfidState, clearRegisterMode } from "./rfidState";
import { io } from "../socket.io/socket";

const MQTT_URL = "mqtt://192.168.24.126:1883";
const TOPIC = "iot/rfid/card";

const client: MqttClient = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log(`[MQTT] Connected to broker: ${MQTT_URL}`);

  client.subscribe(TOPIC, (err) => {
    if (err) {
      console.error("[MQTT] Subscribe error:", err);
    } else {
      console.log(`[MQTT] Subscribed to topic: ${TOPIC}`);
    }
  });
});

client.on("message", async (topic: string, message: Buffer) => {
  const payload = message.toString();
  console.log(`\n[MQTT] Received from topic "${topic}": ${payload}`);

  try {
    const data = JSON.parse(payload);
    const uid: string = data.uid;
    console.log("[MQTT] UID =", uid);

    const { mode, currentLockUserId } = getRfidState();
    const currentLockUserIdStr = currentLockUserId ? currentLockUserId.toHexString() : null;

    // Emit realtime cho FE mỗi lần có thẻ quét
    io.emit("client-rfid-scan", {
      uid,
      mode,
      lock_user_id: currentLockUserIdStr,
    });

    if (mode === "REGISTER" && currentLockUserId) {
      // Đang ở chế độ đăng ký: lưu thẻ mới cho 1 khóa duy nhất
      const existed = await RfId.findOne({ rf_id: uid });
      if (existed) {
        console.log("[MQTT] Thẻ đã tồn tại, bỏ qua tạo mới");
        // Gui len client thông báo thẻ đã tồn tại
        io.emit("client-rfid-registered", {
          uid,
          lock_user_id: currentLockUserIdStr,
          status: "EXISTED",
        });
      } else {
        await RfId.create({ rf_id: uid, lock_user_id: currentLockUserId });
        console.log("[MQTT] Đăng ký thẻ mới thành công cho lock_user", currentLockUserId.toHexString());
        // Gui len client thông báo thẻ đã đăng ký thành công1
        io.emit("client-rfid-registered", {
          uid,
          lock_user_id: currentLockUserIdStr,
          status: "CREATED",
        });
      }

      // Đăng ký xong thì quay về NORMAL (1 lần quét / 1 lần thêm)
      clearRegisterMode();
    } else {
      // Chế độ bình thường: kiểm tra thẻ để mở khóa
      const card = await RfId.findOne({ rf_id: uid });
      if (card) {
        console.log("[MQTT] Thẻ hợp lệ, cho phép mở khóa cho lock_user", card.lock_user_id.toString());
        io.emit("client-rfid-access", {
          uid,
          lock_user_id: card.lock_user_id.toString(),
          status: "ALLOWED",
        });
        // TODO: nếu cần, emit sang ESP qua socket để mở cửa
      } else {
        console.log("[MQTT] Thẻ không hợp lệ, từ chối mở khóa");
        io.emit("client-rfid-access", {
          uid,
          lock_user_id: null,
          status: "DENIED",
        });
      }
    }
  } catch (e: any) {
    console.error("[MQTT] JSON parse error:", e.message);
  }
});

export default client;
