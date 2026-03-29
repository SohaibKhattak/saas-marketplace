import { prisma } from "../config/database.js";
import { AppError } from "../middleware/error-handler.js";

export async function applyAsDeveloper(
  userId: string,
  data: {
    businessName: string;
    businessEmail: string;
    taxId?: string;
    bio?: string;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { developerProfile: true },
  });

  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  if (user.developerProfile) {
    if (user.developerProfile.applicationStatus === "PENDING") {
      throw new AppError(409, "You already have a pending application", "APPLICATION_PENDING");
    }
    if (user.developerProfile.applicationStatus === "APPROVED") {
      throw new AppError(409, "You are already a developer", "ALREADY_DEVELOPER");
    }
    // If rejected, allow reapplication by updating the existing profile
    const profile = await prisma.developerProfile.update({
      where: { id: user.developerProfile.id },
      data: {
        ...data,
        applicationStatus: "PENDING",
        rejectionReason: null,
      },
    });
    return profile;
  }

  const profile = await prisma.developerProfile.create({
    data: {
      userId,
      ...data,
    },
  });

  return profile;
}

export async function getDeveloperProfile(userId: string) {
  const profile = await prisma.developerProfile.findUnique({
    where: { userId },
    include: {
      sites: { orderBy: { createdAt: "desc" } },
      _count: { select: { products: true } },
    },
  });

  if (!profile) {
    throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
  }

  return profile;
}

export async function updateDeveloperProfile(
  userId: string,
  data: { businessName?: string; businessEmail?: string; taxId?: string; bio?: string }
) {
  const profile = await prisma.developerProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, "Developer profile not found", "PROFILE_NOT_FOUND");
  }

  return prisma.developerProfile.update({
    where: { id: profile.id },
    data,
  });
}

export async function listPendingApplications(page: number, limit: number) {
  const where = { applicationStatus: "PENDING" as const };

  const [applications, total] = await Promise.all([
    prisma.developerProfile.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, fullName: true, createdAt: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.developerProfile.count({ where }),
  ]);

  return { applications, total };
}

export async function reviewApplication(
  profileId: string,
  adminUserId: string,
  decision: { status: "APPROVED" | "REJECTED"; rejectionReason?: string }
) {
  const profile = await prisma.developerProfile.findUnique({
    where: { id: profileId },
    include: { user: true },
  });

  if (!profile) {
    throw new AppError(404, "Application not found", "APPLICATION_NOT_FOUND");
  }

  if (profile.applicationStatus !== "PENDING") {
    throw new AppError(400, "Application has already been reviewed", "ALREADY_REVIEWED");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedProfile = await tx.developerProfile.update({
      where: { id: profileId },
      data: {
        applicationStatus: decision.status,
        rejectionReason: decision.status === "REJECTED" ? decision.rejectionReason : null,
        approvedAt: decision.status === "APPROVED" ? new Date() : null,
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    // Upgrade user role to DEVELOPER if approved
    if (decision.status === "APPROVED") {
      await tx.user.update({
        where: { id: profile.userId },
        data: { role: "DEVELOPER" },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: `DEVELOPER_APPLICATION_${decision.status}`,
        entityType: "DeveloperProfile",
        entityId: profileId,
        details: {
          developerName: profile.user.fullName,
          decision: decision.status,
          reason: decision.rejectionReason ?? null,
        },
      },
    });

    return updatedProfile;
  });

  return updated;
}
