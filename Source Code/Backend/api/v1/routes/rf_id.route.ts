import { Router } from "express";
import * as RfIdController from "../controllers/rf_id.controller";

const route = Router();

route.post("/:lock_user_id", RfIdController.createRfId);
route.delete("/:rf_id", RfIdController.deleteRfID);

export const rfIdRoute = route;
