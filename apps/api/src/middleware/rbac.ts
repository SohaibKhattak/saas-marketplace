import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import { AppError } from "./error-handler.js";

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, "You do not have permission to access this resource", "FORBIDDEN")
      );
    }

    next();
  };
}
