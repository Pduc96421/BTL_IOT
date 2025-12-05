import { io } from "socket.io-client"
import { API_BASE_URL } from "./api.service"

// Backend URL gốc: lấy host:port từ API_BASE_URL
// Ví dụ API_BASE_URL = http://localhost:8080/api/v1 -> socketURL = http://localhost:8080
let socketURL = API_BASE_URL
try {
  const url = new URL(API_BASE_URL)
  socketURL = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`
} catch {
  socketURL = "http://localhost:8080"
}

export const socket = io(socketURL, {
  transports: ["websocket", "polling"],
})

socket.on("connect", () => {
  console.log("[Socket] connected:", socket.id, "->", socketURL)
})

socket.on("connect_error", (err) => {
  console.error("[Socket] connect_error:", err.message)
})

