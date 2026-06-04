"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Star, Store, Package, Loader2, ArrowLeft, ArrowRight, X } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "CRM", "Project Management", "Marketing", "Analytics", "E-Commerce",
  "Education", "Finance", "Healthcare", "Communication", "Productivity",
  "Developer Tools", "Other",
];

const PRICE_RANGES = [
  { label: "Any price", min: undefined, max: undefined },
  { label: "Free", min: 0, max: 0 },
  { label: "Under $10/mo", min: undefined, max: 10 },
  { label: "$10 - $50/mo", min: 10, max: 50 },
  { label: "$50 - $100/mo", min: 50, max: 100 },
  { label: "$100+/mo", min: 100, max: undefined },
];

interface MarketplaceProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  category: string;
  logoUrl: string | null;
  avgRating: number;
  totalSubscribers: number;
  isFeatured: boolean;
  developer: {
    user: { fullName: string; avatarUrl: string | null };
  };
  pricingPlans: { price_monthly: number }[];
  _count: { reviews: number };
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.round(rating)
                ? "fill-black text-black"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-gray-600">
        {rating.toFixed(1)}
      </span>
      <span className="text-xs text-gray-400">({count})</span>
    </div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");
  const [priceRange, setPriceRange] = useState("Any price");
  const [error, setError] = useState("");
  const limit = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });
      if (search) params.set("search", search);
      if (category !== "All") params.set("category", category);
      const range = PRICE_RANGES.find(r => r.label === priceRange);
      if (range?.min !== undefined) params.set("minPrice", range.min.toString());
      if (range?.max !== undefined) params.set("maxPrice", range.max.toString());

      const res = await api.get<{
        data: MarketplaceProduct[];
        pagination: { total: number };
      }>(`/products?${params}`);
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortBy, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  const content = (
    <div className="flex min-h-screen flex-col w-full bg-white">
      {/* Header */}
      {!user ? (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                <Store className="h-4 w-4" />
              </div>
              <span className="text-gray-900">Saasifyy</span>
            </Link>
            <nav className="flex items-center gap-3">
              <Link href="/marketplace" className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                Marketplace
              </Link>

              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-gray-900">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-black text-white hover:bg-gray-900">Get started</Button>
              </Link>
            </nav>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <SidebarTrigger />
          <div className="h-6 w-px bg-gray-200" />
          <span className="font-semibold text-gray-900">Marketplace</span>
        </header>
      )}

      <main className="flex-1">
        {/* Hero Banner */}
        <div className="relative border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white px-4 py-16 sm:py-24">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Discover Premium SaaS Tools
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Explore high-quality SaaS solutions built by expert developers. Find the perfect tool to accelerate your business growth.
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 py-10">
          {/* Filters Section */}
          <div className="mb-12">
            <form onSubmit={handleSearch} className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search products, categories, features..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-12 h-12 border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus-visible:ring-black/10 focus-visible:border-gray-500 font-medium text-base"
                />
              </div>

              {/* Filter Controls Grid */}
              <div className="grid gap-6 sm:grid-cols-3">
                {/* Category Filter */}
                <div className="space-y-2.5">
                  <label className="block text-sm font-semibold text-gray-900">
                    Category
                  </label>
                  <Select value={category} onValueChange={(val) => { setCategory(val ?? "All"); setPage(1); }}>
                    <SelectTrigger className="h-11 border-gray-300 rounded-lg bg-white text-gray-900 text-sm hover:border-gray-400 focus:border-gray-500 transition-colors data-[placeholder]:text-gray-500">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-300">
                      <SelectItem value="All" className="text-sm">All Categories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-2.5">
                  <label className="block text-sm font-semibold text-gray-900">
                    Price Range
                  </label>
                  <Select value={priceRange} onValueChange={(val) => { setPriceRange(val ?? "Any price"); setPage(1); }}>
                    <SelectTrigger className="h-11 border-gray-300 rounded-lg bg-white text-gray-900 text-sm hover:border-gray-400 focus:border-gray-500 transition-colors data-[placeholder]:text-gray-500">
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-300">
                      {PRICE_RANGES.map((range) => (
                        <SelectItem key={range.label} value={range.label} className="text-sm">{range.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By Filter */}
                <div className="space-y-2.5">
                  <label className="block text-sm font-semibold text-gray-900">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={(val) => { setSortBy(val ?? "latest"); setPage(1); }}>
                    <SelectTrigger className="h-11 border-gray-300 rounded-lg bg-white text-gray-900 text-sm hover:border-gray-400 focus:border-gray-500 transition-colors data-[placeholder]:text-gray-500">
                      <SelectValue placeholder="Latest Arrival" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-gray-300">
                      <SelectItem value="latest" className="text-sm">Latest Arrival</SelectItem>
                      <SelectItem value="popular" className="text-sm">Most Popular</SelectItem>
                      <SelectItem value="rating" className="text-sm">Top Rated</SelectItem>
                      <SelectItem value="name" className="text-sm">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </div>

          {/* Results Info */}
          <div className="mb-10 flex items-center justify-between border-b border-gray-200 pb-5">
            <p className="text-sm font-medium text-gray-700">
              <span className="font-bold text-gray-900">{total}</span> product{total !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-semibold text-gray-900">No products found</p>
              <p className="mt-2 text-sm text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 mb-12">
              {products.map((product) => (
                <Link key={product.id} href={`/marketplace/${product.id}`}>
                  <Card className="h-full group border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-300 hover:border-gray-400 hover:shadow-xl">
                    {/* Image/Logo Area - Larger and Dominant */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-center overflow-hidden group-hover:from-gray-100 group-hover:to-gray-200 transition-colors">
                      {product.logoUrl ? (
                        <img 
                          src={product.logoUrl} 
                          alt={product.name} 
                          className="h-20 w-20 object-contain transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <Package className="h-16 w-16 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                      
                      {/* Badges - Positioned on Image */}
                      <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                        {product.isFeatured && (
                          <Badge className="text-xs font-semibold px-2.5 py-1 rounded-md bg-black text-white border-none shadow-sm">
                            Featured
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs font-medium text-gray-700 border-gray-300 bg-white shadow-sm">
                          {product.category}
                        </Badge>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col h-full">
                      <div className="flex-1 space-y-4 p-6">
                        {/* Title */}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-black transition-colors line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1.5">
                            By <span className="font-semibold text-gray-800">{product.developer.user.fullName}</span>
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                          {product.shortDescription ?? product.name}
                        </p>
                      </div>

                      {/* Footer with Rating and Price */}
                      <div className="border-t border-gray-200 px-6 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <StarRating rating={product.avgRating} count={product._count.reviews} />
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium text-gray-500 mb-0.5">Starting at</div>
                            <div className="font-bold text-lg text-gray-900">
                              {product.pricingPlans.length > 0
                                ? `$${product.pricingPlans[0].price_monthly}`
                                : "Free"}
                              <span className="text-xs text-gray-500 font-normal ml-1">/mo</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-gray-200 pt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed h-9 px-3"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(0, 5)
                  .map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                        p === page
                          ? "bg-black text-white border-black hover:bg-gray-900"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      )}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed h-9 px-3"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-gray-600">
          <p>Saasifyy - Multi-Tenant SaaS Platform</p>
        </div>
      </footer>
    </div>
  );

  if (user) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {content}
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return content;
}
