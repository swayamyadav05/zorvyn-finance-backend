import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/error.middleware";
import { authRateLimiter } from "./middleware/rateLimiter.middleware";
import { validate } from "./middleware/validate.middleware";
import authRouter from "./modules/auth/auth.routes";
import userRouter from "./modules/user/user.routes";
import recordRouter from "./modules/record/record.routes";
import dashboardRouter from "./modules/dashboard/dashboard.routes";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./modules/auth/auth.schema";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_ORIGIN === "*" ? true : env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server is up and running" });
});

app.use(
  "/api/v1/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);

app.use(
  "/api/v1/auth/register",
  authRateLimiter,
  validate(registerSchema),
);
app.use("/api/v1/auth/login", authRateLimiter, validate(loginSchema));
app.use("/api/v1/auth/refresh-token", validate(refreshTokenSchema));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/records", recordRouter);
app.use("/api/v1/dashboard", dashboardRouter);

app.use(errorHandler);

export default app;
