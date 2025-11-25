"use client"

import { memo, useState } from "react"
import "./style.scss"
import { FiEye, FiLock, FiUnlock } from "react-icons/fi"

const DashboardPage = () => {
  const [doorStatus, setDoorStatus] = useState("locked")

  const stats = [
    { label: "Live Camera Feed", value: "Active", color: "#1a1a1a" },
    { label: "Door Status", value: "Locked", color: "#27ae60" },
    { label: "Last Access", value: "Sarah Johnson", color: "#3498db" },
    { label: "Success Rate", value: "98%", color: "#27ae60" },
  ]

  const quickStats = [
    { label: "Face ID Recognition", status: "Active" },
    { label: "RFID Scanner", status: "Active" },
    { label: "Battery Level", value: "87%" },
    { label: "WiFi Signal", value: "Strong" },
  ]

  const handleDoorControl = (action) => {
    setDoorStatus(action)
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Door Lock Dashboard</h1>
        <p>Monitor and control your smart door lock system</p>
      </div>

      <div className="dashboard-content">
        {/* Left Column - Camera and Controls */}
        <div className="left-section">
          {/* Camera Feed */}
          <div className="camera-section">
            <div className="camera-feed">
              <div className="camera-placeholder">
                <FiEye className="camera-icon" />
                <span className="live-badge">LIVE</span>
                <div className="status-indicator online">Online</div>
                <p className="feed-text">ESP32-CAM Feed</p>
              </div>
              <p className="camera-info">Front Door Camera • 1920x1080 • 30fps</p>
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
            <FiLock className="status-icon" />
            <h4>Door Closed</h4>
            <p className="status-label">Status: Locked</p>
          </div>

          {/* Last Access */}
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
  )
}

export default memo(DashboardPage)
