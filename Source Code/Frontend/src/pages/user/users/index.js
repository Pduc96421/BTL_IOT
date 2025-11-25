"use client"

import { memo, useState } from "react"
import "./style.scss"
import { FiPlus } from "react-icons/fi"

const UsersPage = () => {
  const [users] = useState([
    {
      id: 1,
      name: "John Doe",
      avatar: "JD",
      faceId: true,
      rfid: true,
      status: "Active",
      lastAccess: "Today, 2:30 PM",
      color: "#4a90e2",
    },
    {
      id: 2,
      name: "Jane Smith",
      avatar: "JS",
      faceId: true,
      rfid: false,
      status: "Active",
      lastAccess: "Yesterday, 5:45 PM",
      color: "#50c878",
    },
    {
      id: 3,
      name: "Mike Johnson",
      avatar: "MJ",
      faceId: false,
      rfid: true,
      status: "Inactive",
      lastAccess: "3 days ago",
      color: "#f39c12",
    },
    {
      id: 4,
      name: "Sarah Williams",
      avatar: "SW",
      faceId: true,
      rfid: true,
      status: "Active",
      lastAccess: "Today, 10:15 AM",
      color: "#e74c3c",
    },
    {
      id: 5,
      name: "Tom Brown",
      avatar: "TB",
      faceId: false,
      rfid: false,
      status: "Inactive",
      lastAccess: "1 week ago",
      color: "#9b59b6",
    },
    {
      id: 6,
      name: "Emma Davis",
      avatar: "ED",
      faceId: true,
      rfid: true,
      status: "Active",
      lastAccess: "Today, 1:20 PM",
      color: "#1abc9c",
    },
  ])

  const stats = [
    { number: 6, label: "Active Users", color: "#3498db" },
    { number: 5, label: "Face ID Enabled", color: "#2ecc71" },
    { number: 5, label: "RFID Enabled", color: "#9b59b6" },
    { number: 8, label: "Total Users", color: "#34495e" },
  ]

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage user access permissions and authentication methods</p>
        </div>
        <button className="add-user-btn">
          <FiPlus />
          Add New User
        </button>
      </div>

      {/* Stats */}
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

      {/* Users Table Header */}
      <div className="users-table-header">
        <div className="table-columns">
          <div className="column">User</div>
          <div className="column">Face ID</div>
          <div className="column">RFID</div>
          <div className="column">Status</div>
          <div className="column">Last Access</div>
          <div className="column">Actions</div>
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {users.map((user) => (
          <div key={user.id} className="user-row">
            <div className="user-cell">
              <div className="avatar" style={{ backgroundColor: user.color }}>
                {user.avatar}
              </div>
              <span>{user.name}</span>
            </div>
            <div className="info-cell">
              <span className={`badge ${user.faceId ? "enabled" : "disabled"}`}>
                {user.faceId ? "✓ Enabled" : "✗ Disabled"}
              </span>
            </div>
            <div className="info-cell">
              <span className={`badge ${user.rfid ? "enabled" : "disabled"}`}>
                {user.rfid ? "✓ Enabled" : "✗ Disabled"}
              </span>
            </div>
            <div className="info-cell">
              <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
            </div>
            <div className="info-cell">
              <span>{user.lastAccess}</span>
            </div>
            <div className="actions-cell">
              <button className="action-link">Edit</button>
              <button className="action-link delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(UsersPage)
