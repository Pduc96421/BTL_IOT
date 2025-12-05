"use client";

import React, { memo, useEffect, useState } from "react";
import "./style.scss";
import { FiEye, FiLock, FiUnlock } from "react-icons/fi";
import { socket } from "services/socket.service";
import { api } from "services/api.service";

const DashboardPage = () => {
  const [doorStatus, setDoorStatus] = useState("closed"); // "open" | "closed"

  // ==== state cho stream + nhận diện ====
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("Đang chờ nhận diện...");

  // ==== dữ liệu thiết bị + log ====
  const [currentDevice, setCurrentDevice] = useState(null);
  const [lastAccess, setLastAccess] = useState(null);
  const [accessStats, setAccessStats] = useState({ total: 0, success: 0, rate: "0%" });

  // ==== socket.io: nhận stream + kết quả AI + trạng thái cửa ====
  useEffect(() => {
    // Video từ ESP32
    socket.on("esp_frame", (data) => {
      setImage(data.image);
    });

    // Kết quả nhận diện realtime
    socket.on("recognize_result", (data) => {
      const { name, score } = data;

      if (name === "NoFace") {
        setStatus("Nhận diện: Không thấy khuôn mặt nào trong khung hình.");
      } else if (name === "Unknown") {
        setStatus(`Nhận diện: Không nhận ra ai (score=${score.toFixed(2)})`);
      } else {
        setStatus(`Nhận diện: ${name} (score=${score.toFixed(2)})`);
      }
    });

    // Trạng thái cửa từ cảm biến
    socket.on("client-door-status", (data) => {
      if (!data || !data.door) return;
      const normalized = data.door.toUpperCase() === "OPEN" ? "open" : "closed";
      setDoorStatus(normalized);
    });

    // Khi mở bằng RFID
    socket.on("client-rfid-access", (data) => {
      if (data?.status === "ALLOWED") {
        setDoorStatus("open");
      }
    });

    return () => {
      socket.off("esp_frame");
      socket.off("recognize_result");
      socket.off("client-door-status");
      socket.off("client-rfid-access");
    };
  }, []);

  // Fetch device + access log cho dashboard
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        // 1) Thiết bị hiện tại (mặc định lấy thiết bị đầu tiên)
        const devRes = await api.get("/device");
        const devices = devRes.data?.result || [];
        if (devices.length > 0) {
          const d = devices[0];
          setCurrentDevice(d);
          setDoorStatus(d.status === "OPEN" ? "open" : "closed");
        }

        // 2) Lịch sử truy cập
        const logRes = await api.get("/access_log");
        const logs = logRes.data?.result || [];

        if (logs.length > 0) {
          const latest = logs[0];
          setLastAccess(latest);

          const total = logs.length;
          const success = logs.filter((l) => l.result === "SUCCESS").length;
          const rate = total > 0 ? `${Math.round((success / total) * 100)}%` : "0%";
          setAccessStats({ total, success, rate });
        }
      } catch (err) {
        console.error("Dashboard init error", err);
      }
    };

    fetchInitial();
  }, []);

  const handleDoorControl = async (desired) => {
    if (!currentDevice) {
      alert("Chưa có thiết bị nào được cấu hình");
      return;
    }

    // Nếu trạng thái hiện tại đã đúng thì không toggle nữa
    if (desired === "open" && doorStatus === "open") return;
    if (desired === "closed" && doorStatus === "closed") return;

    try {
      const res = await api.post(`/device/${currentDevice._id}/switch_door`);
      const newStatus = res.data?.result?.status || currentDevice.status;
      setDoorStatus(newStatus === "OPEN" ? "open" : "closed");
      setCurrentDevice((prev) => (prev ? { ...prev, status: newStatus } : prev));
    } catch (err) {
      console.error("Door control error", err);
      alert("Điều khiển cửa thất bại");
    }
  };

  const quickStats = [
    { label: "Total Access Logs", value: accessStats.total },
    { label: "Successful Access", value: accessStats.success },
    { label: "Success Rate", value: accessStats.rate },
    { label: "Face ID Recognition", status: "Active" },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Door Lock Dashboard</h1>
        <p>Monitor and control your smart door lock system</p>
      </div>

      <div className="dashboard-content">
        {/* Left Column - Camera and Controls */}
        <div className="left-section">
          {/* Camera Feed + Trạng thái nhận diện */}
          <div className="camera-section">
            <div className="camera-feed">
              {image ? (
                <div className="camera-image-wrapper">
                  <img src={image} alt="ESP32 frame" className="camera-image" />
                </div>
              ) : (
                <div className="camera-placeholder">
                  <FiEye className="camera-icon" />
                  <span className="live-badge">WAITING</span>
                  <div className="status-indicator offline">No Signal</div>
                  <p className="feed-text">ESP32-CAM Feed</p>
                </div>
              )}

              {/* Trạng thái nhận diện */}
              <p className="camera-status">
                <b>Trạng thái:</b> {status}
              </p>
            </div>
          </div>

          {/* Door Controls */}
          <div className="controls-section">
            <h3>Door Controls</h3>
            <div className="button-group">
              <button
                className="control-btn open"
                onClick={() => handleDoorControl("open")}
                disabled={doorStatus === "open" || !currentDevice}
              >
                <FiUnlock />
                Open Door
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Stats and Info */}
        <div className="right-section">
          {/* Door Status */}
          <div className="status-card">
            {doorStatus === "open" ? <FiUnlock className="status-icon" /> : <FiLock className="status-icon" />}
            <h4>{doorStatus === "open" ? "Door Open" : "Door Closed"}</h4>
            <p className="status-label">
              Status: {doorStatus === "open" ? "Unlocked" : "Locked"}{" "}
              {currentDevice ? `(${currentDevice.name})` : ""}
            </p>
          </div>

          {/* Last Access (dữ liệu thật từ access_log) */}
          <div className="info-card">
            <h4>Last Access</h4>
            {lastAccess ? (
              <div className="access-info">
                <div className="avatar-small" style={{ backgroundColor: "#4a90e2" }}>
                  {(lastAccess.device_id?.name || "D").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="access-name">{lastAccess.device_id?.name || "Unknown device"}</p>
                  <p className="access-method">{lastAccess.method}</p>
                  <p className="access-time">
                    {new Date(lastAccess.createdAt).toLocaleString()}
                  </p>
                  <span className="access-badge">
                    {lastAccess.result === "SUCCESS" ? "Authorized Access" : "Access Denied"}
                  </span>
                </div>
              </div>
            ) : (
              <p>Chưa có log truy cập nào.</p>
            )}
          </div>

          {/* Access Stats (dữ liệu thật) */}
          <div className="stats-grid">
            <div className="stat-item">
              <p className="stat-number">{accessStats.total}</p>
              <p className="stat-label">Total Access Logs</p>
              <p className="stat-change"></p>
            </div>
            <div className="stat-item">
              <p className="stat-number">{accessStats.rate}</p>
              <p className="stat-label">Success Rate</p>
              <p className="stat-change"></p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="quick-stats">
            <h4>Quick Stats</h4>
            {quickStats.map((stat, idx) => (
              <div key={idx} className="quick-stat-row">
                <span>{stat.label}</span>
                <span className="value">{stat.status || stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(DashboardPage);
