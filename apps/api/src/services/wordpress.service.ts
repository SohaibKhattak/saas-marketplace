import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const WP_DOMAIN = process.env.WP_DOMAIN ?? "localhost";
const WP_CLI_PATH = process.env.WP_CLI_PATH ?? "/usr/local/bin/wp";
const WP_PATH = "/var/www/wordpress";

/**
 * Execute a WP-CLI command on the WordPress Multisite installation.
 */
async function wpCli(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `sudo -u www-data ${WP_CLI_PATH} ${command} --path=${WP_PATH}`,
      { timeout: 30000 }
    );
    return stdout.trim();
  } catch (error: any) {
    console.error("WP-CLI error:", error.message);
    throw new AppError(500, `WordPress command failed: ${error.message}`, "WP_CLI_ERROR");
  }
}

/**
 * Provision a WordPress subsite for an approved developer.
 * Calls WP-CLI on the VPS to create the Multisite subsite.
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

  // Reserved subdomains
  const reserved = ["api", "www", "admin", "mail", "ftp", "wp", "wordpress", "testsite"];
  if (reserved.includes(subdomain)) {
    throw new AppError(400, "This subdomain is reserved", "SUBDOMAIN_RESERVED");
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

  // Check subdomain uniqueness in our database
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

  try {
    const title = profile.businessName || profile.user.fullName + "'s Site";
    const email = profile.user.email;
    let username = subdomain.replace(/-/g, "") + "admin";
    const password = "Dev@" + Math.random().toString(36).slice(2, 10) + "!";

    // Step 1: Create the WordPress subsite via WP-CLI
    const output = await wpCli(
      `site create --slug=${subdomain} --title="${title}" --email=${email}`
    );

    // Extract the blog ID from WP-CLI output (e.g., "Success: Site 3 created.")
    const blogIdMatch = output.match(/Site\s+(\d+)\s+created/);
    const wpSiteId = blogIdMatch ? parseInt(blogIdMatch[1], 10) : null;

    // Step 2: wp site create auto-creates a user with that email if it doesn't exist.
    // Either way, set a known password so the developer can log in.
    try {
      await wpCli(`user update ${email} --user_pass="${password}" --display_name="${profile.user.fullName}"`);
    } catch {
      // If update fails, try creating the user
      try {
        await wpCli(
          `user create ${username} ${email} --user_pass="${password}" --display_name="${profile.user.fullName}" --role=administrator`
        );
      } catch {
        // User might already exist with different lookup — continue anyway
      }
    }

    // Step 3: Get the actual WP username for this email
    let actualUsername = username;
    try {
      actualUsername = await wpCli(`user get ${email} --field=user_login`);
    } catch {
      // fallback to generated username
    }

    // Step 4: Make them a super admin so they have full access
    try {
      await wpCli(`super-admin add ${actualUsername}`);
    } catch {
      // Not critical
    }

    // Use the actual WP username for credentials
    username = actualUsername;

    // Update site record to ACTIVE
    const activeSite = await prisma.developerSite.update({
      where: { id: site.id },
      data: {
        status: "ACTIVE",
        wpSiteId,
      },
    });

    return {
      ...activeSite,
      wpCredentials: {
        username,
        password,
        loginUrl: `https://${subdomain}.${WP_DOMAIN}/wp-login.php`,
      },
    };
  } catch (error) {
    // If WP-CLI fails, mark site as failed and re-throw
    await prisma.developerSite.update({
      where: { id: site.id },
      data: { status: "SUSPENDED" },
    });
    throw error;
  }
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
