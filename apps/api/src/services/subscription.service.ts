import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/error-handler.js";

export async function getCustomerSubscriptions(customerId: string, page: number, limit: number) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 1. Fetch base subscriptions
  const { data: subs, count: total, error: subError } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact" })
    .eq("customer_id", customerId)
    .range(from, to)
    .order("created_at", { ascending: false });

  if (subError) {
    throw new AppError(500, "Failed to fetch subscriptions", "FETCH_ERROR");
  }

  if (!subs || subs.length === 0) {
    return { subscriptions: [], total: 0 };
  }

  // 2. Collect unique IDs for related data
  const productIds = [...new Set(subs.map(s => s.product_id))];
  const planIds = [...new Set(subs.map(s => s.pricing_plan_id))];

  // 3. Fetch related data in parallel
  const [productsRes, plansRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, logo_url, category, developer_id, site_id")
      .in("id", productIds),
    supabase
      .from("pricing_plans")
      .select("id, name, price_monthly, price_yearly, features")
      .in("id", planIds)
  ]);

  // 4. Fetch developer names and site info if products were found
  const developerIds = productsRes.data ? [...new Set(productsRes.data.map(p => p.developer_id))] : [];
  const siteIds = productsRes.data ? [...new Set(productsRes.data.filter(p => p.site_id).map(p => p.site_id))] : [];

  const [devsRes, sitesRes] = await Promise.all([
    developerIds.length ? supabase.from("users").select("id, full_name").in("id", developerIds) : { data: [] },
    siteIds.length ? supabase.from("developer_sites").select("id, site_url, subdomain").in("id", siteIds) : { data: [] }
  ]);

  // 5. Map everything together
  const subscriptions = subs.map(sub => {
    const product = productsRes.data?.find(p => p.id === sub.product_id);
    const plan = plansRes.data?.find(p => p.id === sub.pricing_plan_id);
    const developer = devsRes.data?.find(d => d.id === product?.developer_id);
    const site = sitesRes.data?.find(s => s.id === product?.site_id);

    return {
      id: sub.id,
      status: sub.status,
      billingCycle: sub.billing_cycle,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      trialEnd: sub.trial_end,
      canceledAt: sub.canceled_at,
      createdAt: sub.created_at,
      product: product ? {
        id: product.id,
        name: product.name,
        logoUrl: product.logo_url,
        // slug: product.slug || product.id, // Fallback to ID if slug is missing
        developer: {
          user: {
            fullName: developer?.full_name || 'Unknown Developer'
          }
        },
        site: site ? {
          id: site.id,
          siteUrl: site.site_url,
          subdomain: site.subdomain
        } : null
      } : null,
      pricingPlan: plan ? {
        id: plan.id,
        name: plan.name,
        priceMonthly: plan.price_monthly,
        priceYearly: plan.price_yearly,
        features: plan.features
      } : null
    };
  });

  return { subscriptions, total: total || 0 };
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
