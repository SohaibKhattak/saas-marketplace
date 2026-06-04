import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as analyticsService from "../services/analytics.service.js";
import * as payoutService from "../services/payout.service.js";

// ─── Admin Analytics ──────────────────────────────────────────────────────

export async function getPlatformKPIs(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const kpis = await analyticsService.getPlatformKPIs();
    res.json({ data: kpis });
  } catch (err) {
    next(err);
  }
}

export async function getRevenueByMonth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const data = await analyticsService.getRevenueByMonth(months);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getRecentTransactions(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getRecentTransactions(10);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// ─── Admin Payouts ──────────────────────────────────────────────────────

export async function listPayouts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const { payouts, total } = await payoutService.listPayouts(page, limit, status);
    res.json({
      data: payouts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPayoutSummary(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const summary = await payoutService.getDeveloperPayoutSummary();
    res.json({ data: summary });
  } catch (err) {
    next(err);
  }
}

export async function createPayout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { developerId, amount, periodStart, periodEnd } = req.body;
    const payout = await payoutService.createPayout(
      developerId, amount, new Date(periodStart), new Date(periodEnd), req.user!.userId
    );
    res.status(201).json({ data: payout });
  } catch (err) {
    next(err);
  }
}

export async function updatePayoutStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const payout = await payoutService.updatePayoutStatus(id as string, status, req.user!.userId);
    res.json({ data: payout });
  } catch (err) {
    next(err);
  }
}

export async function generateReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: { message: "startDate and endDate are required" } });
      return;
    }
    const report = await payoutService.generateFinancialReport(
      new Date(startDate as string), new Date(endDate as string)
    );

    // const transactions = await prisma.transaction.findMany({
    //     where: {
    //       createdAt: { gte: startDate, lte: endDate },
    //       status: "SUCCEEDED",
    //     },
    //     include: {
    //       customer: { select: { fullName: true, email: true } },
    //       developer: {
    //         include: { user: { select: { fullName: true } } },
    //       },
    //       subscription: {
    //         include: {
    //           product: { select: { name: true } },
    //           pricingPlan: { select: { name: true } },
    //         },
    //       },
    //     },
    //     orderBy: { createdAt: "asc" },
    //   });

    //   // Generate CSV
    //   const header = "Date,Customer,Customer Email,Developer,Product,Plan,Amount,Platform Fee,Developer Amount,Type,Status";
    //   const rows = transactions.map((tx: any) => {
    //     return [
    //       tx.createdAt.toISOString().split("T")[0],
    //       `"${tx.customer.fullName}"`,
    //       tx.customer.email,
    //       `"${tx.developer.user.fullName}"`,
    //       `"${tx.subscription?.product.name ?? "N/A"}"`,
    //       `"${tx.subscription?.pricingPlan.name ?? "N/A"}"`,
    //       tx.amount.toFixed(2),
    //       tx.platformFee.toFixed(2),
    //       tx.developerAmount.toFixed(2),
    //       tx.type,
    //       tx.status,
    //     ].join(",");
    //   });

    //   const totals = transactions.reduce(
    //     (acc: any, tx: any) => ({
    //       amount: acc.amount + tx.amount,
    //       platformFee: acc.platformFee + tx.platformFee,
    //       developerAmount: acc.developerAmount + tx.developerAmount,
    //     }),
    //     { amount: 0, platformFee: 0, developerAmount: 0 }
    //   );

    //   rows.push("");
    //   rows.push(`,,,,,,${totals.amount.toFixed(2)},${totals.platformFee.toFixed(2)},${totals.developerAmount.toFixed(2)},,TOTALS`);

    //   const report = { csv: [header, ...rows].join("\n"), count: transactions.length, totals };

    res.json({ data: report });
  } catch (err) {
    next(err);
  }
}

export async function downloadReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      res.status(400).json({ error: { message: "startDate and endDate are required" } });
      return;
    }
    const report = await payoutService.generateFinancialReport(
      new Date(startDate as string), new Date(endDate as string)
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=report-${startDate}-${endDate}.csv`);
    res.send(report.csv);
  } catch (err) {
    next(err);
  }
}

// ─── Developer Analytics ──────────────────────────────────────────────────

export async function getDeveloperAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getDeveloperAnalytics(req.user!.userId);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getDeveloperRevenueByMonth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const data = await analyticsService.getDeveloperRevenueByMonth(req.user!.userId, months);
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

export async function getDeveloperTransactions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { transactions, total } = await analyticsService.getDeveloperTransactions(
      req.user!.userId, page, limit
    );
    res.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}
