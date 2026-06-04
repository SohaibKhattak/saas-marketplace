import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import * as productService from "../services/product.service.js";
import * as pricingPlanService from "../services/pricing-plan.service.js";
import { supabase } from "../config/supabase.js";
import { logger } from "../config/logger.js";
import { AppError } from "../middleware/error-handler.js";
import { query } from "../config/database.js";

async function uploadProductAsset(file: any, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from("product-assets")
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    logger.error({ err: error }, "Failed to upload product asset to Supabase");
    throw new AppError(500, "Failed to upload asset", "UPLOAD_FAILED");
  }

  const { data: publicUrlData } = supabase.storage
    .from("product-assets")
    .getPublicUrl(path);

  if (!publicUrlData?.publicUrl) {
    throw new AppError(500, "Failed to get public URL for asset", "URL_FAILED");
  }

  return publicUrlData.publicUrl;
}


export async function createProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const developerId = req.user!.userId;
    const data = req.body;

    // Verify developer profile
    const { data: profile, error: profileError } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", developerId)
      .single();

    if (profileError || !profile) {
      logger.error({ err: profileError }, "Error fetching developer profile");
      throw new AppError(404, "Developer profile not found", "NOT_FOUND");
    }

    if (profile.application_status !== "APPROVED") {
      logger.error({ err: profileError }, "Developer profile not approved");
      throw new AppError(
        403,
        "You must be an approved developer",
        "NOT_APPROVED"
      );
    }

    // Generate unique slug
    // let slug = generateSlug(data.name);

    // const { data: existingSlug } = await supabase
    //   .from("products")
    //   .select("id")
    //   // .eq("slug", slug)
    //   .maybeSingle();

    // if (existingSlug) {
    //   slug = `${slug}-${Date.now().toString(36)}`;
    // }

    // Verify site ownership if provided
    console.log("data  ", data)
    if (data.siteId) {
      const { data: site, error: siteError } = await supabase
        .from("developer_sites")
        .select("*")
        .eq("id", data.siteId)
        .single();
      console.log("site  ", site)
      console.log("siteId  ", data.siteId)
      console.log("profile  ", profile)
      if (siteError || !site || site.developer_id !== profile.id) {
        logger.error({ err: siteError }, "You do not own this site");
        throw new AppError(403, "You do not own this site", "FORBIDDEN");
      }
    }

    // Handle file uploads
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const logoFile = files?.["logo"]?.[0];
    const screenshotFiles = files?.["screenshots"] || [];

    if (!logoFile) {
      throw new AppError(400, "Logo is required", "VALIDATION_FAILED");
    }

    // Upload Logo
    const logoPath = `logos/${developerId}_${Date.now()}_${logoFile.originalname}`;
    const logoUrl = await uploadProductAsset(logoFile, logoPath);

    // Upload Screenshots
    const screenshots: string[] = [];
    if (screenshotFiles.length > 0) {
      if (screenshotFiles.length < 5 || screenshotFiles.length > 8) {
        throw new AppError(400, "Please provide between 5 and 8 screenshots", "VALIDATION_FAILED");
      }

      for (const file of screenshotFiles) {
        const screenshotPath = `screenshots/${developerId}_${Date.now()}_${file.originalname}`;
        const url = await uploadProductAsset(file, screenshotPath);
        screenshots.push(url);
      }
    }

    // Create product
    const { data: createdProduct, error: createError } = await supabase
      .from("products")
      .insert([
        {
          developer_id: developerId,
          name: data.name,
          description: data.description,
          category: data.category,
          site_id: data.siteId ?? null,
          logo_url: logoUrl,
          screenshots: screenshots,
          status: "DRAFT",
        },
      ])
      .select("*")
      .single();

    if (createError || !createdProduct) {
      logger.error({ err: createError }, "Failed to create product");
      throw new AppError(500, "Failed to create product", "CREATE_FAILED");
    }

    // Fetch pricing plans
    const { data: pricingPlans } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("product_id", createdProduct.id);

    // Fetch site
    let site = null;

    if (createdProduct.site_id) {
      const { data: siteData } = await supabase
        .from("developer_sites")
        .select("*")
        .eq("id", createdProduct.site_id)
        .maybeSingle();

      site = siteData;
    }

    // Fetch counts
    const [{ count: subscriptions }, { count: reviews }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("product_id", createdProduct.id),

      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("product_id", createdProduct.id),
    ]);

    // Final response
    const product = {
      id: createdProduct.id,
      name: createdProduct.name,
      slug: createdProduct.slug,
      shortDescription: createdProduct.short_description ?? "",
      description: createdProduct.description,
      category: createdProduct.category,
      tags: createdProduct.tags ?? [],
      logoUrl: createdProduct.logo_url,
      screenshots: createdProduct.screenshots ?? [],
      status: createdProduct.status,
      rejectionReason: createdProduct.rejection_reason,
      avgRating: 0,
      pricingPlans: pricingPlans ?? [],
      site,
      reviews: reviews ?? 0,
      _count: {
        subscriptions: subscriptions ?? 0,
        reviews: reviews ?? 0,
      },
    };

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user!.userId;

    // const product = await productService.updateProduct(id as string, req.user!.userId, req.body);
    // verify ownership
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, developer_id, isdeleted, logo_url")
      .eq("id", id)
      .single();

    if (fetchError || !product) {
      logger.error({ err: fetchError }, "Failed to fetch product for update");
      throw new AppError(404, "Product not found", "NOT_FOUND");
    }

    if (product.developer_id !== userId) {
      logger.error({ err: fetchError }, "User not authorized to update this product");
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }

    // Handle file uploads for update
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const logoFile = files?.["logo"]?.[0];
    const screenshotFiles = files?.["screenshots"] || [];
    const existingScreenshots = Array.isArray(req.body.existingScreenshots)
      ? req.body.existingScreenshots
      : req.body.existingScreenshots
        ? [req.body.existingScreenshots]
        : [];

    let logoUrl = req.body.logoUrl || product.logo_url;

    if (logoFile) {
      const logoPath = `logos/${userId}_${Date.now()}_${logoFile.originalname}`;
      logoUrl = await uploadProductAsset(logoFile, logoPath);
    }

    let finalScreenshots = [...existingScreenshots];

    if (screenshotFiles.length > 0) {
      for (const file of screenshotFiles) {
        const screenshotPath = `screenshots/${userId}_${Date.now()}_${file.originalname}`;
        const url = await uploadProductAsset(file, screenshotPath);
        finalScreenshots.push(url);
      }
    }

    // Validation after combining
    if (finalScreenshots.length > 0 && (finalScreenshots.length < 5 || finalScreenshots.length > 8)) {
      throw new AppError(400, "Please provide between 5 and 8 screenshots", "VALIDATION_FAILED");
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        name: data.name,
        description: data.description,
        category: data.category,
        logo_url: logoUrl,
        screenshots: finalScreenshots,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updatedProduct) {
      logger.error({ err: updateError }, "Failed to update product");
      throw new AppError(500, "Failed to update product", "UPDATE_FAILED");
    }

    res.json({ data: updatedProduct });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, developer_id, isdeleted")
      .eq("id", id)
      .single();

    if (fetchError || !product) {
      logger.error({ err: fetchError }, "Failed to fetch product for deletion");
      throw new AppError(404, "Product not found", "NOT_FOUND");
    }

    if (product.developer_id !== userId) {
      logger.error({ err: fetchError }, "User not authorized to delete this product");
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }

    if (product.isdeleted) {
      logger.error({ err: fetchError }, "Product already deleted");
      throw new AppError(400, "Product already deleted", "ALREADY_DELETED");
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        isDeleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("developer_id", userId);

    if (updateError) {
      throw new AppError(500, "Failed to delete product", "DELETE_FAILED");
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function unpublishProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const product = await productService.unpublishProduct(id as string, req.user!.userId);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await productService.adminDeleteProduct(id as string);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function submitForReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    // const product = await productService.submitForReview(id as string, req.user!.userId);

    // verify ownership  
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, developer_id, isdeleted, status ")
      .eq("id", id)
      .single();
    if (fetchError || !product) {
      logger.error({ err: fetchError }, "Failed to fetch product for submission");
      throw new AppError(404, "Product not found", "NOT_FOUND");

    }
    if (product.developer_id !== req.user!.userId) {
      logger.error({ err: fetchError }, "User not authorized to submit this product");
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }

    if (product.isdeleted) {
      logger.error({ err: fetchError }, "Cannot submit a deleted product");
      throw new AppError(400, "Cannot submit a deleted product", "ALREADY_DELETED");
    }

    if (product.status !== "DRAFT" && product.status !== "REJECTED") {
      logger.error({ err: fetchError }, "Product cannot be submitted from current status");
      throw new AppError(400, "Product can only be submitted from draft or rejected status", "INVALID_STATUS");
    }

    // Must have at least one pricing plan
    const { data: pricingPlans, error: plansError } = await supabase
      .from("pricing_plans")
      .select("id")
      .eq("product_id", id);

    if (plansError) {
      logger.error({ err: plansError }, "Failed to fetch pricing plans for submission");
      throw new AppError(500, "Failed to submit product", "SUBMISSION_FAILED");
    }
    if (!pricingPlans || pricingPlans.length === 0) {
      logger.error({ err: plansError }, "Product must have at least one pricing plan");
      throw new AppError(400, "Product must have at least one pricing plan", "INVALID_PRICING_PLANS");
    }

    // Update status to PENDING_REVIEW  
    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({ status: "PENDING_REVIEW" })
      .eq("id", id)
      .select("*")
      .single();
    if (updateError || !updatedProduct) {
      logger.error({ err: updateError }, "Failed to update product status for submission");
      throw new AppError(500, "Failed to submit product", "SUBMISSION_FAILED");
    }


    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function getDeveloperProducts(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const developerId = req.user!.userId;
    console.log("Fetching products for developer:", developerId, "page:", page, "limit:", limit);
    // 1. Get products (simple query)
    const { data: products, count, error } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("developer_id", developerId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      logger.error({ err: error }, "Error fetching developer products");
      throw new Error(error.message || "Failed to fetch products");
    }

    if (!products?.length) {
      return res.json({
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // 2. Get product IDs
    const productIds = products.map((p) => p.id);

    // 3. Fetch sites separately
    const { data: sites } = await supabase
      .from("developer_sites")
      .select("*")
      .in("id", products.map((p) => p.site_id).filter(Boolean));

    // 4. Fetch pricing plans separately
    const { data: pricingPlans } = await supabase
      .from("pricing_plans")
      .select("*")
      .in("product_id", productIds);

    // 5. Fetch subscription counts (simple grouped query)
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("product_id");

    // 6. Fetch review counts (simple grouped query)
    const { data: reviews } = await supabase
      .from("reviews")
      .select("product_id");

    // 7. Fetch developer profile
    const { data: profile } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", developerId)
      .single();

    const { data: userData } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .eq("id", developerId)
      .single();

    const developer = profile ? {
      id: profile.id,
      businessName: profile.business_name,
      user: userData
    } : null;

    // 8. Merge manually (Prisma-style result)
    const enriched = products.map((product) => {
      const site = (sites || [])?.find((s) => s.id === product.site_id);

      const pricing = (pricingPlans || [])?.filter(
        (p) => p.product_id === product.id
      );

      const subscriptionCount =
        (subscriptions || [])?.filter((s) => s.product_id === product.id).length || 0;

      const reviewCount =
        (reviews || [])?.filter((r) => r.product_id === product.id).length || 0;

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        shortDescription: product.short_description ?? "",
        description: product.description,
        category: product.category,
        tags: product.tags ?? [],
        logoUrl: product.logo_url,
        screenshots: product.screenshots ?? [],
        status: product.status,
        rejectionReason: product.rejection_reason,
        avgRating: product.avg_rating ?? 0,
        createdAt: product.created_at,
        developer,
        site,
        pricingPlans: pricing,
        _count: {
          subscriptions: subscriptionCount,
          reviews: reviewCount,
        },
      };
    });

    // 9. Response
    res.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id: productId } = req.params;
    // const userId = req.user?.userId;
    // // check if authenticated means either dev or customer if not then a visitor
    // const isDeveloper = req.user?.role === "DEVELOPER";
    // const isCustomer = req.user?.role === "CUSTOMER";
    // const isVisitor = !isDeveloper && !isCustomer;
    // let returnSiteUrl = false;
    // // if developer check ownership
    // if (isDeveloper) {
    //   const { data: product, error: productError } = await supabase
    //     .from("products")
    //     .select("*")
    //     .eq("id", productId)
    //     .eq("developer_id", userId)
    //     .single();

    //     if(productError || !product) returnSiteUrl = false;
    //     else returnSiteUrl = true;
    // }
    // if(isCustomer){
    //   // check if subscibed to this product
    //   const { data: subscription, error: subscriptionError } = await supabase
    //     .from("subscriptions")
    //     .select("*")
    //     .eq("product_id", productId)
    //     .eq("user_id", userId)
    //     .single();

    //     if(subscriptionError || !subscription) returnSiteUrl = false;
    //     else returnSiteUrl = true;
    // }
    // if (isVisitor) {
    //   returnSiteUrl = false;
    // }
    // console.log("Fetching product with ID:", productId);
    // Get product based
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      logger.error({ err: productError }, "Failed to fetch product");
      throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    console.log("Product fetched:", { id: product.id, name: product.name, developer_id: product.developer_id });

    // Get developer profile
    const { data: developer, error: devError } = await supabase
      .from("developer_profiles")
      .select("*")
      .eq("user_id", product.developer_id)
      .single();

    console.log("Developer profile fetch result:", { developer, error: devError });

    // Get developer user
    let user = null;

    if (developer?.user_id) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .eq("id", developer.user_id)
        .single();

      user = userData;
    }

    // Get pricing plans
    const { data: pricingPlans } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    // Get site
    let site = null;
    if (product.site_id) {
      const { data: siteData } = await supabase
        .from("developer_sites")
        .select("*")
        .eq("id", product.site_id)
        .maybeSingle();

      site = siteData;
    }
    // Get counts
    const [{ count: subscriptions }, { count: reviews }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId),

      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId),
    ]);

    // --- Access Control Logic ---
    let isSubscribed = false;
    let activePlanId = null;
    let isOwner = false;
    let showSite = false;

    if (req.user) {
      // 1. Check if user is the Owner or Admin
      isOwner = product.developer_id === req.user.userId;
      const isAdmin = (req.user as any).role === "ADMIN";

      if (isOwner || isAdmin) {
        showSite = true;
      } else if (req.user.role === "CUSTOMER") {
        // 2. Check for active/trialing subscription for Customers
        const { data: subscription } = await supabase
          .from("subscriptions")
          .select("id, pricing_plan_id, current_period_end, status")
          .eq("product_id", product.id)
          .eq("customer_id", req.user.userId)
          .in("status", ["ACTIVE", "TRIALING"])
          .maybeSingle();

        if (subscription) {
          const now = new Date();
          const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;

          // Subscription is valid if no period end is set (infinite) or it's in the future
          if (!periodEnd || periodEnd > now) {
            isSubscribed = true;
            activePlanId = subscription.pricing_plan_id;
            showSite = true;
          }
        }
      }
    }

    const finalProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      shortDescription: product.short_description ?? "",
      description: product.description,
      category: product.category,
      tags: product.tags ?? [],
      logoUrl: product.logo_url,
      screenshots: product.screenshots ?? [],
      status: product.status,
      rejectionReason: product.rejection_reason,
      avgRating: product.avg_rating ?? 0,
      createdAt: product.created_at,
      developer: developer
        ? {
          id: developer.id,
          businessName: developer.business_name,
          user,
        }
        : null,
      pricingPlans: (pricingPlans ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        features: p.features ?? [],
        trial_days: p.trial_days ?? 0,
        isActive: p.is_active,
        sortOrder: p.sort_order,
      })),
      site: showSite ? site : null,
      isSubscribed,
      isOwner,
      activePlanId,
      _count: {
        subscriptions: subscriptions ?? 0,
        reviews: reviews ?? 0,
      },
    };
    console.log("Final product:", finalProduct);
    res.json({ data: finalProduct });
  } catch (err) {
    next(err);
  }
}

