import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/error-handler.js";

export async function getCustomerSubscriptions(
  customerId: string,
  page: number,
  limit: number
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const now = new Date().toISOString();

  // ─── 1. FETCH ALL ACTIONABLE SUBS ───────────────────────────────────────
  const { data: subs, error: subError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("customer_id", customerId)
    .in("status", ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELED"])
    .order("created_at", { ascending: false });

  if (subError) {
    throw new AppError(500, "Failed to fetch subscriptions", "FETCH_ERROR");
  }

  if (!subs || subs.length === 0) {
    return { subscriptions: [], total: 0 };
  }

  // ─── 2. DEDUPLICATE — keep latest sub per product ─────────────────────────
  const uniqueProductSubs: typeof subs = [];
  const seenProductIds = new Set<string>();

  for (const sub of subs) {
    if (!seenProductIds.has(sub.product_id)) {
      uniqueProductSubs.push(sub);
      seenProductIds.add(sub.product_id);
    }
  }

  const total = uniqueProductSubs.length;
  const paginatedSubs = uniqueProductSubs.slice(from, to + 1);

  if (paginatedSubs.length === 0) {
    return { subscriptions: [], total };
  }

  // ─── 3. COLLECT IDS FOR BATCH FETCHING ───────────────────────────────────
  const productIds = [...new Set(paginatedSubs.map((s) => s.product_id))];
  const planIds = [...new Set(paginatedSubs.map((s) => s.pricing_plan_id))];

  // ─── 4. FETCH PRODUCTS + PLANS IN PARALLEL ────────────────────────────────
  const [productsRes, plansRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, logo_url, category, developer_id, site_id")
      .in("id", productIds),
    supabase
      .from("pricing_plans")
      .select("id, name, price_monthly, price_yearly, features, sort_order, product_id, is_active")
      .in("id", planIds),
  ]);

  if (productsRes.error) {
    console.error("[Subscription Service] Error fetching products:", productsRes.error);
  }
  if (plansRes.error) {
    console.error("[Subscription Service] Error fetching plans:", plansRes.error);
  }

  const products = productsRes.data ?? [];
  const plans = plansRes.data ?? [];

  // ─── 5. FETCH DEVELOPER PROFILES → THEN USERS ────────────────────────────
  const developerUserIds = [...new Set(products.map((p) => p.developer_id))];

  const { data: developerProfiles } = developerUserIds.length
    ? await supabase
      .from("developer_profiles")
      .select("user_id, business_name")
      .in("user_id", developerUserIds)
    : { data: [] };

  const devProfileUserIds = (developerProfiles ?? []).map((d) => d.user_id);

  const { data: devUsers } = devProfileUserIds.length
    ? await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", devProfileUserIds)
    : { data: [] };

  // ─── 6. FETCH SITES ───────────────────────────────────────────────────────
  const siteIds = [
    ...new Set(
      products.filter((p) => p.site_id).map((p) => p.site_id as string)
    ),
  ];

  const { data: sites } = siteIds.length
    ? await supabase
      .from("developer_sites")
      .select("id, site_url, subdomain")
      .in("id", siteIds)
    : { data: [] };

  // ─── 7. FETCH ALL PRICING PLANS PER PRODUCT (for change plan modal) ───────
  // We need all plans for each product so UI can show plan switcher
  const { data: allProductPlans } = productIds.length
    ? await supabase
      .from("pricing_plans")
      .select("id, name, price_monthly, price_yearly, features, sort_order, product_id")
      .in("product_id", productIds)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    : { data: [] };

  // ─── 8. BUILD LOOKUP MAPS ─────────────────────────────────────────────────
  const productMap = new Map(products.map((p) => [p.id, p]));
  const planMap = new Map(plans.map((p) => [p.id, p]));
  const devProfileMap = new Map(
    (developerProfiles ?? []).map((d) => [d.user_id, d])
  );
  const devUserMap = new Map((devUsers ?? []).map((u) => [u.id, u]));
  const siteMap = new Map((sites ?? []).map((s) => [s.id, s]));

  // Group all plans by product_id for the change plan modal
  const plansByProductMap = new Map<string, any[]>();
  for (const plan of allProductPlans ?? []) {
    if (!plansByProductMap.has(plan.product_id)) {
      plansByProductMap.set(plan.product_id, []);
    }
    plansByProductMap.get(plan.product_id)!.push(plan);
  }

  // ─── 9. ASSEMBLE RESPONSE ─────────────────────────────────────────────────
  const subscriptions = paginatedSubs.map((sub) => {
    const product = productMap.get(sub.product_id);
    const currentPlan = planMap.get(sub.pricing_plan_id);
    const devProfile = product
      ? devProfileMap.get(product.developer_id)
      : null;
    const devUser = devProfile ? devUserMap.get(devProfile.user_id) : null;
    const site = product?.site_id ? siteMap.get(product.site_id) : null;
    const availablePlans = plansByProductMap.get(sub.product_id) ?? [];

    const isCanceled = sub.status === "CANCELED";
    const isPastDue = sub.status === "PAST_DUE";
    const isTrialing = sub.status === "TRIALING";

    return {
      id: sub.id,
      stripeSubscriptionId: sub.stripe_subscription_id,
      status: sub.status,
      billingCycle: sub.billing_cycle,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      trialEnd: sub.trial_end,
      canceledAt: sub.canceled_at,
      createdAt: sub.created_at,

      // ── UI STATE FLAGS ──
      flags: {
        isCanceled,
        isPastDue,
        isTrialing,
        isActive: sub.status === "ACTIVE",
      },

      // ── WHAT THE USER CAN DO ──
      allowedActions: {
        canCancel: !isCanceled,      // already canceled → hide cancel button
        canChangePlan: true,         // always allowed while period is active
        canReactivate: isCanceled,   // show "Reactivate" if canceled but not expired
      },

      product: product
        ? {
          id: product.id,
          name: product.name,
          slug: product.id,
          logoUrl: product.logo_url,
          category: product.category,
          developer: {
            businessName: devProfile?.business_name ?? null,
            user: {
              fullName: devUser?.full_name ?? "Unknown Developer",
              avatarUrl: devUser?.avatar_url ?? null,
            },
          },
          // Site always exposed here — this is the customer's own dashboard
          // they already have access (we filtered by current_period_end > now)
          site: site
            ? { siteUrl: site.site_url, subdomain: site.subdomain }
            : null,
        }
        : null,

      // ── CURRENT PLAN ──
      currentPricingPlan: currentPlan
        ? {
          id: currentPlan.id,
          name: currentPlan.name,
          priceMonthly: currentPlan.price_monthly,
          priceYearly: currentPlan.price_yearly,
          features: currentPlan.features ?? [],
        }
        : null,

      // ── ALL PLANS (for change plan modal) ──
      availablePlans: availablePlans.map((p) => ({
        id: p.id,
        name: p.name,
        priceMonthly: p.price_monthly,
        priceYearly: p.price_yearly,
        features: p.features ?? [],
        sortOrder: p.sort_order,
        isCurrentPlan: p.id === sub.pricing_plan_id,
      })),
    };
  });

  return { subscriptions, total };
}

export async function getSubscriptionById(subscriptionId: string, customerId: string) {
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      product:products!product_id(
        id,
        name,
        logo_url,
        developer:users!developer_id(full_name)
      ),
      pricing_plan:pricing_plans!pricing_plan_id(*),
      transactions(*)
    `)
    .eq("id", subscriptionId)
    .order("created_at", { foreignTable: "transactions", ascending: false })
    .limit(10, { foreignTable: "transactions" })
    .single();

  if (error || !subscription) {
    throw new AppError(404, "Subscription not found", "SUB_NOT_FOUND");
  }

  if (subscription.customer_id !== customerId) {
    throw new AppError(403, "Not your subscription", "FORBIDDEN");
  }

  return subscription;
}

export async function getBillingHistory(customerId: string, page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data: transactions, count: total, error } = await supabase
    .from("transactions")
    .select(`
      *,
      subscription:subscriptions!subscription_id(
        *,
        product:products!product_id(name),
        pricing_plan:pricing_plans!pricing_plan_id(name)
      )
    `, { count: "exact" })
    .eq("customer_id", customerId)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (error) {
    throw new AppError(500, "Failed to fetch billing history", "FETCH_ERROR");
  }

  return { transactions, total };
}
