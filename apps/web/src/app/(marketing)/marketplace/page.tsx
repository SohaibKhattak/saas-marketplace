"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Search, Star, Store, Package, Loader2, ArrowLeft, ArrowRight, X, ListFilter } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/ui/loader";
import { MarketingHeader } from "@/components/layout/marketing-header";

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
            className={`h-3.5 w-3.5 ${star <= Math.round(rating)
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col w-full bg-white">
      {/* Header */}
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero Banner */}
        <div className="relative border-b border-gray-200 bg-linear-to-b from-gray-50 to-white px-4 py-16 sm:py-24">
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
          {/* Filters & Search Section */}
          <div className="mb-12 relative z-20 max-w-4xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-2">

              {/* Search Bar */}
              <div className="relative flex-1 rounded-full bg-white border border-gray-300 group focus-within:border-gray-500 focus-within:shadow-[0_0_0_2px_rgba(0,0,0,0.05)] transition-all duration-300 overflow-hidden h-12 flex items-center">
                {/* Animated Background Overlay */}
                <div className="absolute inset-0 bg-black/10 origin-left scale-x-0 transition-transform duration-300 ease-in-out group-focus-within:scale-x-100 pointer-events-none" />

                <Search className="absolute left-4 h-5 w-5 text-gray-500 pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-black" />

                <Input
                  placeholder="Search products, categories, features..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full h-full pl-12 pr-4 bg-transparent border-none text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10 font-medium text-base shadow-none"
                />
              </div>

              {/* Filter Button */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "h-12 w-12 sm:w-auto sm:px-6 rounded-full border bg-white flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-black/10 shrink-0",
                  isFilterOpen ? "border-black shadow-md ring-2 ring-black/5" : "border-gray-300 hover:border-gray-400 hover:shadow-sm"
                )}
              >
                <ListFilter className="h-5 w-5 text-gray-700" />
                <span className="hidden sm:inline font-medium text-gray-700">Filter</span>
              </button>
            </form>

            {/* Filter Options (Inline below, aligned right) */}
            {isFilterOpen && (
              <div className="flex flex-wrap items-center justify-end gap-3 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Category Filter */}
                <Select value={category} onValueChange={(val) => { setCategory(val ?? "All"); setPage(1); }}>
                  <SelectTrigger className="w-40 h-10 border-gray-300 rounded-full bg-white text-gray-900 text-sm hover:border-gray-400 transition-colors focus:ring-black/10">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                    <SelectItem value="All" className="text-sm">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-sm">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Price Range Filter */}
                <Select value={priceRange} onValueChange={(val) => { setPriceRange(val ?? "Any price"); setPage(1); }}>
                  <SelectTrigger className="w-40 h-10 border-gray-300 rounded-full bg-white text-gray-900 text-sm hover:border-gray-400 transition-colors focus:ring-black/10">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                    {PRICE_RANGES.map((range) => (
                      <SelectItem key={range.label} value={range.label} className="text-sm">{range.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort By Filter */}
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val ?? "latest"); setPage(1); }}>
                  <SelectTrigger className="w-40 h-10 border-gray-300 rounded-full bg-white text-gray-900 text-sm hover:border-gray-400 transition-colors focus:ring-black/10">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200 shadow-lg">
                    <SelectItem value="latest" className="text-sm">Latest Arrival</SelectItem>
                    <SelectItem value="popular" className="text-sm">Most Popular</SelectItem>
                    <SelectItem value="rating" className="text-sm">Top Rated</SelectItem>
                    <SelectItem value="name" className="text-sm">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
            <div className="py-20 flex justify-center items-center">
              <Loader />
              {/* <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
              <p className="mt-4 text-gray-600">Loading products...</p> */}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-lg font-semibold text-gray-900">No products found</p>
              <p className="mt-2 text-sm text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 mb-12">
              {products.map((product) => (
                <Link key={product.id} href={`/marketplace/${product.id}`}>
                  <Card className="py-0 h-40 group border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-300 hover:border-gray-400 hover:shadow-lg flex flex-row items-stretch">
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
                        {/* Title & Rating */}
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {product.name}
                          </h3>

                          {/* Rating - Single yellow star (No background hover) */}
                          <div
                            className="flex items-center gap-1 px-1 py-0.5 cursor-help shrink-0"
                            title={`${product._count.reviews} reviews`}
                          >
                            <Star className="h-3.5 w-3.5 text-gray-300 fill-transparent transition-all duration-500 group-hover:text-yellow-500 group-hover:fill-yellow-400 group-hover:transform-[rotateY(180deg)]" />
                            <span className="text-xs font-bold text-gray-600">
                              {product.avgRating ? product.avgRating.toFixed(1) : "0.0"}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-gray-500 truncate">
                          By <span className="font-semibold text-gray-900">{product.developer.user.fullName}</span>
                        </p>

                        {/* Description */}
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 mt-1.5">
                          {product.shortDescription ?? product.name}
                        </p>
                      </div>

                      {/* Badges & Price */}
                      <div className="mt-2 flex items-end justify-between border-t border-gray-100 pt-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {product.isFeatured && (
                            <Badge className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0 rounded-sm bg-black text-white border-none shadow-sm">
                              Featured
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[9px] font-medium text-gray-600 bg-gray-50 border-gray-200 px-1.5 py-0">
                            {product.category}
                          </Badge>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-base text-gray-900">
                            {product.pricingPlans.length > 0
                              ? `$${product.pricingPlans[0].price_monthly}`
                              : "Free"}
                            <span className="text-[10px] text-gray-500 font-normal ml-0.5">/mo</span>
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


    </div>
  );
}
