import { Express } from "express";
import { authRoute } from "./auth.route";

export const routeApiV1 = (app: Express): void => {
  const version = "/api/v1";
  app.use(version + "/auth", authRoute);
};
