import { Router } from "express";
import * as deviceController from "../controllers/device.controller";

const route = Router();

route.get("/", deviceController.getListDevice);
route.get("/:device_id", deviceController.getDevice);
route.post("/", deviceController.createDevice);
route.delete("/:device_id", deviceController.deleteDevice);
route.post("/:device_id/switch_mode", deviceController.switchModeDevice);
route.post("/:device_id/switch_door", deviceController.switchDoorDevice);

export const deviceRoute = route;
