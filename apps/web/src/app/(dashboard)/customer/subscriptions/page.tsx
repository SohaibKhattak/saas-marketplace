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
import { ExternalLink, Check } from "lucide-react";

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
  flags: {
    isCanceled: boolean;
    isPastDue: boolean;
    isTrialing: boolean;
    isActive: boolean;
  };
  allowedActions: {
    canCancel: boolean;
    canChangePlan: boolean;
    canReactivate: boolean;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    developer: {
      user: { fullName: string };
    };
    site: { siteUrl: string; subdomain: string } | null;
  };
  currentPricingPlan: {
    id: string;
    name: string;
    priceMonthly: number;
    priceYearly: number | null;
  };
  availablePlans: PlanOption[];
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
  console.log("subscriptions", subscriptions)
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

  function openSwitchDialog(sub: Subscription) {
    setSwitchingSub(sub);
    setSwitchError("");
    setSelectedBilling(sub.billingCycle as "MONTHLY" | "YEARLY");

    // We already have available plans from the API!
    setAvailablePlans(sub.availablePlans);

    if (sub.availablePlans.length > 0) {
      // Pre-select a different plan if possible
      const otherPlan = sub.availablePlans.find(p => p.id !== sub.currentPricingPlan.id);
      setSelectedPlanId(otherPlan?.id || sub.currentPricingPlan.id);
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

  const [launchingSlug, setLaunchingSlug] = useState<string | null>(null);

  async function handleLaunchApp(siteUrl: string, subdomain: string) {
    setLaunchingSlug(subdomain);
    try {
      const res = await api.post<{ data: { token: string } }>(
        "/wp/launch-token",
        { siteSlug: subdomain },
        { token: accessToken! }
      );
      const launchUrl = `${siteUrl}?saas_token=${res.data.token}`;
      window.open(launchUrl, "_blank");
    } catch {
      // Fallback: open without token
      window.open(siteUrl, "_blank");
    } finally {
      setLaunchingSlug(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My Subscriptions</h1>
      <p className="text-gray-500 mt-1">
        Manage your active SaaS subscriptions ({total} total)
      </p>

      {fetchError && <div className="mt-4 rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{fetchError}</div>}

      {justSubscribed && (
        <div className="mt-4 rounded-sm border border-green-500/50 bg-green-500/10 p-4">
          <p className="text-sm font-semibold tracking-tight text-green-700 dark:text-green-400">
            Subscription created successfully! Welcome aboard.
          </p>
        </div>
      )}

      {loading ? (
        <div className="mt-8 py-12 text-center text-gray-500">Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="mt-8 rounded-sm border border-dashed p-12 text-center text-gray-500">
          <p className="text-lg font-semibold tracking-tight">No subscriptions yet</p>
          <p className="mt-1 text-sm">Browse the marketplace to find SaaS products</p>
          <Link href="/marketplace">
            <Button className="mt-4" variant="outline">Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {subscriptions.map((sub) => {
            if (!sub.product || !sub.currentPricingPlan) return null;
            return (
              <Card key={sub.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {sub.product.logoUrl && (
                        <img src={sub.product.logoUrl} alt="" className="h-10 w-10 rounded-sm object-cover" />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          <Link href={`/marketplace/${sub.product.slug}`} className="hover:underline">
                            {sub.product.name}
                          </Link>
                        </CardTitle>
                        <CardDescription>
                          {sub.currentPricingPlan.name} plan &middot; by {sub.product.developer.user.fullName}
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
                      <span className="text-gray-500">Billing: </span>
                      <span className="font-semibold tracking-tight">
                        ${sub.billingCycle === "YEARLY" && sub.currentPricingPlan.priceYearly
                          ? sub.currentPricingPlan.priceYearly
                          : sub.currentPricingPlan.priceMonthly}
                        /{sub.billingCycle === "YEARLY" ? "year" : "month"}
                      </span>
                    </div>
                    {sub.currentPeriodEnd && (
                      <div>
                        <span className="text-gray-500">
                          {sub.flags.isCanceled ? "Access until: " : "Renews: "}
                        </span>
                        <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Since: </span>
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* State Indicators */}
                  {sub.canceledAt && sub.currentPeriodEnd && (
                    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                      <span>Scheduled to cancel on <strong>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</strong> (You retain access until then)</span>
                    </div>
                  )}

                  {sub.status === "TRIALING" && sub.currentPeriodEnd && !sub.canceledAt && (
                    <div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                      <span>Trial active until <strong>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</strong> (Will renew to active paid plan then)</span>
                    </div>
                  )}

                  {sub.status === "PAST_DUE" && (
                    <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-destructive animate-pulse flex-shrink-0" />
                      <span>Payment failed &middot; Past due! Please check your billing details to avoid losing service.</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2 flex-wrap">
                  {sub.product.site && (sub.flags.isActive || sub.flags.isTrialing) && (
                    <Button
                      size="sm"
                      onClick={() => handleLaunchApp(sub.product.site!.siteUrl, sub.product.site!.subdomain)}
                      disabled={launchingSlug === sub.product.site.subdomain}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      {launchingSlug === sub.product.site.subdomain ? "Launching..." : "Launch App"}
                    </Button>
                  )}
                  <Link href={`/marketplace/${sub.product.slug}`}>
                    <Button size="sm" variant="outline">View Product</Button>
                  </Link>
                  {sub.allowedActions.canChangePlan && (
                    <Button size="sm" variant="outline" onClick={() => openSwitchDialog(sub)}>
                      Manage Subscription
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
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
            <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
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
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 border-b border-border/50">
            <div className="flex items-center gap-4">
              {switchingSub?.product.logoUrl && (
                <div className="h-16 w-16 rounded-2xl border-2 border-background shadow-lg overflow-hidden bg-background">
                  <img src={switchingSub.product.logoUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex-grow">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {switchingSub?.product.name}
                </DialogTitle>
                <DialogDescription className="text-base">
                  Manage your subscription & explore available plans
                </DialogDescription>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Member Since</p>
                <p className="text-sm font-medium">{switchingSub && new Date(switchingSub.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {switchError && (
              <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                {switchError}
              </div>
            )}

            {switchingSub?.canceledAt && (
              <div className="mb-6 rounded-lg bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400 border border-amber-500/20 flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-2 animate-pulse flex-shrink-0" />
                <p>
                  <strong>Subscription Cancelled:</strong> You can continue using this product and all its features until your current {switchingSub.status === "TRIALING" ? "trial" : "billing"} period ends on <strong>{switchingSub.currentPeriodEnd ? new Date(switchingSub.currentPeriodEnd).toLocaleDateString() : ""}</strong>.
                </p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {availablePlans.map((plan) => {
                const isCurrent = plan.id === switchingSub?.currentPricingPlan.id;
                const price = switchingSub?.billingCycle === "YEARLY" && plan.priceYearly
                  ? plan.priceYearly
                  : plan.priceMonthly;

                return (
                  <Card
                    key={plan.id}
                    className={`group relative flex flex-col transition-all duration-300 border-2 overflow-hidden ${isCurrent
                        ? "border-primary shadow-xl shadow-primary/10 bg-primary/5"
                        : "border-border/50 hover:border-primary/30 hover:shadow-lg bg-card/50"
                      }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                          Active Plan
                        </div>
                      </div>
                    )}

                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start mb-1">
                        <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tight">${price}</span>
                        <span className="text-sm text-gray-500 font-medium lowercase">
                          /{switchingSub?.billingCycle === "YEARLY" ? "Year" : "Month"}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-grow pb-6">
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">What's included</p>
                        <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
                          {plan.features?.slice(0, 4).map((f, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <div className="mt-1 flex-shrink-0 h-4 w-4 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Check className="h-2.5 w-2.5 text-green-600" />
                              </div>
                              <span className="leading-tight">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-0 pb-6 px-6">
                      <Button
                        className={`w-full font-bold transition-all ${isCurrent
                            ? "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                            : "bg-background hover:bg-accent"
                          }`}
                        variant={isCurrent ? "outline" : "secondary"}
                        disabled={!isCurrent}
                      >
                        {isCurrent ? "Currently Subscribed" : "Upgrade Plan"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>

          <DialogFooter className="bg-gray-50 dark:bg-white/5 p-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between items-center">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold text-xs transition-colors disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => {
                setCancelingSub(switchingSub);
                setSwitchingSub(null);
              }}
              disabled={!!switchingSub?.canceledAt}
            >
              Cancel Subscription
            </Button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto px-8 font-semibold"
                onClick={() => setSwitchingSub(null)}
              >
                Close
              </Button>
            </div>
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
