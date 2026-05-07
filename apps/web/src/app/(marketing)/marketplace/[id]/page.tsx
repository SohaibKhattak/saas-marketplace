"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Star, Check, ArrowLeft, Loader2, Package, ArrowRight } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  trial_days: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { fullName: string; avatarUrl: string | null };
}

interface ProductDetail {
  id: string;
  name: string;
  // slug: string;
  shortDescription: string | null;
  description: string;
  category: string;
  // tags: string[];
  logoUrl: string | null;
  screenshots: string[];
  avgRating: number;
  totalReviews: number;
  totalSubscribers: number;
  publishedAt: string;
  site: { siteUrl: string; subdomain: string } | null;
  developer: {
    user: { id: string; fullName: string; avatarUrl: string | null };
  };
  pricingPlans: PricingPlan[];
  reviews: Review[];
  _count: { subscriptions: number; reviews: number };
}

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewLoaded, setReviewLoaded] = useState(false);

  const { accessToken } = useAuthStore();
  console.log(product)
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: ProductDetail }>(`/products/catalog/${id}`);
        setProduct(res.data);
      } catch {
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Check if user already reviewed this product
  useEffect(() => {
    if (!product || !user || !accessToken) return;
    api.get<{ data: Review | null }>(`/products/${product.id}/reviews/me`, { token: accessToken })
      .then((res) => { if (res.data) setUserReview(res.data); })
      .catch(() => { })
      .finally(() => setReviewLoaded(true));
  }, [product, user, accessToken]);

  async function handleSubmitReview() {
    if (!product || !accessToken) return;
    if (reviewRating === 0) {
      setReviewError("Please select a rating");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await api.post<{ data: Review }>(
        `/products/${product.id}/reviews`,
        { rating: reviewRating, comment: reviewComment || undefined },
        { token: accessToken }
      );
      setUserReview(res.data);
      // Add to local reviews list and update rating
      setProduct((prev) => prev ? {
        ...prev,
        reviews: [res.data, ...prev.reviews],
        _count: { ...prev._count, reviews: prev._count.reviews + 1 },
      } : prev);
      setReviewComment("");
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleDeleteReview() {
    if (!userReview || !accessToken) return;
    try {
      await api.delete(`/products/reviews/${userReview.id}`, { token: accessToken });
      setProduct((prev) => prev ? {
        ...prev,
        reviews: prev.reviews.filter((r) => r.id !== userReview.id),
        _count: { ...prev._count, reviews: prev._count.reviews - 1 },
      } : prev);
      setUserReview(null);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to delete review");
    }
  }

  async function handleSubscribe(planId: string, billingCycle: "MONTHLY" | "YEARLY") {
    if (!user || !accessToken) {
      window.location.href = "/login";
      return;
    }
    setSubscribing(planId);
    try {
      const res = await api.post<{ data: { url: string } }>(
        "/subscriptions/checkout",
        { pricingPlanId: planId, billingCycle },
        { token: accessToken }
      );
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setCheckoutError(err instanceof ApiError ? err.message : "Failed to start checkout");
      setSubscribing(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{error || "Product not found"}</p>
        <Link href="/marketplace">
          <Button variant="outline">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black text-white">S</div>
            <span>Saasifyy</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Marketplace</Link>
            <div className="h-4 w-px bg-gray-200" />
            {user ? (
              <Link href={user.role === "ADMIN" ? "/admin/analytics" : user.role === "DEVELOPER" ? "/developer/products" : "/customer/subscriptions"}>
                <Button size="sm" variant="ghost" className="font-semibold">Dashboard</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login"><Button variant="ghost" size="sm" className="font-medium">Sign in</Button></Link>
                <Link href="/register"><Button size="sm" className="font-bold shadow-md shadow-primary/10">Get started</Button></Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Link href="/marketplace" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="mt-4 grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {product.logoUrl ? (
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-muted bg-white p-2 shadow-sm">
                    <img src={product.logoUrl} alt={product.name} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-muted bg-muted/30">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20 bg-primary/5">{product.category}</Badge>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• Updated recently</span>
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-slate-900 mb-2">
                    {product.name}
                  </h1>
                  <p className="text-lg text-gray-600 font-medium mb-4 flex items-center gap-2">
                    by <span className="text-foreground font-bold hover:underline cursor-pointer">{product.developer.user.fullName}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100 shadow-sm">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-base font-bold text-yellow-700">{product.avgRating.toFixed(1)}</span>
                      </div>
                      <div className="h-3 w-px bg-yellow-200" />
                      <span className="text-xs font-semibold text-yellow-600 uppercase tracking-tight">
                        {product._count.reviews} review{product._count.reviews !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-500 font-semibold tracking-tight text-sm">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      {product._count.subscriptions} active subscriber{product._count.subscriptions !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {product.site && (
                    <div className="mt-6">
                      <a
                        href={product.site.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors bg-primary/5 px-4 py-2 rounded-full border border-primary/10"
                      >
                        Visit Official Website <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Product Overview</h2>
                {product.shortDescription && (
                  <p className="text-xl font-medium text-slate-600 leading-relaxed border-l-4 border-primary/20 pl-4 py-1 bg-primary/5 rounded-r-lg">
                    {product.shortDescription}
                  </p>
                )}
                <div className="whitespace-pre-wrap text-base text-slate-600 leading-7">
                  {product.description}
                </div>
              </div>

              {/* Screenshots */}
              {product.screenshots.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Screenshots</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {product.screenshots.map((url, i) => (
                      <div key={i} className="group relative overflow-hidden rounded-xl border-2 border-muted transition-all hover:border-primary/30 hover:shadow-xl">
                        <img
                          src={url}
                          alt={`Screenshot ${i + 1}`}
                          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                          <Button variant="secondary" size="sm" className="font-bold">View Fullsize</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">Community Reviews</h2>
                  <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-full text-sm font-semibold text-slate-600">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {product.avgRating.toFixed(1)} / 5.0
                  </div>
                </div>

                {/* Review Form */}
                {user && user.role === "CUSTOMER" && reviewLoaded && !userReview && (
                  <Card className="mt-4 overflow-hidden border">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-semibold text-slate-900 leading-none">Share your experience</h3>
                        <p className="text-sm text-slate-500">Your feedback helps other users and the developer.</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const starValue = i + 1;
                            const isFilled = hoverRating ? starValue <= hoverRating : starValue <= reviewRating;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setReviewRating(starValue)}
                                onMouseEnter={() => setHoverRating(starValue)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="transition-transform active:scale-95"
                              >
                                <Star
                                  className={`h-6 w-6 cursor-pointer transition-all ${isFilled
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-slate-200 hover:text-yellow-400/50"
                                    }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Textarea
                          placeholder="Tell us what you think..."
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          className="resize-none focus-visible:ring-primary/20 border-slate-200"
                        />
                      </div>

                      {reviewError && (
                        <p className="text-sm font-medium text-destructive">
                          {reviewError}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <Button
                          onClick={handleSubmitReview}
                          disabled={reviewSubmitting}
                          className="px-6 font-bold"
                        >
                          {reviewSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Submit Review"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {user && userReview && (
                  <Card className="mt-4 overflow-hidden border bg-slate-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold uppercase text-sm">
                            {user.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 leading-none">Your Review</h4>
                            <p className="text-xs text-slate-500 mt-1">Thank you for your feedback!</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < userReview.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-8 px-2 text-xs font-semibold"
                            onClick={handleDeleteReview}
                          >
                            Delete Review
                          </Button>
                        </div>
                      </div>
                      {userReview.comment && (
                        <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-4">
                          "{userReview.comment}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* {product.reviews.length === 0 && !userReview ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-100 bg-slate-50/30">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                       <Star className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-lg font-bold text-slate-900">No reviews yet</p>
                    <p className="text-sm text-slate-500 mt-1">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {product.reviews.map((review) => (
                      <Card key={review.id} className="border-none shadow-sm bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                                <span className="text-sm font-bold text-primary">
                                  {review.customer.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 leading-none mb-1">{review.customer.fullName}</h4>
                                <p className="text-xs text-slate-400 font-medium">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-100 pl-4">
                              "{review.comment}"
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )} */}
              </div>
            </div>

            {/* Pricing Sidebar */}
            <div className="space-y-4">
              {checkoutError && (
                <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
                  {checkoutError}
                </div>
              )}
              {product.pricingPlans.map((plan) => (
                <Card key={plan.id} className="sticky top-4 overflow-hidden border-2 transition-all hover:border-primary/20 shadow-lg shadow-black/5">
                  <div className="absolute top-0 right-0 p-2">
                    {plan.trial_days > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] uppercase font-bold">
                        {plan.trial_days} Day Trial
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold tracking-tight">{plan.name}</CardTitle>
                    <div className="mt-4 flex flex-col gap-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold tracking-tight text-foreground">
                          ${plan.price_monthly}
                        </span>
                        <span className="text-sm font-medium text-gray-500">/ month</span>
                      </div>
                      {plan.price_yearly && (
                        <div className="text-sm text-gray-500 font-medium">
                          or <span className="text-primary font-semibold">${plan.price_yearly}</span> billed yearly
                          <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                            Save {(100 - (plan.price_yearly / (plan.price_monthly * 12)) * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <Separator className="mb-6 opacity-50" />
                    <ul className="space-y-3">
                      {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                          <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 bg-muted/30 pt-6">
                    <Button
                      className="w-full h-11 text-base font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                      onClick={() => handleSubscribe(plan.id, "MONTHLY")}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        : user
                          ? `Start Monthly Subscription`
                          : "Sign in to Subscribe"}
                    </Button>
                    {plan.price_yearly && (
                      <Button
                        className="w-full h-11 text-base font-bold transition-all border-2 hover:bg-muted"
                        variant="outline"
                        onClick={() => handleSubscribe(plan.id, "YEARLY")}
                        disabled={subscribing === plan.id}
                      >
                        {subscribing === plan.id
                          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> ...</>
                          : `Subscribe Yearly — $${plan.price_yearly}/yr`}
                      </Button>
                    )}
                    <p className="text-center text-[10px] text-gray-400 mt-2">
                      Secure payment via Stripe. Cancel anytime.
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