// --- Marketplace (Public) ---

export async function listMarketplaceProducts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;

    const conditions: string[] = ["p.status = 'PUBLISHED'", "p.isdeleted = false"];
    const values: any[] = [];

    if (category) {
      values.push(category);
      conditions.push(`p.category = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      let priceCondition = `EXISTS (SELECT 1 FROM pricing_plans pp WHERE pp.product_id = p.id AND pp.is_active = true`;
      if (minPrice !== undefined) {
        values.push(minPrice);
        priceCondition += ` AND pp.price_monthly >= $${values.length}`;
      }
      if (maxPrice !== undefined) {
        values.push(maxPrice);
        priceCondition += ` AND pp.price_monthly <= $${values.length}`;
      }
      priceCondition += `)`;
      conditions.push(priceCondition);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderClause = "ORDER BY p.created_at DESC";
    if (sortBy === "popular") {
      orderClause = "ORDER BY p.total_subscribers DESC";
    } else if (sortBy === "rating") {
      orderClause = "ORDER BY p.avg_rating DESC";
    } else if (sortBy === "name") {
      orderClause = "ORDER BY p.name ASC";
    }

    const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const dataQuery = `
      SELECT 
        p.*,
        p.avg_rating as "avgRating",
        p.logo_url as "logoUrl",
        jsonb_build_object(
          'id', dp.id,
          'businessName', dp.business_name,
          'user', jsonb_build_object(
            'fullName', u.full_name,
            'avatarUrl', u.avatar_url
          )
        ) as "developer",
        COALESCE(
          (
            SELECT jsonb_agg(pp)
            FROM (
              SELECT * FROM pricing_plans 
              WHERE product_id = p.id AND is_active = true 
              ORDER BY price_monthly ASC 
              LIMIT 1
            ) pp
          ),
          '[]'::jsonb
        ) as "pricingPlans",
        jsonb_build_object(
          'reviews', (SELECT COUNT(*) FROM reviews WHERE product_id = p.id)
        ) as "_count"
      FROM products p
      LEFT JOIN users u ON p.developer_id = u.id
      LEFT JOIN developer_profiles dp ON p.developer_id = dp.user_id
      ${whereClause}
      ${orderClause}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const products = dataResult.rows;

    res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error({ err }, "Error listing marketplace products");
    next(err);
  }
}

