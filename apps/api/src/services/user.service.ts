import { pool } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

// Reusable SQL select string matching the old Prisma columns
const userSelectFields = `
  id,
  email,
  full_name as "fullName",
  role,
  avatar_url as "avatarUrl",
  email_verified as "emailVerified",
  is_suspended as "isSuspended",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

export async function getUserById(userId: string) {
  const result = await pool.query(
    `SELECT ${userSelectFields} FROM users WHERE id = $1`,
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  return result.rows[0];
}

export async function updateProfile(
  userId: string,
  data: { fullName?: string; avatarUrl?: string }
) {
  let query = 'UPDATE users SET updated_at = NOW()';
  const values: any[] = [userId];
  
  if (data.fullName !== undefined) {
    values.push(data.fullName);
    query += `, full_name = $${values.length}`;
  }
  if (data.avatarUrl !== undefined) {
    values.push(data.avatarUrl);
    query += `, avatar_url = $${values.length}`;
  }
  
  query += ` WHERE id = $1 RETURNING ${userSelectFields}`;
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  // Get user details
  const { data: userAuth, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !userAuth.user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  
  if (userAuth.user.app_metadata?.provider !== 'email') {
    throw new AppError(400, "Password changes are only supported for email/password accounts", "INVALID_PROVIDER");
  }

  const email = userAuth.user.email;
  if (!email) {
    throw new AppError(400, "User email not found", "EMAIL_NOT_FOUND");
  }

  // Verify current password by attempting to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    throw new AppError(400, "Incorrect current password", "INVALID_PASSWORD");
  }

  // Update password using admin API
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    throw new AppError(500, "Failed to update password", "UPDATE_FAILED");
  }

  return { message: "Password updated successfully" };
}

export async function listUsers(
  page: number,
  limit: number,
  role?: string,
  search?: string
) {
  const offset = (page - 1) * limit;
  let whereClause = '1=1';
  const values: any[] = [];
  
  if (role) {
    values.push(role);
    whereClause += ` AND role = $${values.length}`;
  }
  if (search) {
    values.push(`%${search}%`);
    whereClause += ` AND (full_name ILIKE $${values.length} OR email ILIKE $${values.length})`;
  }

  const queryObj = await pool.query(
    `SELECT ${userSelectFields} FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, offset]
  );
  
  const countObj = await pool.query(`SELECT COUNT(*) FROM users WHERE ${whereClause}`, values);

  return { users: queryObj.rows, total: parseInt(countObj.rows[0].count) };
}

export async function suspendUser(userId: string, suspend: boolean) {
  const check = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (check.rows.length === 0) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  if (check.rows[0].role === "ADMIN") {
    throw new AppError(403, "Cannot suspend an admin account", "FORBIDDEN");
  }

  const result = await pool.query(
    `UPDATE users SET is_suspended = $1, updated_at = NOW() WHERE id = $2 RETURNING ${userSelectFields}`,
    [suspend, userId]
  );

  return result.rows[0];
}

export async function deleteUser(userId: string) {
  const check = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (check.rows.length === 0) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  if (check.rows[0].role === "ADMIN") {
    throw new AppError(403, "Cannot delete an admin account", "FORBIDDEN");
  }

  // Deleting from auth.users (Supabase needs admin API), but for now, we just delete purely from public.users
  // Real implementation needs Supabase SDK to delete Auth user as well
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);

  return { message: "User deleted successfully" };
}
