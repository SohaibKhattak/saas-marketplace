import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/database.js";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { sendPasswordResetEmail } from "../services/email.service.js";
import type { AuthRequest } from "../middleware/auth.js";
import { ensureUsersAuthColumns } from "../utils/db-upgrades.js";

// Token refresh is handled by Supabase Auth. No backend refresh endpoint needed, but route expects a function.
// Login is handled by Supabase Auth. No backend login endpoint needed, but route expects a function.
export async function refresh(_req: Request, res: Response) {
  res.status(501).json({ error: { message: "Token refresh is handled by Supabase Auth.", code: "NOT_IMPLEMENTED" } });
}
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: { message: "Email is required", code: "VALIDATION_ERROR" } });
    }

    // Generate link with Supabase Admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${env.FRONTEND_URL}/reset-password`,
      },
    });

    // We don't expose if the email exists for security reasons
    if (!error && data?.properties?.action_link) {
      // Send the Action Link via Nodemailer
      await sendPasswordResetEmail(email, data.properties.action_link);
    }

    res.json({
      data: { message: "If an account with that email exists, we sent a password reset link." },
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    // Safely enforce parsing token only from the request body for security.
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: { message: "Token and new password are required", code: "VALIDATION_ERROR" } });
    }

    // Since we receive an access_token from the recovery link, verify it by getting the user
    // The recovery link gives us an authenticated session token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: { message: "Invalid or expired reset token", code: "INVALID_TOKEN" } });
    }

    // Now that we verified the token belongs to a user, update their password via admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: password
    });

    if (updateError) {
      return res.status(400).json({ error: { message: updateError.message, code: "PASSWORD_UPDATE_FAILED" } });
    }

    res.json({ data: { message: "Password updated successfully" } });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
  }
}
export async function login(req: Request, res: Response) {
  try {
    // await ensureUsersAuthColumns();

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: { message: "Email and password are required", code: "VALIDATION_ERROR" } });
    }

    const existingUser = await pool.query(
      `SELECT auth_provider as "authProvider"
       FROM users
       WHERE email = $1`,
      [email]
    );
    if (existingUser.rows[0]?.authProvider === "GOOGLE") {
      return res.status(403).json({
        error: {
          message: "This email is registered with Google Sign-In. Please continue with Google.",
          code: "AUTH_METHOD_MISMATCH",
        },
      });
    }

    // Sign in with Supabase Auth (user pool)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      return res.status(401).json({ error: { message: error?.message || "Invalid credentials", code: "INVALID_CREDENTIALS" } });
    }

    // Fetch user from local DB for role and profile info
    const queryRes = await pool.query(
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
      [data.user.id]
    );
    const user = queryRes.rows[0];
    if (!user) {
      return res.status(403).json({ error: { message: "User not found in local database", code: "USER_NOT_FOUND" } });
    }

    if (user.authProvider === "GOOGLE") {
      return res.status(403).json({
        error: {
          message: "This account is registered with Google Sign-In. Please continue with Google.",
          code: "AUTH_METHOD_MISMATCH",
        },
      });
    }

    // Return access token and user info
    res.json({
      data: {
        accessToken: data.session.access_token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          profileComplete: user.profileComplete,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
  }
}

// Registration endpoint: creates user in Supabase Auth and sends verification email
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    await ensureUsersAuthColumns();

    const { email, password, fullName, role, businessName, businessEmail } = req.body;

    const existingUser = await pool.query(
      `SELECT auth_provider as "authProvider"
       FROM users
       WHERE email = $1`,
      [email]
    );
    if (existingUser.rows[0]?.authProvider === "GOOGLE") {
      return res.status(409).json({
        error: {
          message: "This email is already registered with Google Sign-In.",
          code: "EMAIL_EXISTS_DIFFERENT_METHOD",
        },
      });
    }

    // 1. Create user in Supabase Auth (triggers verification email via signUp)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          business_name: businessName,
          business_email: businessEmail,
          auth_provider: "PASSWORD",
        },
      },
    });
    if (error) {
      if (error.message.includes("already registered")) {
        return res.status(409).json({ error: { message: "Email already exists", code: "EMAIL_EXISTS" } });
      }
      console.log("Supabase error during registration:", error);
      return res.status(400).json({ error: { message: error.message, code: "SUPABASE_ERROR" } });
    }
    // 2. Wait for user to verify email and be inserted into local users table by trigger
    // 3. Optionally, if developer, try to create developer profile if user exists
    let developerProfileCreated = false;
    if (role === "DEVELOPER" && businessName) {
      // Try to find user (may not exist yet if not verified)
      const uRes = await pool.query('SELECT id, email, full_name as "fullName", role, avatar_url as "avatarUrl" FROM users WHERE email = $1', [email]);
      const userObj = uRes.rows[0];
      if (userObj) {
        const dpRes = await pool.query('SELECT id FROM developer_profiles WHERE user_id = $1', [userObj.id]);
        const existingProfile = dpRes.rows[0];
        if (!existingProfile) {
          await pool.query(
            `INSERT INTO developer_profiles(user_id, business_name, business_email, application_status)
             VALUES ($1, $2, $3, 'PENDING')`,
            [userObj.id, businessName, businessEmail || email]
          );
          developerProfileCreated = true;
        }
      }
    }
    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
      developerProfileCreated,
    });
  } catch (err) {
    next(err);
  }
}

