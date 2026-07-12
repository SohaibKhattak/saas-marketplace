"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
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
import { Plus, Package } from "lucide-react";
import { Loader } from "@/components/ui/loader";

interface Product {
  id: string;
  name: string;
  logoUrl: string | null;
  slug: string;
  category: string;
  status: string;
  totalSubscribers: number;
  avgRating: number;
  createdAt: string;
  pricingPlans: { id: string; name: string; priceMonthly: number }[];
  _count: { subscriptions: number; reviews: number };
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PENDING_REVIEW: "outline",
  PUBLISHED: "default",
  REJECTED: "destructive",
  UNPUBLISHED: "secondary",
};

export default function ProductsPage() {
  const { accessToken } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const limit = 10;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{
        data: Product[];
        pagination: { total: number };
      }>(`/products/me?page=${page}&limit=${limit}`, { token: accessToken! });
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Products</h1>
          <p className="text-gray-500 mt-1">
            Manage your SaaS product listings ({total} total)
          </p>
        </div>
        <Link href="/developer/products/new">
          <Button className={"group cursor-pointer"}>
            <Plus className="mr-2 h-4 w-4 group-hover:scale-125 duration-200 transition-all" />
            New Product
          </Button>
        </Link>
      </div>

      {error && <div className="rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Your SaaS products on the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            // <div className="py-8 text-center text-gray-500">Loading...</div>
            <div className="py-20 flex justify-center items-center">
              <Loader />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-sm border border-dashed p-12 text-center text-gray-500">
              <p className="text-lg font-semibold tracking-tight">No products yet</p>
              <p className="mt-1 text-sm">Create your first product to get started</p>
              <Link href="/developer/products/new">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Product
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                {products.map((product) => (
                  <Card key={product.id} className="py-0 h-40 group border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-300 hover:border-gray-400 hover:shadow-lg flex flex-row items-stretch">
                    {/* Left: Image/Logo Area completely covered */}
                    <div className="relative w-1/3 min-w-35 max-w-45 bg-gray-50 border-r border-gray-200 flex shrink-0 overflow-hidden">
                      {product.logoUrl ? (
                        <img
                          src={product.logoUrl}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
                          <Package className="h-10 w-10 text-gray-300 transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                    </div>

                    {/* Right: Content Area */}
                    <div className="flex flex-col flex-1 p-4 justify-between min-w-0">
                      <div className="space-y-1">
                        {/* Title & Status */}
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {product.name}
                          </h3>

                          <Badge variant={statusVariant[product.status] ?? "secondary"} className="shrink-0 text-[10px] uppercase tracking-wider font-bold">
                            {product.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <p className="text-[11px] text-gray-500 truncate">
                          {product.category}
                        </p>

                        {/* Stats below */}
                        <div className="flex gap-4 mt-2">
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold text-gray-900">{product.pricingPlans.length}</span> {product.pricingPlans.length === 1 ? "Plan" : "Plans"}
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-semibold text-gray-900">{product._count.subscriptions}</span> {product._count.subscriptions === 1 ? "Subscriber" : "Subscribers"}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row */}
                      <div className="mt-2 flex items-end justify-between border-t border-gray-100 pt-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-medium text-gray-600 bg-gray-50 border-gray-200 px-1.5 py-0">
                            {product.category}
                          </Badge>
                        </div>

                        <div className="text-right shrink-0">
                          <Link href={`/developer/products/${product.id}`}>
                            <Button size="sm" variant="outline" className="cursor-pointer hover:bg-black! hover:text-white! h-7 text-[11px] px-3 font-semibold">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
