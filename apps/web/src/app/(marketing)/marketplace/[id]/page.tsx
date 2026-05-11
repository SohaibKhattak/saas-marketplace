"use client";

import { useState, useEffect, useRef } from "react";
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
import { Star, Check, ArrowLeft, Loader2, Package, ArrowRight, Pencil, Trash2 } from "lucide-react";
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
  customer: { id: string; fullName: string; avatarUrl: string | null };
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
  isSubscribed: boolean;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "positive" | "negative">("all");
  const [isEditingUserReview, setIsEditingUserReview] = useState(false);
  const [editUserRating, setEditUserRating] = useState(0);
  const [editUserComment, setEditUserComment] = useState("");
  const [reviewUpdating, setReviewUpdating] = useState(false);
  const fetchTabRef = useRef(activeTab);

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

  const fetchReviews = async (tab: "all" | "positive" | "negative") => {
    fetchTabRef.current = tab;
    setReviewsLoading(true);
    try {
      const res = await api.get<{ data: Review[] }>(`/products/${id}/reviews?type=${tab}`);
      if (fetchTabRef.current === tab) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      if (fetchTabRef.current === tab) {
        setReviewsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (product) {
      fetchReviews(activeTab);
    }
  }, [product, activeTab]);

  async function handleSubmitReview() {
    if (!product || !accessToken) return;
    if (reviewRating === 0) {
      setReviewError("Please select a rating");
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError("Please provide a comment for your review");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await api.post<{ data: Review }>(
        `/products/${product.id}/reviews`,
        { rating: reviewRating, comment: reviewComment },
        { token: accessToken }
      );
      setUserReview(res.data);
      // Refresh reviews if on "all" or matching tab
      if (activeTab === "all" || (activeTab === "positive" && res.data.rating >= 3) || (activeTab === "negative" && res.data.rating < 3)) {
        setReviews((prev) => [res.data, ...prev]);
      }
      // Update counts
      setProduct((prev) => prev ? {
        ...prev,
        _count: { ...prev._count, reviews: (prev._count?.reviews || 0) + 1 },
      } : prev);
      setReviewComment("");
      setReviewRating(0);
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleDeleteReview(reviewId?: string) {
    const idToDelete = reviewId || userReview?.id;
    if (!idToDelete || !accessToken) return;
    try {
      await api.delete(`/products/reviews/${idToDelete}`, { token: accessToken });
      setReviews((prev) => prev.filter((r) => r.id !== idToDelete));
      setProduct((prev) => prev ? {
        ...prev,
        _count: { ...prev._count, reviews: Math.max(0, prev._count.reviews - 1) },
      } : prev);
      if (userReview?.id === idToDelete) {
        setUserReview(null);
        setIsEditingUserReview(false);
      }
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Failed to delete review");
    }
  }

  async function handleUpdateReview(reviewId: string, rating: number, comment: string) {
    if (!accessToken) return;
    setReviewUpdating(true);
    try {
      const res = await api.patch<{ data: Review }>(
        `/products/reviews/${reviewId}`,
        { rating, comment },
        { token: accessToken }
      );
      const updatedReview = res.data;
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updatedReview : r)));
      if (userReview?.id === reviewId) {
        setUserReview(updatedReview);
        setIsEditingUserReview(false);
      }
      return updatedReview;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setReviewUpdating(false);
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

  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const paginatedReviews = reviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);

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
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("h-4 w-4", s <= Math.round(product.avgRating) ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} />
                        ))}
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {product.avgRating.toFixed(1)} <span className="text-slate-400 font-bold ml-1">({product._count.reviews})</span>
                      </span>
                    </div>

                    {product._count.subscriptions >= 50 && (
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
                    )}
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

              <div className="space-y-24">
                {/* About & Screenshots */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  {/* Left: Content */}
                  <div className="lg:col-span-7 space-y-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-primary rounded-full" />
                        <h2 className="text-2xl font-black tracking-tight text-slate-900">About {product.name}</h2>
                      </div>
                      <div className="whitespace-pre-wrap text-lg text-slate-600 leading-relaxed font-medium">
                        {product.description}
                      </div>
                    </div>

                    {/* <div className="p-10 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Check className="h-32 w-32" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-black mb-8">Core Features</h3>
                        <div className="grid sm:grid-cols-2 gap-6">
                          {Array.from(new Set(product.pricingPlans.flatMap(p => p.features))).slice(0, 8).map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                              <div className="h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                <Check className="h-3.5 w-3.5 text-white" />
                              </div>
                              <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Right: Screenshots */}
                  <div className="lg:col-span-5">
                    {product.screenshots.length > 0 && (
                      <div className="space-y-8 sticky top-24">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-1.5 bg-primary rounded-full" />
                          <h2 className="text-2xl font-black tracking-tight text-slate-900">Product Interface</h2>
                        </div>
                        <div className="grid gap-6">
                          {product.screenshots.slice(0, 3).map((url, i) => (
                            <div key={i} className="group relative overflow-hidden rounded-[2rem] border border-slate-200 transition-all duration-500 hover:border-primary/20 hover:shadow-2xl">
                              <img src={url} alt={`Screenshot ${i + 1}`} className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center backdrop-blur-[2px]">
                                <Button variant="secondary" size="sm" className="font-semibold rounded-lg shadow-xl">Expand View</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Section */}
                <div id="pricing-plans" className="pt-24 border-t border-slate-100">
                  <div className="space-y-12">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                      <h2 className="text-4xl font-black tracking-tight text-slate-900">Choose your plan</h2>
                      <p className="text-slate-500 font-medium">Simple, transparent pricing that grows with you.</p>
                    </div>
                    <PricingSection
                      plans={product.pricingPlans}
                      onSubscribe={handleSubscribe}
                      subscribingPlanId={subscribing}
                      isLoggedIn={!!user}
                    />
                  </div>
                </div>

                {/* Reviews Section - Full Width */}
                <div className="pt-24 border-t border-slate-100 pb-24">
                  <div className="max-w-4xl mx-auto space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-1.5 bg-primary rounded-full" />
                          <h2 className="text-3xl font-black tracking-tight text-slate-900">Customer Feedback</h2>
                        </div>
                        <p className="text-slate-500 font-medium text-lg">See what the community is saying about {product.name}</p>
                      </div>
                      <div className="flex items-center gap-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="text-center">
                          <div className="text-3xl font-black text-slate-900 leading-none">{product.avgRating.toFixed(1)}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Rating</div>
                        </div>
                        <div className="h-10 w-px bg-slate-100" />
                        <div className="text-center">
                          <div className="text-3xl font-black text-slate-900 leading-none">{product._count.reviews}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Reviews</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl w-fit">
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'positive', label: 'Positive' },
                        { id: 'negative', label: 'Critical' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                          className={cn(
                            "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                            activeTab === tab.id
                              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                              : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                          )}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-8">
                      {/* Review Form */}
                      {user && user.role === "CUSTOMER" && reviewLoaded && !userReview && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          {product.isSubscribed ? (
                            <Card className="overflow-hidden border border-slate-200 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-100/50">
                              <CardHeader className="p-10 pb-4">
                                <h3 className="text-2xl font-black text-slate-900">Share your thoughts</h3>
                                <p className="text-sm text-slate-500 font-medium">Both rating and comment are mandatory to ensure quality feedback.</p>
                              </CardHeader>
                              <CardContent className="p-10 pt-4 space-y-10">
                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Rating</label>
                                  <div className="flex gap-2.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-transform active:scale-90"
                                      >
                                        <Star
                                          className={cn(
                                            "h-10 w-10 transition-all duration-200",
                                            star <= (hoverRating || reviewRating)
                                              ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                                              : "text-slate-200 hover:text-slate-300"
                                          )}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Comment</label>
                                  <Textarea
                                    placeholder="What was your experience like? What did you love most?"
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="min-h-[150px] p-8 rounded-3xl border-slate-200 focus-visible:ring-primary/10 resize-none font-medium text-slate-600 text-lg"
                                  />
                                </div>

                                {reviewError && (
                                  <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest text-center animate-shake">
                                    {reviewError}
                                  </div>
                                )}

                                <div className="flex justify-end pt-4">
                                  <Button
                                    onClick={handleSubmitReview}
                                    disabled={reviewSubmitting}
                                    className="px-12 h-14 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                                  >
                                    {reviewSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Submit Review"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="p-12 rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50 text-center space-y-6">
                              <div className="h-16 w-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                                <Star className="h-8 w-8 text-slate-300" />
                              </div>
                              <div className="space-y-2">
                                <h3 className="font-black text-2xl text-slate-900">Verified Reviews Only</h3>
                                <p className="text-sm text-slate-500 font-semibold max-w-sm mx-auto leading-relaxed">
                                  To ensure the highest quality community feedback, only active subscribers can post reviews.
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                className="rounded-xl border-slate-200 font-black text-xs uppercase tracking-widest px-8"
                                onClick={() => document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth' })}
                              >
                                View Pricing Plans
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Current User Review Card */}
                      {user && userReview && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <Card className="overflow-hidden border border-primary/20 rounded-[1.5rem] bg-primary/5 shadow-xl shadow-primary/5">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black uppercase text-sm shadow-lg shadow-primary/20">
                                    {user.fullName?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 text-sm leading-none">Your Feedback</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Verified Subscriber</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  {!isEditingUserReview && (
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => {
                                          setIsEditingUserReview(true);
                                          setEditUserRating(userReview.rating);
                                          setEditUserComment(userReview.comment || "");
                                        }}
                                        className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteReview()}
                                        className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={cn(
                                          "h-3 w-3", 
                                          i < (isEditingUserReview ? editUserRating : userReview.rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-200",
                                          isEditingUserReview && "cursor-pointer hover:scale-110 transition-transform"
                                        )} 
                                        onClick={() => isEditingUserReview && setEditUserRating(i + 1)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {isEditingUserReview ? (
                                <div className="space-y-4">
                                  <Textarea
                                    value={editUserComment}
                                    onChange={(e) => setEditUserComment(e.target.value)}
                                    className="min-h-[100px] p-4 rounded-xl border-slate-200 focus-visible:ring-primary/10 resize-none font-medium text-slate-600 text-sm bg-white"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => setIsEditingUserReview(false)}
                                      className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg"
                                    >
                                      Cancel
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleUpdateReview(userReview.id, editUserRating, editUserComment)}
                                      className="h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg"
                                      disabled={reviewUpdating}
                                    >
                                      {reviewUpdating ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Updating...</> : "Save Changes"}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm italic text-sm text-slate-700 leading-relaxed font-medium">
                                  "{userReview.comment}"
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      {/* Review List */}
                      <div className={`${reviewsLoading ? "flex items-center justify-center" : "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                        {reviewsLoading ? (
                          <div className="py-24 text-center space-y-6 animate-in fade-in duration-500">
                            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto">
                              <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                            </div>
                            <p className="text-slate-500 font-medium text-center">Syncing feedback...</p>
                          </div>
                        ) : paginatedReviews.length > 0 ? (
                          paginatedReviews.map((review, i) => (
                            <ReviewCard 
                              key={review.id} 
                              review={review} 
                              index={i} 
                              currentUserId={user?.userId}
                              onUpdate={handleUpdateReview}
                              onDelete={handleDeleteReview}
                            />
                          ))
                        ) : (
                          <div className="py-24 text-center space-y-6">
                            <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                              <Package className="h-10 w-10" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-slate-900 font-black text-xl">No {activeTab} reviews found</p>
                              <p className="text-slate-500 font-medium">Be the first to share your experience!</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-12">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: document.getElementById('reviews-start')?.offsetTop || 0, behavior: 'smooth' }); }}
                            className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 border-slate-200"
                          >
                            Previous
                          </Button>
                          <div className="flex items-center gap-2">
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <button
                                key={i}
                                onClick={() => { setCurrentPage(i + 1); window.scrollTo({ top: document.getElementById('reviews-start')?.offsetTop || 0, behavior: 'smooth' }); }}
                                className={cn(
                                  "h-10 w-10 rounded-xl text-[11px] font-black transition-all",
                                  currentPage === i + 1
                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                    : "text-slate-400 hover:bg-slate-100"
                                )}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: document.getElementById('reviews-start')?.offsetTop || 0, behavior: 'smooth' }); }}
                            className="rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-6 border-slate-200"
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
function ReviewCard({ 
  review, 
  index 
}: { 
  review: Review; 
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const comment = review.comment || "";
  const isLong = comment.length > 150;
  const displayComment = isLong && !isExpanded ? `${comment.substring(0, 150)}...` : comment;

  return (
    <div 
      className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 group flex flex-col h-full" 
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 group-hover:border-primary/20 transition-colors">
            {review.customer.avatarUrl ? (
              <img src={review.customer.avatarUrl} alt={review.customer.fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-black text-slate-400 uppercase">{review.customer.fullName.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 text-xs leading-none truncate max-w-[100px]">{review.customer.fullName}</h4>
            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">
              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100 h-fit">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={cn(
                "h-2.5 w-2.5", 
                i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <p className="text-slate-600 font-medium leading-relaxed text-[13px]">
          {displayComment}
        </p>
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-primary text-[11px] font-bold mt-2 hover:underline focus:outline-none w-fit"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
    </div>
  );
}
