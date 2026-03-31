import { Router } from "express";
import * as subscriptionController from "../controllers/subscription.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();

const checkoutSchema = z.object({
  pricingPlanId: z.string().uuid(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

const switchPlanSchema = z.object({
  pricingPlanId: z.string().uuid(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
});

// All subscription routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /subscriptions/me:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get current user's subscriptions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of subscriptions with product details }
 * /subscriptions/me/billing:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get billing/transaction history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: Paginated transaction history }
 */
router.get("/me", subscriptionController.getMySubscriptions);
router.get("/me/billing", subscriptionController.getBillingHistory);

/**
 * @swagger
 * /subscriptions/checkout:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create Stripe Checkout session
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pricingPlanId]
 *             properties:
 *               pricingPlanId: { type: string, format: uuid }
 *               billingCycle: { type: string, enum: [MONTHLY, YEARLY], default: MONTHLY }
 *     responses:
 *       200: { description: Returns Stripe Checkout URL }
 *       409: { description: Already subscribed to this product }
 */
router.post("/checkout", validate(checkoutSchema), subscriptionController.createCheckout);

/**
 * @swagger
 * /subscriptions/{id}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get subscription by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Subscription detail }
 * /subscriptions/{id}/cancel:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Cancel subscription at period end
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Subscription will cancel at period end }
 */
router.get("/:id", subscriptionController.getSubscription);
router.post("/:id/cancel", subscriptionController.cancelSubscription);
router.post("/:id/switch", validate(switchPlanSchema), subscriptionController.switchPlan);

export default router;
