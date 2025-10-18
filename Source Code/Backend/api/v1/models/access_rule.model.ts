import { model, Schema } from "mongoose";

const accessRuleSchema = new Schema(
  {
    device_id: { type: String, required: true },
    lock_user_id: { type: Schema.Types.ObjectId, ref: "LockUser", required: true },
    allowed_methods: { type: Object },
  },
  { timestamps: true },
);

const AccessRule = model("AccessRule", accessRuleSchema, "access_rules");
export default AccessRule;
