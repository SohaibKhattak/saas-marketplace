import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createProduct(
  developerId: string,
  data: {
    name: string;
    description: string;
    shortDescription?: string;
    category: string;
    tags?: string[];
    siteId?: string;
  }
) {
  // Verify developer profile
  const profile = await prisma.developerProfile.findUnique({
    where: { userId: developerId },
  });

  if (!profile || profile.applicationStatus !== "APPROVED") {
    throw new AppError(403, "You must be an approved developer", "NOT_APPROVED");
  }

  // Generate unique slug
  let slug = generateSlug(data.name);
  const existingSlug = await prisma.product.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // Verify site ownership if provided
  if (data.siteId) {
    const site = await prisma.developerSite.findUnique({ where: { id: data.siteId } });
    if (!site || site.developerId !== profile.id) {
      throw new AppError(403, "You do not own this site", "FORBIDDEN");
    }
  }

  const product = await prisma.product.create({
    data: {
      developerId: profile.id,
      name: data.name,
      slug,
      description: data.description,
      shortDescription: data.shortDescription,
      category: data.category,
      tags: data.tags ?? [],
      siteId: data.siteId,
      status: "DRAFT",
    },
    include: {
      pricingPlans: true,
      site: true,
      _count: { select: { subscriptions: true, reviews: true } },
    },
  });

  return product;
}

export async function updateProduct(
  productId: string,
  developerId: string,
  data: {
    name?: string;
    description?: string;
    shortDescription?: string;
    category?: string;
    tags?: string[];
    logoUrl?: string;
    screenshots?: string[];
    siteId?: string;
  }
) {
  const product = await getOwnedProduct(productId, developerId);

  // If renaming, update slug
  let slug = product.slug;
  if (data.name && data.name !== product.name) {
    slug = generateSlug(data.name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.id !== productId) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...data,
      slug,
    },
    include: {
      pricingPlans: true,
      site: true,
      _count: { select: { subscriptions: true, reviews: true } },
    },
  });
}

export async function deleteProduct(productId: string, developerId: string) {
  const product = await getOwnedProduct(productId, developerId);

  // Only allow deletion of draft/rejected products
  if (product.status === "PUBLISHED") {
    throw new AppError(400, "Cannot delete a published product. Unpublish it first.", "CANNOT_DELETE_PUBLISHED");
  }

  await prisma.product.delete({ where: { id: productId } });
  return { deleted: true };
}

export async function submitForReview(productId: string, developerId: string) {
  const product = await getOwnedProduct(productId, developerId);

  if (product.status !== "DRAFT" && product.status !== "REJECTED") {
    throw new AppError(400, "Product can only be submitted from draft or rejected status", "INVALID_STATUS");
  }

  // Must have at least one pricing plan
  const planCount = await prisma.pricingPlan.count({ where: { productId } });
  if (planCount === 0) {
    throw new AppError(400, "Product must have at least one pricing plan before submission", "NO_PRICING_PLANS");
  }

  return prisma.product.update({
    where: { id: productId },
    data: { status: "PENDING_REVIEW" },
    include: {
      pricingPlans: true,
      site: true,
    },
  });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      developer: {
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
      pricingPlans: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      site: true,
      reviews: {
        include: {
          customer: { select: { id: true, fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { subscriptions: true, reviews: true } },
    },
  });

  if (!product) {
    throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  return product;
}

export async function getProductById(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      developer: {
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
      pricingPlans: { orderBy: { sortOrder: "asc" } },
      site: true,
      _count: { select: { subscriptions: true, reviews: true } },
    },
  });

  if (!product) {
    throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  return product;
}

export async function getDeveloperProducts(developerId: string, page: number, limit: number) {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId: developerId },
  });

  if (!profile) {
    throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
  }

  const where = { developerId: profile.id };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        pricingPlans: true,
        site: true,
        _count: { select: { subscriptions: true, reviews: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function listMarketplaceProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  sortBy?: string;
}) {
  const { page, limit, search, category, sortBy } = params;

  const where: any = { status: "PUBLISHED" };

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  let orderBy: any = { createdAt: "desc" };
  if (sortBy === "popular") orderBy = { totalSubscribers: "desc" };
  else if (sortBy === "rating") orderBy = { avgRating: "desc" };
  else if (sortBy === "name") orderBy = { name: "asc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        developer: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        pricingPlans: {
          where: { isActive: true },
          orderBy: { priceMonthly: "asc" },
          take: 1,
        },
        _count: { select: { reviews: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

// Admin moderation
export async function listPendingProducts(page: number, limit: number) {
  const where = { status: "PENDING_REVIEW" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        developer: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        pricingPlans: true,
        site: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
}

export async function reviewProduct(
  productId: string,
  adminUserId: string,
  decision: { status: "PUBLISHED" | "REJECTED"; rejectionReason?: string }
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { developer: { include: { user: true } } },
  });

  if (!product) {
    throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  if (product.status !== "PENDING_REVIEW") {
    throw new AppError(400, "Product is not pending review", "NOT_PENDING");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        status: decision.status,
        rejectionReason: decision.status === "REJECTED" ? decision.rejectionReason : null,
        publishedAt: decision.status === "PUBLISHED" ? new Date() : null,
      },
      include: {
        developer: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: `PRODUCT_${decision.status}`,
        entityType: "Product",
        entityId: productId,
        details: {
          productName: product.name,
          decision: decision.status,
          reason: decision.rejectionReason ?? null,
        },
      },
    });

    return updatedProduct;
  });

  return updated;
}

// Helper: verify product ownership
async function getOwnedProduct(productId: string, developerId: string) {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId: developerId },
  });

  if (!profile) {
    throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new AppError(404, "Product not found", "PRODUCT_NOT_FOUND");
  }

  if (product.developerId !== profile.id) {
    throw new AppError(403, "You do not own this product", "FORBIDDEN");
  }

  return product;
}
