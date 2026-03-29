import { Router } from "express";

const router = Router();

// POST /api/v1/wordpress/verify-site (verify WP site)
router.post("/verify-site", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/v1/wordpress/check-access (check subscription access)
router.get("/check-access", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/v1/wordpress/provision-site (provision new WP subsite)
router.post("/provision-site", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export default router;
