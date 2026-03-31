import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as notificationService from "../services/notification.service.js";

export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { notifications, total, unreadCount } = await notificationService.getUserNotifications(
      req.user!.userId, page, limit
    );
    res.json({
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await notificationService.markAsRead(req.user!.userId, id as string);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await notificationService.markAllAsRead(req.user!.userId);
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    res.json({ data: { count } });
  } catch (err) {
    next(err);
  }
}
