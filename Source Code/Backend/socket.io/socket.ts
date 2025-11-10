import { Server, Socket } from "socket.io";
import http from "http";
import express, { Express } from "express";

const app: Express = express();
const server = http.createServer(app);

const io = new Server(server, { cors: { origin: process.env.CORS_ORIGIN } });

export { io, app, server };
