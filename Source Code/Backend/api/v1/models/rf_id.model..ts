import { model, Schema } from "mongoose";

const rfIdSchema = new Schema(
  {
    rf_id: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

const RfId = model("RfId", rfIdSchema, "rf_ids");
export default RfId; 
