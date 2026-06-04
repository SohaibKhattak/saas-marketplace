import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { authRateLimit } from "../middleware/rate-limit.js";
import { authenticate } from "../middleware/auth.js";
import { z } from "zod";
import { login } from "../controllers/auth.controller.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  fullName: z.string().min(2).max(100),
  role: z.enum(["CUSTOMER", "DEVELOPER"]).optional(),
  // Developer-specific fields (required when role=DEVELOPER)
  businessName: z.string().min(2).max(200).optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
}).refine(
  (data) => data.role !== "DEVELOPER" || (data.businessName && data.businessName.length >= 2),
  { message: "Business name is required for developer accounts", path: ["businessName"] }
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const completeOnboardingSchema = z.object({
  role: z.enum(["CUSTOMER", "DEVELOPER"]),
  fullName: z.string().min(2).max(100),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  businessName: z.string().min(2).max(200).optional(),
  businessEmail: z.string().email().optional().or(z.literal("")),
}).refine(
  (data) => data.role !== "DEVELOPER" || !!data.businessName,
  { message: "Business name is required for developer accounts", path: ["businessName"] }
);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               fullName: { type: string }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already exists }
 */
router.post("/register", authRateLimit.register, validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Returns access token and user object }
 *       401: { description: Invalid credentials }
 */
router.post("/login", login, validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using httpOnly cookie
 *     responses:
 *       200: { description: New access token }
 *       401: { description: Invalid or expired refresh token }
 */
router.post("/refresh", authController.refresh);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200: { description: Email verified }
 */
router.post("/verify-email", authController.verifyEmail);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Reset email sent (always returns 200) }
 */
router.post("/forgot-password", validate(z.object({ email: z.string().email() })), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password reset successfully }
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and clear refresh token cookie
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/onboarding/complete:
 *   post:
 *     tags: [Auth]
 *     summary: Complete onboarding for Google Sign-In users by selecting role and profile data
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role, fullName]
 *             properties:
 *               role: { type: string, enum: [CUSTOMER, DEVELOPER] }
 *               fullName: { type: string }
 *               avatarUrl: { type: string }
 *               businessName: { type: string }
 *               businessEmail: { type: string, format: email }
 *     responses:
 *       200: { description: Onboarding completed }
 */
router.post(
  "/onboarding/complete",
  authenticate,
  validate(completeOnboardingSchema),
  authController.completeOnboarding
);

export default router;
