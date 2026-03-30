import { prisma } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";
import { AppError } from "../middleware/error-handler.js";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-min-32-characters!!";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-min-32-characters!!";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ?? "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ?? "7d";

export async function register(email: string, password: string, fullName: string, role?: "CUSTOMER" | "DEVELOPER") {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(password);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: role ?? "CUSTOMER",
      verifyToken,
      // Auto-verify in development (no email service configured)
      ...(process.env.NODE_ENV === "development" && { emailVerified: true }),
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return { user, verifyToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (user.isSuspended) {
    throw new AppError(403, "Your account has been suspended", "ACCOUNT_SUSPENDED");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  if (!user.emailVerified) {
    throw new AppError(403, "Please verify your email before logging in", "EMAIL_NOT_VERIFIED");
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload, ACCESS_SECRET, ACCESS_EXPIRY);
  const refreshToken = signRefreshToken(payload, REFRESH_SECRET, REFRESH_EXPIRY);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({ where: { verifyToken: token } });
  if (!user) {
    throw new AppError(400, "Invalid or expired verification token", "INVALID_TOKEN");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyToken: null },
  });

  return { message: "Email verified successfully" };
}

export async function refreshAccessToken(refreshTokenStr: string) {
  try {
    const payload = verifyToken(refreshTokenStr, REFRESH_SECRET);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.isSuspended) {
      throw new AppError(401, "Invalid refresh token", "INVALID_TOKEN");
    }

    const newPayload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(newPayload, ACCESS_SECRET, ACCESS_EXPIRY);
    const newRefreshToken = signRefreshToken(newPayload, REFRESH_SECRET, REFRESH_EXPIRY);

    return { accessToken, refreshToken: newRefreshToken };
  } catch {
    throw new AppError(401, "Invalid or expired refresh token", "INVALID_TOKEN");
  }
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return { message: "If an account exists, a reset email has been sent" };

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetTokenExp },
  });

  // TODO: Send email with reset link via Resend
  // For now, return token in dev mode
  return {
    message: "If an account exists, a reset email has been sent",
    ...(process.env.NODE_ENV === "development" && { resetToken }),
  };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(400, "Invalid or expired reset token", "INVALID_TOKEN");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExp: null },
  });

  return { message: "Password reset successfully" };
}
