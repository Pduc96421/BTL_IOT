import { Router } from "express";
import * as faceController from "../controllers/face_id.controller";

const route = Router();

route.post("/:lock_user_id", faceController.createFace);
route.delete("/:lock_user_id", faceController.deleteFace);

export const faceRoute = route;
