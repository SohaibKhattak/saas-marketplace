import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";
import { AppError } from "../middleware/error-handler.js";
import { stripe } from "../config/stripe.js";
import { env } from "../config/env.js";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

type DeveloperProfileRow = {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string;
  tax_id: string | null;
  bio: string | null;
  application_status: ApplicationStatus;
  rejection_reason: string | null;
  stripe_account_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
};

type DeveloperSiteDto = {
  id: string;
  developerId: string;
  wpSiteId: number | null;
  subdomain: string;
  siteUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type DeveloperProfileDto = {
  id: string;
  userId: string;
  businessName: string;
  businessEmail: string;
  taxId: string | null;
  bio: string | null;
  applicationStatus: ApplicationStatus;
  rejectionReason: string | null;
  stripeAccountId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DeveloperProfileWithRelationsDto = DeveloperProfileDto & {
  stripeChargesEnabled: boolean;
  stripeDetailsSubmitted: boolean;
  productCount: number;
  sites: DeveloperSiteDto[];
};

type DeveloperApplicationUserDto = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

type DeveloperApplicationDto = DeveloperProfileDto & {
  user: DeveloperApplicationUserDto | null;
};

type DeveloperProfileDatabaseRow = {
  id: string;
  user_id: string;
  business_name: string;
  business_email: string;
  tax_id: string | null;
  bio: string | null;
  application_status: ApplicationStatus;
  rejection_reason: string | null;
  stripe_account_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

type DeveloperSiteDatabaseRow = {
  id: string;
  developer_id: string;
  wp_site_id: number | null;
  subdomain: string;
  site_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type UsersListDatabaseRow = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
};

type DeveloperApplicationDatabaseRow = DeveloperProfileDatabaseRow;

type DeveloperProfileResponse = {
  data: DeveloperProfileWithRelationsDto;
};

type DeveloperApplyResponse = {
  data: DeveloperProfileDto;
};

type DeveloperApplicationsListResponse = {
  data: DeveloperApplicationDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type DeveloperReviewResponse = {
  data: DeveloperApplicationDto;
};

type DeveloperProfileUpdatePayload = {
  business_name?: string;
  business_email?: string;
  bio?: string | null;
  application_status?: ApplicationStatus;
  rejection_reason?: string | null;
  approved_at?: string | null;
};

type DeveloperApplicationInput = {
  businessName: string;
  businessEmail?: string;
  bio?: string;
};

type DeveloperApplicationReviewInput = {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
};

function logDebug(message: string, meta?: unknown) {
  if (process.env.NODE_ENV !== "production") {
    // Keep controller-level diagnostics lightweight and local to this file.
    // eslint-disable-next-line no-console
    console.debug(`[developer.controller] ${message}`, meta ?? "");
  }
}

export async function apply(
  req: AuthRequest,
  res: Response<DeveloperApplyResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { businessName, businessEmail, bio } =
      req.body as DeveloperApplicationInput;
    // Look up the signed-in user so we can fall back to their email if needed.
    logDebug("Applying as developer", { userId, businessName, businessEmail });
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      logDebug("Failed to fetch user for developer application", userError);
      throw new AppError(
        500,
        userError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    if (!user) {
      throw new AppError(404, "User not found", "USER_NOT_FOUND");
    }

    // Reuse the same pending/approved checks whether this is a new application or a re-application.
    const profileData = {
      business_name: businessName,
      business_email: businessEmail || user.email,
      bio: bio || null,
      application_status: "PENDING" as const,
      rejection_reason: null,
    };

    const { data: existingProfile, error: existingError } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      logDebug("Failed to check existing developer profile", existingError);
      throw new AppError(
        500,
        existingError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    if (existingProfile) {
      const currentProfile = existingProfile as Pick<
        DeveloperProfileDatabaseRow,
        "id" | "application_status"
      >;

      if (currentProfile.application_status === "PENDING") {
        throw new AppError(
          409,
          "You already have a pending application",
          "APPLICATION_PENDING",
        );
      }

      if (currentProfile.application_status === "APPROVED") {
        throw new AppError(
          409,
          "You are already a developer",
          "ALREADY_DEVELOPER",
        );
      }

      // Reapply by updating the existing record instead of creating duplicates.
      const { data: updatedProfile, error: updateError } = await supabase
        .from("developer_profiles")
        .update(profileData)
        .eq("id", currentProfile.id)
        .select("*")
        .single();

      if (updateError) {
        logDebug("Failed to update developer application", updateError);
        throw new AppError(
          500,
          updateError.message || "Database operation failed",
          "SUPABASE_ERROR",
        );
      }

      const typedProfile = updatedProfile as DeveloperProfileDatabaseRow;

      logDebug("Developer reapplication updated", {
        userId,
        profileId: currentProfile.id,
      });
      res.status(201).json({
        data: {
          id: typedProfile.id,
          userId: typedProfile.user_id,
          businessName: typedProfile.business_name,
          businessEmail: typedProfile.business_email,
          taxId: typedProfile.tax_id,
          bio: typedProfile.bio,
          applicationStatus: typedProfile.application_status,
          rejectionReason: typedProfile.rejection_reason,
          stripeAccountId: typedProfile.stripe_account_id,
          approvedAt: typedProfile.approved_at,
          createdAt: typedProfile.created_at,
          updatedAt: typedProfile.updated_at,
        },
      });
      return;
    }

    // Create the first application row when the user has never applied before.
    const { data: createdProfile, error: createError } = await supabase
      .from("developer_profiles")
      .insert({
        user_id: userId,
        ...profileData,
      })
      .select("*")
      .single();

    if (createError) {
      logDebug("Failed to create developer application", createError);
      throw new AppError(
        500,
        createError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    const typedProfile = createdProfile as DeveloperProfileDatabaseRow;

    logDebug("Developer application created", { userId });
    res.status(201).json({
      data: {
        id: typedProfile.id,
        userId: typedProfile.user_id,
        businessName: typedProfile.business_name,
        businessEmail: typedProfile.business_email,
        taxId: typedProfile.tax_id,
        bio: typedProfile.bio,
        applicationStatus: typedProfile.application_status,
        rejectionReason: typedProfile.rejection_reason,
        stripeAccountId: typedProfile.stripe_account_id,
        approvedAt: typedProfile.approved_at,
        createdAt: typedProfile.created_at,
        updatedAt: typedProfile.updated_at,
      },
    });
  } catch (err) {
    logDebug(
      "Error in apply",
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    next(err);
  }
}

export async function getProfile(
  req: AuthRequest,
  res: Response<DeveloperProfileResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    console.log("Getting developer profile for user ID:", userId);
    // Load the developer profile directly so the API handler owns the whole request flow.
    logDebug("Fetching developer profile", { userId });

    const { data: profile, error: profileError } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      logDebug("Failed to fetch developer profile", profileError);
      throw new AppError(
        500,
        profileError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    if (!profile) {
      throw new AppError(
        404,
        "Developer profile not found",
        "PROFILE_NOT_FOUND",
      );
    }
    const developerId = profile.id;

    // Fetch product count and sites in parallel, then project them into the public API shape.
    // 2. Fetch sites (safe)
    // ---------------------------
    const { data: sites, error: sitesError } = await supabase
      .from("developer_sites")
      .select("*")
      .eq("developer_id", developerId);

    if (sitesError) {
      logDebug("Failed to fetch developer sites", sitesError);
      throw new AppError(
        500,
        sitesError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }
    // Always fallback to empty array
    const safeSites = sites ?? [];

    // 3. Fetch product count (FIXED)
    // ---------------------------
    const { count, error: productCountError } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("developer_id", developerId);

    if (productCountError) {
      console.error("[getProfile] product count error:", productCountError);
    }

    // 4. Fetch live Stripe account status if connected
    let stripeChargesEnabled = false;
    let stripeDetailsSubmitted = false;
    if (profile.stripe_account_id) {
      try {
        const stripeAccount = await stripe.accounts.retrieve(profile.stripe_account_id);
        stripeChargesEnabled = stripeAccount.charges_enabled ?? false;
        stripeDetailsSubmitted = stripeAccount.details_submitted ?? false;
      } catch (stripeErr) {
        logDebug("Failed to retrieve Stripe account status", stripeErr);
        // If retrieval fails (e.g. deleted account), treat as not connected
      }
    }

    res.json({
      data: {
        id: profile.id,
        userId: profile.user_id,
        businessName: profile.business_name,
        businessEmail: profile.business_email,
        taxId: profile.tax_id,
        bio: profile.bio,
        applicationStatus: profile.application_status,
        rejectionReason: profile.rejection_reason,
        stripeAccountId: profile.stripe_account_id,
        stripeChargesEnabled,
        stripeDetailsSubmitted,
        approvedAt: profile.approved_at,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        productCount: count ?? 0,
        sites: safeSites,
      },
    });
  } catch (err) {
    logDebug(
      "Error in getProfile",
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    next(err);
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response<DeveloperApplyResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { businessName, businessEmail, bio } =
      req.body as Partial<DeveloperApplicationInput>;
    // Update only the fields the client sent, and keep the rest untouched.
    logDebug("Updating developer profile", {
      userId,
      businessName,
      businessEmail,
    });

    const { data: currentProfile, error: lookupError } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (lookupError) {
      logDebug("Failed to lookup developer profile", lookupError);
      throw new AppError(
        500,
        lookupError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    if (!currentProfile) {
      throw new AppError(
        404,
        "Developer profile not found",
        "PROFILE_NOT_FOUND",
      );
    }

    const updatePayload: DeveloperProfileUpdatePayload = {};
    if (typeof businessName === "string")
      updatePayload.business_name = businessName;
    if (typeof businessEmail === "string")
      updatePayload.business_email = businessEmail;
    if (typeof bio === "string") updatePayload.bio = bio;

    const { data: updatedProfile, error: updateError } = await supabase
      .from("developer_profiles")
      .update(updatePayload)
      .eq("id", (currentProfile as DeveloperProfileDatabaseRow).id)
      .select("*")
      .single();

    if (updateError) {
      logDebug("Failed to update developer profile", updateError);
      throw new AppError(
        500,
        updateError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    const typedProfile = updatedProfile as DeveloperProfileDatabaseRow;

    res.json({
      data: {
        id: typedProfile.id,
        userId: typedProfile.user_id,
        businessName: typedProfile.business_name,
        businessEmail: typedProfile.business_email,
        taxId: typedProfile.tax_id,
        bio: typedProfile.bio,
        applicationStatus: typedProfile.application_status,
        rejectionReason: typedProfile.rejection_reason,
        stripeAccountId: typedProfile.stripe_account_id,
        approvedAt: typedProfile.approved_at,
        createdAt: typedProfile.created_at,
        updatedAt: typedProfile.updated_at,
      },
    });
  } catch (err) {
    logDebug(
      "Error in updateProfile",
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    next(err);
  }
}

export async function listApplications(
  req: AuthRequest,
  res: Response<DeveloperApplicationsListResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    // Pull all pending applications directly and enrich them with user records for the admin UI.
    logDebug("Listing developer applications", { page, limit, offset });

    const {
      data: applications,
      error,
      count,
    } = await supabase
      .from("developer_profiles")
      .select("*", { count: "exact" })
      .eq("application_status", "PENDING")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logDebug("Failed to list applications", error);
      throw new AppError(
        500,
        error.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    const rows = (applications ?? []) as DeveloperApplicationDatabaseRow[];

    const userIds = [...new Set(rows.map((row) => row.user_id))];

    const usersResult = userIds.length
      ? await supabase
        .from("users")
        .select("id, email, full_name, created_at")
        .in("id", userIds)
      : { data: [], error: null };

    const { data: users, error: usersError } = usersResult;

    if (usersError) {
      logDebug("Failed to load application users", usersError);
      throw new AppError(
        500,
        usersError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    const userMap = new Map<string, DeveloperApplicationUserDto>();
    for (const user of users ?? []) {
      const typedUser = user as UsersListDatabaseRow;

      userMap.set(typedUser.id, {
        id: typedUser.id,
        email: typedUser.email,
        fullName: typedUser.full_name,
        createdAt: typedUser.created_at,
      });
    }

    const mappedApplications: DeveloperApplicationDto[] = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      businessEmail: row.business_email,
      taxId: row.tax_id,
      bio: row.bio,
      applicationStatus: row.application_status,
      rejectionReason: row.rejection_reason,
      stripeAccountId: row.stripe_account_id,
      approvedAt: row.approved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: userMap.get(row.user_id) ?? null,
    }));

    res.json({
      data: mappedApplications,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (err) {
    logDebug(
      "Error in listApplications",
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    next(err);
  }
}

export async function reviewApplication(
  req: AuthRequest,
  res: Response<DeveloperReviewResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;
    const { status, rejectionReason } =
      req.body as DeveloperApplicationReviewInput;
    const adminUserId = req.user!.userId;
    // Review the application directly here so the controller owns the entire request lifecycle.
    logDebug("Reviewing developer application", { id, adminUserId, status });

    const { data: profile, error: profileError } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("id", id as string)
      .maybeSingle();

    if (profileError) {
      logDebug("Failed to fetch developer profile by id", profileError);
      throw new AppError(
        500,
        profileError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    if (!profile) {
      throw new AppError(404, "Application not found", "APPLICATION_NOT_FOUND");
    }

    const typedProfile = profile as DeveloperProfileDatabaseRow;

    if (typedProfile.application_status !== "PENDING") {
      throw new AppError(
        400,
        "Application has already been reviewed",
        "ALREADY_REVIEWED",
      );
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("developer_profiles")
      .update({
        application_status: status,
        rejection_reason:
          status === "REJECTED" ? (rejectionReason ?? null) : null,
        approved_at: status === "APPROVED" ? new Date().toISOString() : null,
      })
      .eq("id", typedProfile.id)
      .select("*")
      .single();

    if (updateError) {
      logDebug("Failed to update application status", updateError);
      throw new AppError(
        500,
        updateError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("id", typedProfile.user_id)
      .maybeSingle();

    if (userError) {
      logDebug("Failed to fetch application user", userError);
      throw new AppError(
        500,
        userError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    if (status === "APPROVED") {
      // Promote the user when the application is approved.
      const { error: roleError } = await supabase
        .from("users")
        .update({ role: "DEVELOPER" })
        .eq("id", typedProfile.user_id);

      if (roleError) {
        logDebug("Failed to promote user to developer", roleError);
        throw new AppError(
          500,
          roleError.message || "Database operation failed",
          "SUPABASE_ERROR",
        );
      }
    }

    // Write an audit entry for admin review actions.
    const { error: auditError } = await supabase.from("audit_logs").insert({
      user_id: adminUserId,
      action: `DEVELOPER_APPLICATION_${status}`,
      entity_type: "DeveloperProfile",
      entity_id: typedProfile.id,
      details: {
        developerName: user ? (user as UsersListDatabaseRow).full_name : null,
        decision: status,
        reason: rejectionReason ?? null,
      },
    });

    if (auditError) {
      logDebug("Failed to write audit log", auditError);
      throw new AppError(
        500,
        auditError.message || "Database operation failed",
        "SUPABASE_ERROR",
      );
    }

    res.json({
      data: {
        id: (updatedProfile as DeveloperProfileDatabaseRow).id,
        userId: (updatedProfile as DeveloperProfileDatabaseRow).user_id,
        businessName: (updatedProfile as DeveloperProfileDatabaseRow)
          .business_name,
        businessEmail: (updatedProfile as DeveloperProfileDatabaseRow)
          .business_email,
        taxId: (updatedProfile as DeveloperProfileDatabaseRow).tax_id,
        bio: (updatedProfile as DeveloperProfileDatabaseRow).bio,
        applicationStatus: (updatedProfile as DeveloperProfileDatabaseRow)
          .application_status,
        rejectionReason: (updatedProfile as DeveloperProfileDatabaseRow)
          .rejection_reason,
        stripeAccountId: (updatedProfile as DeveloperProfileDatabaseRow)
          .stripe_account_id,
        approvedAt: (updatedProfile as DeveloperProfileDatabaseRow).approved_at,
        createdAt: (updatedProfile as DeveloperProfileDatabaseRow).created_at,
        updatedAt: (updatedProfile as DeveloperProfileDatabaseRow).updated_at,
        user: user
          ? {
            id: (user as UsersListDatabaseRow).id,
            email: (user as UsersListDatabaseRow).email,
            fullName: (user as UsersListDatabaseRow).full_name,
            createdAt: (user as UsersListDatabaseRow).created_at,
          }
          : null,
      },
    });
  } catch (err) {
    logDebug(
      "Error in reviewApplication",
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    next(err);
  }
}

export async function setupStripeConnect(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;

    // 1. Fetch Developer Profile
    const { data: profile, error: profileError } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
    }

    let stripeAccountId = profile.stripe_account_id;

    // 2. Create Stripe Connect Account if not exists
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          name: profile.business_name,
        },
      });
      stripeAccountId = account.id;

      // Save to Developer Profile
      const { error: updateError } = await supabase
        .from("developer_profiles")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", profile.id);

      if (updateError) {
        throw new AppError(500, "Failed to link Stripe account", "SUPABASE_ERROR");
      }
    }

    // 3. Generate Account Link for onboarding redirect
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${env.FRONTEND_URL}/developer/profile?stripe=refresh`,
      return_url: `${env.FRONTEND_URL}/developer/profile?stripe=success`,
      type: "account_onboarding",
    });

    res.json({ url: accountLink.url });
  } catch (err) {
    logDebug(
      "Error in setupStripeConnect",
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    next(err);
  }
}

export async function createStripeLoginLink(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const { data: profile, error: profileError } = await supabase
      .from("developer_profiles")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile || !profile.stripe_account_id) {
      throw new AppError(400, "Developer has not connected Stripe", "STRIPE_NOT_CONNECTED");
    }

    // Check if the account has completed onboarding before generating a login link.
    // Login links only work for accounts that have finished Stripe's onboarding process.
    const stripeAccount = await stripe.accounts.retrieve(profile.stripe_account_id);
    
    if (!stripeAccount.charges_enabled || !stripeAccount.details_submitted) {
      // Account exists but onboarding is incomplete — generate an account link to resume.
      const accountLink = await stripe.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${env.FRONTEND_URL}/developer/profile?stripe=refresh`,
        return_url: `${env.FRONTEND_URL}/developer/profile?stripe=success`,
        type: "account_onboarding",
      });
      res.json({ url: accountLink.url, onboardingIncomplete: true });
      return;
    }

    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);

    res.json({ url: loginLink.url });
  } catch (err) {
    logDebug(
      "Error in createStripeLoginLink",
      err instanceof Error ? (err.stack ?? err.message) : err,
    );
    next(err);
  }
}

