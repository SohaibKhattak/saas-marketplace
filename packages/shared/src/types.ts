export type UserRole = "CUSTOMER" | "DEVELOPER" | "ADMIN";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SiteStatus = "PROVISIONING" | "ACTIVE" | "SUSPENDED" | "DELETED";
export type ProductStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "UNPUBLISHED";
export type SubscriptionStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
export type BillingCycle = "MONTHLY" | "YEARLY";
export type TransactionType = "PAYMENT" | "REFUND";
export type TransactionStatus = "SUCCEEDED" | "FAILED" | "REFUNDED";
export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
}
