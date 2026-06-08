import express, { Application, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { IndexRoutes } from "./app/routes";
import cors from "cors";
import { success } from "better-auth";
import { error } from "node:console";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import path from "path";
import { envVars } from "./app/config/env";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      envVars.BETTER_AUTH_URL,
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", toNodeHandler(auth));

//Enable url-encoded form data parsin
app.use(express.urlencoded({ extended: true }));

//middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", IndexRoutes);

app.get("/", async (req: Request, res: Response) => {
  res.status(201).json({
    success: true,
    message: "Healthcare API is working",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
