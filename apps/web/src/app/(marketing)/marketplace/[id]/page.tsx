'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Star, Check, ArrowLeft, Loader2, Package, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { PricingSection } from '@/components/marketplace/pricing-section';
import { ImageCarousel } from '@/components/marketplace/image-carousel';
import { ReviewCard } from '@/components/marketplace/review-card';
import { cn } from '@/lib/utils';

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
  shortDescription: string | null;
  description: string;
  category: string;
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
  isOwner: boolean;
  activePlanId: string | null;
  _count: { subscriptions: number; reviews: number };
}

export default function ProductPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [reviewLoaded, setReviewLoaded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'positive' | 'negative'>('all');
  const [isEditingUserReview, setIsEditingUserReview] = useState(false);
  const [editUserRating, setEditUserRating] = useState(0);
  const [editUserComment, setEditUserComment] = useState('');
  const [reviewUpdating, setReviewUpdating] = useState(false);
  const fetchTabRef = useRef(activeTab);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<{ data: ProductDetail }>(`/products/catalog/${id}`);
        setProduct(res.data);
      } catch {
        setError('Product not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!product || !user || !accessToken) return;
    api.get<{ data: Review | null }>(`/products/${product.id}/reviews/me`, { token: accessToken })
      .then((res) => {
        if (res.data) setUserReview(res.data);
      })
      .catch(() => {})
      .finally(() => setReviewLoaded(true));
  }, [product, user, accessToken]);

  const fetchReviews = async (tab: 'all' | 'positive' | 'negative') => {
    fetchTabRef.current = tab;
    setReviewsLoading(true);
    try {
      const res = await api.get<{ data: Review[] }>(`/products/${id}/reviews?type=${tab}`);
      if (fetchTabRef.current === tab) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
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
      setReviewError('Please select a rating');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please provide a comment for your review');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await api.post<{ data: Review }>(
        `/products/${product.id}/reviews`,
        { rating: reviewRating, comment: reviewComment },
        { token: accessToken }
      );
      setUserReview(res.data);
      if (activeTab === 'all' || (activeTab === 'positive' && res.data.rating >= 3) || (activeTab === 'negative' && res.data.rating < 3)) {
        setReviews((prev) => [res.data, ...prev]);
      }
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              _count: { ...prev._count, reviews: (prev._count?.reviews || 0) + 1 },
            }
          : prev
      );
      setReviewComment('');
      setReviewRating(0);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review');
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
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              _count: { ...prev._count, reviews: Math.max(0, prev._count.reviews - 1) },
            }
          : prev
      );
      if (userReview?.id === idToDelete) {
        setUserReview(null);
        setIsEditingUserReview(false);
      }
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to delete review');
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

  async function handleSubscribe(planId: string, billingCycle: 'MONTHLY' | 'YEARLY') {
    if (!user || !accessToken) {
      window.location.href = '/login';
      return;
    }
    setSubscribing(planId);
    try {
      const res = await api.post<{ data: { url: string } }>(
        '/subscriptions/checkout',
        { pricingPlanId: planId, billingCycle },
        { token: accessToken }
      );
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Failed to start checkout');
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
        <p className="text-gray-500">{error || 'Product not found'}</p>
        <Link href="/marketplace">
          <Button variant="outline">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black text-white">S</div>
            <span className="text-gray-900">Marketplace</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              All Products
            </Link>
            <div className="h-4 w-px bg-gray-200" />
            {user ? (
              <Link href={user.role === 'ADMIN' ? '/admin/analytics' : user.role === 'DEVELOPER' ? '/developer/products' : '/customer/subscriptions'}>
                <Button size="sm" variant="ghost" className="font-semibold">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium">
                    Sign in
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Breadcrumb */}
          <Link href="/marketplace" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium mb-8 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Products
          </Link>

          <div className="space-y-20">
            {/* Product Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Left: Logo & Info */}
              <div className="space-y-8">
                {/* Logo */}
                {product.logoUrl ? (
                  <div className="h-32 w-32 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center shadow-sm">
                    <img src={product.logoUrl} alt={product.name} className="h-full w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                    <Package className="h-10 w-10 text-gray-300" />
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-gray-900 text-white border-none">
                      {product.category}
                    </Badge>
                  </div>

                  <div>
                    <h1 className="text-5xl font-black text-gray-900 leading-tight mb-3">
                      {product.name}
                    </h1>
                    <p className="text-lg text-gray-600 font-medium">
                      By <span className="font-bold text-gray-900">{product.developer?.user?.full_name || 'Developer'}</span>
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              'h-5 w-5',
                              s <= Math.round(product.avgRating) ? 'fill-gray-900 text-gray-900' : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {(product.avgRating || 0).toFixed(1)}{' '}
                        <span className="text-sm text-gray-500 font-normal ml-1">({product._count?.reviews || 0} reviews)</span>
                      </span>
                    </div>

                    {product._count?.subscriptions > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                        <span className="text-sm font-bold text-gray-600">{(product._count?.subscriptions || 0).toLocaleString()}+ users</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-lg leading-relaxed font-medium mt-6">
                    {product.shortDescription || product.description}
                  </p>

                  {product.site && (
                    <div className="pt-4">
                      <a
                        href={product.site.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors shadow-lg group"
                      >
                        Visit Official Site
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Carousel */}
              {product.screenshots && product.screenshots.length > 0 && (
                <div className="sticky top-24">
                  <ImageCarousel images={product.screenshots} alt={product.name} />
                </div>
              )}
            </div>

            {/* Pricing Section */}
            <div id="pricing" className="pt-8 border-t-2 border-gray-200">
              <div className="space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                  <h2 className="text-4xl font-black text-gray-900">Choose your plan</h2>
                  <p className="text-gray-600 font-medium text-lg">Simple, transparent pricing that scales with your needs.</p>
                </div>
                <PricingSection
                  plans={product.pricingPlans}
                  onSubscribe={handleSubscribe}
                  subscribingPlanId={subscribing}
                  isLoggedIn={!!user}
                  isOwner={product.isOwner}
                  activePlanId={product.activePlanId}
                  userRole={user?.role}
                />
              </div>
            </div>

            {/* About Section */}
            <div className="pt-8 border-t-2 border-gray-200">
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-black text-gray-900 mb-6">About {product.name}</h2>
                  <div className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                    {product.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Section */}
            <div id="reviews" className="pt-8 border-t-2 border-gray-200">
              <div className="max-w-4xl mx-auto space-y-12">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-gray-900">Customer Reviews</h2>
                    <p className="text-gray-600 font-medium">Real feedback from {product.name} users</p>
                  </div>
                  <div className="flex items-center gap-8 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div className="text-center">
                      <div className="text-3xl font-black text-gray-900">{(product.avgRating || 0).toFixed(1)}</div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Overall Rating</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200" />
                    <div className="text-center">
                      <div className="text-3xl font-black text-gray-900">{product._count?.reviews || 0}</div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Total Reviews</div>
                    </div>
                  </div>
                </div>

                {/* Write Review Form */}
                {user && user.role === 'CUSTOMER' && reviewLoaded && !userReview && (
                  <div className="p-8 rounded-2xl border-2 border-gray-200 bg-gray-50">
                    {product.isSubscribed ? (
                      <div className="space-y-8">
                        <div>
                          <h3 className="text-2xl font-black text-gray-900">Share Your Experience</h3>
                          <p className="text-sm text-gray-600 font-medium mt-2">Help other users by sharing your honest feedback.</p>
                        </div>

                        {/* Rating */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Rating</label>
                          <div className="flex gap-3">
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
                                    'h-8 w-8 transition-colors',
                                    star <= (hoverRating || reviewRating)
                                      ? 'fill-gray-900 text-gray-900'
                                      : 'text-gray-300 hover:text-gray-400'
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Comment</label>
                          <Textarea
                            placeholder="What was your experience like? What features did you love most?"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            className="min-h-[120px] p-4 rounded-lg border-gray-200 focus-visible:ring-gray-400 resize-none text-base font-medium"
                          />
                        </div>

                        {reviewError && (
                          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider text-center">
                            {reviewError}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <Button
                            onClick={handleSubmitReview}
                            disabled={reviewSubmitting}
                            className="px-8 h-11 font-bold uppercase text-sm tracking-wider rounded-lg bg-gray-900 text-white hover:bg-black"
                          >
                            {reviewSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              'Submit Review'
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="h-12 w-12 rounded-xl bg-white border border-gray-300 flex items-center justify-center mx-auto">
                          <Star className="h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="font-black text-gray-900 text-lg">Subscribe to Review</h4>
                          <p className="text-sm text-gray-600 font-medium mt-1">Only active subscribers can leave reviews.</p>
                        </div>
                        <Button
                          variant="outline"
                          className="rounded-lg border-gray-300 font-bold text-xs uppercase tracking-wider"
                          onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                          View Pricing
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* User's Review */}
                {userReview && (
                  <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-white">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-gray-900">Your Feedback</h4>
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Verified Subscriber</p>
                        </div>
                        {!isEditingUserReview && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsEditingUserReview(true);
                                setEditUserRating(userReview.rating);
                                setEditUserComment(userReview.comment || '');
                              }}
                              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview()}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Rating */}
                      {!isEditingUserReview && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < userReview.rating
                                    ? 'fill-gray-900 text-gray-900'
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-gray-600">{userReview.rating} / 5</span>
                        </div>
                      )}

                      {isEditingUserReview ? (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setEditUserRating(star)}
                                className="transition-transform hover:scale-110"
                              >
                                <Star
                                  className={cn(
                                    'h-5 w-5',
                                    star <= editUserRating
                                      ? 'fill-gray-900 text-gray-900'
                                      : 'text-gray-300'
                                  )}
                                />
                              </button>
                            ))}
                          </div>
                          <Textarea
                            value={editUserComment}
                            onChange={(e) => setEditUserComment(e.target.value)}
                            className="min-h-[100px] p-3 rounded-lg border-gray-200 focus-visible:ring-gray-400 resize-none text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setIsEditingUserReview(false);
                                setEditUserRating(userReview.rating);
                                setEditUserComment(userReview.comment || '');
                              }}
                              className="rounded-lg border-gray-200 font-semibold text-xs uppercase tracking-wider"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateReview(userReview.id, editUserRating, editUserComment)}
                              disabled={reviewUpdating}
                              className="rounded-lg font-semibold text-xs uppercase tracking-wider"
                            >
                              {reviewUpdating ? 'Saving...' : 'Save Changes'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 text-base leading-relaxed font-medium italic">
                          "{userReview.comment}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Review Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Reviews' },
                    { id: 'positive', label: 'Positive' },
                    { id: 'negative', label: 'Critical' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setCurrentPage(1);
                      }}
                      className={cn(
                        'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Reviews Grid */}
                <div className="space-y-8">
                  {reviewsLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : paginatedReviews.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {paginatedReviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          review={review}
                          currentUserId={user?.id}
                          onUpdate={handleUpdateReview}
                          onDelete={handleDeleteReview}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No {activeTab} reviews yet. Be the first to share!</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="rounded-lg border-gray-200 font-bold text-xs uppercase tracking-wider"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={cn(
                            'h-9 w-9 rounded-lg text-xs font-bold transition-all',
                            currentPage === i + 1
                              ? 'bg-gray-900 text-white shadow-md'
                              : 'text-gray-600 hover:bg-gray-100'
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
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="rounded-lg border-gray-200 font-bold text-xs uppercase tracking-wider"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
