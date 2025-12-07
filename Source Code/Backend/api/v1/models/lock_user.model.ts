import { model, Schema } from "mongoose";

const lockUserSchema = new Schema(
  {
    name: { type: String, unique: true },
    embedding: [Number],
  },
  { timestamps: true },
);

const LockUser = model("LockUser", lockUserSchema, "lock_users");
export default LockUser;
