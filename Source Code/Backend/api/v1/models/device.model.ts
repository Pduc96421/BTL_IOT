import { model, Schema } from "mongoose";

const deviceSchema = new Schema(
  {
    name: { type: String },
    mode: { type: String, enum: ["AND", "OR"], default: "OR" },
  },
  { timestamps: true },
);

const Device = model("Device", deviceSchema, "devices");
export default Device;
