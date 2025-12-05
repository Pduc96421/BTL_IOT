import axios from "axios"

// Backend API gốc, có thể override bằng biến môi trường
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api/v1"

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export { api, API_BASE_URL }
export default api


