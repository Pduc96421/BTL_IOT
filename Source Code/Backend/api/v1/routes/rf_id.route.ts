import { Router } from "express";
import * as RfIdController from "../controllers/rf_id.controller";

const route = Router();

route.post("/:lock_user_id", RfIdController.createRfId);
route.delete("/:rf_id", RfIdController.deleteRfID);
route.post("/register_mode/:lock_user_id", RfIdController.startRegisterCard);
route.post("/cancel_register", RfIdController.cancelRegisterCard);
route.get("/register_state", RfIdController.getRegisterState);

export const rfIdRoute = route;
