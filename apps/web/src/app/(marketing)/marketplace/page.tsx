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
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${star <= Math.round(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-yellow-400"
            }`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-500">({count})</span>
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
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [priceRange, setPriceRange] = useState("0");
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
      if (category !== "all") params.set("category", category);
      // if (tagFilter) params.set("tag", tagFilter);
      const range = PRICE_RANGES[parseInt(priceRange)];
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
        <div className="hero-gradient border-b">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight animate-fade-in">
              Explore the <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto animate-fade-in-delay-1">
              Discover SaaS products built by developers on our platform
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search & Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center animate-fade-in-delay-2">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 h-11"
              />
            </form>
            <div className="flex gap-2">
              <Select value={category} onValueChange={(val) => { setCategory(val ?? "all"); setPage(1); }}>
                <SelectTrigger className="w-44 h-11">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priceRange} onValueChange={(val) => { setPriceRange(val ?? "0"); setPage(1); }}>
                <SelectTrigger className="w-40 h-11">
                  <SelectValue placeholder="Price range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((range, i) => (
                    <SelectItem key={i} value={i.toString()}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(val) => { setSortBy(val ?? "latest"); setPage(1); }}>
                <SelectTrigger className="w-36 h-11">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
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
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <Link key={product.id} href={`/marketplace/${product.id}`}>
                  <Card className={`h-full group border hover:shadow-sm hover:-translate-y-1 transition-all duration-300 animate-slide-up${i < 3 ? (i > 0 ? `-delay-${i}` : "") : ""}`}>
                    {/* Gradient top bar */}
                    <div className={`h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-t-lg transition-opacity ${product.isFeatured ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                    <div className="p-6 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-neutral-900 transition-colors">{product.name}</h3>
                          <p className="mt-0.5 text-xs text-gray-500">
                            by {product.developer.user.fullName}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {product.isFeatured && (
                            <Badge className="text-[10px] px-1.5 py-0">Featured</Badge>
                          )}
                          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gray-100 text-neutral-900 group-hover:bg-black group-hover:text-primary-foreground transition-colors">
                            <Package className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                        {product.shortDescription ?? product.name}
                      </p>
                      {/* <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        {product?.tags?.slice(0, 2).map((tag: any) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div> */}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t pt-4">
                      <StarRating rating={product.avgRating} count={product._count.reviews} />
                      <div className="text-sm font-semibold text-neutral-900">
                        {product.pricingPlans.length > 0
                          ? `$${product.pricingPlans[0].price_monthly}/mo`
                          : "Free"}
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <div className="flex items-center gap-1 mx-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "ghost"}
                    size="sm"
                    className="w-9 h-9"
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
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
