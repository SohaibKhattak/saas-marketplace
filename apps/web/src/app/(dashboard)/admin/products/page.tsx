"use client";
import { Loader } from '@/components/ui/loader';

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Star, Sparkles, Trash2, Search, AlertTriangle, Package, Loader2 } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const [successFeaturedIds, setSuccessFeaturedIds] = useState<Set<string>>(new Set());
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

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
  }, [accessToken, page, statusFilter, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  async function handleToggleFeatured(productId: string) {
    setFeaturingId(productId);
    try {
      const res = await api.post<{ data: boolean }>(
        `/admin/products/${productId}/feature`,
        {},
        { token: accessToken! }
      );

      if (res.data === true) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isFeatured: !p.isFeatured } : p))
        );
        setSuccessFeaturedIds(prev => new Set(prev).add(productId));
      } else {
        alert("Failed to update featured status: Operation returned false");
      }
    } catch {
      setError("Failed to toggle featured status");
    } finally {
      setFeaturingId(null);
    }
  }

  async function handleDeleteProduct() {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/products/${deletingProduct.id}`, { token: accessToken! });

      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
      setTotal(prev => prev - 1);

      setDeletingProduct(null);
    } catch {
      setError("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fade-in space-y-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Manage <span className="bg-linear-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">Products</span>
        </h1>
        <p className="text-lg text-gray-500">
          View all products, manage featured listings ({total} products)
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="border-0 shadow-lg ring-1 ring-gray-200/50 overflow-hidden transition-all">
        <CardHeader className="bg-gray-50/50 border-b px-6 py-5">
          <CardTitle className="text-xl flex items-center gap-2"><Package className="h-5 w-5 text-gray-500" /> Products Registry</CardTitle>
          <CardDescription>Click the star to feature/unfeature a product on the marketplace</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters & Search */}
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
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-45 h-12 border-gray-300 rounded-full bg-white text-gray-900 text-sm hover:border-gray-400 transition-colors focus:ring-black/10">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                <SelectItem value="all" className="text-sm">All Statuses</SelectItem>
                <SelectItem value="PUBLISHED" className="text-sm">Published</SelectItem>
                <SelectItem value="DRAFT" className="text-sm">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW" className="text-sm">Pending Review</SelectItem>
                <SelectItem value="REJECTED" className="text-sm">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center items-center"><Loader /></div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center text-gray-500 bg-gray-50/50">
              <p className="text-lg font-semibold tracking-tight text-gray-900">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
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
                      <TableHead className="font-semibold text-gray-500">Status</TableHead>
                      <TableHead className="font-semibold text-gray-500">Rating</TableHead>
                      <TableHead className="font-semibold text-gray-500">Subs</TableHead>
                      <TableHead className="font-semibold text-gray-500">Featured</TableHead>
                      <TableHead className="text-right font-semibold text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-semibold tracking-tight text-gray-900">{product.name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.developer.user.fullName}</p>
                            <p className="text-xs text-gray-500">{product.developer.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="bg-white text-gray-700 shadow-none">{product.category}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[product.status] ?? "secondary"} className="shadow-none rounded-md px-2.5">
                            {product.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Star className={`h-3.5 w-3.5 ${product.avgRating > 0 ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-300"}`} />
                            <span className="text-sm font-medium">{product.avgRating.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-500">({product._count.reviews})</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{product._count.subscriptions}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={product.isFeatured ? "default" : "ghost"}
                            onClick={() => handleToggleFeatured(product.id)}
                            disabled={product.status !== "PUBLISHED" || featuringId === product.id}
                            className={`cursor-pointer transition-all duration-200 rounded-md h-8 w-8 p-0 ${successFeaturedIds.has(product.id) && product.isFeatured ? "bg-black text-white hover:bg-gray-800 shadow-md" : "text-gray-400 hover:text-gray-700"
                              }`}
                          >
                            {featuringId === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                            ) : (
                              <Sparkles className={`h-4 w-4 ${product.isFeatured ? "text-yellow-300" : ""}`} />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            className="rounded-md bg-red-50 text-red-600 border border-transparent hover:bg-transparent hover:border-red-600 hover:text-red-700 transition-all shadow-none font-medium h-8 w-8 p-0"
                            onClick={() => setDeletingProduct(product)}
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingProduct}
        onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}
      >
        <DialogContent className="sm:max-w-112.5 p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-red-50/80 backdrop-blur-md p-6 border-b border-red-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 ring-4 ring-red-500/5">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-red-700">Delete Product</DialogTitle>
              </div>
            </div>
          </div>
          <div className="p-6">
            <DialogDescription className="text-base text-gray-600">
              Are you sure you want to permanently delete <strong>{deletingProduct?.name}</strong>?
              <br /><br />
              This will remove all associated pricing plans, subscriptions, reviews, and transactions. <strong>This action cannot be undone.</strong>
            </DialogDescription>
          </div>
          <DialogFooter className="bg-gray-50 dark:bg-white/5 p-6 border-t gap-2 sm:justify-between flex flex-col-reverse sm:flex-row">
            <Button variant="ghost" className="rounded-md font-semibold text-gray-600 hover:text-gray-900 w-full sm:w-auto" onClick={() => setDeletingProduct(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-all w-full sm:w-auto shadow-md"
              onClick={handleDeleteProduct}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
