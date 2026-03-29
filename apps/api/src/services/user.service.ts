import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";
import { hashPassword, comparePassword } from "../utils/password.js";

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  emailVerified: true,
  isSuspended: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  return user;
}

export async function updateProfile(
  userId: string,
  data: { fullName?: string; avatarUrl?: string }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: userSelect,
  });

  return user;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new AppError(400, "Current password is incorrect", "INVALID_PASSWORD");
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { message: "Password changed successfully" };
}

export async function listUsers(
  page: number,
  limit: number,
  role?: string,
  search?: string
) {
  const where: any = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSelect,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function suspendUser(userId: string, suspend: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  if (user.role === "ADMIN") {
    throw new AppError(403, "Cannot suspend an admin account", "FORBIDDEN");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isSuspended: suspend },
    select: userSelect,
  });
}
