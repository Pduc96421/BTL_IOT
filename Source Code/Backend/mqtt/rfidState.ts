import { Types } from "mongoose";

export type RfidMode = "NORMAL" | "REGISTER";

let mode: RfidMode = "NORMAL";
let currentLockUserId: Types.ObjectId | null = null;

export function startRegisterMode(lockUserId: string) {
  mode = "REGISTER";
  currentLockUserId = new Types.ObjectId(lockUserId);
}

export function clearRegisterMode() {
  mode = "NORMAL";
  currentLockUserId = null;
}

export function getRfidState() {
  return { mode, currentLockUserId };
}


