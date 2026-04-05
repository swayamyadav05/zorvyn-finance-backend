import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/auth/auth.service";
import { ApiError } from "../utils/ApiError";

declare global {
  namespace Express {
    interface Request {
      user: {
        userId: string;
        role: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("No token provided"));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(ApiError.unauthorized("No token provided"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};
