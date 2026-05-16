import { stripe } from "../config/stripe.js";
// import { prisma } from "../config/database.js";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/error-handler.js";
import { env } from "../config/env.js";
import { sendNewSubscriptionEmail, sendSubscriptionConfirmationEmail } from "./email.service.js";
import { createNotification } from "./notification.service.js";
import Stripe from 'stripe'

const FRONTEND_URL = env.FRONTEND_URL;
const PLATFORM_FEE_PERCENT = env.PLATFORM_FEE_PERCENT;

/**
 * Create a Stripe Checkout Session for a subscription.
 */
export async function createCheckoutSession(
  customerId: string,
  pricingPlanId: string,
  billingCycle: "MONTHLY" | "YEARLY"
) {
  // Fetch pricing plan with its associated product
  const { data: plan, error: planError } = await supabase
    .from("pricing_plans")
    .select("*, product:products(*)")
    .eq("id", pricingPlanId)
    .single();

  if (planError || !plan) {
    throw new AppError(404, "Pricing plan not found", "PLAN_NOT_FOUND");
  }

  if (!plan.is_active) {
    throw new AppError(400, "Pricing plan is inactive", "PLAN_INACTIVE");
  }

  if (plan.product.status !== "PUBLISHED") {
    throw new AppError(400, "Product is not published", "NOT_PUBLISHED");
  }

  // Check if customer has any history with this product
  const { data: existingRecords } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end")
    .eq("customer_id", customerId)
    .eq("product_id", plan.product_id);

  let trialDays = plan.trial_days > 0 ? plan.trial_days : undefined;

  if (existingRecords && existingRecords.length > 0) {
    // 1. Block if they have an ACTIVE or TRIALING subscription
    const activeSub = existingRecords.find(s => ["ACTIVE", "TRIALING"].includes(s.status));
    if (activeSub) {
      throw new AppError(409, "You already have an active subscription to this product", "ALREADY_SUBSCRIBED");
    }

    // 2. Block if they have a CANCELED subscription that is still in its valid period
    const now = new Date();
    const stillValidSub = existingRecords.find(s => 
      s.status === "CANCELED" && 
      s.current_period_end && 
      new Date(s.current_period_end) > now
    );

    if (stillValidSub) {
      throw new AppError(400, "Your previous subscription is still active until the end of the current period. Please wait for it to expire before resubscribing.", "SUBSCRIPTION_STILL_VALID");
    }

    // 3. If any record exists (even if expired/canceled), they are NOT eligible for a new trial
    trialDays = undefined;
  }

  // Determine price
  const price = billingCycle === "YEARLY" && plan.price_yearly
    ? plan.price_yearly
    : plan.price_monthly;

  const interval = billingCycle === "YEARLY" ? "year" : "month";

  // Create or get Stripe Price
  let stripePriceId: string;

  const priceField = billingCycle === "YEARLY" ? "stripe_price_id_yearly" : "stripe_price_id_monthly";
  if (plan[priceField]) {
    stripePriceId = plan[priceField]!;
  } else {
    // Create Stripe Product + Price on the fly
    const stripeProduct = await stripe.products.create({
      name: `${plan.product.name} - ${plan.name}`,
      metadata: {
        productId: plan.product_id,
        pricingPlanId: plan.id,
      },
    });

    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100),
      currency: "usd",
      recurring: { interval },
      metadata: {
        pricingPlanId: plan.id,
        billingCycle,
      },
    });

    stripePriceId = stripePrice.id;

    // Save Stripe price ID for reuse
    const { error: updateError } = await supabase
      .from("pricing_plans")
      .update({ [priceField]: stripePriceId })
      .eq("id", plan.id);

    if (updateError) {
      throw new AppError(500, "Failed to update pricing plan", "PLAN_UPDATE_FAILED");
    }
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: stripePriceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        customerId,
        productId: plan.product_id,
        pricingPlanId: plan.id,
        developerId: plan.product.developer_id,
        billingCycle,
      },
      trial_period_days: trialDays,
    },
    metadata: {
      customerId,
      productId: plan.product_id,
      pricingPlanId: plan.id,
    },
    success_url: `${FRONTEND_URL}/customer/subscriptions?success=true`,
    cancel_url: `${FRONTEND_URL}/marketplace/${plan.product.slug || plan.product.id}?canceled=true`,
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Handle Stripe webhook events with idempotency.
 */
