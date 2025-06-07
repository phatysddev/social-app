import express, { Express } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import router from "./routes/route";
import { errorController, notFoundController } from "./controllers/error.controller";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(cookieParser());
// Routes
app.use("/api/v1", router);
app.use("/uploads", express.static("uploads"));
// Error handling
app.use(errorController);
app.use(notFoundController);

export default app;
