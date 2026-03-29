import { stripe } from "../config/stripe.js";
import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT ?? "15");

/**
 * Create a Stripe Checkout Session for a subscription.
 */
export async function createCheckoutSession(
  customerId: string,
  pricingPlanId: string,
  billingCycle: "MONTHLY" | "YEARLY"
) {
  const plan = await prisma.pricingPlan.findUnique({
    where: { id: pricingPlanId },
    include: {
      product: {
        include: { developer: true },
      },
    },
  });

  if (!plan || !plan.isActive) {
    throw new AppError(404, "Pricing plan not found or inactive", "PLAN_NOT_FOUND");
  }

  if (plan.product.status !== "PUBLISHED") {
    throw new AppError(400, "Product is not published", "NOT_PUBLISHED");
  }

  // Check if customer already has active subscription to this product
  const existingSub = await prisma.subscription.findFirst({
    where: {
      customerId,
      productId: plan.productId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
  });

  if (existingSub) {
    throw new AppError(409, "You already have an active subscription to this product", "ALREADY_SUBSCRIBED");
  }

  // Determine price
  const price = billingCycle === "YEARLY" && plan.priceYearly
    ? plan.priceYearly
    : plan.priceMonthly;

  const interval = billingCycle === "YEARLY" ? "year" : "month";

  // Create or get Stripe Price
  let stripePriceId: string;

  const priceField = billingCycle === "YEARLY" ? "stripePriceIdYearly" : "stripePriceIdMonthly";
  if (plan[priceField]) {
    stripePriceId = plan[priceField]!;
  } else {
    // Create Stripe Product + Price on the fly
    const stripeProduct = await stripe.products.create({
      name: `${plan.product.name} - ${plan.name}`,
      metadata: {
        productId: plan.productId,
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
    await prisma.pricingPlan.update({
      where: { id: plan.id },
      data: { [priceField]: stripePriceId },
    });
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: stripePriceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        customerId,
        productId: plan.productId,
        pricingPlanId: plan.id,
        developerId: plan.product.developerId,
        billingCycle,
      },
      trial_period_days: plan.trialDays > 0 ? plan.trialDays : undefined,
    },
    metadata: {
      customerId,
      productId: plan.productId,
      pricingPlanId: plan.id,
    },
    success_url: `${FRONTEND_URL}/customer/subscriptions?success=true`,
    cancel_url: `${FRONTEND_URL}/marketplace/${plan.product.slug}?canceled=true`,
  });

  return { sessionId: session.id, url: session.url };
}

/**
 * Handle Stripe webhook events.
 */
export async function handleWebhookEvent(event: any) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      // Unhandled event type
      break;
  }
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

  // Create subscription in our database
  await prisma.subscription.create({
    data: {
      customerId,
      productId,
      pricingPlanId,
      stripeSubscriptionId,
      status: stripeSub.status === "trialing" ? "TRIALING" : "ACTIVE",
      billingCycle: billingCycle as any,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : new Date(),
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
    },
  });

  // Increment subscriber count
  await prisma.product.update({
    where: { id: productId },
    data: { totalSubscribers: { increment: 1 } },
  });
}

async function handleInvoicePaid(invoice: any) {
  const stripeSubscriptionId = invoice.subscription as string;
  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
    include: {
      product: { include: { developer: true } },
    },
  });

  if (!subscription) return;

  const amount = (invoice.amount_paid ?? 0) / 100;
  if (amount <= 0) return;

  const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
  const developerAmount = amount - platformFee;

  // Record transaction
  await prisma.transaction.create({
    data: {
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      developerId: subscription.product.developerId,
      stripePaymentIntentId: invoice.payment_intent as string,
      amount,
      platformFee,
      developerAmount,
      status: "SUCCEEDED",
      type: "PAYMENT",
    },
  });
}

async function handleSubscriptionUpdated(stripeSub: any) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  });

  if (!subscription) return;

  let status: any;
  switch (stripeSub.status) {
    case "active": status = "ACTIVE"; break;
    case "trialing": status = "TRIALING"; break;
    case "past_due": status = "PAST_DUE"; break;
    case "canceled": status = "CANCELED"; break;
    default: status = subscription.status; break;
  }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      canceledAt: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000) : null,
    },
  });
}

async function handleSubscriptionDeleted(stripeSub: any) {
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
    include: { product: true },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });

  // Decrement subscriber count
  await prisma.product.update({
    where: { id: subscription.productId },
    data: {
      totalSubscribers: { decrement: 1 },
    },
  });
}

/**
 * Cancel a subscription at period end.
 */
export async function cancelSubscription(subscriptionId: string, customerId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError(404, "Subscription not found", "SUB_NOT_FOUND");
  }

  if (subscription.customerId !== customerId) {
    throw new AppError(403, "Not your subscription", "FORBIDDEN");
  }

  if (subscription.status === "CANCELED" || subscription.status === "EXPIRED") {
    throw new AppError(400, "Subscription is already canceled", "ALREADY_CANCELED");
  }

  // Cancel at period end in Stripe
  if (subscription.stripeSubscriptionId) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: { canceledAt: new Date() },
    include: {
      product: { select: { name: true, slug: true } },
      pricingPlan: { select: { name: true } },
    },
  });
}
