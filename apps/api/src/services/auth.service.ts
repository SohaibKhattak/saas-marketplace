import { pool } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

export async function register(
  email: string,
  fullName: string,
  role?: "CUSTOMER" | "DEVELOPER",
  developerData?: { businessName?: string; businessEmail?: string }
) {
  // Registration is now handled by Supabase Auth.
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const existing = res.rows[0];
  if (!existing) {
    throw new AppError(404, "User must be created via Supabase Auth", "USER_NOT_FOUND");
  }
  // If registering as developer, create DeveloperProfile with PENDING status
  if (role === "DEVELOPER" && developerData?.businessName) {
    await pool.query(
      `INSERT INTO developer_profiles(user_id, business_name, business_email, application_status) 
       VALUES ($1, $2, $3, 'PENDING')`,
      [existing.id, developerData.businessName, developerData.businessEmail || email]
    );
  }
  return { user: existing };
}

export async function verifyEmail(token: string) {
  // verifyEmail would typically look this up in Supabase or a local token mapping table.
  const res = await pool.query('SELECT * FROM users WHERE verify_token = $1', [token]);
  const user = res.rows[0];
  if (!user) {
    throw new AppError(400, "This verification link has already been used or is invalid. If you already verified, you can sign in.", "INVALID_TOKEN");
  }

  if (user.email_verified) {
    return { message: "Email already verified" };
  }

  await pool.query('UPDATE users SET email_verified = true, verify_token = null WHERE id = $1', [user.id]);

  return { message: "Email verified successfully" };
}

