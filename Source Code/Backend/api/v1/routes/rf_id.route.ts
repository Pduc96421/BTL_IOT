import { Router } from "express";
import * as RfIdController from "../controllers/rf_id.controller";

const route = Router();

route.post("/:device_id", RfIdController.createRfId);
route.delete("/:rf_id", RfIdController.deleteRfID);
route.post("/register_mode/:device_id", RfIdController.startRegisterCard);
route.post("/cancel_register", RfIdController.cancelRegisterCard);
route.get("/register_state", RfIdController.getRegisterState);
route.get("/device/:device_id", RfIdController.getRfIdByDevice);
route.delete("/device/:device_id/:rfid_id", RfIdController.deleteRfIdFromDevice);

export const rfIdRoute = route;
