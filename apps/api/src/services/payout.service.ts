import { pool } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

export async function listPayouts(page: number, limit: number, status?: string) {
  // Validate input
  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, limit);

  let query = `
    SELECT
      p.id, p.amount, p.status, p.period_start as "periodStart", p.period_end as "periodEnd",
      p.processed_at as "processedAt", p.created_at as "createdAt",
      u.full_name, u.email
    FROM payouts p
    JOIN developer_profiles d ON p.developer_id = d.id
    JOIN users u ON d.user_id = u.id
  `;
  const params: any[] = [];

  if (status) {
    query += " WHERE p.status = $1";
    params.push(status);
  }

  query += " ORDER BY p.created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
  params.push(validLimit, (validPage - 1) * validLimit);

  const [payoutsRes, countRes] = await Promise.all([
    pool.query(query, params),
    pool.query(`SELECT COUNT(*) FROM payouts${status ? ' WHERE status = $1' : ''}`, status ? [status] : [])
  ]);

  const payouts = payoutsRes.rows.map(row => ({
    id: row.id,
    amount: row.amount,
    status: row.status,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    processedAt: row.processedAt,
    createdAt: row.createdAt,
    developer: {
      user: { fullName: row.full_name, email: row.email }
    }
  }));

  return { payouts, total: parseInt(countRes.rows[0].count, 10) };
}

export async function getDeveloperPayoutSummary() {
  const res = await pool.query(`
    SELECT
      d.id as developer_id,
      u.full_name as developer_name,
      u.email as developer_email,
      COALESCE(earned.total_earned, 0) as total_earned,
      COALESCE(paid.total_paid, 0) as total_paid
    FROM developer_profiles d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN (
      SELECT developer_id, SUM(developer_amount) as total_earned
      FROM transactions
      WHERE status = 'SUCCEEDED'
      GROUP BY developer_id
    ) earned ON d.id = earned.developer_id
    LEFT JOIN (
      SELECT developer_id, SUM(amount) as total_paid
      FROM payouts
      WHERE status IN ('COMPLETED', 'PROCESSING')
      GROUP BY developer_id
    ) paid ON d.id = paid.developer_id
    WHERE d.application_status = 'APPROVED'
      AND COALESCE(earned.total_earned, 0) > 0
  `);

  return res.rows.map(row => ({
    developerId: row.developer_id,
    developerName: row.developer_name,
    developerEmail: row.developer_email,
    totalEarned: parseFloat(row.total_earned) || 0,
    totalPaid: parseFloat(row.total_paid) || 0,
    balance: parseFloat(row.total_earned) - parseFloat(row.total_paid) || 0,
  }));
}

export async function createPayout(
  developerId: string,
  amount: number,
  periodStart: Date,
  periodEnd: Date,
  adminUserId: string
) {
  const devRes = await pool.query(`
    SELECT d.id, u.full_name FROM developer_profiles d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = $1
  `, [developerId]);

  if (devRes.rowCount === 0) {
    throw new AppError(404, "Developer not found", "DEVELOPER_NOT_FOUND");
  }

  const developer = devRes.rows[0];

  const payoutRes = await pool.query(`
    INSERT INTO payouts (developer_id, amount, period_start, period_end, status, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING *
  `, [developerId, amount, periodStart, periodEnd, "PENDING"]);

  const payout = payoutRes.rows[0];

  // Log audit
  await pool.query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [
    adminUserId,
    "PAYOUT_CREATED",
    "Payout",
    payout.id,
    JSON.stringify({
      developerName: developer.full_name,
      amount,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    })
  ]);

  return {
    id: payout.id,
    amount: payout.amount,
    status: payout.status,
    periodStart: payout.period_start,
    periodEnd: payout.period_end,
    processedAt: payout.processed_at,
    createdAt: payout.created_at,
  };
}

export async function updatePayoutStatus(
  payoutId: string,
  status: "PROCESSING" | "COMPLETED" | "FAILED",
  adminUserId: string
) {
  const payoutRes = await pool.query(`SELECT * FROM payouts WHERE id = $1`, [payoutId]);

  if (payoutRes.rowCount === 0) {
    throw new AppError(404, "Payout not found", "PAYOUT_NOT_FOUND");
  }

  const processedAt = status === "COMPLETED" ? new Date() : null;

  const updateRes = await pool.query(`
    UPDATE payouts SET status = $1, processed_at = $2 WHERE id = $3 RETURNING *
  `, [status, processedAt, payoutId]);

  // Log audit
  await pool.query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [
    adminUserId,
    `PAYOUT_${status}`,
    "Payout",
    payoutId,
    JSON.stringify({ status })
  ]);

  const updated = updateRes.rows[0];
  return {
    id: updated.id,
    amount: updated.amount,
    status: updated.status,
    periodStart: updated.period_start,
    periodEnd: updated.period_end,
    processedAt: updated.processed_at,
    createdAt: updated.created_at,
  };
}

export async function generateFinancialReport(startDate: Date, endDate: Date) {
  const txRes = await pool.query(`
    SELECT
      t.created_at, u.full_name as customer_name, u.email as customer_email,
      d_u.full_name as developer_name,
      p.name as product_name, pp.name as plan_name,
      t.amount, t.platform_fee, t.developer_amount, t.type, t.status
    FROM transactions t
    JOIN users u ON t.customer_id = u.id
    JOIN developer_profiles d ON t.developer_id = d.id
    JOIN users d_u ON d.user_id = d_u.id
    LEFT JOIN subscriptions sub ON t.subscription_id = sub.id
    LEFT JOIN products p ON sub.product_id = p.id
    LEFT JOIN pricing_plans pp ON sub.pricing_plan_id = pp.id
    WHERE t.created_at >= $1 AND t.created_at <= $2 AND t.status = 'SUCCEEDED'
    ORDER BY t.created_at ASC
  `, [startDate, endDate]);

  const transactions = txRes.rows;

  // Generate CSV
  const header = "Date,Customer,Customer Email,Developer,Product,Plan,Amount,Platform Fee,Developer Amount,Type,Status";
  const rows = transactions.map((tx: any) => {
    return [
      tx.created_at.toISOString().split("T")[0],
      `"${tx.customer_name}"`,
      tx.customer_email,
      `"${tx.developer_name}"`,
      `"${tx.product_name ?? "N/A"}"`,
      `"${tx.plan_name ?? "N/A"}"`,
      tx.amount.toFixed(2),
      tx.platform_fee.toFixed(2),
      tx.developer_amount.toFixed(2),
      tx.type,
      tx.status,
    ].join(",");
  });

  const totals = transactions.reduce(
    (acc: any, tx: any) => ({
      amount: acc.amount + tx.amount,
      platformFee: acc.platformFee + tx.platform_fee,
      developerAmount: acc.developerAmount + tx.developer_amount,
    }),
    { amount: 0, platformFee: 0, developerAmount: 0 }
  );

  rows.push("");
  rows.push(`,,,,,,${totals.amount.toFixed(2)},${totals.platformFee.toFixed(2)},${totals.developerAmount.toFixed(2)},,TOTALS`);

  return { csv: [header, ...rows].join("\n"), count: transactions.length, totals };
}
