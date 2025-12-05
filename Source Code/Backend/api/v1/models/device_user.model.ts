import { model, Schema } from "mongoose";

const deviceUserSchema = new Schema(
  {
    device_id: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    lock_user_id: { type: Schema.Types.ObjectId, ref: "LockUser" },
    rf_id: {type: Schema.Types.ObjectId, ref: "RfId" },
  },
  { timestamps: true },
);

const DeviceUser = model("DeviceUser", deviceUserSchema, "device_users");
export default DeviceUser;
