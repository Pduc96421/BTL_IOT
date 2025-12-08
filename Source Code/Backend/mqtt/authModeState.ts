// src/mqtt/authModeState.ts

const WINDOW_MS = 10_000; // 10 giây để kết hợp RFID + FACE

interface DeviceAuthState {
  rfidOk: boolean;
  faceOk: boolean;
  rfidAt?: number;
  faceAt?: number;
}

const authState: Record<string, DeviceAuthState> = {};

/**
 * Gọi khi RFID quét thành công cho 1 device
 * @returns true nếu sau khi RFID success, đủ điều kiện mở cửa (AND)
 */
export function onRFIDSuccess(deviceId: string): boolean {
  const now = Date.now();
  let st = authState[deviceId];
  if (!st) {
    st = { rfidOk: false, faceOk: false };
    authState[deviceId] = st;
  }

  st.rfidOk = true;
  st.rfidAt = now;

  return checkAndConsume(deviceId, now);
}

/**
 * Gọi khi FaceID nhận diện thành công cho 1 device
 * @returns true nếu sau khi FaceID success, đủ điều kiện mở cửa (AND)
 */
export function onFaceSuccess(deviceId: string): boolean {
  const now = Date.now();
  let st = authState[deviceId];
  if (!st) {
    st = { rfidOk: false, faceOk: false };
    authState[deviceId] = st;
  }

  st.faceOk = true;
  st.faceAt = now;

  return checkAndConsume(deviceId, now);
}

// Kiểm tra xem trong WINDOW_MS, cả RFID và FACE đều OK hay chưa.
// Nếu đủ, reset state và trả về true (cho mở cửa).
function checkAndConsume(deviceId: string, now: number): boolean {
  const st = authState[deviceId];
  if (!st) return false;

  if (!st.rfidOk || !st.faceOk || !st.rfidAt || !st.faceAt) {
    return false;
  }

  // Cả 2 phải nằm trong khoảng WINDOW_MS
  if (now - st.rfidAt > WINDOW_MS || now - st.faceAt > WINDOW_MS) {
    // Hết hạn, reset
    st.rfidOk = false;
    st.faceOk = false;
    st.rfidAt = undefined;
    st.faceAt = undefined;
    return false;
  }

  // Đủ điều kiện -> tiêu thụ và reset
  st.rfidOk = false;
  st.faceOk = false;
  st.rfidAt = undefined;
  st.faceAt = undefined;
  return true;
}
