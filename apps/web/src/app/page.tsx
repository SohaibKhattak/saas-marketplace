import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
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
              className="text-sm text-muted-foreground hover:text-foreground"
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

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Discover & Subscribe to
            <br />
            <span className="text-primary">SaaS Products</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A multi-tenant marketplace where developers publish SaaS tools built on
            WordPress, and customers find the perfect solutions for their business.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/marketplace">
              <Button size="lg">Browse Marketplace</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Become a Developer
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">How it works</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-background p-6">
                <div className="mb-4 text-3xl">1</div>
                <h3 className="text-lg font-semibold">Developers Build</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create SaaS products on your WordPress site, connect it to our
                  platform, and set up subscription plans.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <div className="mb-4 text-3xl">2</div>
                <h3 className="text-lg font-semibold">We Distribute</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Products are published in our marketplace. We handle payments,
                  subscriptions, and revenue splitting.
                </p>
              </div>
              <div className="rounded-lg border bg-background p-6">
                <div className="mb-4 text-3xl">3</div>
                <h3 className="text-lg font-semibold">Customers Subscribe</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse the catalog, subscribe to the tools you need, and access them
                  instantly through the developer&apos;s site.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 text-center md:grid-cols-3">
              <div>
                <div className="text-4xl font-bold text-primary">85%</div>
                <p className="mt-2 text-muted-foreground">Revenue share for developers</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">$0</div>
                <p className="mt-2 text-muted-foreground">Upfront costs to get started</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary">24/7</div>
                <p className="mt-2 text-muted-foreground">Platform availability</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>SaaS Marketplace - Multi-Tenant Business Platform for SaaS Products</p>
          <p className="mt-1">Final Year Project - UET Peshawar</p>
        </div>
      </footer>
    </div>
  );
}
