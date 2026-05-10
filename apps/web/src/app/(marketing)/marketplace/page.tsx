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
  // tags: string[];
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
    <div className="flex items-center gap-1.5 bg-yellow-50/50 px-2.5 py-1 rounded-full border border-yellow-100/50">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-slate-200"
              }`}
          />
        ))}
      </div>
      <span className="text-[10px] font-black text-yellow-700">{rating.toFixed(1)} <span className="text-yellow-600/40 ml-0.5">({count})</span></span>
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
  // const [tagFilter, setTagFilter] = useState("");
  const [error, setError] = useState("");
  const limit = 12;

  // Collect all unique tags from loaded products for the tag filter
  // const allTags = Array.from(new Set(products.flatMap((p) => p.tags))).sort();

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
      // if (tagFilter) params.set("tag", tagFilter);
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
    <div className="flex min-h-screen flex-col w-full">
      {/* Header */}
      {!user ? (
        <header className="sticky top-0 z-50 glass-card border-b">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black text-primary-foreground">
                <Store className="h-4 w-4" />
              </div>
              <span>Saasifyy</span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link href="/marketplace" className="hidden sm:inline-flex px-3 py-2 text-sm font-semibold tracking-tight text-foreground">
                Marketplace
              </Link>

              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="shadow-sm shadow-primary/20">Get started</Button>
              </Link>
            </nav>
          </div>
        </header>
      ) : (
        <header className="flex h-14 items-center gap-2 border-b px-4 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
          <SidebarTrigger />
          <div className="h-6 w-px bg-border mx-1" />
          <span className="font-bold tracking-tight text-sm uppercase">Explore Marketplace</span>
        </header>
      )}

      <main className="flex-1">
        {/* Hero banner */}
        <div className="relative overflow-hidden border-b border-slate-100 bg-white pt-16 pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--color-primary-10),transparent)]" />
          <div className="container relative mx-auto px-4 text-center">
            <Badge className="mb-6 px-4 py-1.5 rounded-full bg-primary/5 text-primary border-primary/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5">
              Discovery Engine
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-6 animate-fade-in">
              Explore the <span className="text-primary italic">Marketplace</span>
            </h1>
            <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed animate-fade-in-delay-1">
              Connect with high-quality SaaS solutions built by expert developers. 
              Accelerate your growth with tools that scale with you.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search & Filters */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center justify-between animate-fade-in-delay-2 mb-10">
            <form onSubmit={handleSearch} className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search premium products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-11 h-12 rounded-2xl border-slate-200 focus-visible:ring-primary/10 font-medium"
              />
            </form>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={category} onValueChange={(val) => { setCategory(val ?? "All"); setPage(1); }}>
                <SelectTrigger className="w-40 h-12 rounded-2xl border-slate-200 font-semibold text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200">
                  <SelectItem value="All" className="text-xs font-semibold">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-xs font-semibold">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priceRange} onValueChange={(val) => { setPriceRange(val ?? "Any price"); setPage(1); }}>
                <SelectTrigger className="w-40 h-12 rounded-2xl border-slate-200 font-semibold text-xs">
                  <SelectValue placeholder="Price range" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200">
                  {PRICE_RANGES.map((range) => (
                    <SelectItem key={range.label} value={range.label} className="text-xs font-semibold">{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(val) => { setSortBy(val ?? "latest"); setPage(1); }}>
                <SelectTrigger className="w-36 h-12 rounded-2xl border-slate-200 font-semibold text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200">
                  <SelectItem value="latest" className="text-xs font-semibold">Latest Arrival</SelectItem>
                  <SelectItem value="popular" className="text-xs font-semibold">Most Popular</SelectItem>
                  <SelectItem value="rating" className="text-xs font-semibold">Top Rated</SelectItem>
                  <SelectItem value="name" className="text-xs font-semibold">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active tag filters */}
          {/*{allTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-gray-500">Tags:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setTagFilter(tagFilter === tag ? "" : tag); setPage(1); }}
                  className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-semibold tracking-tight transition-colors ${
                    tagFilter === tag
                      ? "bg-black text-primary-foreground"
                      : "bg-muted text-gray-500 hover:bg-muted/80"
                  }`}
                >
                  {tag}
                  {tagFilter === tag && <X className="ml-1 h-3 w-3" />}
                </button>
              ))}
            </div>
          )} */}

          {/* Results count */}
          <p className="mt-4 text-sm text-gray-500">
            {total} product{total !== 1 ? "s" : ""} found
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-sm bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="mt-8 py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-neutral-900" />
              <p className="mt-3 text-gray-500">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-sm border border-dashed p-16 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-500/40" />
              <p className="mt-4 text-lg font-semibold tracking-tight">No products found</p>
              <p className="mt-2 text-sm text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, i) => (
              <Link key={product.id} href={`/marketplace/${product.id}`}>
                <Card className={cn(
                  "h-full group border border-slate-200 hover:border-primary/30 rounded-[2rem] bg-white transition-all duration-500",
                  "hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-2 animate-slide-up",
                  i < 3 ? (i > 0 ? `-delay-${i}` : "") : ""
                )}>
                  <div className="p-8 pb-4">
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:border-primary/20 group-hover:bg-primary/5 transition-colors overflow-hidden">
                        {product.logoUrl ? (
                          <img src={product.logoUrl} alt={product.name} className="h-10 w-10 object-contain" />
                        ) : (
                          <Package className="h-7 w-7 text-slate-300 group-hover:text-primary transition-colors" />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        {product.isFeatured && (
                          <Badge className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg bg-primary text-white border-none shadow-lg shadow-primary/20">Featured</Badge>
                        )}
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-slate-100 group-hover:text-primary group-hover:border-primary/20 transition-colors">{product.category}</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <h3 className="font-black text-xl text-slate-900 tracking-tight group-hover:text-primary transition-colors">{product.name}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        By <span className="text-slate-900">{product.developer.user.fullName}</span>
                      </p>
                    </div>
                  </div>

                  <CardContent className="px-8 pb-8">
                    <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed mb-6">
                      {product.shortDescription ?? product.name}
                    </p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <StarRating rating={product.avgRating} count={product._count.reviews} />
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Starting at</span>
                        <div className="text-lg font-black text-slate-900">
                          {product.pricingPlans.length > 0
                            ? `$${product.pricingPlans[0].price_monthly}`
                            : "Free"}
                          <span className="text-[10px] text-slate-400 font-bold ml-1">/mo</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page <= 1} 
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border-slate-200 h-10 px-4 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Prev
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-10 h-10 rounded-xl text-xs font-black transition-all",
                      p === page ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100"
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
                className="rounded-xl border-slate-200 h-10 px-4 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
              >
                Next <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
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
