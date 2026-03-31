import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as reviewService from "../services/review.service.js";

export async function createReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const review = await reviewService.createReview(req.user!.userId, productId as string, req.body);
    res.status(201).json({ data: review });
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reviewId } = req.params;
    const review = await reviewService.updateReview(req.user!.userId, reviewId as string, req.body);
    res.json({ data: review });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reviewId } = req.params;
    const result = await reviewService.deleteReview(req.user!.userId, reviewId as string);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUserReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const review = await reviewService.getUserReviewForProduct(req.user!.userId, productId as string);
    res.json({ data: review });
  } catch (err) {
    next(err);
  }
}
