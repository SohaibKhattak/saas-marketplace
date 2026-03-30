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
import { ThemeToggle } from "@/components/theme-toggle";
import { Search, Star, Store, Package, Loader2, ArrowLeft, ArrowRight } from "lucide-react";

const CATEGORIES = [
  "CRM", "Project Management", "Marketing", "Analytics", "E-Commerce",
  "Education", "Finance", "Healthcare", "Communication", "Productivity",
  "Developer Tools", "Other",
];

interface MarketplaceProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  category: string;
  tags: string[];
  logoUrl: string | null;
  avgRating: number;
  totalSubscribers: number;
  developer: {
    user: { fullName: string; avatarUrl: string | null };
  };
  pricingPlans: { priceMonthly: number }[];
  _count: { reviews: number };
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({count})</span>
    </div>
  );
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const limit = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);

      const res = await api.get<{
        data: MarketplaceProduct[];
        pagination: { total: number };
      }>(`/products?${params}`);
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, category, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span>Saasifyy</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/marketplace" className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-foreground">
              Marketplace
            </Link>
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="shadow-md shadow-primary/20">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero banner */}
        <div className="hero-gradient border-b">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight animate-fade-in">
              Explore the <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto animate-fade-in-delay-1">
              Discover SaaS products built by developers on our platform
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Search & Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center animate-fade-in-delay-2">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

          {/* Results count */}
          <p className="mt-4 text-sm text-muted-foreground">
            {total} product{total !== 1 ? "s" : ""} found
          </p>

          {/* Product Grid */}
          {loading ? (
            <div className="mt-8 py-16 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-muted-foreground">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed p-16 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-lg font-medium">No products found</p>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, i) => (
                <Link key={product.id} href={`/marketplace/${product.slug}`}>
                  <Card className={`h-full group border hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up${i < 3 ? (i > 0 ? `-delay-${i}` : "") : ""}`}>
                    {/* Gradient top bar */}
                    <div className="h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="p-6 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{product.name}</h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            by {product.developer.user.fullName}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <Package className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                        {product.shortDescription ?? product.name}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                        {product.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between border-t pt-4">
                      <StarRating rating={product.avgRating} count={product._count.reviews} />
                      <div className="text-sm font-semibold text-primary">
                        {product.pricingPlans.length > 0
                          ? `$${product.pricingPlans[0].priceMonthly}/mo`
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
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Saasifyy - Multi-Tenant SaaS Platform</p>
        </div>
      </footer>
    </div>
  );
}
