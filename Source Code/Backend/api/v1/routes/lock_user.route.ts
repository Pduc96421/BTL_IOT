import { Router } from "express";
import * as lockUserController from "../controllers/lock_user.controller";

const route = Router();

route.get("/", lockUserController.getListLockUser);
route.get("/:lock_user_id", lockUserController.getLockUser);
route.post("/", lockUserController.createLockUser);
route.delete("/:lock_user_id", lockUserController.deletedLockUser);

export const lockUserRoute = route;
