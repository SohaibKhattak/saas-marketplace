// import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";
import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "../config/env.js";
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

const execFileAsync = promisify(execFile);

const WP_DOMAIN = process.env.NODE_ENV === "development" || process.platform === "win32"
  ? "saasifyy.tech"
  : (env.WP_SITE_URL ? new URL(env.WP_SITE_URL).hostname : "saasifyy.tech");

const WP_CLI_PATH = env.WP_CLI_PATH;
const WP_PATH = "/var/www/wordpress";

/**
 * Execute a WP-CLI command on the WordPress Multisite installation.
 * Uses execFile (no shell) to prevent command injection.
 */
async function wpCli(args: string[]): Promise<string> {
  // IF LOCAL DEVELOPMENT: Route commands through the live production Azure API bridge
  if (process.env.NODE_ENV === "development" || process.platform === "win32") {
    console.log("⚡ Local Dev Detected: Routing WP-CLI over secure bridge connection...");
    try {
      const response = await fetch(
        "https://api.saasifyy.tech/api/v1/internal/wp-cli-bridge",
        {
          body: JSON.stringify({ args }),
          method: "POST",
          headers: {
            "x-internal-secret": env.INTERNAL_WP_SECRET,
            "Content-Type": "application/json"
          }
        }
      );
      const body = (await response.json()) as { output: string };

      return body.output;
    } catch (error: any) {
      console.error("❌ Remote WP-CLI Bridge Failed:", error.message);
      throw new AppError(500, `Remote WordPress compilation failed: ${error.message}`, "WP_BRIDGE_ERROR");
    }
  }

  // IF PRODUCTION: Execute directly on the local machine bash terminal
  try {
    const { stdout } = await execFileAsync(
      "sudo",
      ["-u", "www-data", env.WP_CLI_PATH, ...args, `--path=${WP_PATH}`],
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

  console.log("Checking developer profile for ID:", developerId);
  const { data: profile, error } = await supabase
    .from("developer_profiles")
    .select(`
      *,
      user:user_id (
        id,
        full_name
      )
    `)
    .eq("id", developerId)
    .maybeSingle();
  console.log("Developer profile query result:", { profile, error });
  // const profile = await prisma.developerProfile.findUnique({
  //   where: { id: developerId },
  //   include: { user: true },
  // });

  if (!profile) {
    throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
  }


  if (profile.application_status !== 'APPROVED') {
    throw new AppError(403, "Developer application must be approved first", "NOT_APPROVED");
  }

  // const user = profile.user?.[0];
  // if (!user) {
  //   throw new AppError(404, "Developer user not found", "USER_NOT_FOUND");
  // }

  // Check subdomain uniqueness in our database
  const { data: existing, error: existingError } = await supabase.from("developer_sites")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle();
  console.log("Subdomain uniqueness check result:", { existing, existingError });
  // const existing = await prisma.developerSite.findUnique({
  //   where: { subdomain },
  // });

  if (existing) {
    throw new AppError(409, "Subdomain is already taken", "SUBDOMAIN_TAKEN");
  }

  // Create site record in PROVISIONING status
  const { data: site, error: siteError } = await supabase.from("developer_sites")
    .insert({ developer_id: developerId, subdomain, site_url: `https://${subdomain}.${WP_DOMAIN}`, status: "PROVISIONING" })
    .select("id")
    .single();

  if (siteError || !site) {
    throw new AppError(500, siteError?.message || "Failed to create site record", "DB_ERROR");
  }
  // const site = await prisma.developerSite.create({
  //   data: {
  //     developerId,
  //     subdomain,
  //     siteUrl: `https://${subdomain}.${WP_DOMAIN}`,
  //     status: "PROVISIONING",
  //   },
  // });

  try {
    const title = profile.business_name + "'s Site";
    const email = profile.business_email;
    let username = subdomain.replace(/-/g, "") + "admin";
    const password = "Dev@" + Math.random().toString(36).slice(2, 10) + "!";

    // Step 1: Create the WordPress subsite via WP-CLI
    const output = await wpCli([
      "site", "create", `--slug=${subdomain}`, `--title=${title}`, `--email=${email}`
    ]);

    // Extract the blog ID from WP-CLI output (e.g., "Success: Site 3 created.")
    const blogIdMatch = output.match(/Site\s+(\d+)\s+created/);
    const wpSiteId = blogIdMatch ? parseInt(blogIdMatch[1], 10) : null;

    // Step 2: wp site create auto-creates a user with that email if it doesn't exist.
    // Either way, set a known password so the developer can log in.
    try {
      const displayName = (profile.user as any)?.full_name || subdomain + " Admin";
      await wpCli(["user", "update", email, `--user_pass=${password}`, `--display_name=${displayName}`]);
    } catch {
      // If update fails, try creating the user
      try {
        const displayName = (profile.user as any)?.full_name || subdomain + " Admin";
        await wpCli([
          "user", "create", username, email, `--user_pass=${password}`, `--display_name=${displayName}`, "--role=administrator"
        ]);
      } catch {
        // User might already exist with different lookup — continue anyway
      }
    }

    // Step 3: Get the actual WP username for this email
    let actualUsername = username;
    try {
      actualUsername = await wpCli(["user", "get", email, "--field=user_login"]);
    } catch {
      // fallback to generated username
    }

    // Step 4: Make them a super admin so they have full access
    try {
      await wpCli(["super-admin", "add", actualUsername]);
    } catch {
      // Not critical
    }

    // Use the actual WP username for credentials
    username = actualUsername;

    // Update site record to ACTIVE
    const { data: activeSite, error: activeError } = await supabase.from("developer_sites")
      .update({ status: "ACTIVE", wp_site_id: wpSiteId })
      .eq("id", site.id)
      .select("*")
      .single();
    if (activeError || !activeSite) {
      throw new AppError(500, activeError?.message || "Failed to update site record", "DB_ERROR");
    }
    // const activeSite = await prisma.developerSite.update({
    //   where: { id: site.id },
    //   data: {
    //     status: "ACTIVE",
    //     wpSiteId,
    //   },
    // });
    // Safely construct urls using HTTPS protocols
    const formattedSiteUrl = `https://${subdomain}.${WP_DOMAIN}`;
    const formattedLoginUrl = `https://${subdomain}.${WP_DOMAIN}/wp-login.php`;

    // Update the database record with the clean HTTPS URL string
    await supabase.from("developer_sites")
      .update({ site_url: formattedSiteUrl })
      .eq("id", site.id);

    return {
      ...activeSite,
      site_url: formattedSiteUrl, // Override fallback
      wpCredentials: {
        username,
        password,
        loginUrl: formattedLoginUrl, // Clean production URL output
      },
    };
  } catch (error) {
    // If WP-CLI fails, mark site as failed and re-throw
    // console.error("Provisioning failed, marking site as SUSPENDED:", error);    

    const { error: suspendError } = await supabase.from("developer_sites")
      .update({ status: "SUSPENDED" })
      .eq("id", site.id);
    if (suspendError) {
      console.error("Failed to update site status to SUSPENDED:", suspendError);
    }
    // await prisma.developerSite.update({
    //   where: { id: site.id },
    //   data: { status: "SUSPENDED" },
    // });
    throw error;
  }
}

export async function getDeveloperSites(developerId: string) {
  const {data: sites, error} = await supabase.from("developer_sites").select("*").eq("developerId", developerId).order("createdAt", { ascending: false });
  if (error) {
    throw new AppError(500, error.message || "Database operation failed", "SUPABASE_ERROR");
  }
  return sites;
}

export async function getSiteById(siteId: string, developerId: string) {
  // const site = await prisma.developerSite.findUnique({
  //   where: { id: siteId },
  // });
  const {data: site, error: siteError} = await supabase.from("developer_sites").select("*").eq("id", siteId).maybeSingle();
  if (siteError) {
    throw new AppError(500, siteError.message || "Database operation failed", "SUPABASE_ERROR");
  }
  if (!site) {
    throw new AppError(404, "Site not found", "SITE_NOT_FOUND");
  }

  if (site.developerId !== developerId) {
    throw new AppError(403, "You do not own this site", "FORBIDDEN");
  }

  return site;
}

// export async function suspendSite(siteId: string) {
//   const site = await prisma.developerSite.findUnique({ where: { id: siteId } });

//   if (!site) {
//     throw new AppError(404, "Site not found", "SITE_NOT_FOUND");
//   }

//   return prisma.developerSite.update({
//     where: { id: siteId },
//     data: { status: "SUSPENDED" },
//   });
// }

export async function deleteWPSite(site: any) {
  try {
    if (!site.wp_site_id) {
      return true; // No WP site to delete, consider it successful
    }
    await wpCli(["site", "delete", site.wp_site_id.toString(), "--yes"]);
    return true;
  } catch (error) {
    console.error("Failed to delete WP subsite:", error);
    throw new AppError(500, "Failed to delete WordPress site", "WP_DELETE_ERROR");
  } 
  
}

export async function checkSubscriptionAccess(
  userEmail: string,
  siteSubdomain: string
) {
  // Find the site
  // const site = await prisma.developerSite.findUnique({
  //   where: { subdomain: siteSubdomain },
  //   include: { products: { where: { status: "PUBLISHED" } } },
  // });
  const {data: site, error: siteError} = await supabase.from("developer_sites").select("*").eq("subdomain", siteSubdomain).maybeSingle();
  if (siteError) {
    throw new AppError(500, siteError.message || "Database operation failed", "SUPABASE_ERROR");
  }
  if (!site || site.status !== "ACTIVE") {
    return { hasAccess: false, plan: null };
  }

  // Find the user
  // const user = await prisma.user.findUnique({
  //   where: { email: userEmail },
  // });

  const {data: user, error: userError} = await supabase.from("users").select("*").eq("email", userEmail).maybeSingle();
  if (userError) {
    throw new AppError(500, userError.message || "Database operation failed", "SUPABASE_ERROR");
  }
  if (!user) {
    return { hasAccess: false, plan: null };
  }

  // Check if user has active subscription to any product on this site
  const productIds = site.products.map((p: any) => p.id);
  if (productIds.length === 0) {
    return { hasAccess: false, plan: null };
  }

  // const subscription = await prisma.subscription.findFirst({
  //   where: {
  //     customerId: user.id,
  //     productId: { in: productIds },
  //     status: { in: ["ACTIVE", "TRIALING"] },
  //   },
  //   include: {
  //     pricingPlan: true,
  //   },
  // });

  const {data: subscription, error: subscriptionError} = await supabase.from("subscriptions").select("*").eq("customer_id", user.id).in("product_id", productIds).in("status", ["ACTIVE", "TRIALING"]).maybeSingle();
  if (subscriptionError) {
    throw new AppError(500, subscriptionError.message || "Database operation failed", "SUPABASE_ERROR");
  }
  if (!subscription) {
    return { hasAccess: false, plan: null };
  }

  return {
    hasAccess: true,
    plan: subscription.pricingPlan.name,
  };
}

/**
 * Generate a short-lived launch token for a customer to access a WordPress subsite.
 * The token is a JWT containing the user's email and site slug, valid for 5 minutes.
 */
export function generateLaunchToken(userEmail: string, siteSlug: string): string {
  return jwt.sign(
    { email: userEmail, site: siteSlug, purpose: "wp_launch" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "5m", algorithm: "HS256" }
  );
}

/**
 * Validate a launch token and return the user email if valid.
 * Called by the WordPress mu-plugin to verify the token.
 */
export function validateLaunchToken(token: string): { email: string; site: string } | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as { email: string; site: string; purpose: string };

    if (payload.purpose !== "wp_launch") {
      return null;
    }

    return { email: payload.email, site: payload.site };
  } catch {
    return null;
  }
}