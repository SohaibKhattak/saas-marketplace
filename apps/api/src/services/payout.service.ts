import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

export async function listPayouts(page: number, limit: number, status?: string) {
  const where: any = {};
  if (status) where.status = status;

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      include: {
        developer: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.payout.count({ where }),
  ]);

  return { payouts, total };
}

export async function getDeveloperPayoutSummary() {
  // Get all developers with unpaid earnings
  const developers = await prisma.developerProfile.findMany({
    where: { applicationStatus: "APPROVED" },
    include: {
      user: { select: { fullName: true, email: true } },
      transactions: {
        where: { status: "SUCCEEDED" },
        select: { developerAmount: true },
      },
      payouts: {
        where: { status: { in: ["COMPLETED", "PROCESSING"] } },
        select: { amount: true },
      },
    },
  });

  return developers.map((dev: any) => {
    const totalEarned = dev.transactions.reduce((sum: any, tx: any) => sum + tx.developerAmount, 0);
    const totalPaid = dev.payouts.reduce((sum: any, p: any) => sum + p.amount, 0);
    const balance = totalEarned - totalPaid;

    return {
      developerId: dev.id,
      developerName: dev.user.fullName,
      developerEmail: dev.user.email,
      totalEarned,
      totalPaid,
      balance,
    };
  }).filter((d: any) => d.totalEarned > 0);
}

export async function createPayout(
  developerId: string,
  amount: number,
  periodStart: Date,
  periodEnd: Date,
  adminUserId: string
) {
  const developer = await prisma.developerProfile.findUnique({
    where: { id: developerId },
    include: { user: true },
  });

  if (!developer) {
    throw new AppError(404, "Developer not found", "DEVELOPER_NOT_FOUND");
  }

  const payout = await prisma.$transaction(async (tx: any) => {
    const newPayout = await tx.payout.create({
      data: {
        developerId,
        amount,
        periodStart,
        periodEnd,
        status: "PENDING",
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: "PAYOUT_CREATED",
        entityType: "Payout",
        entityId: newPayout.id,
        details: {
          developerName: developer.user.fullName,
          amount,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        },
      },
    });

    return newPayout;
  });

  return payout;
}

export async function updatePayoutStatus(
  payoutId: string,
  status: "PROCESSING" | "COMPLETED" | "FAILED",
  adminUserId: string
) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });

  if (!payout) {
    throw new AppError(404, "Payout not found", "PAYOUT_NOT_FOUND");
  }

  return prisma.$transaction(async (tx: any) => {
    const updated = await tx.payout.update({
      where: { id: payoutId },
      data: {
        status,
        processedAt: status === "COMPLETED" ? new Date() : undefined,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: `PAYOUT_${status}`,
        entityType: "Payout",
        entityId: payoutId,
        details: { status },
      },
    });

    return updated;
  });
}

export async function generateFinancialReport(startDate: Date, endDate: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      status: "SUCCEEDED",
    },
    include: {
      customer: { select: { fullName: true, email: true } },
      developer: {
        include: { user: { select: { fullName: true } } },
      },
      subscription: {
        include: {
          product: { select: { name: true } },
          pricingPlan: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Generate CSV
  const header = "Date,Customer,Customer Email,Developer,Product,Plan,Amount,Platform Fee,Developer Amount,Type,Status";
  const rows = transactions.map((tx: any) => {
    return [
      tx.createdAt.toISOString().split("T")[0],
      `"${tx.customer.fullName}"`,
      tx.customer.email,
      `"${tx.developer.user.fullName}"`,
      `"${tx.subscription?.product.name ?? "N/A"}"`,
      `"${tx.subscription?.pricingPlan.name ?? "N/A"}"`,
      tx.amount.toFixed(2),
      tx.platformFee.toFixed(2),
      tx.developerAmount.toFixed(2),
      tx.type,
      tx.status,
    ].join(",");
  });

  const totals = transactions.reduce(
    (acc: any, tx: any) => ({
      amount: acc.amount + tx.amount,
      platformFee: acc.platformFee + tx.platformFee,
      developerAmount: acc.developerAmount + tx.developerAmount,
    }),
    { amount: 0, platformFee: 0, developerAmount: 0 }
  );

  rows.push("");
  rows.push(`,,,,,,${totals.amount.toFixed(2)},${totals.platformFee.toFixed(2)},${totals.developerAmount.toFixed(2)},,TOTALS`);

  return { csv: [header, ...rows].join("\n"), count: transactions.length, totals };
}
