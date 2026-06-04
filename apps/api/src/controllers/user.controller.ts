import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { pool } from "../config/database.js";
import { supabase, createAuthClient } from "../config/supabase.js";
import { AppError } from "../middleware/error-handler.js";

function logDebug(message: string, meta?: any) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug(`[user.controller] ${message}`, meta ?? '');
  }
}

const userSelectFields = `
  id,
  email,
  full_name as "fullName",
  role,
  avatar_url as "avatarUrl",
  email_verified as "emailVerified",
  profile_complete as "profileComplete",
  is_suspended as "isSuspended",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    console.log('Fetching user by ID')
    const userId = req.user!.userId;
    logDebug('Fetching user by ID', { userId });
    const result = await pool.query(
      `SELECT ${userSelectFields} FROM users WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      logDebug('User not found', { userId });
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    logDebug('Error in getMe', err);
    next(err);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    let { fullName } = req.body;
    logDebug('Updating user profile', { userId, fullName });

    // Validate fullName
    if (!fullName || typeof fullName !== 'string' || fullName.length < 2 || fullName.length > 255) {
      throw new AppError(400, "Full name must be between 2 and 255 characters", "INVALID_FULLNAME");
    }

    let avatarUrl: string | undefined = undefined;
    if (req.file) {
      const file = req.file;
      if (!file.mimetype.startsWith("image/")) {
        throw new AppError(400, "Only image files are allowed", "INVALID_AVATAR_TYPE");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new AppError(400, "Avatar image must be less than 5MB", "AVATAR_TOO_LARGE");
      }
      const ext = file.originalname.split('.').pop() || 'png';
      const filePath = `avatars/${userId}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });
      if (error) {
        logDebug('Supabase upload error', error);
        throw new AppError(500, "Failed to upload avatar", "AVATAR_UPLOAD_FAILED");
      }
      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      avatarUrl = publicUrlData?.publicUrl;
      if (!avatarUrl) {
        throw new AppError(500, "Failed to get avatar URL", "AVATAR_URL_FAILED");
      }
    }

    // Always use the same parameter order for SQL
    let updateQuery = 'UPDATE users SET full_name = $1, updated_at = NOW()';
    const values: any[] = [fullName];
    if (typeof avatarUrl === 'string') {
      updateQuery += ', avatar_url = $2';
      values.push(avatarUrl);
      updateQuery += ' WHERE id = $3 RETURNING ' + userSelectFields;
      values.push(userId);
    } else {
      updateQuery += ' WHERE id = $2 RETURNING ' + userSelectFields;
      values.push(userId);
    }

    logDebug('Profile update SQL', { updateQuery, values });
    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    res.json({ data: result.rows[0] });
  } catch (err: any) {
    logDebug('Error in updateMe', err?.stack || err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;
    logDebug('Attempting password change', { userId });
    // Get user details
    const { data: userAuth, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !userAuth.user) {
      logDebug('User not found for password change', { userId });
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    if (userAuth.user.app_metadata?.provider !== 'email') {
      logDebug('Password change attempted for non-email provider', { userId });
      throw new AppError(400, "Password changes are only supported for email/password accounts", "INVALID_PROVIDER");
    }
    const email = userAuth.user.email;
    if (!email) {
      logDebug('User email not found for password change', { userId });
      throw new AppError(400, "User email not found", "EMAIL_NOT_FOUND");
    }
    // Verify current password by attempting to sign in
    // Use an ephemeral client to avoid contaminating the shared service-role client's session.
    const authClient = createAuthClient();
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      logDebug('Incorrect current password', { userId });
      throw new AppError(400, "Incorrect current password", "INVALID_PASSWORD");
    }
    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateError) {
      logDebug('Failed to update password', { userId, updateError });
      throw new AppError(500, "Failed to update password", "UPDATE_FAILED");
    }
    logDebug('Password updated successfully', { userId });
    res.json({ data: { message: "Password updated successfully" } });
  } catch (err) {
    logDebug('Error in changePassword', err);
    next(err);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;
    logDebug('Listing users', { page, limit, role, search });
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
    res.json({
      data: queryObj.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countObj.rows[0].count),
        totalPages: Math.ceil(parseInt(countObj.rows[0].count) / limit),
      },
    });
  } catch (err) {
    logDebug('Error in listUsers', err);
    next(err);
  }
}

export async function suspendUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { suspend } = req.body;
    logDebug('Suspending user', { id, suspend });
    const check = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      logDebug('User not found for suspend', { id });
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    if (check.rows[0].role === "ADMIN") {
      logDebug('Attempt to suspend admin account', { id });
      throw new AppError(403, "Cannot suspend an admin account", "FORBIDDEN");
    }
    const result = await pool.query(
      `UPDATE users SET is_suspended = $1, updated_at = NOW() WHERE id = $2 RETURNING ${userSelectFields}`,
      [suspend, id]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    logDebug('Error in suspendUser', err);
    next(err);
  }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    logDebug('Deleting user', { id });
    const check = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      logDebug('User not found for delete', { id });
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }
    if (check.rows[0].role === "ADMIN") {
      logDebug('Attempt to delete admin account', { id });
      throw new AppError(403, "Cannot delete an admin account", "FORBIDDEN");
    }

    // can be soft delete too using isdeleted column in users table
    // await pool.query('UPDATE users SET is_deleted = true, updated_at = NOW() WHERE id = $1', [id]);

    // delete user from auth 
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      logDebug('Failed to delete user from auth', { id, error });
      throw new AppError(500, "Failed to delete user from auth", "DELETE_FAILED");
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    logDebug('User deleted successfully', { id });
    res.json({ data: { message: "User deleted successfully" } });
  } catch (err) {
    logDebug('Error in deleteUser', err);
    next(err);
  }
}
