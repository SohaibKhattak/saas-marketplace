import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { z } from "zod";

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
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/v1/auth/register
router.post("/register", validate(registerSchema), authController.register);

// POST /api/v1/auth/login
router.post("/login", validate(loginSchema), authController.login);

// POST /api/v1/auth/refresh
router.post("/refresh", authController.refresh);

// POST /api/v1/auth/verify-email
router.post("/verify-email", authController.verifyEmail);

// POST /api/v1/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword);

// POST /api/v1/auth/reset-password
router.post("/reset-password", authController.resetPassword);

// POST /api/v1/auth/logout
router.post("/logout", authController.logout);

export default router;
