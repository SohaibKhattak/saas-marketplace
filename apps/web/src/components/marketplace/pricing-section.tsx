"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Loader } from '@/components/ui/loader';
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
  activeBillingCycle?: "MONTHLY" | "YEARLY" | null;
  userRole?: string | null;
}

export function PricingSection({
  plans,
  onSubscribe,
  subscribingPlanId,
  isLoggedIn,
  isOwner,
  activePlanId,
  activeBillingCycle,
  userRole,
}: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  if (!plans || plans.length === 0) return null;

  return (
    <div className="w-full pb-14 space-y-12">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900">
          Pricing Plans
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl font-medium">
          Manage, track, and optimize your digital assets<br/>with a plan built for your needs.
        </p> */}

        <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-full border border-slate-100 mt-8">
          <button
            onClick={() => setBillingCycle("YEARLY")}
            className={cn(
              "px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300 relative",
              billingCycle === "YEARLY"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Yearly
          </button>
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={cn(
              "px-6 py-2 text-sm font-semibold rounded-full transition-all duration-300",
              billingCycle === "MONTHLY"
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto items-stretch">
        {plans.map((plan) => {
          const price = billingCycle === "MONTHLY" ? plan.price_monthly : plan.price_yearly;
          const displayPrice = price ?? plan.price_monthly;
          const isYearlyPossible = !!plan.price_yearly;
          const isRecommended = plan.name.toLowerCase().includes("growth") || plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("popular");

          // let description = "Ideal for individuals managing personal crypto finances.";
          let subtext = plan.trial_days > 0 && `${plan.trial_days} days free`;
          // if (isRecommended) {
          //   description = "Built for traders and small businesses scaling their web3 operations.";
          //   subtext = "2 days until expiration"; // Based on the image
          // } else if (plan.name.toLowerCase().includes("enterprise")) {
          //   description = "Perfect for web3 builders, companies and financial teams.";
          //   subtext = "Individual";
          // }

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col overflow-hidden border-none transition-all duration-500 rounded-[2rem]",
                isRecommended ? "bg-black text-white" : "bg-slate-50/80 text-slate-900"
              )}
            >

              <CardHeader className="p-8 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  {/* {isRecommended && (
                    <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/20 border-none px-3 py-1 font-semibold rounded-full lowercase text-xs">
                      best choice
                    </Badge>
                  )} */}
                </div>
                {/* <p className={cn("text-sm leading-relaxed", isRecommended ? "text-slate-300" : "text-slate-500")}>
                  {description}
                </p> */}
              </CardHeader>

              <CardContent className="flex-1 p-8 pt-4">
                <ul className="space-y-4">
                  {(plan.features as string[]).map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 shrink-0">
                        <Check className="h-4 w-4 text-blue-500 stroke-[3]" />
                      </div>
                      <span className={cn("leading-tight font-medium", isRecommended ? "text-slate-300" : "text-slate-700")}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-8 pt-0 mt-auto flex flex-col gap-6">
                <div className="flex items-end justify-between w-full">
                  <div className="flex items-baseline gap-1.5">
                    {plan.price_monthly ? (
                      <>
                        <span className="text-4xl font-extrabold tracking-tight">
                          ${displayPrice}
                        </span>
                        <span className={cn("text-xs font-semibold", isRecommended ? "text-slate-400" : "text-slate-500")}>
                          / per month
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold tracking-tight">
                        Custom pricing
                      </span>
                    )}
                  </div>
                  {plan.price_monthly && (
                    <span className={cn("text-xs font-semibold pb-1", isRecommended ? "text-slate-400" : "text-slate-500")}>
                      billed {billingCycle === "YEARLY" ? "yearly" : "monthly"}
                    </span>
                  )}
                </div>

                {activePlanId && (plan.id !== activePlanId || billingCycle !== activeBillingCycle) ? (
                  <div className="w-full flex items-center justify-center text-center h-12 px-4 rounded-full border border-gray-200 bg-gray-50 text-[11px] text-gray-500 font-medium">
                    To change subscription, contact support@saasifyy.tech
                  </div>
                ) : (
                  <Button
                    className={cn(
                      "w-full h-12 text-sm font-bold transition-all duration-300 rounded-full",
                      plan.id === activePlanId && billingCycle === activeBillingCycle
                        ? "bg-white text-black cursor-default hover:bg-slate-100 border-[0.1px] border-black"
                        : isRecommended
                          ? "bg-white text-black hover:bg-slate-100"
                          : "bg-black text-white hover:bg-slate-900"
                    )}
                    onClick={() => !isOwner && onSubscribe(plan.id, billingCycle)}
                    disabled={
                      subscribingPlanId === plan.id ||
                      (billingCycle === "YEARLY" && !isYearlyPossible && plan.price_monthly !== null) ||
                      isOwner ||
                      (plan.id === activePlanId && billingCycle === activeBillingCycle) ||
                      (isLoggedIn && userRole === 'DEVELOPER' && !isOwner)
                    }
                  >
                    {subscribingPlanId === plan.id ? (
                      <Loader2 className="w-5 mr-2 animate-spin" />
                    ) : isLoggedIn && userRole === 'DEVELOPER' ? (
                      "Customer Account Required"
                    ) : plan.id === activePlanId && billingCycle === activeBillingCycle ? (
                      "Current Subscription"
                    ) : (
                      "Subscribe"
                    )}
                  </Button>
                )}
                <p className={cn("text-center text-[11px] font-semibold tracking-wide w-full", isRecommended ? "text-slate-400" : "text-slate-500")}>
                  {subtext}
                </p>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
