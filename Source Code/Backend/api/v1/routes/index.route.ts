import { Express } from "express";
import { authRoute } from "./auth.route";
import { lockUserRoute } from "./lock_user.route";
import { deviceRoute } from "./device.route";
import { faceRoute } from "./face_id.route";
import { rfIdRoute } from "./rf_id.route";

export const routeApiV1 = (app: Express): void => {
  const version = "/api/v1";
  app.use(version + "/auth", authRoute);
  app.use(version + "/lock_user", lockUserRoute);
  app.use(version + "/device", deviceRoute);
  app.use(version + "/face", faceRoute);
  app.use(version + "/rf_id", rfIdRoute);
};
