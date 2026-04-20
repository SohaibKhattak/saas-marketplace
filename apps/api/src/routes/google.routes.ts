import { Router } from "express";
import * as googleController from "../controllers/google.controller.js";
import * as googleSessionController from "../controllers/google.session.controller.js";

const router = Router();

// Start Google OAuth
router.get("/google", googleController.googleAuthStart);
// Handle Google OAuth callback
router.get("/google/callback", googleController.googleAuthCallback);
// Exchange Google OAuth tokens for app session
router.post("/google/session", googleSessionController.googleSession);

export default router;
