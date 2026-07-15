/**
 * Unit tests for the Stripe Connect incomplete onboarding fix.
 *
 * These tests use vitest mocks to isolate the controller/service logic from
 * Stripe API calls and Supabase. They cover:
 *
 *  1. getProfile — returns correct stripeChargesEnabled/stripeDetailsSubmitted
 *  2. createStripeLoginLink — returns onboarding link vs login link
 *  3. createCheckoutSession — blocks purchases for incomplete developers
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ────────────────────────────────────────────────────────────────────────
// Mock: stripe
// ────────────────────────────────────────────────────────────────────────
const mockStripeAccountsRetrieve = vi.fn();
const mockStripeAccountsCreate = vi.fn();
const mockStripeAccountLinksCreate = vi.fn();
const mockStripeAccountsCreateLoginLink = vi.fn();

vi.mock("../config/stripe.js", () => ({
  stripe: {
    accounts: {
      retrieve: (...args: unknown[]) => mockStripeAccountsRetrieve(...args),
      create: (...args: unknown[]) => mockStripeAccountsCreate(...args),
      createLoginLink: (...args: unknown[]) =>
        mockStripeAccountsCreateLoginLink(...args),
    },
    accountLinks: {
      create: (...args: unknown[]) => mockStripeAccountLinksCreate(...args),
    },
  },
}));

// ────────────────────────────────────────────────────────────────────────
// Mock: supabase
// ────────────────────────────────────────────────────────────────────────
const mockSupabaseFrom = vi.fn();

vi.mock("../config/supabase.js", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
  createAuthClient: vi.fn(),
}));

// ────────────────────────────────────────────────────────────────────────
// Mock: env
// ────────────────────────────────────────────────────────────────────────
vi.mock("../config/env.js", () => ({
  env: {
    FRONTEND_URL: "http://localhost:3000",
    PLATFORM_FEE_PERCENT: 15,
  },
}));

// ────────────────────────────────────────────────────────────────────────
// Mock: email service (not needed but imported by stripe service)
// ────────────────────────────────────────────────────────────────────────
vi.mock("../services/email.service.js", () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendNewSubscriptionEmail: vi.fn(),
  sendSubscriptionConfirmationEmail: vi.fn(),
}));

// ────────────────────────────────────────────────────────────────────────
// Mock: notification service
// ────────────────────────────────────────────────────────────────────────
vi.mock("../services/notification.service.js", () => ({
  createNotification: vi.fn(),
}));

// ────────────────────────────────────────────────────────────────────────
// Mock: db-upgrades
// ────────────────────────────────────────────────────────────────────────
vi.mock("../utils/db-upgrades.js", () => ({
  ensureUsersAuthColumns: vi.fn(),
}));

// ────────────────────────────────────────────────────────────────────────
// Mock: database (pool)
// ────────────────────────────────────────────────────────────────────────
vi.mock("../config/database.js", () => ({
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

// ────────────────────────────────────────────────────────────────────────
// Mock: middleware
// ────────────────────────────────────────────────────────────────────────
vi.mock("../middleware/error-handler.js", () => ({
  AppError: class AppError extends Error {
    statusCode: number;
    code: string;
    constructor(statusCode: number, message: string, code: string) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.name = "AppError";
    }
  },
}));

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────
function makeFakeReq(userId: string) {
  return { user: { userId } } as any;
}

function makeFakeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeFakeNext() {
  return vi.fn();
}

/**
 * Build a fluent Supabase chain mock for a given table.
 * Pass the final resolved value and optionally the error.
 */
function buildSupabaseChain(
  finalData: unknown,
  finalError: unknown = null,
  opts?: { count?: number }
) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  };
  // For count queries
  if (opts?.count !== undefined) {
    chain.select = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ count: opts.count, error: null }),
    });
  }
  return chain;
}

