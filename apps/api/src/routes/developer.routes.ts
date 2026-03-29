import { Router } from "express";

const router = Router();

// POST /api/v1/developers/apply (apply as developer)
router.post("/apply", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/v1/developers/me (developer profile)
router.get("/me", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// PATCH /api/v1/developers/me (update developer profile)
router.patch("/me", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/v1/developers/me/sites (list developer's WP sites)
router.get("/me/sites", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/v1/developers/me/sites (register new site)
router.post("/me/sites", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export default router;
