import { Express } from "express";
import { authRoute } from "./auth.route";
import { lockUserRoute } from "./lock_user.route";
import { deviceRoute } from "./device.route";
import { rfIdRoute } from "./rf_id.route";
import { accessLogRoute } from "./access_log.route";
import { deviceUserRoute } from "./device_user.route";

export const routeApiV1 = (app: Express): void => {
  const version = "/api/v1";
  app.use(version + "/auth", authRoute);
  app.use(version + "/lock_user", lockUserRoute);
  app.use(version + "/device", deviceRoute);
  app.use(version + "/rf_id", rfIdRoute);
  app.use(version + "/access_log", accessLogRoute);
  app.use(version + "/device_user", deviceUserRoute);
};
