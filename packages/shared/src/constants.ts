export const PLATFORM_FEE_PERCENT = 15;
export const MIN_PAYOUT_AMOUNT = 50;
export const MAX_TRIAL_DAYS = 30;
export const JWT_ACCESS_EXPIRY = "15m";
export const JWT_REFRESH_EXPIRY = "7d";

export const USER_ROLES = ["CUSTOMER", "DEVELOPER", "ADMIN"] as const;
export const PRODUCT_CATEGORIES = [
  "CRM",
  "Project Management",
  "Marketing",
  "Analytics",
  "E-Commerce",
  "Education",
  "Finance",
  "Healthcare",
  "Communication",
  "Productivity",
  "Developer Tools",
  "Other",
] as const;

export const PRODUCT_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
  "UNPUBLISHED",
] as const;

export const SUBSCRIPTION_STATUSES = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "EXPIRED",
] as const;
