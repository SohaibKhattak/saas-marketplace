import { Router } from "express";
import * as developerController from "../controllers/developer.controller.js";
import * as analyticsController from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();

const applicationSchema = z.object({
  businessName: z.string().min(2).max(200),
  businessEmail: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional(),
  bio: z.string().max(1000).optional(),
});

const updateProfileSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  businessEmail: z.string().email().optional(),
  taxId: z.string().optional(),
  bio: z.string().max(1000).optional(),
});

// All developer routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /developers/apply:
 *   post:
 *     tags: [Developers]
 *     summary: Apply to become a developer
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [businessName, businessEmail]
 *             properties:
 *               businessName: { type: string }
 *               businessEmail: { type: string, format: email }
 *               taxId: { type: string }
 *               bio: { type: string, maxLength: 1000 }
 *     responses:
 *       201: { description: Application submitted }
 *       409: { description: Already applied }
 */
router.post("/apply", validate(applicationSchema), developerController.apply);

/**
 * @swagger
 * /developers/me:
 *   get:
 *     tags: [Developers]
 *     summary: Get developer profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Developer profile }
 *       404: { description: Not a developer }
 *   patch:
 *     tags: [Developers]
 *     summary: Update developer profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName: { type: string }
 *               businessEmail: { type: string, format: email }
 *               taxId: { type: string }
 *               bio: { type: string }
 *     responses:
 *       200: { description: Updated profile }
 */
router.get("/me", developerController.getProfile);
router.patch("/me", requireRole("DEVELOPER", "ADMIN"), validate(updateProfileSchema), developerController.updateProfile);
router.post("/stripe/connect", requireRole("DEVELOPER", "ADMIN"), developerController.setupStripeConnect);
router.get("/stripe/login-link", requireRole("DEVELOPER", "ADMIN"), developerController.createStripeLoginLink);

// GET /api/v1/developers/me/sites — redirects to /api/v1/wp/sites
router.get("/me/sites", requireRole("DEVELOPER", "ADMIN"), (req, res) => {
  res.redirect(307, "/api/v1/wp/sites");
});

// POST /api/v1/developers/me/sites — redirects to /api/v1/wp/sites
router.post("/me/sites", requireRole("DEVELOPER", "ADMIN"), (req, res) => {
  res.redirect(307, "/api/v1/wp/sites");
});

/**
 * @swagger
 * /developers/analytics:
 *   get:
 *     tags: [Developers]
 *     summary: Get developer analytics KPIs
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Developer analytics data }
 * /developers/analytics/revenue:
 *   get:
 *     tags: [Developers]
 *     summary: Get developer monthly revenue breakdown
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Monthly revenue data }
 * /developers/analytics/transactions:
 *   get:
 *     tags: [Developers]
 *     summary: Get developer transaction history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: Paginated transactions }
 */
router.get("/analytics", requireRole("DEVELOPER", "ADMIN"), analyticsController.getDeveloperAnalytics);
router.get("/analytics/revenue", requireRole("DEVELOPER", "ADMIN"), analyticsController.getDeveloperRevenueByMonth);
router.get("/analytics/transactions", requireRole("DEVELOPER", "ADMIN"), analyticsController.getDeveloperTransactions);

export default router;
