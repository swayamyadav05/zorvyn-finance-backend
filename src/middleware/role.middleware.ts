import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import type { UserRole } from "../config/constants";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(" or ")}`,
        ),
      );
    }

    next();
  };
};
