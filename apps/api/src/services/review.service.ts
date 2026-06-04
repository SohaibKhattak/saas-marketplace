// import { prisma } from "../config/database.js";
// import { AppError } from "../middleware/error-handler.js";

// export async function createReview(
//   userId: string,
//   productId: string,
//   data: { rating: number; comment?: string }
// ) {
//   // Verify product exists and is published
//   const product = await prisma.product.findUnique({ where: { id: productId } });
//   if (!product || product.status !== "PUBLISHED") {
//     throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
//   }

//   // Check if user has an active subscription to this product
//   const subscription = await prisma.subscription.findFirst({
//     where: {
//       customerId: userId,
//       pricingPlan: { productId },
//       status: { in: ["ACTIVE", "TRIALING", "CANCELED"] },
//     },
//   });

//   if (!subscription) {
//     throw new AppError(403, "You must be subscribed to this product to leave a review", "NOT_SUBSCRIBED");
//   }

//   // Check if already reviewed
//   const existing = await prisma.review.findUnique({
//     where: { productId_customerId: { productId, customerId: userId } },
//   });

//   if (existing) {
//     throw new AppError(409, "You have already reviewed this product", "ALREADY_REVIEWED");
//   }

//   const review = await prisma.review.create({
//     data: {
//       productId,
//       customerId: userId,
//       rating: data.rating,
//       comment: data.comment ?? null,
//     },
//     include: {
//       customer: { select: { id: true, fullName: true, avatarUrl: true } },
//     },
//   });

//   // Recalculate avg rating
//   await recalculateRating(productId);

//   return review;
// }

// export async function updateReview(
//   userId: string,
//   reviewId: string,
//   data: { rating?: number; comment?: string }
// ) {
//   const review = await prisma.review.findUnique({ where: { id: reviewId } });
//   if (!review) {
//     throw new AppError(404, "Review not found", "REVIEW_NOT_FOUND");
//   }

//   if (review.customerId !== userId) {
//     throw new AppError(403, "You can only edit your own reviews", "FORBIDDEN");
//   }

//   const updated = await prisma.review.update({
//     where: { id: reviewId },
//     data: {
//       rating: data.rating ?? review.rating,
//       comment: data.comment !== undefined ? data.comment : review.comment,
//     },
//     include: {
//       customer: { select: { id: true, fullName: true, avatarUrl: true } },
//     },
//   });

//   await recalculateRating(review.productId);

//   return updated;
// }

// export async function deleteReview(userId: string, reviewId: string) {
//   const review = await prisma.review.findUnique({ where: { id: reviewId } });
//   if (!review) {
//     throw new AppError(404, "Review not found", "REVIEW_NOT_FOUND");
//   }

//   if (review.customerId !== userId) {
//     throw new AppError(403, "You can only delete your own reviews", "FORBIDDEN");
//   }

//   await prisma.review.delete({ where: { id: reviewId } });
//   await recalculateRating(review.productId);

//   return { deleted: true };
// }

// export async function getUserReviewForProduct(userId: string, productId: string) {
//   return prisma.review.findUnique({
//     where: { productId_customerId: { productId, customerId: userId } },
//   });
// }

// export async function getProductReviews(productId: string, type: 'all' | 'positive' | 'negative' = 'all') {
//   const where: any = { productId };
  
//   if (type === 'positive') {
//     where.rating = { gte: 3 };
//   } else if (type === 'negative') {
//     where.rating = { lt: 3 };
//   }

//   return prisma.review.findMany({
//     where,
//     include: {
//       customer: {
//         select: {
//           id: true,
//           fullName: true,
//           avatarUrl: true,
//         },
//       },
//     },
//     orderBy: { createdAt: 'desc' },
//   });
// }

// async function recalculateRating(productId: string) {
//   const result = await prisma.review.aggregate({
//     where: { productId },
//     _avg: { rating: true },
//     _count: { rating: true },
//   });

//   await prisma.product.update({
//     where: { id: productId },
//     data: {
//       avgRating: result._avg.rating ?? 0,
//       totalReviews: result._count.rating,
//     },
//   });
// }
