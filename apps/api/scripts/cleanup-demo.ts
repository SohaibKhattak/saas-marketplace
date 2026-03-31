import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "sohaibktk969@gmail.com";

async function cleanup() {
  console.log("Starting demo data cleanup...\n");

  // Get admin user ID to preserve
  const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    console.error(`Admin user ${ADMIN_EMAIL} not found! Aborting.`);
    process.exit(1);
  }
  console.log(`Preserving admin: ${admin.fullName} (${admin.email})\n`);

  // Delete in FK-safe order
  const webhookEvents = await prisma.webhookEvent.deleteMany({});
  console.log(`Deleted ${webhookEvents.count} webhook events`);

  const auditLogs = await prisma.auditLog.deleteMany({
    where: { userId: { not: admin.id } },
  });
  console.log(`Deleted ${auditLogs.count} audit logs`);

  const notifications = await prisma.notification.deleteMany({
    where: { userId: { not: admin.id } },
  });
  console.log(`Deleted ${notifications.count} notifications`);

  const transactions = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${transactions.count} transactions`);

  const payouts = await prisma.payout.deleteMany({});
  console.log(`Deleted ${payouts.count} payouts`);

  const reviews = await prisma.review.deleteMany({});
  console.log(`Deleted ${reviews.count} reviews`);

  const subscriptions = await prisma.subscription.deleteMany({});
  console.log(`Deleted ${subscriptions.count} subscriptions`);

  const pricingPlans = await prisma.pricingPlan.deleteMany({});
  console.log(`Deleted ${pricingPlans.count} pricing plans`);

  const products = await prisma.product.deleteMany({});
  console.log(`Deleted ${products.count} products`);

  const sites = await prisma.developerSite.deleteMany({});
  console.log(`Deleted ${sites.count} developer sites`);

  const devProfiles = await prisma.developerProfile.deleteMany({});
  console.log(`Deleted ${devProfiles.count} developer profiles`);

  const users = await prisma.user.deleteMany({
    where: { id: { not: admin.id } },
  });
  console.log(`Deleted ${users.count} users`);

  // Also clean up admin's non-essential data
  await prisma.auditLog.deleteMany({ where: { userId: admin.id } });
  await prisma.notification.deleteMany({ where: { userId: admin.id } });

  console.log("\n--- Cleanup complete ---");
  console.log(`Remaining: 1 admin user (${ADMIN_EMAIL})`);
  console.log("Database is ready for real data.\n");
}

cleanup()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
