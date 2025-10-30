import { model, Schema } from "mongoose";

const accessLogModel = new Schema(
  {
    device_id: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    lock_user_id: { type: Schema.Types.ObjectId, ref: "LockUser" },
    tag_code: { type: String },
    face_code: { type: String },
    method: { type: String, required: true },
    result: { type: String, required: true },
  },
  { timestamps: true },
);

const AccessLog = model("AccessLog", accessLogModel, "access_logs");
export default AccessLog;