// export async function getProductById(req: Request, res: Response, next: NextFunction) {
//   try {
//     const { slug } = req.params;
//     const product = await productService.getProductBySlug(slug as string);
//     res.json({ data: product });
//   } catch (err) {
//     next(err);
//   }
// }

// --- Admin Moderation ---

export async function listPendingProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = "PENDING_REVIEW";

    const conditions: string[] = ["p.isdeleted = false"];
    const values: any[] = [];

    if (status) {
      values.push(status);
      conditions.push(`p.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const dataQuery = `
      SELECT 
        p.*,
        p.avg_rating as "avgRating",
        p.is_featured as "isFeatured",
        p.total_reviews as "totalReviews",
        p.total_subscribers as "totalSubscribers",
        p.published_at as "publishedAt",
        p.created_at as "createdAt",
        jsonb_build_object(
          'user', jsonb_build_object(
            'fullName', u.full_name,
            'email', u.email
          )
        ) as "developer",
        CASE WHEN s.id IS NOT NULL THEN
          jsonb_build_object(
            'siteUrl', s.site_url,
            'subdomain', s.subdomain
          )
        ELSE NULL END as "site",
        COALESCE(
          (
            SELECT jsonb_agg(jsonb_build_object(
              'name', pp.name,
              'priceMonthly', pp.price_monthly
            ))
            FROM pricing_plans pp
            WHERE pp.product_id = p.id
          ),
          '[]'::jsonb
        ) as "pricingPlans",
        jsonb_build_object(
          'subscriptions', p.total_subscribers,
          'reviews', p.total_reviews
        ) as "_count"
      FROM products p
      LEFT JOIN users u ON p.developer_id = u.id
      LEFT JOIN developer_sites s ON p.site_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const products = dataResult.rows.map(row => ({
      ...row,
      tags: row.tags ?? [],
      shortDescription: row.short_description ?? row.shortDescription ?? ""
    }));

    res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error({ err }, "Error listing pending products for moderation");
    next(err);
  }
}

