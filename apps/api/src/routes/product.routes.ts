import { Router } from "express";

const router = Router();

// GET /api/v1/products (public: list marketplace products)
router.get("/", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/v1/products/me/products (developer: my products)
router.get("/me/products", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// GET /api/v1/products/:slug (public: product detail)
router.get("/:slug", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/v1/products (developer: create product)
router.post("/", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// PATCH /api/v1/products/:id (developer: update product)
router.patch("/:id", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// DELETE /api/v1/products/:id (developer: delete product)
router.delete("/:id", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

// POST /api/v1/products/:id/submit (developer: submit for review)
router.post("/:id/submit", (_req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

export default router;
