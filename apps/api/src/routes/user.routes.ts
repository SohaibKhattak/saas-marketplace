import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/v1/users/me
router.get("/me", userController.getMe);

// PATCH /api/v1/users/me
router.patch("/me", userController.updateMe);

// POST /api/v1/users/me/change-password
router.post("/me/change-password", userController.changePassword);

// Admin routes
// GET /api/v1/users
router.get("/", requireRole("ADMIN"), userController.listUsers);

// PATCH /api/v1/users/:id/suspend
router.patch("/:id/suspend", requireRole("ADMIN"), userController.suspendUser);

export default router;
