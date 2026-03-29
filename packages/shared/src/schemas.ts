import { z } from "zod";
import { PRODUCT_CATEGORIES, MAX_TRIAL_DAYS } from "./constants.js";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

// Developer schemas
export const developerApplicationSchema = z.object({
  businessName: z.string().min(2).max(200),
  businessEmail: z.string().email(),
  taxId: z.string().optional(),
  bio: z.string().max(1000).optional(),
});

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  shortDescription: z.string().max(300).optional(),
  description: z.string().min(20).max(10000),
  category: z.enum(PRODUCT_CATEGORIES),
  tags: z.array(z.string()).max(10).default([]),
  siteId: z.string().uuid().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Pricing plan schemas
export const createPricingPlanSchema = z.object({
  name: z.string().min(1).max(100),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0).optional(),
  features: z.array(z.string()).default([]),
  trialDays: z.number().int().min(0).max(MAX_TRIAL_DAYS).default(0),
});

// Review schemas
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// Admin schemas
export const reviewDeveloperSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export const reviewProductSchema = z.object({
  status: z.enum(["PUBLISHED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});
