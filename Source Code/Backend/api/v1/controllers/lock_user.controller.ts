import { Request, Response } from "express";
import LockUser from "../models/lock_user.model";

// Post /lock_user/
export const createLockUser = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if(!name){
      return res.status(400).json({ code: 400, message: "Thiếu thông tin tên khóa người dùng" });
    }

    const lockUser = LockUser.create({ name });

    return res.status(201).json({code: 201, message: "Tạo khóa người dùng thành công", result: lockUser });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Delete /lock_user/:lock_user_id
export const deletedLockUser = async (req: Request, res: Response) => {
  try {
    const lock_user_id = req.params.lock_user_id;

    const lockUser = await LockUser.findByIdAndDelete(lock_user_id);

    if(!lockUser){
      return res.status(404).json({ code: 404, message: "Không tìm thấy khóa người dùng" });
    }

    return res.status(201).json({code: 201, message: "Xóa thông tin người dùng thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
}