import { Request, Response } from "express";
import RfId from "../models/rf_id.model.";
import DeviceUser from "../models/device_user.model";
import { clearRegisterMode, getRfidState, startRegisterMode } from "../../../mqtt/rfidState";

// Post /rf_id/:device_id - tạo thẻ RFID thủ công cho 1 thiết bị
// Logic: 1) tìm (hoặc tạo) bản ghi thẻ trong RfId; 2) gán thẻ đó cho device thông qua DeviceUser
export const createRfId = async (req: Request, res: Response) => {
  try {
    const device_id = req.params.device_id;
    const { rf_id, name } = req.body;

    if (!rf_id || !device_id) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin thẻ hoặc thiết bị" });
    }

    let card = await RfId.findOne({ rf_id });
    if (!card) {
      card = await RfId.create({ rf_id, name });
    } else if (name && card.name !== name) {
      card.name = name;
      await card.save();
    }

    const existedMapping = await DeviceUser.findOne({ device_id, rf_id: card._id });
    if (existedMapping) {
      return res.status(200).json({ code: 200, message: "Thẻ đã được gán cho thiết bị này" });
    }

    await DeviceUser.create({ device_id, rf_id: card._id });

    return res.status(201).json({ code: 201, message: "Tạo rf_id và gán cho thiết bị thành công" });
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

// Delete /rf_id/device/:device_id/:rfid_id - xóa thẻ khỏi 1 thiết bị (không xóa thẻ khỏi hệ thống nếu còn dùng nơi khác)
export const deleteRfIdFromDevice = async (req: Request, res: Response) => {
  try {
    const device_id = req.params.device_id;
    const rfid_id = req.params.rfid_id;

    await DeviceUser.deleteOne({ device_id, rf_id: rfid_id });

    // Nếu thẻ này không còn gán với thiết bị nào khác thì có thể xóa luôn bản ghi RfId (tùy yêu cầu)
    const stillUsed = await DeviceUser.findOne({ rf_id: rfid_id });
    if (!stillUsed) {
      await RfId.findByIdAndDelete(rfid_id);
    }

    return res.status(200).json({ code: 200, message: "Xóa thẻ khỏi thiết bị thành công" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Get /rf_id/device/:device_id - lấy danh sách thẻ theo thiết bị
export const getRfIdByDevice = async (req: Request, res: Response) => {
  try {
    const device_id = req.params.device_id;

    const mappings = await DeviceUser.find({ device_id }).populate("rf_id");

    // Chỉ trả về thông tin thẻ cho FE, bỏ bớt metadata mapping
    const rfids = mappings
      .filter((m: any) => !!m.rf_id)
      .map((m: any) => ({
        rf_id: m.rf_id.rf_id,
        name: m.rf_id.name,
        _id: m.rf_id._id,
      }));

    return res.status(200).json({ code: 200, message: "Lấy danh sách thẻ thành công", result: rfids });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Post /rf_id/register_mode/:device_id
// FE (trang Device) gọi endpoint này trước khi bấm "Quét thẻ mới"
export const startRegisterCard = (req: Request, res: Response) => {
  try {
    const device_id = req.params.device_id;
    const { name } = req.body;

    if (!device_id) {
      return res.status(400).json({ code: 400, message: "Thiếu device_id" });
    }

    startRegisterMode(device_id, name);

    return res.status(200).json({
      code: 200,
      message: "Bật chế độ đăng ký thẻ, hãy quét thẻ trên thiết bị",
      result: { device_id, name },
    });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Post /rf_id/cancel_register
export const cancelRegisterCard = (req: Request, res: Response) => {
  try {
    clearRegisterMode();
    return res.status(200).json({ code: 200, message: "Hủy chế độ đăng ký thẻ" });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Get /rf_id/register_state
export const getRegisterState = (req: Request, res: Response) => {
  try {
    const state = getRfidState();
    return res.status(200).json({ code: 200, result: state });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};
