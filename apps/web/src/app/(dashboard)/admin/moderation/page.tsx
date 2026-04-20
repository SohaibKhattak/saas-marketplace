"use client";

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PendingProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  category: string;
  tags: string[];
  createdAt: string;
  site: { siteUrl: string; subdomain: string } | null;
  developer: {
    user: { id: string; fullName: string; email: string };
  };
  pricingPlans: { name: string; priceMonthly: number }[];
}

export default function ModerationPage() {
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [reviewingProduct, setReviewingProduct] = useState<PendingProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: PendingProduct[];
        pagination: { total: number };
      }>(`/admin/products/moderation?page=${page}&limit=${limit}`, {
        token: accessToken!,
      });
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load pending products");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleReview(status: "PUBLISHED" | "REJECTED") {
    if (!reviewingProduct) return;
    setSubmitting(true);
    setError("");

    try {
      await api.patch(
        `/admin/products/${reviewingProduct.id}/review`,
        {
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
        },
        { token: accessToken! }
      );
      setReviewingProduct(null);
      setRejectionReason("");
      fetchProducts();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit review");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Product Moderation</h1>
      <p className="text-gray-500 mt-1">
        Review and approve pending product submissions ({total} pending)
      </p>

      {error && !reviewingProduct && <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pending Products</CardTitle>
          <CardDescription>
            Approve or reject product listings before they appear in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : products.length === 0 ? (
            <div className="rounded-sm border border-dashed p-12 text-center text-gray-500">
              No pending products
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Plans</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold tracking-tight">{product.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {product.shortDescription ?? product.description.slice(0, 80)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{product.developer.user.fullName}</p>
                          <p className="text-xs text-gray-500">{product.developer.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{product.pricingPlans.length}</TableCell>
                      <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => setReviewingProduct(product)}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={!!reviewingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setReviewingProduct(null);
            setRejectionReason("");
            setError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Product</DialogTitle>
            <DialogDescription>
              Review &quot;{reviewingProduct?.name}&quot; by {reviewingProduct?.developer.user.fullName}
            </DialogDescription>
          </DialogHeader>

          {reviewingProduct && (
            <div className="space-y-4">
              {error && (
                <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-3 rounded-sm border p-4">
                <div>
                  <span className="text-sm text-gray-500">Description</span>
                  <p className="mt-1 text-sm line-clamp-4">{reviewingProduct.description}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Category</span>
                  <Badge variant="outline">{reviewingProduct.category}</Badge>
                </div>
                {reviewingProduct.tags.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-500">Tags</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {reviewingProduct.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Pricing Plans</span>
                  <div className="mt-1 space-y-1">
                    {reviewingProduct.pricingPlans.map((plan, i) => (
                      <p key={i} className="text-sm">
                        {plan.name}: ${plan.priceMonthly}/mo
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">WordPress Site</span>
                  {reviewingProduct.site ? (
                    <a
                      href={reviewingProduct.site.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold tracking-tight text-neutral-900 hover:underline"
                    >
                      {reviewingProduct.site.siteUrl}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">Not linked</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => handleReview("REJECTED")} disabled={submitting}>
              {submitting ? "..." : "Reject"}
            </Button>
            <Button onClick={() => handleReview("PUBLISHED")} disabled={submitting}>
              {submitting ? "..." : "Approve & Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
