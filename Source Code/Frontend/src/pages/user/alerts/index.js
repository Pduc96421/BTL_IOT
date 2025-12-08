"use client";

// cd "C:\\Program Files\\mosquitto"
// mosquitto.exe -c mosquitto.conf -v

import { memo, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { api } from "services/api.service";
import { socket } from "services/socket.service";

const AlertsPage = () => {
  const [logs, setLogs] = useState([]);
  // Thời điểm gần nhất mà cửa đã được mở (bằng bất kỳ cách nào)
  const [lastResetAt, setLastResetAt] = useState(null);

  // ===== 1. Lấy log ban đầu từ backend =====
  const fetchAlerts = async () => {
    try {
      const res = await api.get("/access_log");
      const list = res.data?.result || [];
      setLogs(list);
    } catch (error) {
      console.error("Fetch access_log error", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // ===== 2. Lắng nghe realtime access log (RFID) =====
  useEffect(() => {
    const onAccessLog = (log) => {
      // Đưa log mới lên đầu, giữ tối đa 200 cái
      setLogs((prev) => [log, ...prev].slice(0, 200));
    };

    socket.on("client-access-log", onAccessLog);

    return () => {
      socket.off("client-access-log", onAccessLog);
    };
  }, []);

  // ===== 3. Lắng nghe trạng thái cửa để RESET cảnh báo =====
  useEffect(() => {
    const onDoorStatus = (data) => {
      if (!data || !data.door) return;

      const door = String(data.door).toUpperCase(); // "OPEN" | "CLOSED"
      if (door === "OPEN") {
        // Cửa đã mở thành công (RFID / FaceID / App / v.v.)
        // -> reset cảnh báo: đánh dấu mốc thời gian
        setLastResetAt(Date.now());
      }
    };

    socket.on("client-door-status", onDoorStatus);

    return () => {
      socket.off("client-door-status", onDoorStatus);
    };
  }, []);

  // ===== 4. Tính toán cảnh báo từ logs (sau khi áp dụng reset) =====
  const { consecutiveFails, hasCritical, failedLogs } = useMemo(() => {
    if (!logs.length) {
      return { consecutiveFails: 0, hasCritical: false, failedLogs: [] };
    }

    // Chỉ tính các log xảy ra SAU lần reset gần nhất (lần cửa mở gần nhất)
    let workingLogs = logs;

    if (lastResetAt) {
      workingLogs = logs.filter((log) => {
        if (!log.createdAt) return true;
        const t = new Date(log.createdAt).getTime();
        if (Number.isNaN(t)) return true;
        // Giữ lại những log xảy ra SAU khi cửa mở
        return t >= lastResetAt;
      });
    }

    if (!workingLogs.length) {
      return { consecutiveFails: 0, hasCritical: false, failedLogs: [] };
    }

    // Đếm số lần FAIL liên tiếp từ MỚI NHẤT trở xuống
    let count = 0;
    for (const log of workingLogs) {
      if (log.result === "FALSE") count += 1;
      else break;
    }

    const onlyFailed = workingLogs.filter((l) => l.result === "FALSE");

    return {
      consecutiveFails: count,
      hasCritical: count >= 5,
      failedLogs: onlyFailed,
    };
  }, [logs, lastResetAt]);

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <h1>Security Alerts</h1>
        <p>Theo dõi các lần quẹt thẻ thất bại và cảnh báo an toàn</p>
      </div>

      {hasCritical ? (
        <div className="alert-banner critical">
          <h2>Cảnh báo an toàn mức cao</h2>
          <p>
            Phát hiện <strong>{consecutiveFails}</strong> lần quẹt thẻ thất bại liên tiếp gần nhất. Vui lòng kiểm tra
            thiết bị và môi trường xung quanh ngay lập tức.
          </p>
        </div>
      ) : (
        <div className="alert-banner normal">
          <h2>Không có cảnh báo nghiêm trọng</h2>
          <p>
            Hệ thống không ghi nhận 5 lần quẹt thẻ thất bại liên tiếp sau lần mở cửa gần nhất. Bạn vẫn nên theo dõi các
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
                <td>{log.device_id?.name || log.device_name || "Unknown"}</td>
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
                  Chưa có lần quẹt thẻ thất bại nào sau lần mở cửa gần nhất.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(AlertsPage);
