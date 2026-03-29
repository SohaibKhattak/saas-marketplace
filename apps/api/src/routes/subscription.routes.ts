import { Router } from "express";

const router = Router();

// GET /api/v1/subscriptions/me (customer: my subscriptions)
router.get("/me", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/v1/subscriptions/checkout (customer: create checkout session)
router.post("/checkout", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/v1/subscriptions/:id/cancel (customer: cancel subscription)
router.post("/:id/cancel", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// PATCH /api/v1/subscriptions/:id/plan (customer: upgrade/downgrade)
router.patch("/:id/plan", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/v1/subscriptions/me/billing (customer: billing history)
router.get("/me/billing", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export default router;