// ────────────────────────────────────────────────────────────────────────
// Import after mocks
// ────────────────────────────────────────────────────────────────────────
const { getProfile, createStripeLoginLink, setupStripeConnect } = await import(
  "../controllers/developer.controller.js"
);

// ═══════════════════════════════════════════════════════════════════════
// Test Suite 1: getProfile — Stripe status fields
// ═══════════════════════════════════════════════════════════════════════
describe("getProfile — Stripe account status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseProfile = {
    id: "dev-1",
    user_id: "user-1",
    business_name: "Acme",
    business_email: "dev@acme.com",
    tax_id: null,
    bio: null,
    application_status: "APPROVED",
    rejection_reason: null,
    stripe_account_id: "acct_123",
    approved_at: "2026-01-01",
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
  };

  it("returns stripeChargesEnabled=true and stripeDetailsSubmitted=true for a fully onboarded account", async () => {
    // Mock supabase calls
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "developer_profiles") return buildSupabaseChain(baseProfile);
      if (table === "developer_sites") return buildSupabaseChain([], null);
      if (table === "products") return buildSupabaseChain(null, null, { count: 3 });
      return buildSupabaseChain(null);
    });

    mockStripeAccountsRetrieve.mockResolvedValue({
      charges_enabled: true,
      details_submitted: true,
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await getProfile(req, res, next);

    expect(res.json).toHaveBeenCalledTimes(1);
    const data = res.json.mock.calls[0][0].data;
    expect(data.stripeChargesEnabled).toBe(true);
    expect(data.stripeDetailsSubmitted).toBe(true);
    expect(data.stripeAccountId).toBe("acct_123");
  });

  it("returns stripeChargesEnabled=false when onboarding is incomplete", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "developer_profiles") return buildSupabaseChain(baseProfile);
      if (table === "developer_sites") return buildSupabaseChain([], null);
      if (table === "products") return buildSupabaseChain(null, null, { count: 0 });
      return buildSupabaseChain(null);
    });

    // Stripe account exists but charges not enabled
    mockStripeAccountsRetrieve.mockResolvedValue({
      charges_enabled: false,
      details_submitted: false,
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await getProfile(req, res, next);

    const data = res.json.mock.calls[0][0].data;
    expect(data.stripeChargesEnabled).toBe(false);
    expect(data.stripeDetailsSubmitted).toBe(false);
    expect(data.stripeAccountId).toBe("acct_123");
  });

  it("returns stripeChargesEnabled=false when no stripe_account_id exists", async () => {
    const profileNoStripe = { ...baseProfile, stripe_account_id: null };

    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "developer_profiles") return buildSupabaseChain(profileNoStripe);
      if (table === "developer_sites") return buildSupabaseChain([], null);
      if (table === "products") return buildSupabaseChain(null, null, { count: 0 });
      return buildSupabaseChain(null);
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await getProfile(req, res, next);

    const data = res.json.mock.calls[0][0].data;
    expect(data.stripeChargesEnabled).toBe(false);
    expect(data.stripeDetailsSubmitted).toBe(false);
    expect(data.stripeAccountId).toBeNull();
    // Should NOT call stripe.accounts.retrieve
    expect(mockStripeAccountsRetrieve).not.toHaveBeenCalled();
  });

  it("gracefully handles Stripe API failure (e.g. deleted account) — defaults to false", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "developer_profiles") return buildSupabaseChain(baseProfile);
      if (table === "developer_sites") return buildSupabaseChain([], null);
      if (table === "products") return buildSupabaseChain(null, null, { count: 0 });
      return buildSupabaseChain(null);
    });

    // Stripe throws (e.g. account was deleted externally)
    mockStripeAccountsRetrieve.mockRejectedValue(new Error("No such account: acct_123"));

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await getProfile(req, res, next);

    // Should still return a response, not call next(err)
    expect(next).not.toHaveBeenCalled();
    const data = res.json.mock.calls[0][0].data;
    expect(data.stripeChargesEnabled).toBe(false);
    expect(data.stripeDetailsSubmitted).toBe(false);
  });

  it("handles edge case: charges_enabled=true but details_submitted=false", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "developer_profiles") return buildSupabaseChain(baseProfile);
      if (table === "developer_sites") return buildSupabaseChain([], null);
      if (table === "products") return buildSupabaseChain(null, null, { count: 0 });
      return buildSupabaseChain(null);
    });

    mockStripeAccountsRetrieve.mockResolvedValue({
      charges_enabled: true,
      details_submitted: false,
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await getProfile(req, res, next);

    const data = res.json.mock.calls[0][0].data;
    expect(data.stripeChargesEnabled).toBe(true);
    expect(data.stripeDetailsSubmitted).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Test Suite 2: createStripeLoginLink — onboarding-aware routing
// ═══════════════════════════════════════════════════════════════════════
describe("createStripeLoginLink — onboarding-aware routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a login link URL when account is fully onboarded", async () => {
    mockSupabaseFrom.mockReturnValue(
      buildSupabaseChain({ stripe_account_id: "acct_good" })
    );

    mockStripeAccountsRetrieve.mockResolvedValue({
      charges_enabled: true,
      details_submitted: true,
    });

    mockStripeAccountsCreateLoginLink.mockResolvedValue({
      url: "https://connect.stripe.com/express/login/acct_good",
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await createStripeLoginLink(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      url: "https://connect.stripe.com/express/login/acct_good",
    });
    expect(mockStripeAccountLinksCreate).not.toHaveBeenCalled();
  });

  it("returns an account onboarding link when charges_enabled is false", async () => {
    mockSupabaseFrom.mockReturnValue(
      buildSupabaseChain({ stripe_account_id: "acct_incomplete" })
    );

    mockStripeAccountsRetrieve.mockResolvedValue({
      charges_enabled: false,
      details_submitted: false,
    });

    mockStripeAccountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.com/setup/acct_incomplete",
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await createStripeLoginLink(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      url: "https://connect.stripe.com/setup/acct_incomplete",
      onboardingIncomplete: true,
    });
    expect(mockStripeAccountsCreateLoginLink).not.toHaveBeenCalled();
    expect(mockStripeAccountLinksCreate).toHaveBeenCalledWith({
      account: "acct_incomplete",
      refresh_url: "http://localhost:3000/developer/profile?stripe=refresh",
      return_url: "http://localhost:3000/developer/profile?stripe=success",
      type: "account_onboarding",
    });
  });

  it("returns an account onboarding link when details_submitted=true but charges_enabled=false", async () => {
    mockSupabaseFrom.mockReturnValue(
      buildSupabaseChain({ stripe_account_id: "acct_pending" })
    );

    mockStripeAccountsRetrieve.mockResolvedValue({
      charges_enabled: false,
      details_submitted: true,
    });

    mockStripeAccountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.com/setup/acct_pending",
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await createStripeLoginLink(req, res, next);

    // Should still redirect to onboarding, not login
    expect(res.json).toHaveBeenCalledWith({
      url: "https://connect.stripe.com/setup/acct_pending",
      onboardingIncomplete: true,
    });
  });

  it("calls next with AppError when no stripe_account_id exists", async () => {
    mockSupabaseFrom.mockReturnValue(
      buildSupabaseChain({ stripe_account_id: null })
    );

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await createStripeLoginLink(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.message).toContain("not connected");
  });

  it("calls next with AppError when profile not found", async () => {
    mockSupabaseFrom.mockReturnValue(buildSupabaseChain(null));

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await createStripeLoginLink(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.message).toContain("not connected");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Test Suite 3: setupStripeConnect — handles resume for existing accounts
// ═══════════════════════════════════════════════════════════════════════
describe("setupStripeConnect — handles existing accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses existing stripe_account_id and generates new account link (resume onboarding)", async () => {
    mockSupabaseFrom.mockReturnValue(
      buildSupabaseChain({
        id: "dev-1",
        stripe_account_id: "acct_existing",
      })
    );

    mockStripeAccountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.com/setup/acct_existing",
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await setupStripeConnect(req, res, next);

    // Should NOT create a new Stripe account
    expect(mockStripeAccountsCreate).not.toHaveBeenCalled();
    // Should generate an account link with the existing ID
    expect(mockStripeAccountLinksCreate).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_existing" })
    );
    expect(res.json).toHaveBeenCalledWith({
      url: "https://connect.stripe.com/setup/acct_existing",
    });
  });

  it("creates a new Stripe account when stripe_account_id is null", async () => {
    const profileChain = buildSupabaseChain({
      id: "dev-1",
      stripe_account_id: null,
      business_name: "NewBiz",
    });

    // For the update call after creating
    const updateChain: any = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    };

    let callCount = 0;
    mockSupabaseFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return profileChain; // select profile
      return updateChain; // update with stripe_account_id
    });

    mockStripeAccountsCreate.mockResolvedValue({ id: "acct_new" });
    mockStripeAccountLinksCreate.mockResolvedValue({
      url: "https://connect.stripe.com/setup/acct_new",
    });

    const req = makeFakeReq("user-1");
    const res = makeFakeRes();
    const next = makeFakeNext();

    await setupStripeConnect(req, res, next);

    expect(mockStripeAccountsCreate).toHaveBeenCalledTimes(1);
    expect(mockStripeAccountLinksCreate).toHaveBeenCalledWith(
      expect.objectContaining({ account: "acct_new" })
    );
    expect(res.json).toHaveBeenCalledWith({
      url: "https://connect.stripe.com/setup/acct_new",
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// Test Suite 4: createCheckoutSession — checkout guard
// ═══════════════════════════════════════════════════════════════════════
describe("createCheckoutSession — developer Stripe guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // We import createCheckoutSession from the stripe service
  let createCheckoutSession: any;

  beforeEach(async () => {
    const mod = await import("../services/stripe.service.js");
    createCheckoutSession = mod.createCheckoutSession;
  });

  it("throws DEVELOPER_STRIPE_INCOMPLETE when developer has no stripe_account_id", async () => {
    // Mock supabase for plan lookup, then dev profile
    let callNum = 0;
    mockSupabaseFrom.mockImplementation((table: string) => {
      callNum++;
      if (table === "pricing_plans") {
        return buildSupabaseChain({
          id: "plan-1",
          is_active: true,
          product_id: "prod-1",
          product: { status: "PUBLISHED", developer_id: "dev-user-1", name: "Test", slug: "test" },
          price_monthly: 10,
          trial_days: 0,
          name: "Basic",
        });
      }
      if (table === "developer_profiles") {
        return buildSupabaseChain({ stripe_account_id: null });
      }
      return buildSupabaseChain(null);
    });

    await expect(
      createCheckoutSession("customer-1", "plan-1", "MONTHLY")
    ).rejects.toThrow("developer hasn't completed their payment setup");
  });

  it("throws DEVELOPER_STRIPE_INCOMPLETE when developer's charges_enabled is false", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "pricing_plans") {
        return buildSupabaseChain({
          id: "plan-1",
          is_active: true,
          product_id: "prod-1",
          product: { status: "PUBLISHED", developer_id: "dev-user-1", name: "Test", slug: "test" },
          price_monthly: 10,
          trial_days: 0,
          name: "Basic",
        });
      }
      if (table === "developer_profiles") {
        return buildSupabaseChain({ stripe_account_id: "acct_incomplete" });
      }
      return buildSupabaseChain(null);
    });

    // Account exists but onboarding not finished
    mockStripeAccountsRetrieve.mockResolvedValue({
      charges_enabled: false,
      details_submitted: false,
    });

    await expect(
      createCheckoutSession("customer-1", "plan-1", "MONTHLY")
    ).rejects.toThrow("developer hasn't completed their payment setup");
  });
});
