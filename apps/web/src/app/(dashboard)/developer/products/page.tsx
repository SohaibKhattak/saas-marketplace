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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
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
            <div className="py-8 text-center text-gray-500">Loading...</div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plans</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-semibold tracking-tight">{product.name}</p>
                        {/* <p className="text-xs text-gray-500">/{product.slug}</p> */}
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[product.status] ?? "secondary"}>
                          {product.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.pricingPlans.length}</TableCell>
                      <TableCell>{product._count.subscriptions}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/developer/products/${product.id}`}>
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
