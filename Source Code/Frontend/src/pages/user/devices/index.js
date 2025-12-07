"use client";

import { memo, useEffect, useMemo, useState } from "react";
import "./style.scss";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { api } from "services/api.service";
import { socket } from "services/socket.service";
import { useNavigate } from "react-router-dom";

const colorPalette = ["#3498db", "#27ae60", "#e74c3c", "#f39c12", "#9b59b6"];

const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [rfidScanInfo, setRfidScanInfo] = useState(null);
  const [rfidRegisterInfo, setRfidRegisterInfo] = useState(null);
  const [registeringDeviceId, setRegisteringDeviceId] = useState(null);
  const [deviceRfids, setDeviceRfids] = useState({});
  const [deletingDeviceId, setDeletingDeviceId] = useState(null);
  const [openRfidDeviceId, setOpenRfidDeviceId] = useState(null);
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const total = devices.length;
    // Tạm thời coi tất cả là Online cho đơn giản (1 device)
    return [
      { number: total, label: "Total Devices", color: "#3498db" },
      { number: total, label: "Online Devices", color: "#27ae60" },
    ];
  }, [devices]);

  const fetchDevices = async () => {
    try {
      const res = await api.get("/device");
      const list = res.data?.result || [];
      const enhanced = list.map((d, idx) => ({
        ...d,
        id: d._id,
        model: "ESP32", // tạm thời mock
        version: "v1.0.0",
        ip: "192.168.1.100",
        port: "1883",
        status: "Online",
        uptime: "N/A",
        location: d.name || `Device ${idx + 1}`,
        color: colorPalette[idx % colorPalette.length],
      }));
      setDevices(enhanced);
    } catch (error) {
      console.error("Fetch devices error", error);
    }
  };

  const handleCreateDevice = async () => {
    if (!newDeviceName.trim()) {
      alert("Vui lòng nhập tên thiết bị");
      return;
    }
    setCreating(true);
    try {
      await api.post("/device", { name: newDeviceName.trim() });
      await fetchDevices();
      setNewDeviceName("");
    } catch (error) {
      console.error("Create device error", error);
      alert("Tạo thiết bị thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thiết bị này?")) return;
    setDeletingDeviceId(deviceId);
    try {
      await api.delete(`/device/${deviceId}`);
      await fetchDevices();
    } catch (error) {
      console.error("Delete device error", error);
      alert("Xóa thiết bị thất bại");
    } finally {
      setDeletingDeviceId(null);
    }
  };

  const handleRegisterRfidForDevice = async (deviceId) => {
    try {
      const name = window.prompt("Nhập tên/nhãn cho thẻ RFID (ví dụ: Thẻ nhà, Thẻ Bố...):", "");
      await api.post(`/rf_id/register_mode/${deviceId}`, { name: name || undefined });
      setRegisteringDeviceId(deviceId);
      setRfidRegisterInfo({
        status: "WAITING",
        message: "Đang chờ bạn quét thẻ trên thiết bị...",
        device_id: deviceId,
      });
    } catch (error) {
      console.error(error);
      alert("Bật chế độ đăng ký thẻ thất bại");
    }
  };

  const handleViewRfids = async (deviceId) => {
    // toggle hiển thị: nếu đang mở thì đóng lại
    if (openRfidDeviceId === deviceId) {
      setOpenRfidDeviceId(null);
      return;
    }

    try {
      const res = await api.get(`/rf_id/device/${deviceId}`);
      const list = res.data?.result || [];
      setDeviceRfids((prev) => ({ ...prev, [deviceId]: list }));
      setOpenRfidDeviceId(deviceId);
    } catch (error) {
      console.error("Fetch rfids error", error);
      alert("Lấy danh sách thẻ thất bại");
    }
  };

  const handleDeleteRfidFromDevice = async (deviceId, rfidId) => {
    if (!window.confirm("Bạn có chắc muốn xóa thẻ này khỏi thiết bị?")) return;
    try {
      await api.delete(`/rf_id/device/${deviceId}/${rfidId}`);
      setDeviceRfids((prev) => ({
        ...prev,
        [deviceId]: (prev[deviceId] || []).filter((r) => r._id !== rfidId),
      }));
    } catch (error) {
      console.error("Delete rfid error", error);
      alert("Xóa thẻ thất bại");
    }
  };

  const handleViewDevice = (deviceId) => {
    navigate("/devices/" + deviceId);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    const onScan = (data) => {
      setRfidScanInfo({
        uid: data.uid,
        mode: data.mode,
        device_id: data.device_id,
      });
    };

    const onRegistered = (data) => {
      setRegisteringDeviceId(null);
      setRfidRegisterInfo({
        uid: data.uid,
        device_id: data.device_id,
        status: data.status,
        message: data.status === "CREATED" ? "Đăng ký thẻ mới thành công!" : "Thẻ đã tồn tại trong hệ thống.",
        name: data.name,
      });

      // Cập nhật realtime danh sách thẻ cho thiết bị nếu đã được load
      if (data.device_id && data.status === "CREATED") {
        setDeviceRfids((prev) => {
          const current = prev[data.device_id] || [];
          const exists = current.some((r) => r.rf_id === data.uid);
          if (exists) return prev;
          return {
            ...prev,
            [data.device_id]: [...current, { rf_id: data.uid, name: data.name || undefined, _id: data.uid }],
          };
        });
      }
    };

    socket.on("client-rfid-scan", onScan);
    socket.on("client-rfid-registered", onRegistered);

    return () => {
      socket.off("client-rfid-scan", onScan);
      socket.off("client-rfid-registered", onRegistered);
    };
  }, []);

  return (
    <div className="devices-page">
      <div className="devices-header">
        <div>
          <h1>Device Management</h1>
          <p>Quản lý thiết bị và đăng ký thẻ RFID cho từng thiết bị</p>
        </div>
        <div className="devices-header-actions">
          <input
            type="text"
            placeholder="Nhập tên thiết bị mới"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
          />
          <button className="add-device-btn" onClick={handleCreateDevice} disabled={creating}>
            <FiPlus />
            {creating ? "Đang tạo..." : "Add Device"}
          </button>
        </div>
      </div>

      {/* RFID Realtime cho thiết bị */}
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

        {registeringDeviceId && <p className="rfid-status-waiting">Đang ở chế độ REGISTER...</p>}
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
              <th>Camera</th>
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
                  {device.chip_cam_id ? (<p>{device.chip_cam_id}</p>): ("Chưa có camera")}
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
                    <button className="action-btn" onClick={() => handleRegisterRfidForDevice(device.id)}>
                      {registeringDeviceId === device.id ? "Đang đăng ký RFID..." : "Thêm RFID"}
                    </button>
                    <button className="action-btn" onClick={() => handleViewRfids(device.id)}>
                      Xem thẻ
                    </button>
                    <button className="action-btn" onClick={() => handleViewDevice(device.id)}>
                      Xem chi tiết
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteDevice(device.id)}
                      disabled={deletingDeviceId === device.id}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  {deviceRfids[device.id] && deviceRfids[device.id].length > 0 && (
                    <div className="rfid-list">
                      <strong>RFID đã đăng ký:</strong>
                      <ul>
                        {deviceRfids[device.id].map((r) => (
                          <li key={r._id}>
                            {r.name ? `${r.name} (${r.rf_id})` : r.rf_id}{" "}
                            <button
                              className="rfid-delete-link"
                              onClick={() => handleDeleteRfidFromDevice(device.id, r._id)}
                            >
                              Xóa
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(DevicesPage);
