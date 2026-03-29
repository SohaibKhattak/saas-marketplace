import { Router } from "express";
import type { Request, Response } from "express";
import { stripe } from "../config/stripe.js";
import * as stripeService from "../services/stripe.service.js";

const router = Router();

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     tags: [Webhooks]
 *     summary: Stripe webhook endpoint
 *     description: Handles checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted events
 *     responses:
 *       200: { description: Webhook received }
 *       400: { description: Invalid signature }
 */
// Note: express.raw() is applied to /api/v1/webhooks in index.ts before express.json()
router.post("/stripe", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    res.status(400).json({ error: { message: "Missing signature or webhook secret" } });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).json({ error: { message: `Webhook Error: ${err.message}` } });
    return;
  }

  try {
    await stripeService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    // Return 200 anyway to prevent Stripe from retrying
    res.json({ received: true, error: "Handler failed" });
  }
});

export default router;
