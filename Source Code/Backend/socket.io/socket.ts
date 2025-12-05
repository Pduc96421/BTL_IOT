// src/socket.io/socket.ts
import http from "http";
import express from "express";
import { Server } from "socket.io";
import { WebSocketServer, WebSocket, RawData } from "ws";
import LockUser from "../api/v1/models/lock_user.model";
import mqtt from "mqtt"; // 👈 thêm dòng này

const app = express();
const server = http.createServer(app);

// ============ SOCKET.IO CHO REACT + AI ============
const io = new Server(server, { cors: { origin: "*" } });

// ============ MQTT KẾT NỐI TỚI BROKER ============
// const MQTT_URL = "mqtt://192.168.24.126:1883";
const MQTT_URL = "mqtt://192.168.24.103:1883";
const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on("connect", () => {
  console.log("[MQTT] Connected to broker:", MQTT_URL);

  // Nếu muốn xem trạng thái cửa từ ESP32
  mqttClient.subscribe("iot/door/status", (err) => {
    if (!err) console.log("[MQTT] Subscribed to iot/door/status");
  });
});

mqttClient.on("error", (err) => {
  console.error("[MQTT] Error:", err);
});

// Forward trạng thái cửa cho React (optional)
mqttClient.on("message", (topic, message) => {
  const payload = message.toString();
  // Ví dụ ESP gửi: {"chip_id":"...","door":"CLOSED"|"OPEN"}
  if (topic === "iot/door/status") {
    try {
      const data = JSON.parse(payload);
      io.emit("door_status", data);
    } catch {
      io.emit("door_status", { raw: payload });
    }
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

        // Gửi cho React biết là đăng ký thất bại vì trùng mặt
        io.emit("register_failed", {
          reason: "face_exists",
          existName,
          score: existScore,
        });
        return;
      }

      // ----- 3. Không trùng -> lưu user mới (hoặc update theo name) -----
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
      const { embedding } = data;

      // ====== KHÔNG CÓ EMBEDDING -> KHÔNG THẤY MẶT ======
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

      // console.log("[AI] recognize:", bestName, bestScore.toFixed(3));
      io.emit("recognize_result", { name: bestName, score: bestScore });

      // 🔥 NẾU NHẬN DIỆN ĐƯỢC NGƯỜI HỢP LỆ -> GỬI MQTT MỞ CỬA
      if (bestName !== "Unknown" && bestName !== "NoFace") {
        // Optional: log để debug
        console.log("[MQTT] OPEN DOOR by FaceID user:", bestName);

        mqttClient.publish("iot/rfid/command", "OPEN");
        // ESP32 sẽ nhận "OPEN" và tự mở khóa giống như RFID
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

wss.on("connection", (ws: WebSocket) => {
  console.log("[ESP32] connected");

  ws.on("message", (data: RawData, isBinary: boolean) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);

    const base64 = buffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    // Gửi cho React hiển thị
    io.emit("esp_frame", { image: dataUrl });

    // Gửi cho Python AI (namespace /ai)
    aiNsp.emit("frame", { image: base64 });
  });

  ws.on("close", () => console.log("[ESP32] disconnected"));
  ws.on("error", (err) => console.error("[ESP32] error:", err));
});

export { io, app, server };
