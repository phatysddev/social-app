import "dotenv/config";
import http, { Server } from "http";

import app from "./app";

const server: Server = http.createServer(app);
const port: string = process.env.PORT || process.env.APP_PORT || "3000";

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
