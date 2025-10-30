import { Request, Response } from "express";
import Device from "../models/device.model";

// Post /device
export const createDevice = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin tên thiết bị" });
    }

    const device = Device.create({ name });

    return res.status(201).json({ code: 201, message: "Tạo thiết bị thành công", result: device });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Delete /device/:device_id
export const deleteDevice = async (req: Request, res: Response) => {
  try {
    const device_id = req.params.device_id;

    const device = await Device.findByIdAndDelete(device_id);

    if (!device) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy thiết bị" });
    }

    return res.status(201).json({ code: 201, message: "Xóa thông tin thiết bị thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Post /device/:device_id/switch
export const switchModeDevice = async (req: Request, res: Response) => {
  try {
    const device_id = req.params.device_id;

    const device = await Device.findById(device_id);

    if (!device) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy thiết bị" });
    }

    const mode: "AND" | "OR" = device.mode === "AND" ? "OR" : "AND";

    device.mode = mode;
    await device.save();

    res.status(200).json({ code: 200, message: "Chuyển đổi chế độ thành công", result: { mode } });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};
