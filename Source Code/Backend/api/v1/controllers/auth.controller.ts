import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../helpers/sendMail";

const JWT_SECRET = process.env.JWT_SECRET;

// Post api/v1/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select("+password +token");
    if (!user) {
      return res.status(404).json({ code: 404, message: "Không tìm thấy người dùng" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: "Sai mật khẩu" });
    }

    const token = user.token;
    return res.status(200).json({ code: 200, message: "Đăng nhập thành công", result: { token } });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Post api/v1/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ code: 400, message: "Thiếu thông tin đăng ký" });
    }

    const existedUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existedUser) {
      return res.status(409).json({ code: 409, message: "Tên đăng nhập hoặc email đã tồn tại" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, email, password: hashedPassword });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    user.token = token;
    await user.save();

    return res.status(201).json({ code: 201, message: "Đăng ký tài khoản thành công", result: user });
  } catch (error: any) {
    return res.status(500).json({ code: 500, message: "Lỗi máy chủ", error: error.message });
  }
};

// Post /api/v1/auth/alert
export const alert = async (req: Request, res: Response) => {
  try {
    const { rfid, deviceName, time } = req.body;

    // Email nhận cảnh báo (có thể sau này cho config trong DB)
    const email = "pduc96421@gmail.com";

    const subject = "Cảnh báo an ninh: Quẹt thẻ RFID thất bại nhiều lần";

    const formattedTime = time ? new Date(time).toLocaleString("vi-VN") : "Không rõ";

    const htmlSendMail = `
      <p>Hệ thống ghi nhận nhiều lần quẹt thẻ RFID <b>thất bại</b> liên tiếp.</p>
      <p>Thông tin chi tiết:</p>
      <ul>
        <li>RFID: <b>${rfid || "Không rõ"}</b></li>
        <li>Thiết bị: <b>${deviceName || "Không rõ"}</b></li>
        <li>Thời điểm ghi nhận gần nhất: <b>${formattedTime}</b></li>
      </ul>
      <p>Vui lòng kiểm tra khu vực xung quanh thiết bị ngay lập tức.</p>
    `;

    await sendEmail(email, subject, htmlSendMail);

    res.status(200).json({ code: 200, message: "Alert email sent successfully" });
  } catch (error: any) {
    res.status(500).send({ code: 500, error: error.message });
  }
};
