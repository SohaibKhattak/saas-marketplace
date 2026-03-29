import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as userService from "../services/user.service.js";

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await userService.getUserById(req.user!.userId);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { fullName, avatarUrl } = req.body;
    const user = await userService.updateProfile(req.user!.userId, { fullName, avatarUrl });
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user!.userId, currentPassword, newPassword);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    const { users, total } = await userService.listUsers(page, limit, role, search);
    res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function suspendUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { suspend } = req.body;
    const user = await userService.suspendUser(id as string, suspend);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}
