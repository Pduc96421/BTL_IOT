import { model, Schema } from "mongoose";

const lockUserSchema = new Schema(
  {
    name: { type: String },
    role: { type: String },
  },
  { timestamps: true },
);

const LockUser = model("LockUser", lockUserSchema, "lock_users");
export default LockUser;
