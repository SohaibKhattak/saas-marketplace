import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { AppError } from "./error-handler.js";
import { env } from "../config/env.js";

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken(token, ACCESS_SECRET);
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}
