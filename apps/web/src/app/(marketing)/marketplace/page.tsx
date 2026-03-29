import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            SaaS Marketplace
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/marketplace"
              className="text-sm font-medium text-foreground"
            >
              Marketplace
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="mt-2 text-muted-foreground">
            Discover SaaS products built by developers on our platform
          </p>

          {/* Search and filters placeholder */}
          <div className="mt-8 rounded-lg border border-dashed p-16 text-center text-muted-foreground">
            <p className="text-lg font-medium">Product catalog coming soon</p>
            <p className="mt-2 text-sm">
              Search, filter, and browse SaaS products will be implemented in Phase 3
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
