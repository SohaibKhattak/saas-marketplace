import { prisma } from "../config/database.js";

// ─── Admin Platform Analytics ──────────────────────────────────────────────

export async function getPlatformKPIs() {
  const [
    totalUsers,
    totalDevelopers,
    totalProducts,
    publishedProducts,
    activeSubscriptions,
    totalRevenue,
    platformRevenue,
    pendingApplications,
    pendingProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.developerProfile.count({ where: { applicationStatus: "APPROVED" } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.subscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] } } }),
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { platformFee: true },
    }),
    prisma.developerProfile.count({ where: { applicationStatus: "PENDING" } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW" } }),
  ]);

  return {
    totalUsers,
    totalDevelopers,
    totalProducts,
    publishedProducts,
    activeSubscriptions,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    platformRevenue: platformRevenue._sum.platformFee ?? 0,
    pendingApplications,
    pendingProducts,
  };
}

export async function getRevenueByMonth(months: number = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const transactions = await prisma.transaction.findMany({
    where: {
      status: "SUCCEEDED",
      createdAt: { gte: since },
    },
    select: {
      amount: true,
      platformFee: true,
      developerAmount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by month
  const monthlyData: Record<string, { month: string; revenue: number; platformFee: number; developerPayout: number }> = {};

  for (const tx of transactions) {
    const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { month: key, revenue: 0, platformFee: 0, developerPayout: 0 };
    }
    monthlyData[key].revenue += tx.amount;
    monthlyData[key].platformFee += tx.platformFee;
    monthlyData[key].developerPayout += tx.developerAmount;
  }

  return Object.values(monthlyData);
}

export async function getRecentTransactions(limit: number = 10) {
  return prisma.transaction.findMany({
    include: {
      customer: { select: { fullName: true, email: true } },
      developer: {
        include: { user: { select: { fullName: true } } },
      },
      subscription: {
        include: {
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ─── Developer Analytics ──────────────────────────────────────────────────

export async function getDeveloperAnalytics(userId: string) {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const [
    totalProducts,
    publishedProducts,
    totalSubscribers,
    totalRevenue,
    totalTransactions,
  ] = await Promise.all([
    prisma.product.count({ where: { developerId: profile.id } }),
    prisma.product.count({ where: { developerId: profile.id, status: "PUBLISHED" } }),
    prisma.subscription.count({
      where: {
        product: { developerId: profile.id },
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    }),
    prisma.transaction.aggregate({
      where: { developerId: profile.id, status: "SUCCEEDED" },
      _sum: { developerAmount: true },
    }),
    prisma.transaction.count({ where: { developerId: profile.id } }),
  ]);

  return {
    totalProducts,
    publishedProducts,
    totalSubscribers,
    totalRevenue: totalRevenue._sum.developerAmount ?? 0,
    totalTransactions,
  };
}

export async function getDeveloperRevenueByMonth(userId: string, months: number = 12) {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId },
  });

  if (!profile) return [];

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const transactions = await prisma.transaction.findMany({
    where: {
      developerId: profile.id,
      status: "SUCCEEDED",
      createdAt: { gte: since },
    },
    select: {
      developerAmount: true,
      amount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const monthlyData: Record<string, { month: string; revenue: number; gross: number }> = {};

  for (const tx of transactions) {
    const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyData[key]) {
      monthlyData[key] = { month: key, revenue: 0, gross: 0 };
    }
    monthlyData[key].revenue += tx.developerAmount;
    monthlyData[key].gross += tx.amount;
  }

  return Object.values(monthlyData);
}

export async function getDeveloperTransactions(userId: string, page: number, limit: number) {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId },
  });

  if (!profile) return { transactions: [], total: 0 };

  const where = { developerId: profile.id };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        customer: { select: { fullName: true, email: true } },
        subscription: {
          include: {
            product: { select: { name: true } },
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
