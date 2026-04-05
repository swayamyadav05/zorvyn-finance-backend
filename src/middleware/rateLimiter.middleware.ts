import rateLimit from "express-rate-limit";
import type {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

const passThroughMiddleware: RequestHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction,
) => next();

export const authRateLimiter =
  env.NODE_ENV === "test"
    ? passThroughMiddleware
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) => {
          const error = new ApiError(
            429,
            "Too many requests. Please try again after 15 minutes.",
          );
          res.status(429).json({
            success: false,
            message: error.message,
          });
        },
      });
