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
import { Star, Check, ArrowLeft, Loader2 } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number | null;
  features: string[];
  trialDays: number;
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
  slug: string;
  shortDescription: string | null;
  description: string;
  category: string;
  tags: string[];
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
  const slug = params.slug as string;
  const { user } = useAuthStore();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewLoaded, setReviewLoaded] = useState(false);

  const { accessToken } = useAuthStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: ProductDetail }>(`/products/catalog/${slug}`);
        setProduct(res.data);
      } catch {
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Check if user already reviewed this product
  useEffect(() => {
    if (!product || !user || !accessToken) return;
    api.get<{ data: Review | null }>(`/products/${product.id}/reviews/me`, { token: accessToken })
      .then((res) => { if (res.data) setUserReview(res.data); })
      .catch(() => {})
      .finally(() => setReviewLoaded(true));
  }, [product, user, accessToken]);

  async function handleSubmitReview() {
    if (!product || !accessToken) return;
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
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "Product not found"}</p>
        <Link href="/marketplace">
          <Button variant="outline">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">Saasifyy</Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace" className="text-sm font-medium">Marketplace</Link>
            {user ? (
              <Link href={user.role === "ADMIN" ? "/admin/analytics" : user.role === "DEVELOPER" ? "/developer/products" : "/customer/subscriptions"}>
                <Button size="sm" variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
                <Link href="/register"><Button size="sm">Get started</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Link href="/marketplace" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="mt-4 grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Header */}
              <div className="flex items-start gap-4">
                {product.logoUrl && (
                  <img src={product.logoUrl} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                )}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                  <p className="mt-1 text-muted-foreground">
                    by {product.developer.user.fullName}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.avgRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({product._count.reviews} review{product._count.reviews !== 1 ? "s" : ""})
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product._count.subscriptions} subscriber{product._count.subscriptions !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{product.category}</Badge>
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  {product.site && (
                    <div className="mt-3">
                      <a
                        href={product.site.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        Visit Product Site &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold">About</h2>
                {product.shortDescription && (
                  <p className="mt-2 text-lg text-muted-foreground">{product.shortDescription}</p>
                )}
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                  {product.description}
                </div>
              </div>

              {/* Screenshots */}
              {product.screenshots.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold">Screenshots</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {product.screenshots.map((url, i) => (
                      <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="rounded-lg border object-cover" />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div>
                <h2 className="text-xl font-semibold">Reviews</h2>

                {/* Review Form */}
                {user && user.role === "CUSTOMER" && reviewLoaded && !userReview && (
                  <Card className="mt-4">
                    <CardContent className="pt-4 space-y-3">
                      <p className="text-sm font-medium">Leave a review</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button key={i} type="button" onClick={() => setReviewRating(i + 1)}>
                            <Star className={`h-5 w-5 cursor-pointer ${i < reviewRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Share your experience (optional)"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={3}
                      />
                      {reviewError && (
                        <p className="text-sm text-destructive">{reviewError}</p>
                      )}
                      <Button onClick={handleSubmitReview} disabled={reviewSubmitting} size="sm">
                        {reviewSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Review"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* User's existing review */}
                {user && userReview && (
                  <Card className="mt-4 border-primary/30">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">Your review</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < userReview.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={handleDeleteReview}>
                            Delete
                          </Button>
                        </div>
                      </div>
                      {userReview.comment && (
                        <p className="mt-2 text-sm text-muted-foreground">{userReview.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {product.reviews.length === 0 && !userReview ? (
                  <p className="mt-4 text-sm text-muted-foreground">No reviews yet</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {product.reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{review.customer.fullName}</span>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing Sidebar */}
            <div className="space-y-4">
              {checkoutError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {checkoutError}
                </div>
              )}
              {product.pricingPlans.map((plan) => (
                <Card key={plan.id} className="sticky top-4">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">
                        ${plan.priceMonthly}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      {plan.priceYearly && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          or ${plan.priceYearly}/year
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {plan.trialDays > 0 && (
                      <p className="mb-3 text-sm font-medium text-green-600 dark:text-green-400">
                        {plan.trialDays}-day free trial
                      </p>
                    )}
                    <ul className="space-y-2">
                      {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id, "MONTHLY")}
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id
                        ? "Redirecting..."
                        : user
                          ? `Subscribe — $${plan.priceMonthly}/mo`
                          : "Sign in to Subscribe"}
                    </Button>
                    {plan.priceYearly && (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleSubscribe(plan.id, "YEARLY")}
                        disabled={subscribing === plan.id}
                      >
                        {subscribing === plan.id
                          ? "..."
                          : `Yearly — $${plan.priceYearly}/yr`}
                      </Button>
                    )}
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
