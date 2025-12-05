"use client";

import { memo, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { FiPlus } from "react-icons/fi";
import { api } from "services/api.service";
import { socket } from "services/socket.service";
import { useNavigate } from "react-router-dom";

// Tạo avatar từ tên
const getInitials = (name = "") => {
  const parts = name.trim().split(" ");
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const colorPalette = ["#4a90e2", "#50c878", "#f39c12", "#e74c3c", "#9b59b6", "#1abc9c"];

const UsersPage = () => {
  const [lockUsers, setLockUsers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [rfidScanInfo, setRfidScanInfo] = useState(null);
  const [rfidRegisterInfo, setRfidRegisterInfo] = useState(null);
  const [registeringLockUserId, setRegisteringLockUserId] = useState(null);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = lockUsers.length;
    const withRfid = lockUsers.filter((u) => u.rfid).length;
    const withFace = lockUsers.filter((u) => u.faceId).length;

    return [
      { number: total, label: "Total Users", color: "#34495e" },
      { number: total, label: "Active Users", color: "#3498db" },
      { number: withFace, label: "Face ID Enabled", color: "#2ecc71" },
      { number: withRfid, label: "RFID Enabled", color: "#9b59b6" },
    ];
  }, [lockUsers]);

  const fetchLockUsers = async () => {
    try {
      const res = await api.get("/lock_user");
      const list = res.data?.result || [];
      // map thêm field cho FE
      const enhanced = list.map((u, idx) => ({
        ...u,
        id: u._id,
        name: u.name || `User ${idx + 1}`,
        avatar: getInitials(u.name || ""),
        color: colorPalette[idx % colorPalette.length],
        faceId: false, // TODO: có thể gọi thêm API face_id để kiểm tra
        rfid: false, // TODO: có thể check từ rf_id nếu cần
        status: "Active",
        lastAccess: "-",
      }));
      setLockUsers(enhanced);
    } catch (error) {
      console.error("Fetch lock users error", error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      alert("Vui lòng nhập tên người dùng");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/lock_user", { name: newUserName.trim() });
      // API createLockUser hiện chưa trả result, nên refetch danh sách
      await fetchLockUsers();
      setNewUserName("");
    } catch (error) {
      console.error("Create lock user error", error);
      alert("Tạo người dùng thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleRegisterRfidForUser = async (lockUserId) => {
    try {
      await api.post(`/rf_id/register_mode/${lockUserId}`);
      setRegisteringLockUserId(lockUserId);
      setRfidRegisterInfo({
        status: "WAITING",
        message: "Đang chờ bạn quét thẻ trên thiết bị...",
        lock_user_id: lockUserId,
      });
    } catch (error) {
      console.error(error);
      alert("Bật chế độ đăng ký thẻ thất bại");
    }
  };

  useEffect(() => {
    fetchLockUsers();
  }, []);

  useEffect(() => {
    const onScan = (data) => {
      setRfidScanInfo({
        uid: data.uid,
        mode: data.mode,
        lock_user_id: data.lock_user_id,
      });
    };

    const onRegistered = (data) => {
      setRegisteringLockUserId(null);
      setRfidRegisterInfo({
        uid: data.uid,
        lock_user_id: data.lock_user_id,
        status: data.status,
        message: data.status === "CREATED" ? "Đăng ký thẻ mới thành công!" : "Thẻ đã tồn tại trong hệ thống.",
      });
    };

    socket.on("client-rfid-scan", onScan);
    socket.on("client-rfid-registered", onRegistered);

    return () => {
      socket.off("client-rfid-scan", onScan);
      socket.off("client-rfid-registered", onRegistered);
    };
  }, []);

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

      {/* Thông tin RFID realtime để test */}
      <div className="rfid-status-panel">
        <h3>RFID Realtime</h3>
        {rfidScanInfo ? (
          <p>
            <strong>UID vừa quét:</strong> {rfidScanInfo.uid}{" "}
            <span>({rfidScanInfo.mode === "REGISTER" ? "REGISTER" : "NORMAL"})</span>
          </p>
        ) : (
          <p>Chưa có thẻ nào được quét trong phiên này.</p>
        )}

        {rfidRegisterInfo && (
          <p>
            <strong>Đăng ký:</strong> {rfidRegisterInfo.message}{" "}
            {rfidRegisterInfo.uid && <span>- UID: {rfidRegisterInfo.uid}</span>}
          </p>
        )}

        {registeringLockUserId && <p className="rfid-status-waiting">Đang ở chế độ REGISTER...</p>}
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
        {lockUsers.map((user) => (
          <div key={user.id} className="user-row">
            <div className="user-cell">
              <div className="avatar" style={{ backgroundColor: user.color }}>
                {user.avatar}
              </div>
              <span>{user.name}</span>
            </div>
            <div className="info-cell">
              <span
                className={`badge ${
                  Array.isArray(user.embedding) && user.embedding.length > 0 ? "enabled" : "disabled"
                }`}
              >
                {Array.isArray(user.embedding) && user.embedding.length > 0 ? "Đã có Face ID" : "Chưa có Face ID"}
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
              <button className="action-link" onClick={() => handleRegisterRfidForUser(user.id)}>
                {registeringLockUserId === user.id ? "Đang đăng ký RFID..." : "Thêm RFID"}
              </button>
              <button onClick={() => navigate(`/register_face/${user._id}`)} className="action-link">
                Thêm Face ID
              </button>
              {/* TODO: thêm nút xóa / sửa nếu cần */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(UsersPage);
