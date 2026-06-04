import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { pool } from "../config/database.js";
import { ensureUsersAuthColumns } from "../utils/db-upgrades.js";

// POST /api/v1/auth/google/session
// Receives { access_token } from frontend after Google OAuth
export async function googleSession(req: Request, res: Response) {
  try {
    await ensureUsersAuthColumns();

    const { access_token } = req.body;
    if (!access_token) {
      return res.status(400).json({ error: { message: "Missing access_token" } });
    }
    // Get user info from Supabase
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    if (error || !user) {
      return res.status(401).json({ error: { message: error?.message || "Invalid token" } });
    }

    const isGoogleProvider =
      user.app_metadata?.provider === "google" ||
      (Array.isArray((user as any).identities) && (user as any).identities.some((i: any) => i?.provider === "google"));

    // Find user in local DB
    const dbRes = await pool.query(
      `SELECT
        id,
        email,
        full_name as "fullName",
        role,
        auth_provider as "authProvider",
        avatar_url as "avatarUrl",
        profile_complete as "profileComplete"
       FROM users
       WHERE id = $1`,
      [user.id]
    );
    let dbUser = dbRes.rows[0];

    if (!dbUser) {
      // Should not happen if trigger works, but fallback: create user
      await pool.query(
        `INSERT INTO users (id, email, full_name, role, auth_provider, email_verified, profile_complete)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          user.id,
          user.email,
          user.user_metadata?.full_name || "",
          null,
          "GOOGLE",
          true,
          false,
        ]
      );
      dbUser = (
        await pool.query(
          `SELECT
            id,
            email,
            full_name as "fullName",
            role,
            auth_provider as "authProvider",
            avatar_url as "avatarUrl",
            profile_complete as "profileComplete"
           FROM users
           WHERE id = $1`,
          [user.id]
        )
      ).rows[0];
    }

    // Auto-heal legacy rows created before auth_provider migration for Google users.
    if (isGoogleProvider && dbUser.authProvider !== "GOOGLE" && !dbUser.profileComplete) {
      dbUser = (
        await pool.query(
          `UPDATE users
           SET auth_provider = 'GOOGLE',
               role = NULL,
               profile_complete = false,
               email_verified = true,
               updated_at = NOW()
           WHERE id = $1
           RETURNING
             id,
             email,
             full_name as "fullName",
             role,
             auth_provider as "authProvider",
             avatar_url as "avatarUrl",
             profile_complete as "profileComplete"`,
          [user.id]
        )
      ).rows[0];
    }

    if (dbUser.authProvider !== "GOOGLE") {
      return res.status(403).json({
        error: {
          message: "This account is registered with email/password. Use traditional login.",
          code: "AUTH_METHOD_MISMATCH",
        },
      });
    }

    res.json({
      data: {
        accessToken: access_token,
        user: dbUser,
        requiresOnboarding: !dbUser.profileComplete,
      },
    });
  } catch (err) {
    console.error("Google session error:", err);
    res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
  }
}
