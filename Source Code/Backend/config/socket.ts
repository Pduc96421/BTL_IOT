import { Server, Socket } from "socket.io";
import http from "http";
import express, {Express} from "express";

const app: Express = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN } });

const userSocketMap: Record<string, string> = {};

export function getReceiverSocketId(userId: string): string | undefined {
  return userSocketMap[userId];
}

io.on("connection", (socket: Socket) => {
  console.log("Một người dùng đã kết nối:", socket.id);

  const userId = socket.handshake.query.userId;

  if (typeof userId === "string" && userId) {
    userSocketMap[userId] = socket.id;
    console.log(`Người dùng ${userId} đã được ánh xạ với socket ${socket.id}`);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Lắng nghe sự kiện 'disconnect' khi client ngắt kết nối
  socket.on("disconnect", () => {
    console.log("Một người dùng đã ngắt kết nối:", socket.id);

    if (typeof userId === "string" && userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

export { io, app, server };
