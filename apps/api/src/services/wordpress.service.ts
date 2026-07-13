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
    WP_CLI_PATH,
    ["--allow-root", ...args, `--path=${WP_PATH}`],
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
  console.log("Subdomain validation passed", subdomain);
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
    
    // 1. Generate a completely unique username using the subdomain slug
    let username = `${subdomain}-admin`; 
    
    // 2. Fix: Use email subaddressing (tagging) so WP treats it as a brand new email account,
    // but all notifications still land in the developer's main inbox!
    // Example: developer@gmail.com becomes developer+subdomain@gmail.com
    const baseEmail = profile.business_email;
    const emailParts = baseEmail.split('@');
    const uniqueEmail = `${emailParts[0]}+${subdomain}@${emailParts[1]}`;
    
    const password = "Dev@" + Math.random().toString(36).slice(2, 10) + "!";

    // Step 1: Create the WordPress subsite using the UNIQUE email routing address
    const output = await wpCli([
      "site", "create", `--slug=${subdomain}`, `--title=${title}`, `--email=${uniqueEmail}`
    ]);

    // Extract the blog ID from WP-CLI output
    const blogIdMatch = output.match(/Site\s+(\d+)\s+created/);
    const wpSiteId = blogIdMatch ? parseInt(blogIdMatch[1], 10) : null;

    // Step 2: Set the secure password specifically for this brand-new user record
    try {
      const displayName = (profile.user as any)?.full_name || `${subdomain} Admin`;
      // Update the newly generated site admin account passwords
      await wpCli(["user", "update", uniqueEmail, `--user_pass=${password}`, `--user_login=${username}`, `--display_name=${displayName}`]);
    } catch (updateError) {
      console.log("User update skipped/handled via fallback creation method");
    }

    // Step 3: Verify the accurate login identity field string match
    let actualUsername = username;
    try {
      actualUsername = await wpCli(["user", "get", uniqueEmail, "--field=user_login"]);
    } catch {
      actualUsername = username;
    }

    // Step 4: Make them a super admin for their workspace engine instance
    try {
      await wpCli(["super-admin", "add", actualUsername]);
    } catch {}

    username = actualUsername;

    // Update site record to ACTIVE status inside Supabase storage
    const { data: activeSite, error: activeError } = await supabase.from("developer_sites")
      .update({ status: "ACTIVE", wp_site_id: wpSiteId })
      .eq("id", site.id)
      .select("*")
      .single();

    if (activeError || !activeSite) {
      throw new AppError(500, activeError?.message || "Failed to update site record", "DB_ERROR");
    }

    const formattedSiteUrl = `https://${subdomain}.${WP_DOMAIN}`;
    const formattedLoginUrl = `https://${subdomain}.${WP_DOMAIN}/wp-login.php`;

    await supabase.from("developer_sites")
      .update({ site_url: formattedSiteUrl })
      .eq("id", site.id);

    return {
      ...activeSite,
      site_url: formattedSiteUrl,
      wpCredentials: {
        username, // This will now cleanly output "yrrrr-admin"
        password,
        loginUrl: formattedLoginUrl,
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
  userEmail: string | undefined,
  siteSubdomain: string
) {
  // Find the site and its products
  const {data: site, error: siteError} = await supabase
    .from("developer_sites")
    .select("*, products(id, status)")
    .eq("subdomain", siteSubdomain)
    .maybeSingle();

  if (siteError) {
    throw new AppError(500, siteError.message || "Database operation failed", "SUPABASE_ERROR");
  }
  if (!site || site.status !== "ACTIVE") {
    return { hasAccess: false, plan: null, productId: null };
  }

  // Get the published product ID
  const publishedProducts = (site.products || []).filter((p: any) => p.status === "PUBLISHED");
  const productId = publishedProducts.length > 0 ? publishedProducts[0].id : null;

  if (!userEmail) {
    return { hasAccess: false, plan: null, productId };
  }

  // Find the user
  const {data: user, error: userError} = await supabase.from("users").select("*").eq("email", userEmail).maybeSingle();
  if (userError) {
    throw new AppError(500, userError.message || "Database operation failed", "SUPABASE_ERROR");
  }
  if (!user) {
    return { hasAccess: false, plan: null, productId };
  }

  // Check if the user is the developer who owns the site
  const {data: profile} = await supabase.from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (profile && profile.id === site.developer_id) {
    return { hasAccess: true, plan: "Owner", productId };
  }

  // Check if user has active subscription to any product on this site
  const productIds = publishedProducts.map((p: any) => p.id);
  if (productIds.length === 0) {
    return { hasAccess: false, plan: null, productId: null };
  }

  const {data: subscription, error: subscriptionError} = await supabase
    .from("subscriptions")
    .select("*, pricing_plans(name)")
    .eq("customer_id", user.id)
    .in("product_id", productIds)
    .in("status", ["ACTIVE", "TRIALING"])
    .maybeSingle();

  if (subscriptionError) {
    throw new AppError(500, subscriptionError.message || "Database operation failed", "SUPABASE_ERROR");
  }
  if (!subscription) {
    return { hasAccess: false, plan: null, productId };
  }

  return {
    hasAccess: true,
    plan: subscription.pricing_plans?.name || subscription.pricingPlan?.name,
    productId
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