import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const SOCKET_URL = "http://localhost:8080";

let socket = null;

function FaceLock() {
  const [image, setImage] = useState(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Chưa đăng ký");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, { transports: ["websocket"] });
    }

    socket.on("esp_frame", (data) => {
      setImage(data.image);
    });

    // TIẾN ĐỘ ĐĂNG KÝ
    socket.on("register_progress", (data) => {
      if (data.no_face) {
        setStatus("Đang đăng ký: Không thấy mặt, hãy đứng gần camera hơn...");
      } else {
        setStatus(`Đang thu thập ${data.current}/${data.total} frame cho ${data.name}...`);
      }
    });

    socket.on("register_done", (data) => {
      setRegistering(false);
      setStatus(`Đăng ký thành công: ${data.name}`);
    });

    // KẾT QUẢ NHẬN DIỆN
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
        socket.off("register_progress");
        socket.off("register_done");
        socket.off("recognize_result");
      }
    };
  }, []);

  // Gọi API Node để bắt đầu đăng ký
  const handleRegister = async () => {
    if (!name.trim()) {
      alert("Bạn phải nhập tên");
      return;
    }

    try {
      setRegistering(true);
      setStatus("Đang đăng ký... Hãy nhìn vào camera");

      await axios.post(`${SOCKET_URL}/api/v1/lock_user`, {
        name,
      });
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gọi API register-start");
      setRegistering(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Hệ thống khóa cửa bằng khuôn mặt</h2>

      {/* Video từ ESP32 */}
      <div style={{ marginBottom: 20 }}>
        {image ? <img src={image} alt="ESP32 frame" style={{ width: 300, borderRadius: 8 }} /> : <p>Đang chờ ảnh...</p>}
      </div>

      {/* Form đăng ký khuôn mặt */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Nhập tên để đăng ký"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={registering}
          style={{
            padding: 8,
            marginRight: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleRegister}
          disabled={registering}
          style={{
            padding: "8px 15px",
            borderRadius: 6,
            background: registering ? "#aaa" : "#007bff",
            color: "white",
            border: "none",
          }}
        >
          {registering ? "Đang thu thập..." : "Đăng ký khuôn mặt"}
        </button>
      </div>

      {/* Status */}
      <p>
        <b>Trạng thái:</b> {status}
      </p>
    </div>
  );
}

export default FaceLock;
