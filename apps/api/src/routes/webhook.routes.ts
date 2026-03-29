import { Router } from "express";

const router = Router();

// POST /api/v1/webhooks/stripe (Stripe webhook handler)
router.post("/stripe", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export default router;