export async function reviewProduct(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    // 1. Validate Input Status
    const validStatuses = ['PUBLISHED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(400, "Invalid status. Must be PUBLISHED or REJECTED", "INVALID_STATUS");
    }

    // 2. Conditional Validation: If REJECTED, reason is mandatory
    if (status === 'REJECTED' && (!rejectionReason || rejectionReason.trim().length < 5)) {
      throw new AppError(
        400,
        "A rejection reason (minimum 5 characters) is required when rejecting a product",
        "REJECTION_REASON_REQUIRED"
      );
    }

    // 3. Check if product exists and is currently in PENDING_REVIEW
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, status')
      .eq('id', id)
      .eq('isdeleted', false)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!product) {
      throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
    }

    if (product.status !== 'PENDING_REVIEW') {
      throw new AppError(400, `Product is already ${product.status}`, "INVALID_PRODUCT_STATE");
    }

    // 4. Perform Update
    // If status is PUBLISHED, we should explicitly clear any old rejection reasons
    const updateData = {
      status,
      rejection_reason: status === 'REJECTED' ? rejectionReason : null,
      published_at: status === 'PUBLISHED' ? new Date().toISOString() : null, // Optional: track publish date
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      throw new AppError(500, "Failed to update product review status", "PRODUCT_UPDATE_FAILED");
    }

    // 5. Return the newly updated product
    res.json({
      message: `Product successfully ${status.toLowerCase()}`,
      data: updatedProduct
    });

  } catch (err) {
    next(err);
  }
}
export async function listAllProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const conditions: string[] = ["p.isdeleted = false"];
    const values: any[] = [];

    if (status && status !== "all") {
      values.push(status);
      conditions.push(`p.status = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const dataQuery = `
      SELECT 
        p.*,
        p.avg_rating as "avgRating",
        p.is_featured as "isFeatured",
        p.total_reviews as "totalReviews",
        p.total_subscribers as "totalSubscribers",
        p.published_at as "publishedAt",
        p.created_at as "createdAt",
        jsonb_build_object(
          'user', jsonb_build_object(
            'fullName', u.full_name,
            'email', u.email
          )
        ) as "developer",
        jsonb_build_object(
          'subscriptions', p.total_subscribers,
          'reviews', p.total_reviews
        ) as "_count"
      FROM products p
      LEFT JOIN users u ON p.developer_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const [countResult, dataResult] = await Promise.all([
      query(countQuery, values),
      query(dataQuery, [...values, limit, offset]),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const products = dataResult.rows.map(row => ({
      ...row,
      tags: row.tags ?? [],
      shortDescription: row.short_description ?? row.shortDescription ?? ""
    }));

    res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error({ err }, "Error listing all products for admin");
    next(err);
  }
}

export async function toggleFeatured(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Fetch the current is_featured status
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, is_featured")
      .eq("id", id)
      .single();

    if (fetchError || !product) {
      logger.error({ err: fetchError }, "Failed to fetch product for toggling featured status");
      throw new AppError(404, "Product not found", "NOT_FOUND");
    }

    // Toggle the status
    const { data, error } = await supabase
      .from("products")
      .update({ is_featured: !product.is_featured })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error({ err: error }, "Failed to update featured status");
      throw new AppError(500, "Failed to update featured status", "UPDATE_FAILED");
    }

    res.json({ data: true });
  } catch (err) {
    next(err);
  }
}

