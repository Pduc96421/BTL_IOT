import { model, Schema } from "mongoose";

const deviceSchema = new Schema(
  {
    name: { type: String },
    mode: { type: String, enum: ["AND", "OR"], default: "OR" },
    status: {type: String, enum: ["OPEN", "CLOSE"], default: "OPEN"},
  },
  { timestamps: true },
);

const Device = model("Device", deviceSchema, "devices");
export default Device;
