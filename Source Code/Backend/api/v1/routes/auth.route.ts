import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as authMiddleware from "../../../middlewares/auth.middleware";

const route = Router();

route.post("/login", authController.login);
route.post("/register", authController.register);

export const authRoute = route;
