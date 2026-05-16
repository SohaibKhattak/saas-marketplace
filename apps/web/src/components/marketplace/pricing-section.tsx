"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  trial_days: number;
}

interface PricingSectionProps {
  plans: PricingPlan[];
  onSubscribe: (planId: string, billingCycle: "MONTHLY" | "YEARLY") => void;
  subscribingPlanId: string | null;
  isLoggedIn: boolean;
  isOwner?: boolean;
  activePlanId?: string | null;
  userRole?: string | null;
}

export function PricingSection({
  plans,
  onSubscribe,
  subscribingPlanId,
  isLoggedIn,
  isOwner,
  activePlanId,
  userRole,
}: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  if (!plans || plans.length === 0) return null;

  return (
    <div className="w-full pb-14 space-y-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-bold text-primary uppercase tracking-widest">
          Pricing Plans
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
          Ready to supercharge your workflow?
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl font-medium">
          Choose the perfect plan for your business. All plans include our core features with no hidden fees.
        </p>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 mt-8">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={cn(
              "px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-300",
              billingCycle === "MONTHLY"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("YEARLY")}
            className={cn(
              "px-6 py-2 text-sm font-semibold rounded-lg transition-all duration-300 relative",
              billingCycle === "YEARLY"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Yearly
            <span className="absolute -top-3 -right-2 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tighter shadow-lg shadow-primary/20">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {plans.map((plan) => {
          const price = billingCycle === "MONTHLY" ? plan.price_monthly : plan.price_yearly;
          const displayPrice = price ?? plan.price_monthly;
          const isYearlyPossible = !!plan.price_yearly;
          const isRecommended = plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("popular");

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col overflow-hidden border transition-all duration-500 hover:shadow-[0_32px_64px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-2 rounded-3xl",
                isRecommended ? "border-primary/40 shadow-2xl shadow-primary/5 ring-1 ring-primary/10" : "border-slate-200 bg-white"
              )}
            >
              {isRecommended && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
              )}

              {plan.trial_days > 0 && (
                <div className="absolute top-6 right-6">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 border-none text-[10px] uppercase font-black px-2.5 py-1 rounded-lg">
                    {plan.trial_days} Day Trial
                  </Badge>
                </div>
              )}

              <CardHeader className="p-8 pb-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                  {isRecommended && (
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Most Popular</p>
                  )}
                </div>
                <div className="mt-8 flex items-baseline gap-1">
                  <span className="text-5xl font-black tracking-tight text-slate-900">
                    ${displayPrice}
                  </span>
                  <span className="text-slate-400 font-bold text-sm uppercase tracking-widest">
                    /{billingCycle === "MONTHLY" ? "mo" : "yr"}
                  </span>
                </div>
                {billingCycle === "YEARLY" && plan.price_monthly && plan.price_yearly && (
                  <div className="flex items-center gap-2 mt-4">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                    </div>
                    <p className="text-xs font-bold text-emerald-600">
                      Saving ${(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)} per year
                    </p>
                  </div>
                )}
              </CardHeader>

              <CardContent className="flex-1 p-8">
                <div className="h-px bg-slate-100 mb-8" />
                <ul className="space-y-5">
                  {(plan.features as string[]).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3.5 text-sm text-slate-600">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Check className="h-2.5 w-2.5 stroke-[4]" />
                      </div>
                      <span className="leading-normal font-semibold">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-8 pt-0 mt-auto flex flex-col">
                <Button
                  className={cn(
                    "w-full h-11 text-sm font-semibold transition-all duration-300 rounded-xl",
                    plan.id === activePlanId 
                      ? "bg-emerald-500 text-white cursor-default hover:bg-emerald-500" 
                      : isRecommended
                        ? "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/10 hover:shadow-primary/20"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/5 hover:shadow-slate-900/10"
                  )}
                  onClick={() => !isOwner && plan.id !== activePlanId && onSubscribe(plan.id, billingCycle)}
                  disabled={
                    subscribingPlanId === plan.id || 
                    (billingCycle === "YEARLY" && !isYearlyPossible) ||
                    isOwner || 
                    plan.id === activePlanId ||
                    (isLoggedIn && userRole === 'DEVELOPER' && !isOwner)
                  }
                >
                  {subscribingPlanId === plan.id ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : plan.id === activePlanId ? (
                    "Active Subscription"
                  ) : isOwner ? (
                    "Manage Product"
                  ) : isLoggedIn && userRole === 'DEVELOPER' ? (
                    "Customer Account Required"
                  ) : isLoggedIn ? (
                    `Select ${plan.name}`
                  ) : (
                    "Sign in to Subscribe"
                  )}
                </Button>
                <p className="text-center text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-widest w-full">
                  No credit card required for trial
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
