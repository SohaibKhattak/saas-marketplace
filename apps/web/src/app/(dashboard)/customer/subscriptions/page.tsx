"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";

interface PlanOption {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number | null;
  features: string[];
  isActive: boolean;
}

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    category: string;
    site: { siteUrl: string; subdomain: string } | null;
    developer: { user: { fullName: string } };
  };
  pricingPlan: {
    name: string;
    priceMonthly: number;
    priceYearly: number | null;
    features: string[];
  };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  TRIALING: "outline",
  PAST_DUE: "destructive",
  CANCELED: "secondary",
  EXPIRED: "secondary",
};

function SubscriptionsContent() {
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("success") === "true";
  const { accessToken } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [cancelingSub, setCancelingSub] = useState<Subscription | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");

  // Plan switching
  const [switchingSub, setSwitchingSub] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedBilling, setSelectedBilling] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState("");

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: Subscription[];
        pagination: { total: number };
      }>(`/subscriptions/me?page=${page}&limit=${limit}`, { token: accessToken! });
      setSubscriptions(res.data);
      setTotal(res.pagination.total);
    } catch {
      setFetchError("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  async function handleCancel() {
    if (!cancelingSub) return;
    setCanceling(true);
    setError("");

    try {
      await api.post(`/subscriptions/${cancelingSub.id}/cancel`, {}, { token: accessToken! });
      setCancelingSub(null);
      fetchSubscriptions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel");
    } finally {
      setCanceling(false);
    }
  }

  async function openSwitchDialog(sub: Subscription) {
    setSwitchingSub(sub);
    setSwitchError("");
    setSelectedBilling(sub.billingCycle as "MONTHLY" | "YEARLY");
    try {
      const res = await api.get<{ data: PlanOption[] }>(
        `/products/${sub.product.id}/plans`, { token: accessToken! }
      );
      const plans = res.data.filter((p) => p.isActive);
      setAvailablePlans(plans);
      // Pre-select a different plan if possible
      const other = plans.find((p) => p.id !== sub.pricingPlan.name);
      setSelectedPlanId(other?.id ?? plans[0]?.id ?? "");
    } catch {
      setSwitchError("Failed to load plans");
    }
  }

  async function handleSwitch() {
    if (!switchingSub || !selectedPlanId) return;
    setSwitching(true);
    setSwitchError("");
    try {
      await api.post(
        `/subscriptions/${switchingSub.id}/switch`,
        { pricingPlanId: selectedPlanId, billingCycle: selectedBilling },
        { token: accessToken! }
      );
      setSwitchingSub(null);
      fetchSubscriptions();
    } catch (err) {
      setSwitchError(err instanceof ApiError ? err.message : "Failed to switch plan");
    } finally {
      setSwitching(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My Subscriptions</h1>
      <p className="text-muted-foreground mt-1">
        Manage your active SaaS subscriptions ({total} total)
      </p>

      {fetchError && <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{fetchError}</div>}

      {justSubscribed && (
        <div className="mt-4 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Subscription created successfully! Welcome aboard.
          </p>
        </div>
      )}

      {loading ? (
        <div className="mt-8 py-12 text-center text-muted-foreground">Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No subscriptions yet</p>
          <p className="mt-1 text-sm">Browse the marketplace to find SaaS products</p>
          <Link href="/marketplace">
            <Button className="mt-4" variant="outline">Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {sub.product.logoUrl && (
                      <img src={sub.product.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        <Link href={`/marketplace/${sub.product.slug}`} className="hover:underline">
                          {sub.product.name}
                        </Link>
                      </CardTitle>
                      <CardDescription>
                        {sub.pricingPlan.name} plan &middot; by {sub.product.developer.user.fullName}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusVariant[sub.status] ?? "secondary"}>
                    {sub.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Billing: </span>
                    <span className="font-medium">
                      ${sub.billingCycle === "YEARLY" && sub.pricingPlan.priceYearly
                        ? sub.pricingPlan.priceYearly
                        : sub.pricingPlan.priceMonthly}
                      /{sub.billingCycle === "YEARLY" ? "year" : "month"}
                    </span>
                  </div>
                  {sub.currentPeriodEnd && (
                    <div>
                      <span className="text-muted-foreground">
                        {sub.canceledAt ? "Access until: " : "Renews: "}
                      </span>
                      <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Since: </span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 flex-wrap">
                {sub.product.site && (sub.status === "ACTIVE" || sub.status === "TRIALING") && (
                  <a href={sub.product.site.siteUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Launch App
                    </Button>
                  </a>
                )}
                <Link href={`/marketplace/${sub.product.slug}`}>
                  <Button size="sm" variant="outline">View Product</Button>
                </Link>
                {(sub.status === "ACTIVE" || sub.status === "TRIALING") && !sub.canceledAt && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openSwitchDialog(sub)}>
                      Change Plan
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setCancelingSub(sub)}>
                      Cancel
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelingSub}
        onOpenChange={(open) => { if (!open) { setCancelingSub(null); setError(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription to {cancelingSub?.product.name}?
              You'll still have access until the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelingSub(null)}>Keep Subscription</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={canceling}>
              {canceling ? "Canceling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Switch Plan Dialog */}
      <Dialog
        open={!!switchingSub}
        onOpenChange={(open) => { if (!open) { setSwitchingSub(null); setSwitchError(""); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Switch your plan for {switchingSub?.product.name}. Changes take effect immediately with prorated billing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Current Plan</label>
              <p className="text-sm text-muted-foreground">
                {switchingSub?.pricingPlan.name} — ${switchingSub?.billingCycle === "YEARLY" && switchingSub?.pricingPlan.priceYearly
                  ? switchingSub.pricingPlan.priceYearly
                  : switchingSub?.pricingPlan.priceMonthly}/{switchingSub?.billingCycle === "YEARLY" ? "year" : "month"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">New Plan</label>
              <Select value={selectedPlanId} onValueChange={(v) => setSelectedPlanId(v ?? "")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — ${plan.priceMonthly}/mo
                      {plan.priceYearly ? ` or $${plan.priceYearly}/yr` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Billing Cycle</label>
              <Select value={selectedBilling} onValueChange={(v) => { if (v) setSelectedBilling(v as "MONTHLY" | "YEARLY"); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {switchError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{switchError}</div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSwitchingSub(null)}>Cancel</Button>
            <Button onClick={handleSwitch} disabled={switching || !selectedPlanId}>
              {switching ? "Switching..." : "Switch Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense>
      <SubscriptionsContent />
    </Suspense>
  );
}
