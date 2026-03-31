import { prisma } from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt.js";
import { AppError } from "../middleware/error-handler.js";
import { env } from "../config/env.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "./email.service.js";
import crypto from "crypto";

const ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY = env.JWT_ACCESS_EXPIRY;
const REFRESH_EXPIRY = env.JWT_REFRESH_EXPIRY;

export async function register(
  email: string,
  password: string,
  fullName: string,
  role?: "CUSTOMER" | "DEVELOPER",
  developerData?: { businessName?: string; businessEmail?: string }
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "An account with this email already exists", "EMAIL_EXISTS");
  }

  const passwordHash = await hashPassword(password);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: role ?? "CUSTOMER",
        verifyToken,
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

    // If registering as developer, create DeveloperProfile with PENDING status
    if (role === "DEVELOPER" && developerData?.businessName) {
      await tx.developerProfile.create({
        data: {
          userId: newUser.id,
          businessName: developerData.businessName,
          businessEmail: developerData.businessEmail || email,
          applicationStatus: "PENDING",
        },
      });
    }

    return newUser;
  });

  // Send verification email
  try {
    await sendVerificationEmail(email, verifyToken);
  } catch (err) {
    console.error("Failed to send verification email:", err);
  }

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
  const user = await prisma.user.findUnique({ where: { verifyToken: token } });
  if (!user) {
    // Token already consumed — check if the user already verified via this token
    // (token was set to null after successful verification)
    throw new AppError(400, "This verification link has already been used or is invalid. If you already verified, you can sign in.", "INVALID_TOKEN");
  }

  if (user.emailVerified) {
    return { message: "Email already verified" };
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

  // Send password reset email
  try {
    await sendPasswordResetEmail(email, resetToken);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
  }

  return { message: "If an account exists, a reset email has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { resetToken: token },
  });

  if (!user || !user.resetTokenExp || user.resetTokenExp <= new Date()) {
    throw new AppError(400, "Invalid or expired reset token", "INVALID_TOKEN");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExp: null },
  });

  return { message: "Password reset successfully" };
}