// Login is handled by Supabase Auth. No backend login endpoint needed.

// Token refresh is handled by Supabase Auth.

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    // Optionally, you can implement email verification logic if you want to support custom verification
    // Otherwise, Supabase handles email verification
    res.status(501).json({ error: { message: "Email verification is handled by Supabase Auth.", code: "NOT_IMPLEMENTED" } });
  } catch (err) {
    next(err);
  }
}

// Password reset is handled by Supabase Auth.

// Password reset is handled by Supabase Auth.

export async function logout(_req: Request, res: Response) {
  res.clearCookie("refreshToken", { path: "/api/v1/auth/refresh" });
  res.json({ data: { message: "Logged out successfully" } });
}

export async function completeOnboarding(req: AuthRequest, res: Response, next: NextFunction) {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: { message: "Authentication required", code: "UNAUTHORIZED" } });
    }

    const { role, fullName, avatarUrl, businessName, businessEmail } = req.body;

    const currentUserResult = await client.query(
      `SELECT id, email, auth_provider as "authProvider", profile_complete as "profileComplete"
       FROM users
       WHERE id = $1`,
      [userId]
    );
    const currentUser = currentUserResult.rows[0];

    if (!currentUser) {
      return res.status(404).json({ error: { message: "User not found", code: "USER_NOT_FOUND" } });
    }

    if (currentUser.authProvider !== "GOOGLE") {
      return res.status(403).json({
        error: {
          message: "Onboarding completion endpoint is only for Google Sign-In users.",
          code: "AUTH_METHOD_MISMATCH",
        },
      });
    }

    await client.query("BEGIN");
    transactionStarted = true;

    const updatedUserResult = await client.query(
      `UPDATE users
       SET
         full_name = $1,
         role = $2,
         avatar_url = COALESCE($3, avatar_url),
         profile_complete = true,
         updated_at = NOW()
       WHERE id = $4
       RETURNING
         id,
         email,
         full_name as "fullName",
         role,
         auth_provider as "authProvider",
         avatar_url as "avatarUrl",
         profile_complete as "profileComplete"`,
      [fullName, role, avatarUrl || null, userId]
    );

    if (role === "DEVELOPER") {
      await client.query(
        `INSERT INTO developer_profiles (user_id, business_name, business_email, application_status)
         VALUES ($1, $2, $3, 'PENDING')
         ON CONFLICT (user_id)
         DO UPDATE SET
           business_name = EXCLUDED.business_name,
           business_email = EXCLUDED.business_email,
           updated_at = NOW()`,
        [userId, businessName, businessEmail || currentUser.email]
      );
    }

    await client.query("COMMIT");

    res.json({
      data: {
        user: updatedUserResult.rows[0],
        profileCompleted: true,
      },
    });
  } catch (err) {
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }
    next(err);
  } finally {
    client.release();
  }
}
