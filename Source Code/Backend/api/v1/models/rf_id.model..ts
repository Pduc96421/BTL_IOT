import { model, Schema } from "mongoose";

const rfIdSchema = new Schema(
  {
    rf_id: { type: String, required: true, unique: true },
    lock_user_id: { type: Schema.Types.ObjectId, ref: "LockUser", required: true },
  },
  { timestamps: true },
);

const RfId = model("RfId", rfIdSchema, "rf_ids");
export default RfId; 
