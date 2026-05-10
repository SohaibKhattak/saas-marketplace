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
import { PricingSection } from "@/components/marketplace/pricing-section";
import { cn } from "@/lib/utils";



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
  site: { site_url: string; subdomain: string } | null;
  developer: {
    user: { id: string; full_name: string; avatarUrl: string | null };
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

          <div className="mt-4 grid gap-12 lg:grid-cols-1">
            {/* Main Content */}
            <div className="space-y-12">
              {/* Product Header */}
              <div className="flex flex-col sm:flex-row items-start gap-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                {product.logoUrl ? (
                  <div className="h-32 w-32 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm ring-4 ring-slate-50/50">
                    <img src={product.logoUrl} alt={product.name} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                    <Package className="h-10 w-10 text-slate-300" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 bg-primary/5 hover:bg-primary/5 rounded-full">{product.category}</Badge>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Now
                    </div>
                  </div>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl text-slate-900 mb-3">
                    {product.name}
                  </h1>
                  <p className="text-lg text-slate-500 font-semibold mb-6 flex items-center gap-2">
                    Crafted by <span className="text-slate-900 font-bold hover:text-primary transition-colors cursor-pointer border-b-2 border-slate-100 pb-0.5">{product.developer.user.full_name}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2.5 bg-yellow-50/50 px-4 py-2 rounded-2xl border border-yellow-100 shadow-sm">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-4 w-4", s <= Math.round(product.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} />
                        ))}
                      </div>
                      <div className="h-4 w-px bg-yellow-200" />
                      <span className="text-sm font-black text-yellow-700">
                        {product.avgRating.toFixed(1)} <span className="text-yellow-600/60 font-bold ml-1">({product._count.reviews})</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                            <div className="h-full w-full bg-gradient-to-br from-slate-300 to-slate-400" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                        {product._count.subscriptions.toLocaleString()}+ users
                      </span>
                    </div>
                  </div>

                  {product.site && (
                    <div className="mt-8">
                      <a
                        href={product.site.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all px-4 py-2.5 rounded-xl shadow-lg shadow-slate-900/10"
                      >
                        Visit Official Site
                        <div className="p-0.5 rounded-md bg-white/10 group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-12 lg:grid-cols-2">
                {/* Description Column */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 bg-primary rounded-full" />
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">About {product.name}</h2>
                    </div>
                    {product.shortDescription && (
                      <p className="text-xl font-bold text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        "{product.shortDescription}"
                      </p>
                    )}
                    <div className="whitespace-pre-wrap text-base text-slate-500 leading-8 font-medium">
                      {product.description}
                    </div>
                  </div>

                  {/* Screenshots */}
                  {product.screenshots.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-primary rounded-full" />
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">Product Interface</h2>
                      </div>
                      <div className="grid gap-4">
                        {product.screenshots.map((url, i) => (
                          <div key={i} className="group relative overflow-hidden rounded-3xl border border-slate-200 transition-all duration-500 hover:border-primary/20 hover:shadow-2xl">
                            <img
                              src={url}
                              alt={`Screenshot ${i + 1}`}
                              className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px]">
                              <Button variant="secondary" size="sm" className="font-semibold rounded-lg shadow-xl">Expand View</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reviews Column */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 bg-primary rounded-full" />
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">User Reviews</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {product.avgRating.toFixed(1)} rating
                    </div>
                  </div>

                  {/* Review Form */}
                  {user && user.role === "CUSTOMER" && reviewLoaded && !userReview && (
                    <Card className="overflow-hidden border border-slate-200 rounded-3xl shadow-sm">
                      <CardContent className="p-8 space-y-6">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-slate-900 leading-none">Share your experience</h3>
                          <p className="text-sm text-slate-500 font-medium">Your feedback drives the community.</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
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
                                  className="transition-transform active:scale-90"
                                >
                                  <Star
                                    className={`h-8 w-8 cursor-pointer transition-all ${isFilled
                                      ? "fill-yellow-400 text-yellow-400 scale-110"
                                      : "text-slate-200 hover:text-yellow-400/30"
                                      }`}
                                  />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <Textarea
                          placeholder="What did you love? Any suggestions?"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={4}
                          className="resize-none focus-visible:ring-primary/10 border-slate-200 rounded-2xl p-4 font-medium"
                        />

                        {reviewError && (
                          <p className="text-sm font-bold text-destructive px-2">
                            {reviewError}
                          </p>
                        )}

                        <div className="flex justify-end">
                          <Button
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting}
                            className="px-6 h-10 text-sm font-semibold rounded-xl shadow-lg shadow-primary/10"
                          >
                            {reviewSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Post Review"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {user && userReview && (
                    <Card className="overflow-hidden border border-primary/20 rounded-3xl bg-primary/5 shadow-xl shadow-primary/5">
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black uppercase text-lg shadow-lg shadow-primary/20">
                              {user.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 leading-none">Your Honest Feedback</h4>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1.5">Published</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < userReview.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/5 h-10 px-4 text-xs font-black uppercase tracking-widest"
                              onClick={handleDeleteReview}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                        {userReview.comment && (
                          <p className="text-base text-slate-700 leading-relaxed font-semibold italic bg-white/50 p-6 rounded-2xl border border-white/50">
                            "{userReview.comment}"
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* <div className="space-y-4">
                    {product.reviews.length > 0 ? (
                      product.reviews.map((review) => (
                        <div key={review.id} className="p-8 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 transition-all duration-300">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <span className="text-sm font-black text-slate-900">
                                  {review.customer.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 leading-none mb-1.5">{review.customer.fullName}</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-black text-slate-900">{review.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-base text-slate-600 leading-relaxed font-medium">
                              "{review.comment}"
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 px-8 rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50/50">
                         <Star className="h-12 w-12 text-slate-200 mb-4" />
                         <p className="text-xl font-black text-slate-900">No reviews yet</p>
                         <p className="text-sm text-slate-500 font-medium mt-2">Help others by being the first to review!</p>
                      </div>
                    )}
                  </div> */}
                </div>
              </div>

              {/* Pricing Section - Full Width at the bottom */}
              <div className="pt-12 border-t border-slate-100">
                {checkoutError && (
                  <div className="mb-8 rounded-2xl bg-destructive/5 border border-destructive/10 p-4 text-sm font-bold text-destructive flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    {checkoutError}
                  </div>
                )}
                <PricingSection
                  plans={product.pricingPlans}
                  onSubscribe={handleSubscribe}
                  subscribingPlanId={subscribing}
                  isLoggedIn={!!user}
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
