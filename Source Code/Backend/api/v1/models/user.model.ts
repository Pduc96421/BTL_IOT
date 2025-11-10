import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN"], default: "ADMIN" },
    token: { type: String, select: false },
  },
  { timestamps: true },
);

const User = model("User", userSchema, "users");
export default User;
