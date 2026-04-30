import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import * as reviewController from "../controllers/review.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  shortDescription: z.string().max(300).optional(),
  description: z.string().min(20).max(10000),
  category: z.string().min(1),
  tags: z.array(z.string()).max(10).default([]),
  siteId: z.string().uuid().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  shortDescription: z.string().max(300).optional(),
  description: z.string().min(20).max(10000).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).max(10).optional(),
  logoUrl: z.string().url().optional(),
  screenshots: z.array(z.string().url()).max(5).optional(),
  siteId: z.string().uuid().optional(),
});

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0).optional(),
  features: z.array(z.string()).default([]),
  trialDays: z.number().int().min(0).max(30).default(0),
});

const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  priceMonthly: z.number().min(0).optional(),
  priceYearly: z.number().min(0).optional(),
  features: z.array(z.string()).optional(),
  trialDays: z.number().int().min(0).max(30).optional(),
  isActive: z.boolean().optional(),
});

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
});

// --- Public routes ---

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Browse marketplace products
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Search by name or description }
 *       - { in: query, name: category, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string, enum: [latest, popular, rating, name] } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 12 } }
 *     responses:
 *       200: { description: Paginated product list }
 *   post:
 *     tags: [Products]
 *     summary: Create a new product (developer)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, category]
 *             properties:
 *               name: { type: string }
 *               shortDescription: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               tags: { type: array, items: { type: string } }
 *               siteId: { type: string, format: uuid }
 *     responses:
 *       201: { description: Product created }
 */
router.get("/", productController.listMarketplaceProducts);

/**
 * @swagger
 * /products/catalog/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get product detail by slug (public)
 *     parameters:
 *       - { in: path, name: slug, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Product with developer, plans, and reviews }
 *       404: { description: Product not found }
 */
router.get("/catalog/:id", productController.getProductById);

/**
 * @swagger
 * /products/{productId}/plans:
 *   get:
 *     tags: [Products]
 *     summary: Get pricing plans for a product (public)
 *     parameters:
 *       - { in: path, name: productId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: List of pricing plans }
 *   post:
 *     tags: [Products]
 *     summary: Create a pricing plan (developer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: productId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, priceMonthly]
 *             properties:
 *               name: { type: string }
 *               priceMonthly: { type: number }
 *               priceYearly: { type: number }
 *               features: { type: array, items: { type: string } }
 *               trialDays: { type: integer }
 *     responses:
 *       201: { description: Plan created }
 */
router.get("/:productId/plans", productController.getProductPlans);

// --- Authenticated routes ---

/**
 * @swagger
 * /products/me:
 *   get:
 *     tags: [Products]
 *     summary: Get developer's own products
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Developer's product list }
 */
router.get("/me", authenticate, requireRole("DEVELOPER", "ADMIN"), productController.getDeveloperProducts);

/**
 * @swagger
 * /products/detail/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID (authenticated)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Product detail }
 */
router.get("/detail/:id", authenticate, productController.getProductById);

router.post("/", authenticate, requireRole("DEVELOPER", "ADMIN"), validate(createProductSchema), productController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a product (developer)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Updated product }
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (draft/rejected only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Product deleted }
 */
router.patch("/:id", authenticate, requireRole("DEVELOPER", "ADMIN"), validate(updateProductSchema), productController.updateProduct);
router.delete("/:id", authenticate, requireRole("DEVELOPER", "ADMIN"), productController.deleteProduct);

/**
 * @swagger
 * /products/{id}/submit:
 *   post:
 *     tags: [Products]
 *     summary: Submit product for review
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Product submitted for review }
 *       400: { description: Product needs at least one pricing plan }
 */
router.post("/:id/submit", authenticate, requireRole("DEVELOPER", "ADMIN"), productController.submitForReview);
router.post("/:id/unpublish", authenticate, requireRole("DEVELOPER", "ADMIN"), productController.unpublishProduct);

// --- Pricing plan routes ---

router.post("/:productId/plans", authenticate, requireRole("DEVELOPER", "ADMIN"), validate(createPlanSchema), productController.createPricingPlan);

/**
 * @swagger
 * /products/plans/{planId}:
 *   patch:
 *     tags: [Products]
 *     summary: Update a pricing plan
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: planId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Updated plan }
 *   delete:
 *     tags: [Products]
 *     summary: Delete a pricing plan
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: planId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Plan deleted }
 *       400: { description: Plan has active subscriptions }
 */
router.patch("/plans/:planId", authenticate, requireRole("DEVELOPER", "ADMIN"), validate(updatePlanSchema), productController.updatePricingPlan);
router.delete("/plans/:planId", authenticate, requireRole("DEVELOPER", "ADMIN"), productController.deletePricingPlan);

// --- Review routes ---
router.get("/:productId/reviews/me", authenticate, reviewController.getUserReview);
router.post("/:productId/reviews", authenticate, validate(createReviewSchema), reviewController.createReview);
router.patch("/reviews/:reviewId", authenticate, validate(updateReviewSchema), reviewController.updateReview);
router.delete("/reviews/:reviewId", authenticate, reviewController.deleteReview);

export default router;