export async function handleWebhookEvent(event: { id: string; type: string; data: { object: any } }) {
  // Idempotency: skip if already processed
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) return;

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      // Unhandled event type — still record it
      break;
  }

  // Record processed event
  await supabase.from("webhook_events").insert({ id: event.id, type: event.type });
}

async function handleCheckoutCompleted(session: any) {
  const { customerId, productId, pricingPlanId } = session.metadata;
  const stripeSubscriptionId = session.subscription as string;

  if (!stripeSubscriptionId) return;

  // Fetch Stripe subscription for details
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["items.data"],
  });
  const billingCycle = stripeSub.metadata.billingCycle === "YEARLY" ? "YEARLY" : "MONTHLY";

  // Get period from first subscription item
  const firstItem = stripeSub.items?.data?.[0];
  const periodStart = firstItem?.current_period_start;
  const periodEnd = firstItem?.current_period_end;

  // Fetch product, plan, customer, and developer info for emails
  const [
    { data: plan },
    { data: customer },
    { data: product }
  ] = await Promise.all([
    supabase.from("pricing_plans").select("*").eq("id", pricingPlanId).single(),
    supabase.from("users").select("full_name, email").eq("id", customerId).single(),
    supabase.from("products").select("*, developer:users!developer_id(email)").eq("id", productId).single(),
  ]);

  if (!plan || !customer || !product) return;

  // Create subscription
  await supabase.from("subscriptions").insert({
    customer_id: customerId,
    product_id: productId,
    pricing_plan_id: pricingPlanId,
    stripe_subscription_id: stripeSubscriptionId,
    status: stripeSub.status === "trialing" ? "TRIALING" : "ACTIVE",
    billing_cycle: billingCycle,
    current_period_start: periodStart ? new Date(periodStart * 1000) : new Date(),
    current_period_end: periodEnd ? new Date(periodEnd * 1000) : null,
    trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
  });

  // Increment subscriber count
  await supabase.from("products").update({
    total_subscribers: (product.total_subscribers || 0) + 1
  }).eq("id", productId);

  // Send notification emails
  const emailData = {
    customerName: customer.full_name,
    productName: product.name,
    planName: plan.name,
    amount: billingCycle === "YEARLY" && plan.price_yearly ? plan.price_yearly : plan.price_monthly,
    billingCycle,
  };

  // Developer notification (email + in-app)
  sendNewSubscriptionEmail(product.developer.email, emailData).catch(() => { });
  //todo for next version
  // createNotification({
  //   userId: product.developer_id,
  //   type: "NEW_SUBSCRIBER",
  //   title: "New subscriber!",
  //   message: `${customer.full_name} subscribed to ${product.name} (${plan.name})`,
  //   link: `/developer/products`,
  // }).catch(() => { });

  // Customer confirmation
  sendSubscriptionConfirmationEmail(customer.email, emailData).catch(() => { });
}

