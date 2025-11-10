import { Socket } from "socket.io";
import { io } from "./socket";

let espSocket = null; // Giữ kết nối ESP32

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Khi ESP gửi tín hiệu đăng ký
  socket.on("esp-register-device", (msg) => {
    espSocket = socket;
    console.log("ESP32 registered!");
  });

  socket.on("client-control-lock", (cmd) => {
    console.log("Web command:", cmd);
    if (espSocket) espSocket.emit("esp-message", cmd); // gửi cmd cho esp
  });

  socket.on("esp-door_opened", (data) => {
    console.log("[DEVICE] ESP32 mở cửa:", data);
    io.emit("client-door_status", { status: "OPEN", source: data }); // gửi cho React realtime
  });
});
