// mqtt/mqttconnect.ts

import * as mqtt from "mqtt";
import { MqttClient } from "mqtt";
import RfId from "../api/v1/models/rf_id.model.";
import Device from "../api/v1/models/device.model";
import DeviceUser from "../api/v1/models/device_user.model";
import AccessLog from "../api/v1/models/access_log.model";
import { getRfidState, clearRegisterMode } from "./rfidState";
import { io } from "../socket.io/socket";

const MQTT_URL = "mqtt://192.168.24.126:1883";
const CARD_TOPIC = "iot/rfid/card";
const DOOR_TOPIC = "iot/door/status";

const client: MqttClient = mqtt.connect(MQTT_URL);

client.on("connect", () => {
  console.log(`[MQTT] Connected to broker: ${MQTT_URL}`);

  client.subscribe([CARD_TOPIC, DOOR_TOPIC], (err) => {
    if (err) {
      console.error("[MQTT] Subscribe error:", err);
    } else {
      console.log(`[MQTT] Subscribed to topics: ${CARD_TOPIC}, ${DOOR_TOPIC}`);
    }
  });
});

client.on("message", async (topic: string, message: Buffer) => {
  const payload = message.toString();
  console.log(`\n[MQTT] Received from topic "${topic}": ${payload}`);

  // 1) Xử lý trạng thái cửa từ ESP32
  if (topic === DOOR_TOPIC) {
    try {
      const data = JSON.parse(payload);
      const chipId: string | undefined = data.chip_id;
      const door: string | undefined = data.door; // "OPEN" | "CLOSED"
      console.log("[MQTT] Door status update:", chipId, door);

      // Cập nhật trạng thái device trong DB nếu tìm được theo chip_id
      if (chipId && door) {
        const device = await Device.findOne({ chip_id: chipId });
        if (device) {
          const newStatus: "OPEN" | "CLOSE" =
            door.toUpperCase() === "OPEN" ? "OPEN" : "CLOSE";
          if (device.status !== newStatus) {
            device.status = newStatus;
            await device.save();
          }

          // Emit realtime cho FE kèm device_id
          io.emit("client-door-status", {
            chip_id: chipId,
            device_id: device._id.toString(),
            door,
          });
        } else {
          // Nếu chưa map được device, vẫn emit theo chip_id để FE có thể xử lý
          io.emit("client-door-status", { chip_id: chipId, door });
        }
      } else {
        io.emit("client-door-status", { chip_id: chipId, door });
      }
    } catch (e: any) {
      console.error("[MQTT] Door JSON parse error:", e.message);
    }
    return;
  }

  // 2) Xử lý thẻ RFID
  if (topic !== CARD_TOPIC) {
    // unknown topic
    return;
  }

  try {
    const data = JSON.parse(payload);
    const uid: string = data.uid;
    const chipId: string | undefined = data.chip_id;
    console.log("[MQTT] UID =", uid, "chip_id =", chipId);

    // Nếu có chip_id, đảm bảo Device tương ứng tồn tại và lưu chip_id vào model
    // Ưu tiên: nếu có device đã có chip_id => dùng; nếu chưa có, bind chip_id vào 1 device chưa gán chip_id; cuối cùng mới tạo mới
    let deviceFromChip: InstanceType<typeof Device> | null = null;
    if (chipId) {
      // 1. Tìm theo chip_id
      const existedByChip = await Device.findOne({ chip_id: chipId });
      if (existedByChip) {
        deviceFromChip = existedByChip as InstanceType<typeof Device>;
      } else {
        // 2. Nếu chưa có, thử gán chip_id vào 1 device chưa cấu hình chip_id (ví dụ device do admin tạo trước)
        const deviceWithoutChip = await Device.findOne({ chip_id: { $exists: false } });
        if (deviceWithoutChip) {
          deviceWithoutChip.chip_id = chipId;
          await deviceWithoutChip.save();
          deviceFromChip = deviceWithoutChip as InstanceType<typeof Device>;
          console.log("[MQTT] Gán chip_id", chipId, "cho device có sẵn", deviceFromChip._id.toString());
        } else {
          // 3. Không có device nào phù hợp -> tạo mới
          const created = await Device.create({ name: `Device ${chipId.slice(-4)}`, chip_id: chipId });
          console.log("[MQTT] Tạo mới Device cho chip_id", chipId, "=>", created._id.toString());
          deviceFromChip = created as InstanceType<typeof Device>;
        }
      }
    }

    const { mode, currentDeviceId, pendingName } = getRfidState();
    const currentDeviceIdStr = currentDeviceId ? currentDeviceId.toHexString() : null;

    // Emit realtime cho FE mỗi lần có thẻ quét
    io.emit("client-rfid-scan", {
      uid,
      mode,
      device_id: currentDeviceIdStr,
    });

    if (mode === "REGISTER" && currentDeviceId) {
      // Đang ở chế độ đăng ký: lưu thẻ mới cho 1 thiết bị
      let card = await RfId.findOne({ rf_id: uid });
      if (!card) {
        card = await RfId.create({ rf_id: uid, name: pendingName || undefined });
      } else if (pendingName && card.name !== pendingName) {
        card.name = pendingName;
        await card.save();
      }

      const existedMapping = await DeviceUser.findOne({ device_id: currentDeviceId, rf_id: card._id });
      if (existedMapping) {
        console.log("[MQTT] Thẻ đã tồn tại cho thiết bị này, bỏ qua tạo mới mapping");
        // Gui len client thông báo thẻ đã tồn tại
        io.emit("client-rfid-registered", {
          uid,
          device_id: currentDeviceIdStr,
          status: "EXISTED",
          name: card.name,
        });
      } else {
        await DeviceUser.create({ device_id: currentDeviceId, rf_id: card._id });
        console.log("[MQTT] Đăng ký thẻ mới thành công cho device", currentDeviceId.toHexString());
        // Gui len client thông báo thẻ đã đăng ký thành công
        io.emit("client-rfid-registered", {
          uid,
          device_id: currentDeviceIdStr,
          status: "CREATED",
          name: card.name,
        });
      }

      // Đăng ký xong thì quay về NORMAL (1 lần quét / 1 lần thêm)
      clearRegisterMode();
    } else {
      // Chế độ bình thường: kiểm tra thẻ để mở khóa cho đúng thiết bị (dựa trên chip_id)
      const card = await RfId.findOne({ rf_id: uid });
      if (card && deviceFromChip) {
        const mapping = await DeviceUser.findOne({ device_id: deviceFromChip._id, rf_id: card._id });
        if (mapping) {
          console.log("[MQTT] Thẻ hợp lệ, cho phép mở khóa cho device", deviceFromChip._id.toString());
          const log = await AccessLog.create({
            device_id: deviceFromChip._id,
            rf_id: uid,
            method: "RFID",
            result: "SUCCESS",
          });

          // Gửi lệnh mở cửa cho ESP32 qua MQTT
          client.publish("iot/rfid/command", "OPEN");

          const logPayload = {
            _id: log._id,
            device_id: deviceFromChip._id.toString(),
            device_name: deviceFromChip.name,
            rf_id: uid,
            method: "RFID",
            result: "SUCCESS",
            createdAt: log.createdAt,
          };

          io.emit("client-access-log", logPayload);

          io.emit("client-rfid-access", {
            uid,
            device_id: deviceFromChip._id.toString(),
            status: "ALLOWED",
          });
        } else {
          console.log("[MQTT] Thẻ không được gán cho device này, từ chối mở khóa");
          const log = await AccessLog.create({
            device_id: deviceFromChip._id,
            rf_id: uid,
            method: "RFID",
            result: "FALSE",
          });

          const logPayload = {
            _id: log._id,
            device_id: deviceFromChip._id.toString(),
            device_name: deviceFromChip.name,
            rf_id: uid,
            method: "RFID",
            result: "FALSE",
            createdAt: log.createdAt,
          };

          io.emit("client-access-log", logPayload);

          io.emit("client-rfid-access", {
            uid,
            device_id: deviceFromChip._id.toString(),
            status: "DENIED",
          });
        }
      } else {
        console.log("[MQTT] Không tìm thấy thẻ hoặc thiết bị, từ chối mở khóa");
        if (deviceFromChip) {
          const log = await AccessLog.create({
            device_id: deviceFromChip._id,
            rf_id: uid,
            method: "RFID",
            result: "FALSE",
          });

          const logPayload = {
            _id: log._id,
            device_id: deviceFromChip._id.toString(),
            device_name: deviceFromChip.name,
            rf_id: uid,
            method: "RFID",
            result: "FALSE",
            createdAt: log.createdAt,
          };

          io.emit("client-access-log", logPayload);
        }
        io.emit("client-rfid-access", {
          uid,
          device_id: deviceFromChip ? deviceFromChip._id.toString() : null,
          status: "DENIED",
        });
      }
    }
  } catch (e: any) {
    console.error("[MQTT] JSON parse error:", e.message);
  }
});

export default client;
