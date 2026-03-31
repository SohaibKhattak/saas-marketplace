import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

export async function getCustomerSubscriptions(customerId: string, page: number, limit: number) {
  const where = { customerId };

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            category: true,
            site: { select: { siteUrl: true, subdomain: true } },
            developer: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
        pricingPlan: {
          select: { name: true, priceMonthly: true, priceYearly: true, features: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.count({ where }),
  ]);

  return { subscriptions, total };
}

export async function getSubscriptionById(subscriptionId: string, customerId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          developer: {
            include: { user: { select: { fullName: true } } },
          },
        },
      },
      pricingPlan: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!subscription) {
    throw new AppError(404, "Subscription not found", "SUB_NOT_FOUND");
  }

  if (subscription.customerId !== customerId) {
    throw new AppError(403, "Not your subscription", "FORBIDDEN");
  }

  return subscription;
}

export async function getBillingHistory(customerId: string, page: number, limit: number) {
  const where = { customerId };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        subscription: {
          include: {
            product: { select: { name: true, slug: true } },
            pricingPlan: { select: { name: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total };
}
