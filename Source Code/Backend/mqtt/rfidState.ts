import { Types } from "mongoose";

export type RfidMode = "NORMAL" | "REGISTER";

// Lưu state đăng ký thẻ theo thiết bị (device)
let mode: RfidMode = "NORMAL";
let currentDeviceId: Types.ObjectId | null = null;
let pendingName: string | null = null; // tên nhãn FE gửi lên khi thêm thẻ

export function startRegisterMode(deviceId: string, name?: string) {
  mode = "REGISTER";
  currentDeviceId = new Types.ObjectId(deviceId);
  pendingName = name ?? null;
}

export function clearRegisterMode() {
  mode = "NORMAL";
  currentDeviceId = null;
  pendingName = null;
}

export function getRfidState() {
  return { mode, currentDeviceId, pendingName };
}

