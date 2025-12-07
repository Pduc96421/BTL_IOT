// src/socket.io/socket.ts
import http from "http";
import express from "express";
import { Server } from "socket.io";
import { WebSocketServer, WebSocket, RawData } from "ws";
import mqtt from "mqtt";

import LockUser from "../api/v1/models/lock_user.model";
import Device from "../api/v1/models/device.model"; // 👈 để lưu chip_cam_id
import DeviceUser from "../api/v1/models/device_user.model";
import AccessLog from "../api/v1/models/access_log.model";

const app = express();
const server = http.createServer(app);

// ============ SOCKET.IO CHO REACT + AI ============
const io = new Server(server, { cors: { origin: "*" } });

// ============ MQTT KẾT NỐI TỚI BROKER ============
const MQTT_URL = "mqtt://192.168.24.103:1883";
const mqttClient = mqtt.connect(MQTT_URL);

// topic ESP32-CAM gửi chip_cam_id
const CAM_ONLINE_TOPIC = "iot/cam/online";

mqttClient.on("connect", () => {
  console.log("[MQTT] Connected to broker:", MQTT_URL);

  // Subcribe topic ESP32-CAM báo online + chip_cam_id
  mqttClient.subscribe(CAM_ONLINE_TOPIC, (err) => {
    if (err) {
      console.error("[MQTT] Subscribe cam online error:", err);
    } else {
      console.log("[MQTT] Subscribed to", CAM_ONLINE_TOPIC);
    }
  });
});

mqttClient.on("error", (err) => {
  console.error("[MQTT] Error:", err);
});

// Nhận chip_cam_id từ ESP32-CAM qua MQTT
mqttClient.on("message", async (topic, message) => {
  const payload = message.toString();

  if (topic !== CAM_ONLINE_TOPIC) return;

  try {
    const data = JSON.parse(payload);
    const chip_cam_id: string | undefined = data.chip_cam_id;

    if (!chip_cam_id) {
      console.warn("[MQTT] cam_online missing chip_cam_id");
      return;
    }

    console.log("[MQTT] CAM ONLINE, chip_cam_id =", chip_cam_id);

    // ====== BIND chip_cam_id VÀO DEVICE ======
    // Ưu tiên:
    // 1. Nếu đã có device nào có chip_cam_id này -> dùng luôn
    // 2. Nếu không, tìm 1 device chưa có chip_cam_id để gán
    // 3. Nếu vẫn không có -> tạo mới device

    let device = await Device.findOne({ chip_cam_id });

    if (!device) {
      device = await Device.findOne({ chip_cam_id: { $exists: false } });

      if (device) {
        device.chip_cam_id = chip_cam_id;
        await device.save();
        console.log("[MQTT] Gán chip_cam_id", chip_cam_id, "cho device", device._id.toString());
      }
    } else {
      console.log("[MQTT] Cam đã gắn với device", device._id.toString());
    }

    // Emit realtime cho FE biết con cam nào online + map với device nào
    io.emit("cam_online", {
      chip_cam_id,
      device_id: device._id.toString(),
      device_name: device.name,
    });
  } catch (e: any) {
    console.error("[MQTT] cam_online JSON parse error:", e.message, "raw:", payload);
  }
});

// ==== COSINE SIMILARITY (Node dùng để nhận diện) ====
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return -1;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return -1;
  return dot / denom;
}

let lastRecognizeAt = 0;
const RECOGNIZE_COUNTDOWN = 5000; // 5s

// Namespace cho AI server (Python)
const aiNsp = io.of("/ai");

// Hàm để route gọi bắt đầu ĐĂNG KÝ
export const startRegisterFace = (name: string) => {
  console.log("[NODE] startRegisterFace:", name);
  aiNsp.emit("start_register", { name });
};

