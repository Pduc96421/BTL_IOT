"use client"

import { memo, useState } from "react"
import "./style.scss"
import { FiPlus, FiEdit2, FiTrash2, FiDownload } from "react-icons/fi"

const DevicesPage = () => {
  const [devices, setDevices] = useState([
    {
      id: 1,
      name: "Front Door Lock",
      model: "ESP32-CAM",
      version: "v2.1.3",
      ip: "192.168.1.101",
      port: "80",
      status: "Online",
      uptime: "15 days",
      location: "Front Door",
      color: "#3498db",
    },
    {
      id: 2,
      name: "Garage Door Lock",
      model: "ESP32-CAM",
      version: "v2.1.3",
      ip: "192.168.1.102",
      port: "80",
      status: "Online",
      uptime: "12 days",
      location: "Garage",
      color: "#27ae60",
    },
    {
      id: 3,
      name: "Back Door Lock",
      model: "ESP32-CAM",
      version: "v2.1.2",
      ip: "192.168.1.103",
      port: "80",
      status: "Offline",
      uptime: "0 days",
      location: "Back Door",
      color: "#e74c3c",
    },
    {
      id: 4,
      name: "Side Gate",
      model: "ESP32-CAM",
      version: "v2.1.3",
      ip: "192.168.1.104",
      port: "80",
      status: "Online",
      uptime: "8 days",
      location: "Side Gate",
      color: "#f39c12",
    },
    {
      id: 5,
      name: "Office Door Lock",
      model: "ESP32-CAM",
      version: "v2.1.1",
      ip: "192.168.1.105",
      port: "80",
      status: "Offline",
      uptime: "0 days",
      location: "Office",
      color: "#9b59b6",
    },
  ])

  const stats = [
    { number: 3, label: "Online Devices", color: "#27ae60" },
    { number: 2, label: "Offline Devices", color: "#e74c3c" },
    { number: 5, label: "Total Devices", color: "#3498db" },
    { number: "98%", label: "Uptime Average", color: "#f39c12" },
  ]

  const networkStats = [
    { icon: "🌐", label: "Network Range", value: "192.168.1.0/24" },
    { icon: "🔒", label: "Security Protocol", value: "WPA3-PSK" },
    { icon: "📶", label: "Signal Strength", value: "Excellent (-45 dBm)" },
  ]

  return (
    <div className="devices-page">
      <div className="devices-header">
        <div>
          <h1>Device Management</h1>
          <p>Monitor and configure ESP32-CAM door lock devices</p>
        </div>
        <button className="add-device-btn">
          <FiPlus />
          Add Device
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <p className="stat-number" style={{ color: stat.color }}>
              {stat.number}
            </p>
            <p className="stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Devices Table */}
      <div className="devices-table-container">
        <table className="devices-table">
          <thead>
            <tr>
              <th>Device</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Location</th>
              <th>Uptime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id}>
                <td>
                  <div className="device-cell">
                    <div className="device-icon" style={{ backgroundColor: device.color }}>
                      📱
                    </div>
                    <div>
                      <p className="device-name">{device.name}</p>
                      <p className="device-model">
                        {device.model} • {device.version}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="ip-cell">
                    <p>{device.ip}</p>
                    <p className="port">Port {device.port}</p>
                  </div>
                </td>
                <td>
                  <div className={`status-badge ${device.status.toLowerCase()}`}>
                    <span className={`status-dot ${device.status.toLowerCase()}`}></span>
                    {device.status}
                  </div>
                </td>
                <td>
                  <p className="location-text">{device.location}</p>
                </td>
                <td>
                  <p className="uptime-text">{device.uptime}</p>
                  <p className="uptime-label">Continuous operation</p>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="action-btn edit">
                      <FiEdit2 />
                    </button>
                    <button className="action-btn download">
                      <FiDownload />
                    </button>
                    <button className="action-btn power">
                      <span>⚡</span>
                    </button>
                    <button className="action-btn delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Network Configuration */}
      <div className="network-config">
        <h3>Network Configuration</h3>
        <div className="network-stats">
          {networkStats.map((stat, idx) => (
            <div key={idx} className="network-item">
              <span className="network-icon">{stat.icon}</span>
              <div>
                <p className="network-label">{stat.label}</p>
                <p className="network-value">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default memo(DevicesPage)
