"use client"

import { memo, useEffect, useMemo, useState } from "react"
import "./style.scss"
import { FiPlus } from "react-icons/fi"
import { api } from "services/api.service"

// Tạo avatar từ tên
const getInitials = (name = "") => {
  const parts = name.trim().split(" ")
  if (parts.length === 0) return ""
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const colorPalette = ["#4a90e2", "#50c878", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c"]

const UsersPage = () => {
  const [lockUsers, setLockUsers] = useState([])
  const [creating, setCreating] = useState(false)
  const [newUserName, setNewUserName] = useState("")

  const stats = useMemo(() => {
    const total = lockUsers.length
    const active = lockUsers.length // tạm coi tất cả là active
    const withFace = lockUsers.filter((u) => u.faceId).length

    return [
      { number: total, label: "Total Users", color: "#34495e" },
      { number: active, label: "Active Users", color: "#3498db" },
      { number: withFace, label: "Face ID Enabled", color: "#2ecc71" },
    ]
  }, [lockUsers])

  const fetchLockUsers = async () => {
    try {
      const res = await api.get("/lock_user")
      const list = res.data?.result || []
      // map thêm field cho FE
      const enhanced = list.map((u, idx) => ({
        ...u,
        id: u._id,
        name: u.name || `User ${idx + 1}`,
        avatar: getInitials(u.name || ""),
        color: colorPalette[idx % colorPalette.length],
        faceId: false, // TODO: có thể gọi thêm API face_id để kiểm tra
        status: "Active",
        lastAccess: "-",
      }))
      setLockUsers(enhanced)
    } catch (error) {
      console.error("Fetch lock users error", error)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      alert("Vui lòng nhập tên người dùng")
      return
    }
    setCreating(true)
    try {
      const res = await api.post("/lock_user", { name: newUserName.trim() })
      // API createLockUser hiện chưa trả result, nên refetch danh sách
      await fetchLockUsers()
      setNewUserName("")
    } catch (error) {
      console.error("Create lock user error", error)
      alert("Tạo người dùng thất bại")
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    fetchLockUsers()
  }, [])

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage user access permissions and authentication methods</p>
        </div>
        <div className="users-header-actions">
          <div className="add-user-inline-form">
            <input
              type="text"
              placeholder="Nhập tên người dùng mới"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
            />
            <button className="add-user-btn" onClick={handleCreateUser} disabled={creating}>
              <FiPlus />
              {creating ? "Đang tạo..." : "Add New User"}
            </button>
          </div>
        </div>
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
          <div className="column">Status</div>
          <div className="column">Last Access</div>
          <div className="column">Actions</div>
        </div>
      </div>

      {/* Users List */}
      <div className="users-list">
        {lockUsers.map((user) => (
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
              <span className={`status-badge ${user.status.toLowerCase()}`}>{user.status}</span>
            </div>
            <div className="info-cell">
              <span>{user.lastAccess}</span>
            </div>
            <div className="actions-cell">
              <button className="action-link" disabled>
                Thêm RFID (chuyển sang trang Devices)
              </button>
              <button className="action-link" disabled>
                Thêm Face ID (sắp có)
              </button>
              {/* TODO: thêm nút xóa / sửa nếu cần */}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(UsersPage)
