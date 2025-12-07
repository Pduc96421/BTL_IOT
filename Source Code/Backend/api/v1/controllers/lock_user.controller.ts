import { Request, Response } from "express";
import LockUser from "../models/lock_user.model";
import { startRegisterFace } from "../../../socket.io/socket";
import DeviceUser from "../models/device_user.model";

// Get /lock_user
export const getListLockUser = async (req: Request, res: Response) => {
  try {
    const lockUsers = await LockUser.find();

    return res.status(201).json({ code: 201, message: "Lấy người dùng thành công", result: lockUsers });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Get /lock_user/:lock_user_id
export const getLockUser = async (req: Request, res: Response) => {
  try {
    const lock_user_id = req.params.lock_user_id;
    const lockUser = await LockUser.findById(lock_user_id);

    return res.status(201).json({ code: 201, message: "Lấy người dùng thành công", result: lockUser });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Post /lock_user/
export const createLockUser = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin tên khóa người dùng" });
    }

    return res.status(201).json({ code: 201, message: "Thêm lock User thanh công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Post /lock_user/:lock_user_id/register_face
export const registerFaceLockUser = async (req: Request, res: Response) => {
  try {
    const lock_user_id = req.params.lock_user_id;
    const lockUser = await LockUser.findById(lock_user_id);

    if (!lockUser) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy khóa người dùng" });
    }

    startRegisterFace(lockUser.name);

    return res
      .status(201)
      .json({ code: 201, message: "Đã bắt đầu đăng ký lại khuôn mặt, hãy để mặt trước camera (ESP32)" });
  } catch (error) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Delete /lock_user/:lock_user_id
export const deletedLockUser = async (req: Request, res: Response) => {
  try {
    const lock_user_id = req.params.lock_user_id;

    const lockUser = await LockUser.findByIdAndDelete(lock_user_id);

    if (!lockUser) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy khóa người dùng" });
    }

    return res.status(201).json({ code: 201, message: "Xóa thông tin người dùng thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};
