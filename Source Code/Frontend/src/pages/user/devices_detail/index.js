"use client";

import React, { memo, useEffect, useState } from "react";
import "./style.scss";
import { FiEye, FiLock, FiUnlock } from "react-icons/fi";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:8080";
let socket = null;

const DevicesDetail = () => {
  const [doorStatus, setDoorStatus] = useState("closed");

  // ==== state cho stream + nhận diện ====
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("Đang chờ nhận diện...");

  // ==== socket.io: nhận stream + kết quả AI ====
  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, { transports: ["websocket"] });
    }

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

    return () => {
      if (socket) {
        socket.off("esp_frame");
        socket.off("recognize_result");
      }
    };
  }, []);

  const handleDoorControl = (action) => {
    setDoorStatus(action);
    // TODO: sau này nếu muốn điều khiển ESP32 thật thì emit lệnh ở đây
    // socket.emit("door_control", { action }) // ví dụ
  };

  const quickStats = [
    { label: "Face ID Recognition", status: "Active" },
    { label: "RFID Scanner", status: "Active" },
    { label: "Battery Level", value: "87%" },
    { label: "WiFi Signal", value: "Strong" },
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
              <button className="control-btn open" onClick={() => handleDoorControl("open")}>
                <FiUnlock />
                Open Door
              </button>
              <button className="control-btn close" onClick={() => handleDoorControl("closed")}>
                <FiLock />
                Close Door
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
            <p className="status-label">Status: {doorStatus === "open" ? "Unlocked" : "Locked"}</p>
          </div>

          {/* Last Access (demo, sau có thể nối với log thật) */}
          <div className="info-card">
            <h4>Last Access</h4>
            <div className="access-info">
              <div className="avatar-small" style={{ backgroundColor: "#4a90e2" }}>
                SJ
              </div>
              <div>
                <p className="access-name">Sarah Johnson</p>
                <p className="access-method">Face ID</p>
                <p className="access-time">Today at 2:47 PM</p>
                <span className="access-badge">Authorized Access</span>
              </div>
            </div>
          </div>

          {/* Access Stats */}
          <div className="stats-grid">
            <div className="stat-item">
              <p className="stat-number">24</p>
              <p className="stat-label">Accesses Today</p>
              <p className="stat-change">↑ 12% from yesterday</p>
            </div>
            <div className="stat-item">
              <p className="stat-number">98%</p>
              <p className="stat-label">Success Rate</p>
              <p className="stat-change">Last 30 days</p>
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

export default memo(DevicesDetail);
