import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, deleted: false }).select("+password +token");
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
