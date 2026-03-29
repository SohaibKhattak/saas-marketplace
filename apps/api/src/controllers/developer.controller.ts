import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as developerService from "../services/developer.service.js";

export async function apply(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await developerService.applyAsDeveloper(req.user!.userId, req.body);
    res.status(201).json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await developerService.getDeveloperProfile(req.user!.userId);
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const profile = await developerService.updateDeveloperProfile(req.user!.userId, req.body);
    res.json({ data: profile });
  } catch (err) {
    next(err);
  }
}

export async function listApplications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { applications, total } = await developerService.listPendingApplications(page, limit);
    res.json({
      data: applications,
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

export async function reviewApplication(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const result = await developerService.reviewApplication(
      id as string,
      req.user!.userId,
      { status, rejectionReason }
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}
