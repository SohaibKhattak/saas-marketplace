import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as subscriptionService from "../services/subscription.service.js";
import * as stripeService from "../services/stripe.service.js";

export async function createCheckout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { pricingPlanId, billingCycle } = req.body;
    const result = await stripeService.createCheckoutSession(
      req.user!.userId,
      pricingPlanId,
      billingCycle ?? "MONTHLY"
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getMySubscriptions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { subscriptions, total } = await subscriptionService.getCustomerSubscriptions(
      req.user!.userId, page, limit
    );
    res.json({
      data: subscriptions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const subscription = await subscriptionService.getSubscriptionById(id as string, req.user!.userId);
    res.json({ data: subscription });
  } catch (err) {
    next(err);
  }
}

export async function cancelSubscription(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await stripeService.cancelSubscription(id as string, req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function switchPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { pricingPlanId, billingCycle } = req.body;
    const result = await stripeService.switchPlan(
      id as string, req.user!.userId, pricingPlanId, billingCycle ?? "MONTHLY"
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getBillingHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { transactions, total } = await subscriptionService.getBillingHistory(
      req.user!.userId, page, limit
    );
    res.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: total && total > 0 ? Math.ceil(total / limit) : 0 },
    });
  } catch (err) {
    next(err);
  }
}