// --- Pricing Plans ---

export async function createPricingPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    const userId = req.user!.userId;
    const body = req.body;

    // 1. Verify product ownership
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, developer_id, isdeleted")
      .eq("id", productId)
      .single();

    if (fetchError || !product) {
      logger.error({ err: fetchError }, "Failed to fetch product for pricing plan creation");
      throw new AppError(404, "Product not found", "NOT_FOUND");
    }

    if (product.developer_id !== userId) {
      logger.error({ err: fetchError }, "User not authorized to add pricing plan to this product");
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }

    if (product.isdeleted) {
      logger.error({ err: fetchError }, "Cannot add pricing plan to deleted product");
      throw new AppError(400, "Product is deleted", "PRODUCT_DELETED");
    }

    // 2. Get max sort_order
    const { data: maxRow, error: maxError } = await supabase
      .from("pricing_plans")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxError) {
      logger.error({ err: maxError }, "Failed to fetch max sort_order for pricing plan");
      throw new AppError(500, "Internal Server Error", "INTERNAL_SERVER_ERROR");
    }

    const nextOrder = (maxRow?.sort_order ?? 0) + 1;

    // 3. Insert
    const { data: plan, error: insertError } = await supabase
      .from("pricing_plans")
      .insert([
        {
          product_id: productId,
          name: body.name,
          price_monthly: body.priceMonthly,
          price_yearly: body.priceYearly,
          features: body.features ?? [],
          trial_days: body.trialDays ?? 0,
          sort_order: nextOrder,
        },
      ])
      .select()
      .single();

    if (insertError) {
      logger.error({ err: insertError }, "Failed to insert pricing plan");
      throw new AppError(500, "Internal Server Error", "INTERNAL_SERVER_ERROR");
    }

    res.status(201).json({ data: plan });
  } catch (err) {
    next(err);
  }
}

