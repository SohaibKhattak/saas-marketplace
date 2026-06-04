// import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

// export async function createPricingPlan(
//   productId: string,
//   developerId: string,
//   data: {
//     name: string;
//     priceMonthly: number;
//     priceYearly?: number;
//     features?: string[];
//     trialDays?: number;
//   }
// ) {
//   await verifyProductOwnership(productId, developerId);

//   const maxOrder = await prisma.pricingPlan.aggregate({
//     where: { productId },
//     _max: { sortOrder: true },
//   });

//   return prisma.pricingPlan.create({
//     data: {
//       productId,
//       name: data.name,
//       priceMonthly: data.priceMonthly,
//       priceYearly: data.priceYearly,
//       features: data.features ?? [],
//       trialDays: data.trialDays ?? 0,
//       sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
//     },
//   });
// }

// export async function updatePricingPlan(
//   planId: string,
//   developerId: string,
//   data: {
//     name?: string;
//     priceMonthly?: number;
//     priceYearly?: number;
//     features?: string[];
//     trialDays?: number;
//     isActive?: boolean;
//   }
// ) {
//   const plan = await prisma.pricingPlan.findUnique({ where: { id: planId } });
//   if (!plan) {
//     throw new AppError(404, "Pricing plan not found", "PLAN_NOT_FOUND");
//   }

//   await verifyProductOwnership(plan.productId, developerId);

//   return prisma.pricingPlan.update({
//     where: { id: planId },
//     data,
//   });
// }

// export async function deletePricingPlan(planId: string, developerId: string) {
//   const plan = await prisma.pricingPlan.findUnique({ where: { id: planId } });
//   if (!plan) {
//     throw new AppError(404, "Pricing plan not found", "PLAN_NOT_FOUND");
//   }

//   await verifyProductOwnership(plan.productId, developerId);

//   // Check for active subscriptions
//   const activeSubscriptions = await prisma.subscription.count({
//     where: {
//       pricingPlanId: planId,
//       status: { in: ["ACTIVE", "TRIALING"] },
//     },
//   });

//   if (activeSubscriptions > 0) {
//     throw new AppError(400, "Cannot delete a plan with active subscriptions. Deactivate it instead.", "HAS_ACTIVE_SUBS");
//   }

//   await prisma.pricingPlan.delete({ where: { id: planId } });
//   return { deleted: true };
// }

// export async function getProductPlans(productId: string) {
//   return prisma.pricingPlan.findMany({
//     where: { productId },
//     orderBy: { sortOrder: "asc" },
//   });
// }

// async function verifyProductOwnership(productId: string, developerId: string) {
//   const profile = await prisma.developerProfile.findUnique({
//     where: { userId: developerId },
//   });

//   if (!profile) {
//     throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
//   }

//   const product = await prisma.product.findUnique({ where: { id: productId } });
//   if (!product) {
//     throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
//   }

//   if (product.developerId !== profile.id) {
//     throw new AppError(403, "You do not own this product", "FORBIDDEN");
//   }
// }
