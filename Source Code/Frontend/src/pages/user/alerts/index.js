"use client"

import { memo, useEffect, useMemo, useState } from "react"
import "./style.scss"
import { api } from "services/api.service"
import { socket } from "services/socket.service"

const AlertsPage = () => {
  const [logs, setLogs] = useState([])

  const fetchAlerts = async () => {
    try {
      const res = await api.get("/access_log")
      const list = res.data?.result || []
      setLogs(list)
    } catch (error) {
      console.error("Fetch access_log error", error)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  // Lắng nghe realtime access log
  useEffect(() => {
    const onAccessLog = (log) => {
      setLogs((prev) => [log, ...prev].slice(0, 200))
    }

    socket.on("client-access-log", onAccessLog)

    return () => {
      socket.off("client-access-log", onAccessLog)
    }
  }, [])

  // Tính số lần quẹt lỗi liên tiếp gần nhất
  const { consecutiveFails, hasCritical, failedLogs } = useMemo(() => {
    if (!logs.length) return { consecutiveFails: 0, hasCritical: false, failedLogs: [] }

    let count = 0
    for (const log of logs) {
      if (log.result === "FALSE") count += 1
      else break
    }

    const onlyFailed = logs.filter((l) => l.result === "FALSE")

    return {
      consecutiveFails: count,
      hasCritical: count >= 5,
      failedLogs: onlyFailed,
    }
  }, [logs])

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>Security Alerts</h1>
        <p>Theo dõi các lần quẹt thẻ thất bại và cảnh báo an toàn</p>
      </div>

      {hasCritical && (
        <div className="alert-banner critical">
          <h2>Cảnh báo an toàn mức cao</h2>
          <p>
            Phát hiện <strong>{consecutiveFails}</strong> lần quẹt thẻ thất bại liên tiếp gần
            nhất. Vui lòng kiểm tra thiết bị và môi trường xung quanh ngay lập tức.
          </p>
        </div>
      )}

      {!hasCritical && (
        <div className="alert-banner normal">
          <h2>Không có cảnh báo nghiêm trọng</h2>
          <p>
            Hệ thống không ghi nhận 5 lần quẹt thẻ thất bại liên tiếp. Bạn vẫn nên theo dõi các
            log truy cập bên dưới.
          </p>
        </div>
      )}

      <div className="alerts-table-container">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Device</th>
              <th>RFID</th>
              <th>Method</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {failedLogs.map((log) => (
              <tr key={log._id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.device_id?.name || "Unknown"}</td>
                <td>{log.rf_id || "-"}</td>
                <td>{log.method}</td>
                <td>
                  <span className="badge-failed">Failed</span>
                </td>
              </tr>
            ))}
            {!failedLogs.length && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "16px" }}>
                  Chưa có lần quẹt thẻ thất bại nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default memo(AlertsPage)