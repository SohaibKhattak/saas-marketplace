import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { avatarUpload } from "../middleware/avatar-upload.js";

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: User profile }
 *   patch:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200: { description: Updated user }
 */
router.get("/me", userController.getMe);
router.patch("/me", avatarUpload.single("avatar"), userController.updateMe);

/**
 * @swagger
 * /users/me/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change current user's password
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed }
 *       401: { description: Current password incorrect }
 */
router.post("/me/change-password", userController.changePassword);

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: List all users (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: role, schema: { type: string, enum: [CUSTOMER, DEVELOPER, ADMIN] } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *     responses:
 *       200: { description: Paginated user list }
 */
router.get("/", requireRole("ADMIN"), userController.listUsers);

/**
 * @swagger
 * /users/{id}/suspend:
 *   patch:
 *     tags: [Admin - Users]
 *     summary: Suspend or unsuspend a user (admin only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isSuspended: { type: boolean }
 *     responses:
 *       200: { description: User suspension updated }
 */
router.patch("/:id/suspend", requireRole("ADMIN"), userController.suspendUser);

export default router;