async function handleInvoicePaid(invoice: any) {
  console.log(`[Stripe Webhook] handleInvoicePaid triggered for invoice: ${invoice.id}`);

  // Try to find subscription ID in multiple common locations
  let stripeSubscriptionId = invoice.subscription as string;

  if (!stripeSubscriptionId) {
    // Check parent subscription details (found in some trial/quote flows)
    stripeSubscriptionId = invoice.parent?.subscription_details?.subscription;

    // Check lines fallback
    if (!stripeSubscriptionId && invoice.lines?.data?.[0]) {
      stripeSubscriptionId = invoice.lines.data[0].subscription;
    }

    if (stripeSubscriptionId) {
      console.log(`[Stripe Webhook] Found subscription ID in nested path: ${stripeSubscriptionId}`);
    }
  }

  if (!stripeSubscriptionId) {
    console.log("[Stripe Webhook] No subscription ID found on invoice. Object keys:", Object.keys(invoice));
    return;
  }

  // Handle potential race condition: wait a moment for checkout.session.completed to insert the sub
  let subscription = null;
  for (let i = 0; i < 3; i++) {
    const { data } = await supabase
      .from("subscriptions")
      .select("*, product:products!product_id(*)")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    if (data) {
      subscription = data;
      break;
    }
    console.log(`[Stripe Webhook] Subscription ${stripeSubscriptionId} not found in DB yet, retrying in 2s... (attempt ${i + 1})`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  if (!subscription) {
    console.error(`[Stripe Webhook] Subscription ${stripeSubscriptionId} not found after retries. Cannot record transaction.`);
    return;
  }

  const { data: devProfile, error: devError } = await supabase
    .from("developer_profiles")
    .select("id")
    .eq("user_id", subscription.product.developer_id)
    .single();

  if (devError || !devProfile) {
    console.error(`[Stripe Webhook] Developer profile not found for user ${subscription.product.developer_id}`, devError);
    return;
  }

  const amount = (invoice.amount_paid ?? 0) / 100;
  if (amount <= 0) {
    console.log(`[Stripe Webhook] Invoice ${invoice.id} amount is 0 (trial?), skipping transaction record.`);
    return;
  }

  const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
  const developerAmount = amount - platformFee;

  console.log(`[Stripe Webhook] Recording transaction: $${amount} (Fee: $${platformFee})`);

  // Record transaction
  const { error: transError } = await supabase.from("transactions").insert({
    subscription_id: subscription.id,
    customer_id: subscription.customer_id,
    developer_id: devProfile.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    amount,
    platform_fee: platformFee,
    developer_amount: developerAmount,
    status: "SUCCEEDED",
    type: "PAYMENT",
  });

  if (transError) {
    console.error("[Stripe Webhook] Failed to insert transaction record:", transError);
  } else {
    console.log(`[Stripe Webhook] Transaction recorded successfully for subscription ${subscription.id}`);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const stripeSubscriptionId = invoice.subscription as string;
  if (!stripeSubscriptionId) return;

  await supabase
    .from("subscriptions")
    .update({ status: "PAST_DUE" })
    .eq("stripe_subscription_id", stripeSubscriptionId);
}

async function handleSubscriptionUpdated(stripeSub: any) {
  console.log("period fields:", {
    top_start: stripeSub.current_period_start,
    top_end: stripeSub.current_period_end,
    item_start: stripeSub.items?.data?.[0]?.current_period_start,
    item_end: stripeSub.items?.data?.[0]?.current_period_end,
  });
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSub.id)
    .single();

  if (!subscription) return;

  let status: any;
  switch (stripeSub.status) {
    case "active": status = "ACTIVE"; break;
    case "trialing": status = "TRIALING"; break;
    case "past_due": status = "PAST_DUE"; break;
    case "canceled": status = "CANCELED"; break;
    default: status = subscription.status; break;
  }

  // ✅ Read period dates from the item level, with top-level as fallback
  const firstItem = stripeSub.items?.data?.[0];

  const rawPeriodStart =
    firstItem?.current_period_start ??
    stripeSub.current_period_start ??
    null;

  const rawPeriodEnd =
    firstItem?.current_period_end ??
    stripeSub.current_period_end ??
    null;

  const updatedSub = {
    status,
    current_period_start: rawPeriodStart
      ? new Date(rawPeriodStart * 1000).toISOString()
      : null,
    current_period_end: rawPeriodEnd
      ? new Date(rawPeriodEnd * 1000).toISOString()
      : null,
    canceled_at: stripeSub.canceled_at
      ? new Date(stripeSub.canceled_at * 1000).toISOString()
      : null,
  };

  await supabase
    .from("subscriptions")
    .update(updatedSub)
    .eq("id", subscription.id);
}

async function handleSubscriptionDeleted(stripeSub: any) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSub.id)
    .single();
  if (!subscription) return;
  await supabase
    .from("subscriptions")
    .update({
      status: "CANCELED",
      canceled_at: new Date(),
    })
    .eq("id", subscription.id);

  // Decrement subscriber count
  const { data: product } = await supabase
    .from("products")
    .select("total_subscribers")
    .eq("id", subscription.product_id)
    .single();

  if (product) {
    await supabase.from("products").update({
      total_subscribers: Math.max(0, (product.total_subscribers || 0) - 1)
    }).eq("id", subscription.product_id);
  }
}

/**
 * Switch a subscription to a different plan (upgrade/downgrade).
 */
