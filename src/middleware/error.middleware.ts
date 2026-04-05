import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ApiError) {
    logger.warn(
      `[${req.method}] ${req.path} - ${err.statusCode}: ${err.message}`,
    );

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  if (
    (err as NodeJS.ErrnoException & { code?: number }).code === 11000
  ) {
    res.status(409).json({
      success: false,
      message: "A resource with this value already exists",
    });
    return;
  }

  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
    return;
  }

  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      message: "Token has expired",
    });
    return;
  }

  logger.error(`Unhandled error on [${req.method}] ${req.path}`, {
    message: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message,
  });
};