aiNsp.on("connection", (socket) => {
  console.log("[AI] connected:", socket.id);

  // Tiến độ đăng ký
  socket.on("register_progress", (data: any) => {
    console.log(`[AI] progress: ${data.current}/${data.total} for ${data.name}`);
    io.emit("register_progress", data); // gửi cho React
  });

  // Kết quả đăng ký: lưu DB & báo React
  socket.on("register_result", async (data: any) => {
    try {
      const { name, embedding } = data;
      console.log("[AI] register_result:", name);

      if (!name || !embedding || !Array.isArray(embedding)) {
        console.log("[AI] invalid register_result payload");
        return;
      }

      const newEmb = embedding as number[];
      const users = await LockUser.find().lean();

      const EXIST_THRESHOLD = 0.8;

      let existName: string | null = null;
      let existScore = -1;

      for (const user of users) {
        const userEmb = (user as any).embedding as number[];
        if (!userEmb || !userEmb.length) continue;

        const score = cosineSimilarity(newEmb, userEmb);
        if (score > existScore) {
          existScore = score;
          existName = user.name;
        }
      }

      // Nếu tìm được người có khuôn mặt giống trên ngưỡng -> KHÔNG lưu nữa
      if (existName && existScore >= EXIST_THRESHOLD) {
        console.log(`[DB] Face already exists as ${existName} (score=${existScore.toFixed(3)}), skip saving`);

        io.emit("register_failed", {
          reason: "face_exists",
          existName,
          score: existScore,
        });
        return;
      }

      // Không trùng -> lưu user mới (hoặc update theo name)
      const user = await LockUser.findOneAndUpdate({ name }, { name, embedding: newEmb }, { upsert: true, new: true });

      console.log("[DB] Saved LockUser:", user?.name);
      io.emit("register_done", { name: user?.name, _id: user?._id });
    } catch (err) {
      console.error("[AI] register_result error:", err);
    }
  });

  // 🔥 Nhận embedding để NHẬN DIỆN TỰ ĐỘNG
  socket.on("recognize_embedding", async (data: any) => {
    try {
      const { embedding, chip_cam_id } = data;

      // COOLDOWN 5s
      const now = Date.now();
      const diff = now - lastRecognizeAt;
      if (diff < RECOGNIZE_COUNTDOWN) {
        return;
      }

      if (!embedding || !Array.isArray(embedding)) {
        io.emit("recognize_result", { name: "NoFace", score: 0 });
        return;
      }

      const emb = embedding as number[];

      const users = await LockUser.find().lean();
      if (!users.length) {
        io.emit("recognize_result", { name: "Unknown", score: 0 });
        return;
      }

      let bestName = "Unknown";
      let bestScore = -1;

      for (const u of users) {
        const userEmb = (u as any).embedding as number[];
        if (!userEmb || !userEmb.length) continue;

        const score = cosineSimilarity(emb, userEmb);
        if (score > bestScore) {
          bestScore = score;
          bestName = u.name;
        }
      }

      const THRESHOLD = 0.85;
      if (bestScore < THRESHOLD) {
        bestName = "Unknown";
      }

      io.emit("recognize_result", { name: bestName, score: bestScore });

      // Nếu nhận diện OK -> mở cửa + bật cooldown
      if (bestName !== "Unknown" && bestName !== "NoFace") {
        console.log("[MQTT] OPEN DOOR by FaceID user:", bestName, "score=", bestScore.toFixed(3));

        // 🔹 Tìm LockUser theo tên
        const lockUserDoc = await LockUser.findOne({ name: bestName }).lean();

        if (lockUserDoc) {
          const device = await Device.findOne({ chip_cam_id }).lean();

          await AccessLog.create({
            device_id: device._id,
            lock_user_id: lockUserDoc._id,
            method: "FACEID",
            result: "SUCCESS",
          });

          console.log("[ACCESS_LOG] FACEID SUCCESS:", "user=", bestName, "device=", device._id.toString());
        } else {
          console.warn("[ACCESS_LOG] Không tìm thấy LockUser với name:", bestName);
        }

        if (mqttClient.connected) {
          mqttClient.publish("iot/rfid/command", "OPEN");
        } else {
          console.warn("[MQTT] Client not connected, cannot OPEN door");
        }

        lastRecognizeAt = now;
      }
    } catch (err) {
      console.error("[AI] recognize_embedding error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("[AI] disconnected:", socket.id);
  });
});

// ============ WEBSOCKET CHO ESP32-CAM ============
const ESP_WS_PORT = 8081;

const wss = new WebSocketServer({ port: ESP_WS_PORT });

const camIdMap = new Map<WebSocket, string>();

wss.on("connection", (ws: WebSocket) => {
  console.log("[ESP32] connected");

  ws.on("message", async (data: RawData, isBinary: boolean) => {
    if (!isBinary) {
      // TEXT: có thể là cam_hello
      try {
        const text = data.toString();
        const json = JSON.parse(text);
        if (json.type === "cam_hello" && json.chip_cam_id) {
          camIdMap.set(ws, json.chip_cam_id);
          console.log("[ESP32] cam_hello from", json.chip_cam_id);
        }
      } catch {
        console.log("[ESP32] text message:", data.toString());
      }
      return;
    }

    // BINARY: đây là frame JPEG
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);

    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    const chipCamId = camIdMap.get(ws) || null;
    const device = await Device.findOne({ chip_cam_id: chipCamId }).lean();

    // Gửi cho React hiển thị
    io.emit("esp_frame", { image: dataUrl, device: device });

    // Gửi cho Python AI (namespace /ai)
    aiNsp.emit("frame", { image: base64, chip_cam_id: chipCamId });
  });

  ws.on("close", () => console.log("[ESP32] disconnected"));
  ws.on("error", (err) => console.error("[ESP32] error:", err));
});

export { io, app, server };
