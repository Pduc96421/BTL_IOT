import { Request, Response } from "express";
import LockUser from "../models/lock_user.model";
import DeviceUser from "../models/device_user.model";

// Post /device/:lock_user_id/register_to_device/
export const registerUserToDevice = async (req: Request, res: Response) => {
  try {
    const { lock_user_id } = req.params;
    const { device_id } = req.body;

    // 1. Kiểm tra lock_user có tồn tại
    const lockUser = await LockUser.findById(lock_user_id);
    if (!lockUser) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy khóa người dùng" });
    }

    // 2. Kiểm tra device_id
    if (!device_id) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin device_id" });
    }

    // 3. Upsert theo cặp (device_id, lock_user_id)
    //    - Nếu đã có: chỉ $set lại 2 trường này (thực ra không đổi gì),
    //      rf_id vẫn giữ nguyên
    //    - Nếu chưa có: tạo mới doc với device_id + lock_user_id, rf_id = null
    const deviceUser = await DeviceUser.findOneAndUpdate(
      { device_id, lock_user_id }, // filter theo cặp
      { $set: { device_id, lock_user_id } }, // KHÔNG đụng tới rf_id
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(201).json({
      code: 201,
      message: "Đăng ký người dùng vào thiết bị thành công",
      result: deviceUser,
    });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// GET /device/:device_id/lock_users/unassigned
export const getUnassignedLockUsersForDevice = async (req: Request, res: Response) => {
  try {
    const { device_id } = req.params;

    if (!device_id) {
      return res.status(400).json({
        code: 400,
        message: "Thiếu thông tin device_id",
      });
    }

    // 1. Lấy tất cả lock_user_id đã được gán cho device này
    const assignedLockUserIds = await DeviceUser.find({
      device_id,
      lock_user_id: { $ne: null },
    }).distinct("lock_user_id");

    // 2. Lấy tất cả LockUser mà _id NOT IN danh sách trên
    const lockUsers = await LockUser.find({
      _id: { $nin: assignedLockUserIds as any[] },
      embedding: { $exists: true, $ne: [] },
    });

    return res
      .status(200)
      .json({ code: 200, message: "Lấy danh sách LockUser chưa gán vào thiết bị thành công", result: lockUsers });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};
