import { Request, Response } from "express";
import AccessLog from "../models/access_log.model";

// Get /access_log
// Optional query: method=RFID|FACE, result=SUCCESS|FALSE, device_id=...
export const getAccessLogs = async (req: Request, res: Response) => {
  try {
    const { method, result, device_id } = req.query;

    const filter: any = {};
    if (method && typeof method === "string") filter.method = method.toUpperCase();
    if (result && typeof result === "string") filter.result = result.toUpperCase();
    if (device_id && typeof device_id === "string") filter.device_id = device_id;

    const logs = await AccessLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("device_id");

    return res.status(200).json({ code: 200, message: "Lấy lịch sử thành công", result: logs });
  } catch (error: any) {
    return res
      .status(500)
      .json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};


