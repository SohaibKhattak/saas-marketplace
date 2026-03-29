import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import * as userController from "../controllers/user.controller.js";
import * as developerController from "../controllers/developer.controller.js";
import * as productController from "../controllers/product.controller.js";
import * as analyticsController from "../controllers/analytics.controller.js";
import { z } from "zod";

const router = Router();

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

const productReviewSchema = z.object({
  status: z.enum(["PUBLISHED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

const createPayoutSchema = z.object({
  developerId: z.string().uuid(),
  amount: z.number().positive(),
  periodStart: z.string(),
  periodEnd: z.string(),
});

const updatePayoutStatusSchema = z.object({
  status: z.enum(["PROCESSING", "COMPLETED", "FAILED"]),
});

// All admin routes require auth + ADMIN role
router.use(authenticate, requireRole("ADMIN"));

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: role, schema: { type: string, enum: [CUSTOMER, DEVELOPER, ADMIN] } }
 *       - { in: query, name: page, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated user list }
 * /admin/users/{id}/suspend:
 *   patch:
 *     tags: [Admin]
 *     summary: Suspend or unsuspend a user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Updated user }
 */
router.get("/users", userController.listUsers);
router.patch("/users/:id/suspend", userController.suspendUser);

/**
 * @swagger
 * /admin/developers/applications:
 *   get:
 *     tags: [Admin]
 *     summary: List pending developer applications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pending applications }
 * /admin/developers/{id}/review:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve or reject a developer application
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [APPROVED, REJECTED] }
 *               rejectionReason: { type: string }
 *     responses:
 *       200: { description: Application reviewed }
 */
router.get("/developers/applications", developerController.listApplications);
router.patch("/developers/:id/review", validate(reviewSchema), developerController.reviewApplication);

/**
 * @swagger
 * /admin/products/moderation:
 *   get:
 *     tags: [Admin]
 *     summary: List products pending review
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Pending products }
 * /admin/products/{id}/review:
 *   patch:
 *     tags: [Admin]
 *     summary: Approve or reject a product
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PUBLISHED, REJECTED] }
 *               rejectionReason: { type: string }
 *     responses:
 *       200: { description: Product reviewed }
 */
router.get("/products/moderation", productController.listPendingProducts);
router.patch("/products/:id/review", validate(productReviewSchema), productController.reviewProduct);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform KPIs
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Platform analytics }
 * /admin/analytics/revenue:
 *   get:
 *     tags: [Admin]
 *     summary: Get monthly revenue breakdown
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Monthly revenue data }
 * /admin/analytics/transactions:
 *   get:
 *     tags: [Admin]
 *     summary: Get recent transactions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Last 10 transactions }
 */
router.get("/analytics", analyticsController.getPlatformKPIs);
router.get("/analytics/revenue", analyticsController.getRevenueByMonth);
router.get("/analytics/transactions", analyticsController.getRecentTransactions);

/**
 * @swagger
 * /admin/payouts:
 *   get:
 *     tags: [Admin]
 *     summary: List all payouts
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated payout list }
 *   post:
 *     tags: [Admin]
 *     summary: Create a payout record
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [developerId, amount, periodStart, periodEnd]
 *             properties:
 *               developerId: { type: string, format: uuid }
 *               amount: { type: number }
 *               periodStart: { type: string, format: date }
 *               periodEnd: { type: string, format: date }
 *     responses:
 *       201: { description: Payout created }
 * /admin/payouts/summary:
 *   get:
 *     tags: [Admin]
 *     summary: Get developer payout balances
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Developer balance summary }
 * /admin/payouts/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Update payout status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PROCESSING, COMPLETED, FAILED] }
 *     responses:
 *       200: { description: Payout status updated }
 */
router.get("/payouts", analyticsController.listPayouts);
router.get("/payouts/summary", analyticsController.getPayoutSummary);
router.post("/payouts", validate(createPayoutSchema), analyticsController.createPayout);
router.patch("/payouts/:id/status", validate(updatePayoutStatusSchema), analyticsController.updatePayoutStatus);

/**
 * @swagger
 * /admin/reports:
 *   get:
 *     tags: [Admin]
 *     summary: Generate financial report
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: startDate, required: true, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, required: true, schema: { type: string, format: date } }
 *     responses:
 *       200: { description: Report with CSV data and totals }
 * /admin/reports/download:
 *   get:
 *     tags: [Admin]
 *     summary: Download financial report as CSV
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: startDate, required: true, schema: { type: string, format: date } }
 *       - { in: query, name: endDate, required: true, schema: { type: string, format: date } }
 *     responses:
 *       200: { description: CSV file download }
 */
router.get("/reports", analyticsController.generateReport);
router.get("/reports/download", analyticsController.downloadReport);

export default router;
