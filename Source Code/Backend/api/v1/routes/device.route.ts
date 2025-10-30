import { Router } from "express";
import * as deviceController from "../controllers/device.controller";

const route = Router();

route.post("/", deviceController.createDevice);
route.delete("/:device_id", deviceController.deleteDevice);
route.post("/:device_id/switch", deviceController.switchModeDevice);

export const deviceRoute = route;
