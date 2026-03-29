import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

const WP_DOMAIN = process.env.WP_DOMAIN ?? "localhost";

/**
 * Provision a WordPress subsite for an approved developer.
 * In production, this calls WP-CLI on the VPS to create the Multisite subsite.
 * For development, it records the site in the database and simulates provisioning.
 */
export async function provisionSite(
  developerId: string,
  subdomain: string
) {
  // Validate subdomain format
  const subdomainRegex = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
  if (!subdomainRegex.test(subdomain)) {
    throw new AppError(400, "Invalid subdomain. Use lowercase letters, numbers, and hyphens (3-32 chars)", "INVALID_SUBDOMAIN");
  }

  // Check developer exists and is approved
  const profile = await prisma.developerProfile.findUnique({
    where: { id: developerId },
    include: { user: true },
  });

  if (!profile) {
    throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
  }

  if (profile.applicationStatus !== "APPROVED") {
    throw new AppError(403, "Developer application must be approved first", "NOT_APPROVED");
  }

  // Check subdomain uniqueness
  const existing = await prisma.developerSite.findUnique({
    where: { subdomain },
  });

  if (existing) {
    throw new AppError(409, "Subdomain is already taken", "SUBDOMAIN_TAKEN");
  }

  // Create site record in PROVISIONING status
  const site = await prisma.developerSite.create({
    data: {
      developerId,
      subdomain,
      siteUrl: `https://${subdomain}.${WP_DOMAIN}`,
      status: "PROVISIONING",
    },
  });

  // In production, this would execute WP-CLI:
  // wp site create --slug=<subdomain> --title="<businessName>" --email=<email>
  // For now, simulate successful provisioning by marking as ACTIVE
  const activeSite = await prisma.developerSite.update({
    where: { id: site.id },
    data: {
      status: "ACTIVE",
      wpSiteId: Math.floor(Math.random() * 10000) + 1, // Simulated WP blog ID
    },
  });

  return activeSite;
}

export async function getDeveloperSites(developerId: string) {
  return prisma.developerSite.findMany({
    where: { developerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSiteById(siteId: string, developerId: string) {
  const site = await prisma.developerSite.findUnique({
    where: { id: siteId },
  });

  if (!site) {
    throw new AppError(404, "Site not found", "SITE_NOT_FOUND");
  }

  if (site.developerId !== developerId) {
    throw new AppError(403, "You do not own this site", "FORBIDDEN");
  }

  return site;
}

export async function suspendSite(siteId: string) {
  const site = await prisma.developerSite.findUnique({ where: { id: siteId } });

  if (!site) {
    throw new AppError(404, "Site not found", "SITE_NOT_FOUND");
  }

  return prisma.developerSite.update({
    where: { id: siteId },
    data: { status: "SUSPENDED" },
  });
}

export async function checkSubscriptionAccess(
  userEmail: string,
  siteSubdomain: string
) {
  // Find the site
  const site = await prisma.developerSite.findUnique({
    where: { subdomain: siteSubdomain },
    include: { products: { where: { status: "PUBLISHED" } } },
  });

  if (!site || site.status !== "ACTIVE") {
    return { hasAccess: false, plan: null };
  }

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return { hasAccess: false, plan: null };
  }

  // Check if user has active subscription to any product on this site
  const productIds = site.products.map((p) => p.id);
  if (productIds.length === 0) {
    return { hasAccess: false, plan: null };
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      customerId: user.id,
      productId: { in: productIds },
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: {
      pricingPlan: true,
    },
  });

  if (!subscription) {
    return { hasAccess: false, plan: null };
  }

  return {
    hasAccess: true,
    plan: subscription.pricingPlan.name,
  };
}
