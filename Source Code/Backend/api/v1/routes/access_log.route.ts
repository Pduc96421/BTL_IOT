import { Router } from "express";
import * as AccessLogController from "../controllers/access_log.controller";

const route = Router();

// Get /access_log
route.get("/", AccessLogController.getAccessLogs);

export const accessLogRoute = route;
