"use client";
import { Loader } from '@/components/ui/loader';

import { useState, useEffect, useCallback } from "react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const limit = 10;

  const [reviewingProduct, setReviewingProduct] = useState<PendingProduct | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState<"PUBLISHED" | "REJECTED" | null>(null);
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (search) params.set("search", search);
      const res = await api.get<{
        data: PendingProduct[];
        pagination: { total: number };
      }>(`/admin/products/moderation?${params}`, {
        token: accessToken!,
      });
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load pending products");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  async function handleReview(status: "PUBLISHED" | "REJECTED") {
    if (!reviewingProduct) return;
    setSubmittingAction(status);
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
      
      setProducts(prev => prev.filter(p => p.id !== reviewingProduct.id));
      setTotal(prev => prev - 1);
      
      setReviewingProduct(null);
      setRejectionReason("");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to submit review");
      }
    } finally {
      setSubmittingAction(null);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Product <span className="bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Moderation</span>
        </h1>
        <p className="text-lg text-gray-500">
          Review and approve pending product submissions ({total} pending)
        </p>
      </div>

      {error && !reviewingProduct && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all">
        <CardHeader className="bg-gray-50/50 border-b px-6 py-5">
          <CardTitle className="text-xl flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gray-500" /> Pending Products</CardTitle>
          <CardDescription>
            Approve or reject product listings before they appear in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row items-center gap-4">
            <form onSubmit={handleSearch} className="flex flex-1 gap-2 w-full">
              <div className="relative flex-1 rounded-full bg-white border border-gray-300 group focus-within:border-gray-500 focus-within:shadow-[0_0_0_2px_rgba(0,0,0,0.05)] transition-all duration-300 overflow-hidden h-12 flex items-center max-w-lg">
                <div className="absolute inset-0 bg-black/10 origin-left scale-x-0 transition-transform duration-300 ease-in-out group-focus-within:scale-x-100 pointer-events-none" />
                <Search className="absolute left-4 h-5 w-5 text-gray-500 pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-black" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-full pl-12 pr-4 bg-transparent border-none text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10 font-medium text-base shadow-none"
                />
              </div>
            </form>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center items-center"><Loader /></div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500 bg-gray-50/50">
              <p className="text-lg font-semibold tracking-tight text-gray-900">No pending products</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-500">Product</TableHead>
                      <TableHead className="font-semibold text-gray-500">Developer</TableHead>
                      <TableHead className="font-semibold text-gray-500">Category</TableHead>
                      <TableHead className="font-semibold text-gray-500">Plans</TableHead>
                      <TableHead className="font-semibold text-gray-500">Submitted</TableHead>
                      <TableHead className="text-right font-semibold text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold tracking-tight text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-[200px]">
                              {product.shortDescription ?? product.description.slice(0, 80)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.developer.user.fullName}</p>
                            <p className="text-xs text-gray-500">{product.developer.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50 shadow-none font-medium text-gray-700">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{product.pricingPlans.length}</TableCell>
                        <TableCell className="text-gray-600 font-medium">{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="rounded-md shadow-sm hover:shadow transition-all" onClick={() => setReviewingProduct(product)}>
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <p className="text-sm font-medium text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-md shadow-sm hover:shadow transition-all" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" className="rounded-md shadow-sm hover:shadow transition-all" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
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
          if (!open && !submittingAction) {
            setReviewingProduct(null);
            setRejectionReason("");
            setError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 border-b border-border/50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-4 ring-primary/5">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">Review Product</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Review &quot;{reviewingProduct?.name}&quot; by <strong className="text-foreground">{reviewingProduct?.developer.user.fullName}</strong>
                </DialogDescription>
              </div>
            </div>
          </div>

          {reviewingProduct && (
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="rounded-xl border bg-gray-50/50 p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Description</span>
                  <p className="mt-2 text-sm text-gray-700 bg-white p-3 rounded-lg border shadow-sm leading-relaxed whitespace-pre-wrap">{reviewingProduct.description}</p>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-200/50 mt-3 pt-3">
                  <span className="text-sm font-medium text-gray-500">Category</span>
                  <Badge variant="outline" className="shadow-none bg-white font-medium text-gray-700">{reviewingProduct.category}</Badge>
                </div>
                {reviewingProduct.tags.length > 0 && (
                  <div className="py-2 border-t border-gray-200/50">
                    <span className="text-sm font-medium text-gray-500 block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {reviewingProduct.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-gray-200/50 text-gray-700 hover:bg-gray-200 shadow-none font-medium rounded-md">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="py-2 border-t border-gray-200/50">
                  <span className="text-sm font-medium text-gray-500 block mb-2">Pricing Plans</span>
                  <div className="space-y-1">
                    {reviewingProduct.pricingPlans.map((plan, i) => (
                      <div key={i} className="flex justify-between items-center bg-white border rounded-md px-3 py-1.5 shadow-sm text-sm">
                        <span className="font-medium text-gray-900">{plan.name}</span>
                        <span className="text-gray-600">${plan.priceMonthly}<span className="text-[10px] text-gray-400">/mo</span></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-gray-200/50">
                  <span className="text-sm font-medium text-gray-500">WordPress Site</span>
                  {reviewingProduct.site ? (
                    <a
                      href={reviewingProduct.site.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold tracking-tight text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {reviewingProduct.site.siteUrl}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Not linked</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="rejectionReason" className="text-sm font-semibold text-gray-700">Rejection Reason <span className="text-gray-400 font-normal">(Optional, if rejecting)</span></Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="resize-none rounded-lg focus-visible:ring-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="bg-gray-50 dark:bg-white/5 p-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between items-center border-t">
            <Button variant="outline" className="text-gray-500 hover:text-gray-900 rounded-md w-full sm:w-auto" onClick={() => setReviewingProduct(null)} disabled={submittingAction !== null}>
              Cancel
            </Button>
            <div className="flex w-full sm:w-auto gap-3 flex-col sm:flex-row">
              <Button
                variant="outline"
                className="rounded-md border-red-200 bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 w-full sm:w-auto"
                onClick={() => handleReview("REJECTED")}
                disabled={submittingAction !== null}
              >
                {submittingAction === "REJECTED" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
              </Button>
              <Button
                variant="outline"
                className="rounded-md border-green-200 bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-800 w-full sm:w-auto font-medium"
                onClick={() => handleReview("PUBLISHED")}
                disabled={submittingAction !== null}
              >
                {submittingAction === "PUBLISHED" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve & Publish"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