export async function updatePricingPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { planId } = req.params;
    // const plan = await pricingPlanService.updatePricingPlan(planId as string, req.user!.userId, req.body);

    // get plan 
    const { data: plan, error: fetchError } = await supabase
      .from("pricing_plans")
      .select("id, product_id")
      .eq("id", planId)
      .single();
    if (fetchError || !plan) {
      logger.error({ err: fetchError }, "Failed to fetch pricing plan for update");
      throw new AppError(404, "Pricing plan not found", "NOT_FOUND");
    }

    // verify ownership
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, developer_id")
      .eq("id", plan.product_id)
      .single();
    if (productError || !product) {
      logger.error({ err: productError }, "Failed to fetch product for pricing plan update");
      throw new AppError(404, "Product not found", "NOT_FOUND");
    }

    if (product.developer_id !== req.user!.userId) {
      logger.error({ err: productError }, "User not authorized to update this pricing plan");
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }

    // update plan
    const { data: updatedPlan, error: updateError } = await supabase
      .from("pricing_plans")
      .update({
        name: req.body.name,
        price_monthly: req.body.priceMonthly,
        price_yearly: req.body.priceYearly,
        features: req.body.features,
        trial_days: req.body.trialDays,
      })
      .eq("id", planId)
      .select("*")
      .single();
    res.json({ data: updatedPlan });
  } catch (err) {
    next(err);
  }
}

