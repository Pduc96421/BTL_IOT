import * as database from "./config/database";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();
database.connect();

import { routeApiV1 } from "./api/v1/routes/index.route";

const port: number | string = process.env.PORT;

import { io, app, server } from "./socket.io/socket";

app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));

routeApiV1(app);

server.listen(port, () => console.log(`App listening on port ${port}`));
