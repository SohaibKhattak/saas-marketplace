import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

/**
 * Helper to update product average rating and count
 */
async function syncProductRating(productId: string) {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId);

  if (!reviews || reviews.length === 0) {
    await supabase
      .from("products")
      .update({ avg_rating: 0, total_reviews: 0 })
      .eq("id", productId);
    return;
  }

  const total = reviews.length;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  await supabase
    .from("products")
    .update({ avg_rating: avg, total_reviews: total })
    .eq("id", productId);
}

export async function createReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const productId = req.params.productId as string;

    if (req.body.rating < 1 || req.body.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!req.body.comment || req.body.comment.trim() === "") {
      throw new Error("Review comment is required");
    }

    const { data: product } = await supabase.from("products").select("*").eq("id", productId).single();
    if (!product || product.status !== "PUBLISHED") {
      throw new Error("Product not found or not published");
    }

    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("customer_id", req.user!.userId)
      .eq("product_id", productId);

    if (subError || !subscriptions) {
      throw new Error("Failed to verify subscription status");
    }

    const now = new Date();
    const hasValidSubscription = subscriptions.some(sub => {
      if (["ACTIVE", "TRIALING"].includes(sub.status)) return true;
      if (sub.status === "CANCELED" && sub.current_period_end && new Date(sub.current_period_end) > now) return true;
      return false;
    });

    if (!hasValidSubscription) {
      throw new Error("You must be subscribed to this product to post a review");
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("*")
      .eq("customer_id", req.user!.userId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    const { data: review, error: createError } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        customer_id: req.user!.userId,
        rating: req.body.rating,
        comment: req.body.comment,
      })
      .select(`
        id,
        rating,
        comment,
        created_at,
        customer:users!customer_id(full_name, avatar_url)
      `)
      .single();

    if (createError || !review) {
      throw new Error("Failed to create review");
    }

    await syncProductRating(productId);

    const formattedReview = {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      customer: {
        fullName: (review.customer as any).full_name,
        avatarUrl: (review.customer as any).avatar_url
      }
    };

    res.status(201).json({ data: formattedReview });
  } catch (err) {
    next(err);
  }
}

export async function updateReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reviewId = req.params.reviewId as string;

    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("customer_id", req.user!.userId)
      .single();

    if (reviewsError || !reviews) {
      throw new Error("Review not found");
    }

    if (req.body.rating < 1 || req.body.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!req.body.comment || req.body.comment.trim() === "") {
      throw new Error("Review comment is required");
    }

    const { data: updatedReview, error: updateError } = await supabase
      .from("reviews")
      .update({
        rating: req.body.rating,
        comment: req.body.comment,
      })
      .eq("id", reviewId)
      .select(`
        id,
        product_id,
        rating,
        comment,
        created_at,
        customer:users!customer_id(full_name, avatar_url)
      `)
      .single();

    if (updateError || !updatedReview) {
      throw new Error("Failed to update review");
    }

    await syncProductRating(updatedReview.product_id);

    const formattedReview = {
      id: updatedReview.id,
      rating: updatedReview.rating,
      comment: updatedReview.comment,
      createdAt: updatedReview.created_at,
      customer: {
        fullName: (updatedReview.customer as any).full_name,
        avatarUrl: (updatedReview.customer as any).avatar_url
      }
    };

    res.json({ data: formattedReview });
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reviewId = req.params.reviewId as string;

    const { data: review } = await supabase
      .from("reviews")
      .select("id, product_id, customer_id")
      .eq("id", reviewId)
      .single();

    if (!review) {
      throw new Error("Review not found");
    }

    if (review.customer_id !== req.user!.userId) {
      throw new Error("You can only delete your own reviews");
    }

    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) {
      throw new Error("Failed to delete review");
    }

    await syncProductRating(review.product_id);

    res.json({ data: { deleted: true } });
  } catch (err) {
    next(err);
  }
}

export async function getUserReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const productId = req.params.productId as string;
    const { data: review } = await supabase
      .from("reviews")
      .select("*")
      .eq("customer_id", req.user!.userId)
      .eq("product_id", productId)
      .maybeSingle();
    res.json({ data: review });
  } catch (err) {
    next(err);
  }
}

export async function getProductReviews(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const productId = req.params.productId as string;
    const { type = "all" } = req.query;

    let query = supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        customer:users!customer_id(id, full_name, avatar_url)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (type === "positive") {
      query = query.gte("rating", 3);
    } else if (type === "negative") {
      query = query.lt("rating", 3);
    }

    const { data: reviews, error } = await query;

    if (error) throw error;

    const formattedReviews = (reviews || []).map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      customer: {
        fullName: (r.customer as any).full_name,
        avatarUrl: (r.customer as any).avatar_url
      }
    }));

    res.json({ data: formattedReviews });
  } catch (err) {
    next(err);
  }
}