export async function deletePricingPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { planId } = req.params;
    // const result = await pricingPlanService.deletePricingPlan(planId as string, req.user!.userId);
    // find plan and verify ownership
    const { data: plan, error: fetchError } = await supabase
      .from("pricing_plans")
      .select("id, product_id")
      .eq("id", planId)
      .single();

    if (fetchError || !plan) {
      logger.error({ err: fetchError }, "Failed to fetch pricing plan for deletion");
      throw new AppError(404, "Pricing plan not found", "NOT_FOUND");
    }
    // verify ownership 
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, developer_id")
      .eq("id", plan.product_id)
      .single();

    if (productError || !product) {
      logger.error({ err: productError }, "Failed to fetch product for pricing plan deletion");
      throw new AppError(404, "Product not found", "NOT_FOUND");
    }

    if (product.developer_id !== req.user!.userId) {
      logger.error({ err: productError }, "User not authorized to delete this pricing plan");
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }

    // delete plan 
    const { error: deleteError } = await supabase
      .from("pricing_plans")
      .delete()
      .eq("id", planId);

    if (deleteError) {
      logger.error({ err: deleteError }, "Failed to delete pricing plan");
      throw new AppError(500, "Internal Server Error", "INTERNAL_SERVER_ERROR");
    }

    res.json({ data: true });
  } catch (err) {
    next(err);
  }
}

export async function getProductPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const { productId } = req.params;
    // const plans = await pricingPlanService.getProductPlans(productId as string);
    const { data: plans, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true });

    if (error) {
      logger.error({ err: error }, "Failed to fetch pricing plans for product");
      throw new AppError(500, "Internal Server Error", "INTERNAL_SERVER_ERROR");
    }

    res.json({ data: plans });
  } catch (err) {
    next(err);
  }
}
