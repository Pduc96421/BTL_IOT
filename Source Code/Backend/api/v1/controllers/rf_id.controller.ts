import { Request, Response } from "express";
import RfId from "../models/rf_id.model.";

// Post /rf_id/:lock_user_id
export const createRfId = async (req: Request, res: Response) => {
  try {
    const lock_user_id = req.params.lock_user_id;
    const { rf_id } = req.body;

    if (!rf_id) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin thẻ từ" });
    }

    await RfId.create({ rf_id, lock_user_id });

    return res.status(201).json({ code: 201, message: "Tạo rf_id thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Delete /rf_id/:rf_id
export const deleteRfID = async (req: Request, res: Response) => {
  try {
    const rf_id = req.params.rf_id;

    await RfId.deleteOne({ rf_id });

    return res.status(201).json({ code: 201, message: "xóa rf_id thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};
