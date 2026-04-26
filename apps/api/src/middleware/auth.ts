import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error-handler.js";
import { supabase } from "../config/supabase.js";
import { pool } from "../config/database.js";
import { ensureUsersAuthColumns } from "../utils/db-upgrades.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string | null;
    authProvider: "PASSWORD" | "GOOGLE";
    profileComplete: boolean;
    file?: Express.Multer.File; // Add file property for avatar uploads
  };
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
  }

  const token = authHeader.slice(7);

  try {
    await ensureUsersAuthColumns();

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
    }

    const userResult = await pool.query(
      `SELECT id, role, auth_provider as "authProvider", profile_complete as "profileComplete", is_suspended as "isSuspended"
       FROM users
       WHERE id = $1`,
      [data.user.id]
    );

    const dbUser = userResult.rows[0];
    if (!dbUser) {
      return next(new AppError(401, "User not found in local database", "USER_NOT_FOUND"));
    }

    if (dbUser.isSuspended) {
      return next(new AppError(403, "Account is suspended", "ACCOUNT_SUSPENDED"));
    }

    req.user = {
      userId: dbUser.id,
      role: dbUser.role,
      authProvider: dbUser.authProvider,
      profileComplete: dbUser.profileComplete,
    };

    const isOnboardingCompleteEndpoint = req.originalUrl.includes("/api/v1/auth/onboarding/complete") || req.originalUrl.includes("/change-password") || req.originalUrl.includes("/users/me") || req.originalUrl.includes("/subscriptions/me");
    if (!dbUser.profileComplete && !isOnboardingCompleteEndpoint) {
      return next(new AppError(403, "Profile onboarding is incomplete", "PROFILE_INCOMPLETE"));
    }

    next();
  } catch (err) {
    next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}
