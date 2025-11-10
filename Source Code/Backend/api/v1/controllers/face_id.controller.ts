import { Request, Response } from "express";
import FaceId from "../models/face_id.model";

// Post /face/:lock_user_id
export const createFace = async (req: Request, res: Response) => {
  try {
    const lock_user_id = req.params.lock_user_id;
    const { face_id } = req.body;

    if (!face_id) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin face" });
    }

    await FaceId.create({ face_id, lock_user_id });

    return res.status(201).json({ code: 201, message: "Tạo face thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Delete /face/:lock_user_id
export const deleteFace = async (req: Request, res: Response) => {
  try {
    const lock_user_id = req.params.lock_user_id;

    await FaceId.deleteOne({ lock_user_id });

    return res.status(201).json({ code: 201, message: "xóa face thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};
