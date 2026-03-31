"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, Sparkles, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  isFeatured: boolean;
  avgRating: number;
  totalReviews: number;
  totalSubscribers: number;
  createdAt: string;
  developer: {
    user: { fullName: string; email: string };
  };
  _count: { subscriptions: number; reviews: number };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  PENDING_REVIEW: "outline",
  REJECTED: "destructive",
};

export default function AdminProductsPage() {
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PUBLISHED");
  const [error, setError] = useState("");
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await api.get<{
        data: Product[];
        pagination: { total: number };
      }>(`/admin/products?${params}`, { token: accessToken! });
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, statusFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  async function handleToggleFeatured(productId: string) {
    try {
      const res = await api.post<{ data: { id: string; isFeatured: boolean } }>(
        `/admin/products/${productId}/feature`,
        {},
        { token: accessToken! }
      );
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, isFeatured: res.data.isFeatured } : p))
      );
    } catch {
      setError("Failed to toggle featured status");
    }
  }

  async function handleDeleteProduct() {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${deletingProduct.id}`, { token: accessToken! });
      setDeletingProduct(null);
      fetchProducts();
    } catch {
      setError("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Manage Products</h1>
      <p className="text-muted-foreground mt-1">
        View all products, manage featured listings ({total} products)
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="mt-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "PUBLISHED"); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Click the star to feature/unfeature a product on the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
              No products found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{product.developer.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{product.developer.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[product.status] ?? "secondary"}>
                          {product.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{product.avgRating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">({product._count.reviews})</span>
                        </div>
                      </TableCell>
                      <TableCell>{product._count.subscriptions}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={product.isFeatured ? "default" : "ghost"}
                          onClick={() => handleToggleFeatured(product.id)}
                          disabled={product.status !== "PUBLISHED"}
                        >
                          <Sparkles className={`h-4 w-4 ${product.isFeatured ? "text-yellow-300" : ""}`} />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingProduct}
        onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete <strong>{deletingProduct?.name}</strong>?
              This will remove all associated pricing plans, subscriptions, reviews, and transactions.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingProduct(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
