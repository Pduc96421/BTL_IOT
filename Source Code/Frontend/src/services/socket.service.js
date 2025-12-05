import { io } from "socket.io-client"
import { API_BASE_URL } from "./api.service"

// Backend URL gốc: lấy host:port từ API_BASE_URL
// Ví dụ API_BASE_URL = http://localhost:3000/api/v1 -> socketURL = http://localhost:3000
let socketURL = API_BASE_URL
try {
  const url = new URL(API_BASE_URL)
  socketURL = `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}`
} catch {
  socketURL = "http://localhost:8080"
}

export const socket = io(socketURL, {
  withCredentials: true,
})


