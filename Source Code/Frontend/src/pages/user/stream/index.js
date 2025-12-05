import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useParams } from "react-router-dom"; // 👈 lấy param từ URL
import "./FaceLock.scss";

const SOCKET_URL = "http://localhost:8080";
let socket = null;

function FaceLock() {
  const { lock_user_id } = useParams(); // 👈 /lock_user/:lock_user_id/...
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("Chưa đăng ký");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(SOCKET_URL, { transports: ["websocket"] });
    }

    // Nhận frame từ ESP32
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

    // ĐĂNG KÝ XONG
    socket.on("register_done", (data) => {
      setRegistering(false);
      setStatus(`Đăng ký thành công: ${data.name}`);
    });

    // ĐĂNG KÝ THẤT BẠI (trùng mặt / lỗi)
    socket.on("register_failed", (data) => {
      if (data.reason === "face_exists") {
        setRegistering(false);
        setStatus(`Khuôn mặt này đã tồn tại: ${data.existName} (score=${data.score.toFixed(2)})`);
        alert(`Khuôn mặt này đã được đăng ký là: ${data.existName}`);
      } else {
        setRegistering(false);
        setStatus("Đăng ký thất bại");
      }
    });

    // KẾT QUẢ NHẬN DIỆN (đang không dùng để set status)
    socket.on("recognize_result", (data) => {
      const { name, score } = data;
      // nếu muốn có thể log ra:
      // console.log("recognize_result", name, score);
    });

    return () => {
      if (socket) {
        socket.off("esp_frame");
        socket.off("register_progress");
        socket.off("register_done");
        socket.off("register_failed");
        socket.off("recognize_result");
      }
    };
  }, []);

  // Gọi API Node để bắt đầu đăng ký
  const handleRegister = async () => {
    if (!lock_user_id) {
      alert("Không tìm thấy lock_user_id trên URL");
      return;
    }

    try {
      setRegistering(true);
      setStatus("Đang đăng ký... Hãy nhìn vào camera");

      // ❌ KHÔNG dùng `:id` trong URL thực
      // ✅ URL thật:
      await axios.post(`${SOCKET_URL}/api/v1/lock_user/${lock_user_id}/register_face`);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gọi API register-start");
      setRegistering(false);
    }
  };

  return (
    <div className="face-lock">
      <div className="face-lock__card">
        <h2 className="face-lock__title">Đăng ký khuôn mặt</h2>
        <p className="face-lock__subtitle">
          Hãy đứng trước camera ESP32-CAM, nhìn thẳng vào camera trong quá trình thu thập.
        </p>

        {/* Video từ ESP32 */}
        <div className="face-lock__video">
          {image ? (
            <div className="face-lock__video-wrapper">
              <img src={image} alt="ESP32 frame" className="face-lock__video-img" />
              <span className="face-lock__badge face-lock__badge--live">LIVE</span>
            </div>
          ) : (
            <div className="face-lock__video-placeholder">
              <div className="face-lock__video-icon">📷</div>
              <p>Đang chờ tín hiệu từ ESP32-CAM...</p>
            </div>
          )}
        </div>

        {/* Status */}
        <p className="face-lock__status">
          <b>Trạng thái:</b> {status}
        </p>

        {/* Button đăng ký khuôn mặt */}
        <div className="face-lock__form">
          <button
            onClick={handleRegister}
            disabled={registering}
            className={`face-lock__button ${
              registering ? "face-lock__button--disabled" : "face-lock__button--primary"
            }`}
          >
            {registering ? "Đang thu thập..." : "Đăng ký khuôn mặt"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FaceLock;
