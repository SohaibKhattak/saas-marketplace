import { pool } from "../config/database.js";

// ─── Admin Platform Analytics ──────────────────────────────────────────────

export async function getPlatformKPIs() {
  const [
    totalUsers,
    totalDevelopers,
    totalProducts,
    publishedProducts,
    activeSubscriptions,
    totalRevenueRes,
    platformRevenueRes,
    pendingApplications,
    pendingProducts,
  ] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM users`),
    pool.query(`SELECT COUNT(*) FROM developer_profiles WHERE application_status = 'APPROVED'`),
    pool.query(`SELECT COUNT(*) FROM products`),
    pool.query(`SELECT COUNT(*) FROM products WHERE status = 'PUBLISHED'`),
    pool.query(`SELECT COUNT(*) FROM subscriptions WHERE status IN ('ACTIVE', 'TRIALING')`),
    pool.query(`SELECT SUM(amount) FROM transactions WHERE status = 'SUCCEEDED'`),
    pool.query(`SELECT SUM(platform_fee) FROM transactions WHERE status = 'SUCCEEDED'`),
    pool.query(`SELECT COUNT(*) FROM developer_profiles WHERE application_status = 'PENDING'`),
    pool.query(`SELECT COUNT(*) FROM products WHERE status = 'PENDING_REVIEW'`),
  ]);

  return {
    totalUsers: parseInt(totalUsers.rows[0].count, 10),
    totalDevelopers: parseInt(totalDevelopers.rows[0].count, 10),
    totalProducts: parseInt(totalProducts.rows[0].count, 10),
    publishedProducts: parseInt(publishedProducts.rows[0].count, 10),
    activeSubscriptions: parseInt(activeSubscriptions.rows[0].count, 10),
    totalRevenue: parseFloat(totalRevenueRes.rows[0].sum) || 0,
    platformRevenue: parseFloat(platformRevenueRes.rows[0].sum) || 0,
    pendingApplications: parseInt(pendingApplications.rows[0].count, 10),
    pendingProducts: parseInt(pendingProducts.rows[0].count, 10),
  };
}

export async function getRevenueByMonth(months: number = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const txRes = await pool.query(`
    SELECT amount, platform_fee as "platformFee", developer_amount as "developerAmount", created_at as "createdAt"
    FROM transactions
    WHERE status = 'SUCCEEDED' AND created_at >= $1
    ORDER BY created_at ASC
  `, [since]);

  const monthlyData: Record<string, { month: string; revenue: number; platformFee: number; developerPayout: number }> = {};

  for (const tx of txRes.rows) {
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
  const res = await pool.query(`
    SELECT
      t.id, t.amount, t.platform_fee as "platformFee", t.developer_amount as "developerAmount", t.status, t.type, t.created_at as "createdAt",
      u.full_name as customer_name, u.email as customer_email,
      d_u.full_name as developer_name,
      p.name as product_name
    FROM transactions t
    JOIN users u ON t.customer_id = u.id
    JOIN developer_profiles d ON t.developer_id = d.id
    JOIN users d_u ON d.user_id = d_u.id
    LEFT JOIN subscriptions sub ON t.subscription_id = sub.id
    LEFT JOIN products p ON sub.product_id = p.id
    ORDER BY t.created_at DESC
    LIMIT $1
  `, [limit]);

  return res.rows.map(row => ({
    id: row.id,
    amount: row.amount,
    platformFee: row.platformFee,
    developerAmount: row.developerAmount,
    status: row.status,
    type: row.type,
    createdAt: row.createdAt,
    customer: { fullName: row.customer_name, email: row.customer_email },
    developer: { user: { fullName: row.developer_name } },
    subscription: row.product_name ? { product: { name: row.product_name } } : null
  }));
}

// ─── Developer Analytics ──────────────────────────────────────────────────

export async function getDeveloperAnalytics(userId: string) {
  const profileRes = await pool.query(`SELECT id FROM developer_profiles WHERE user_id = $1`, [userId]);
  if (profileRes.rowCount === 0) return null;
  const developerId = profileRes.rows[0].id;

  const [tProd, pProd, tSub, tRev, tTx] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM products WHERE developer_id = $1`, [userId]),
    pool.query(`SELECT COUNT(*) FROM products WHERE developer_id = $1 AND status = 'PUBLISHED'`, [userId]),
    pool.query(`
      SELECT COUNT(*) FROM subscriptions s
      JOIN products p ON s.product_id = p.id
      WHERE p.developer_id = $1 AND s.status IN ('ACTIVE', 'TRIALING')
    `, [userId]),
    pool.query(`SELECT SUM(developer_amount) FROM transactions WHERE developer_id = $1 AND status = 'SUCCEEDED'`, [developerId]),
    pool.query(`SELECT COUNT(*) FROM transactions WHERE developer_id = $1`, [developerId])
  ]);

  return {
    totalProducts: parseInt(tProd.rows[0].count, 10),
    publishedProducts: parseInt(pProd.rows[0].count, 10),
    totalSubscribers: parseInt(tSub.rows[0].count, 10),
    totalRevenue: parseFloat(tRev.rows[0].sum) || 0,
    totalTransactions: parseInt(tTx.rows[0].count, 10),
  };
}

export async function getDeveloperRevenueByMonth(userId: string, months: number = 12) {
  const profileRes = await pool.query(`SELECT id FROM developer_profiles WHERE user_id = $1`, [userId]);
  if (profileRes.rowCount === 0) return [];
  const developerId = profileRes.rows[0].id;

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const txRes = await pool.query(`
    SELECT developer_amount as "developerAmount", amount, created_at as "createdAt"
    FROM transactions
    WHERE developer_id = $1 AND status = 'SUCCEEDED' AND created_at >= $2
    ORDER BY created_at ASC
  `, [developerId, since]);

  const monthlyData: Record<string, { month: string; revenue: number; gross: number }> = {};

  for (const tx of txRes.rows) {
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
  const profileRes = await pool.query(`SELECT id FROM developer_profiles WHERE user_id = $1`, [userId]);

  if (profileRes.rowCount === 0) return { transactions: [], total: 0 };

  const developerId = profileRes.rows[0].id;

  const countRes = await pool.query(`SELECT COUNT(*) FROM transactions WHERE developer_id = $1`, [developerId]);
  const total = parseInt(countRes.rows[0].count, 10);

  const offset = (page - 1) * limit;
  const txRes = await pool.query(`
    SELECT
      t.id, t.amount, t.platform_fee as "platformFee", t.developer_amount as "developerAmount",
      t.status, t.type, t.created_at as "createdAt",
      u.full_name, u.email as user_email,
      p.name as product_name,
      pp.name as plan_name
    FROM transactions t
    JOIN users u ON t.customer_id = u.id
    LEFT JOIN subscriptions sub ON t.subscription_id = sub.id
    LEFT JOIN products p ON sub.product_id = p.id
    LEFT JOIN pricing_plans pp ON sub.pricing_plan_id = pp.id
    WHERE t.developer_id = $1
    ORDER BY t.created_at DESC
    LIMIT $2 OFFSET $3
  `, [developerId, limit, offset]);

  const transactions = txRes.rows.map(row => ({
    id: row.id,
    amount: row.amount,
    platformFee: row.platformFee,
    developerAmount: row.developerAmount,
    status: row.status,
    type: row.type,
    createdAt: row.createdAt,
    customer: { fullName: row.full_name, email: row.user_email },
    subscription: row.product_name || row.plan_name ? {
      product: { name: row.product_name },
      pricingPlan: { name: row.plan_name }
    } : null
  }));

  return { transactions, total };
}
