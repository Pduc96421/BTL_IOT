import { model, Schema } from "mongoose";

const rfIdSchema = new Schema(
  {
    rf_id: { type: String, required: true, unique: true },
    name: { type: String }, // nhãn thân thiện cho thẻ, để hiển thị ở FE
  },
  { timestamps: true },
);

const RfId = model("RfId", rfIdSchema, "rf_ids");
export default RfId;
