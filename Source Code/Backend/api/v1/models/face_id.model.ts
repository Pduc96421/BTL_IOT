import { model, Schema } from "mongoose";

const faceIdSchema = new Schema(
  {
    face_id: { type: String, required: true, unique: true },
    lock_user: { type: Schema.Types.ObjectId, ref: "LockUser", required: true },
  },
  { timestamps: true },
);

const FaceId = model("FaceId", faceIdSchema, "face_ids");
export default FaceId; 
