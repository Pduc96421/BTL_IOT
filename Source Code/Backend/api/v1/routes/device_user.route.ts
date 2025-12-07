import { Router } from "express";
import * as deviceUserController from "../controllers/device_user.controller";

const route = Router();

route.post("/:lock_user_id/register_to_device", deviceUserController.registerUserToDevice);
route.get("/:device_id/lock_users/unassigned", deviceUserController.getUnassignedLockUsersForDevice);

export const deviceUserRoute = route;
