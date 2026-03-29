import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import * as wordpressService from "../services/wordpress.service.js";

const router = Router();

/**
 * @swagger
 * /wp/check-access:
 *   get:
 *     tags: [WordPress]
 *     summary: Check subscription access for a WP subsite (called by MU-plugin)
 *     parameters:
 *       - { in: query, name: user_email, required: true, schema: { type: string } }
 *       - { in: query, name: site_slug, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Access check result with plan tier }
 *       400: { description: Missing parameters }
 */
router.get("/check-access", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_email, site_slug } = req.query;
    if (!user_email || !site_slug) {
      res.status(400).json({ error: { message: "user_email and site_slug are required" } });
      return;
    }
    const result = await wordpressService.checkSubscriptionAccess(
      user_email as string,
      site_slug as string
    );
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

// --- Authenticated routes below ---
router.use(authenticate);

/**
 * @swagger
 * /wp/sites:
 *   get:
 *     tags: [WordPress]
 *     summary: List developer's WordPress sites
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of WordPress subsites }
 *   post:
 *     tags: [WordPress]
 *     summary: Provision a new WordPress subsite
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subdomain]
 *             properties:
 *               subdomain: { type: string, pattern: "^[a-z0-9-]+$" }
 *     responses:
 *       201: { description: Site provisioned }
 *       400: { description: Invalid subdomain or developer not approved }
 */
router.get("/sites", requireRole("DEVELOPER", "ADMIN"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const profile = await (await import("../services/developer.service.js")).getDeveloperProfile(req.user!.userId);
    const sites = await wordpressService.getDeveloperSites(profile.id);
    res.json({ data: sites });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/wp/sites — provision a new WordPress subsite
router.post("/sites", requireRole("DEVELOPER", "ADMIN"), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { subdomain } = req.body;
    if (!subdomain) {
      res.status(400).json({ error: { message: "subdomain is required" } });
      return;
    }
    const profile = await (await import("../services/developer.service.js")).getDeveloperProfile(req.user!.userId);
    const site = await wordpressService.provisionSite(profile.id, subdomain);
    res.status(201).json({ data: site });
  } catch (err) {
    next(err);
  }
});

export default router;