export async function switchPlan(
  subscriptionId: string,
  customerId: string,
  newPricingPlanId: string,
  billingCycle: "MONTHLY" | "YEARLY"
) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, pricing_plan:pricing_plans(*)")
    .eq("id", subscriptionId)
    .single();

  if (!subscription) {
    throw new AppError(404, "Subscription not found", "SUB_NOT_FOUND");
  }

  if (subscription.customer_id !== customerId) {
    throw new AppError(403, "Not your subscription", "FORBIDDEN");
  }

  if (subscription.status !== "ACTIVE" && subscription.status !== "TRIALING") {
    throw new AppError(400, "Can only switch plans on active subscriptions", "INVALID_STATUS");
  }

  // Verify new plan belongs to same product
  const { data: newPlan } = await supabase.from("pricing_plans").select("*").eq("id", newPricingPlanId).single();
  if (!newPlan || !newPlan.is_active) {
    throw new AppError(404, "Pricing plan not found", "PLAN_NOT_FOUND");
  }

  if (newPlan.product_id !== subscription.product_id) {
    throw new AppError(400, "Can only switch to plans within the same product", "WRONG_PRODUCT");
  }

  if (newPlan.id === subscription.pricing_plan_id && billingCycle === subscription.billing_cycle) {
    throw new AppError(400, "Already on this plan", "SAME_PLAN");
  }

  // Determine new Stripe price
  const price = billingCycle === "YEARLY" && newPlan.price_yearly
    ? newPlan.price_yearly
    : newPlan.price_monthly;
  const interval = billingCycle === "YEARLY" ? "year" : "month";
  const priceField = billingCycle === "YEARLY" ? "stripe_price_id_yearly" : "stripe_price_id_monthly";

  let stripePriceId = newPlan[priceField];

  if (!stripePriceId) {
    const { data: product } = await supabase.from("products").select("name").eq("id", newPlan.product_id).single();
    const stripeProduct = await stripe.products.create({
      name: `${product!.name} - ${newPlan.name}`,
      metadata: { productId: newPlan.product_id, pricingPlanId: newPlan.id },
    });
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100),
      currency: "usd",
      recurring: { interval },
      metadata: { pricingPlanId: newPlan.id, billingCycle },
    });
    stripePriceId = stripePrice.id;
    await supabase.from("pricing_plans").update({ [priceField]: stripePriceId }).eq("id", newPlan.id);
  }

  // Update Stripe subscription
  if (subscription.stripe_subscription_id) {
    const stripeSub = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{
        id: stripeSub.items.data[0].id,
        price: stripePriceId,
      }],
      proration_behavior: "create_prorations",
    });
  }

  // Update local subscription
  const { data: updatedSub, error: updateError } = await supabase
    .from("subscriptions")
    .update({
      pricing_plan_id: newPlan.id,
      billing_cycle: billingCycle as any,
    })
    .eq("id", subscriptionId)
    .select("*, product:products(name, slug), pricing_plan:pricing_plans(name, price_monthly, price_yearly)")
    .single();

  if (updateError) {
    throw new AppError(500, "Failed to update local subscription", "SUB_UPDATE_FAILED");
  }

  return updatedSub;
}

/**
 * Cancel a subscription at period end.
 */
export async function cancelSubscription(subscriptionId: string, customerId: string) {
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (!subscription) {
    throw new AppError(404, "Subscription not found", "SUB_NOT_FOUND");
  }

  if (subscription.customer_id !== customerId) {
    throw new AppError(403, "Not your subscription", "FORBIDDEN");
  }

  if (subscription.status === "CANCELED" || subscription.status === "EXPIRED") {
    throw new AppError(400, "Subscription is already canceled", "ALREADY_CANCELED");
  }

  // Cancel at period end in Stripe
  if (subscription.stripe_subscription_id) {
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  }

  const { data: updatedSub, error: updateError } = await supabase
    .from("subscriptions")
    .update({ canceled_at: new Date() })
    .eq("id", subscriptionId)
    .select("*, product:products(name, slug), pricing_plan:pricing_plans(name)")
    .single();

  if (updateError) {
    throw new AppError(500, "Failed to cancel subscription locally", "SUB_CANCEL_FAILED");
  }

  return updatedSub;
}
