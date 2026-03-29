import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as productService from "../services/product.service.js";
import * as pricingPlanService from "../services/pricing-plan.service.js";

// --- Developer Product CRUD ---

export async function createProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct(req.user!.userId, req.body);
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const product = await productService.updateProduct(id as string, req.user!.userId, req.body);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.deleteProduct(id as string, req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function submitForReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const product = await productService.submitForReview(id as string, req.user!.userId);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function getDeveloperProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { products, total } = await productService.getDeveloperProducts(req.user!.userId, page, limit);
    res.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id as string);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

// --- Marketplace (Public) ---

export async function listMarketplaceProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;

    const { products, total } = await productService.listMarketplaceProducts({
      page, limit, search, category, sortBy,
    });
    res.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const product = await productService.getProductBySlug(slug as string);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

// --- Admin Moderation ---

export async function listPendingProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { products, total } = await productService.listPendingProducts(page, limit);
    res.json({
      data: products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function reviewProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const result = await productService.reviewProduct(id as string, req.user!.userId, {
      status,
      rejectionReason,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// --- Pricing Plans ---

export async function createPricingPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const plan = await pricingPlanService.createPricingPlan(productId as string, req.user!.userId, req.body);
    res.status(201).json({ data: plan });
  } catch (err) {
    next(err);
  }
}

export async function updatePricingPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { planId } = req.params;
    const plan = await pricingPlanService.updatePricingPlan(planId as string, req.user!.userId, req.body);
    res.json({ data: plan });
  } catch (err) {
    next(err);
  }
}

export async function deletePricingPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { planId } = req.params;
    const result = await pricingPlanService.deletePricingPlan(planId as string, req.user!.userId);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProductPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const plans = await pricingPlanService.getProductPlans(productId as string);
    res.json({ data: plans });
  } catch (err) {
    next(err);
  }
}
