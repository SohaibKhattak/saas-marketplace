import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Store,
  ArrowRight,
  Users,
  Code,
  Shield,
  Globe,
  Zap,
  Target,
  Heart,
  GraduationCap,
} from "lucide-react";

export const metadata = {
  title: "About - Saasifyy",
  description: "Learn about Saasifyy, the multi-tenant SaaS marketplace built for developers and customers.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span>Saasifyy</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/marketplace"
              className="hidden sm:inline-flex px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
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
        {/* Hero */}
        <section className="relative hero-gradient overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-float" />
          </div>
          <div className="container relative mx-auto px-4 py-24 text-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-sm">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span>Final Year Project - UET Peshawar</span>
              </div>
            </div>
            <h1 className="animate-fade-in-delay-1 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              About <span className="gradient-text">Saasifyy</span>
            </h1>
            <p className="animate-fade-in-delay-2 mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              A multi-tenant SaaS marketplace that bridges the gap between WordPress developers
              and customers looking for powerful, subscription-based web applications.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2 items-center">
              <div className="animate-slide-up">
                <h2 className="text-3xl font-bold tracking-tight">Our Mission</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Saasifyy empowers developers to monetize their WordPress expertise by
                  providing a complete marketplace infrastructure. We handle payments,
                  subscriptions, multi-tenancy, and distribution so developers can focus
                  on building great products.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  For customers, we offer a curated catalog of SaaS tools with transparent
                  pricing, instant access, and centralized subscription management.
                </p>
              </div>
              <div className="animate-slide-up-delay-1 grid grid-cols-2 gap-4">
                {[
                  { icon: Target, label: "Focused", desc: "Built for WordPress SaaS" },
                  { icon: Shield, label: "Secure", desc: "Stripe-powered payments" },
                  { icon: Zap, label: "Fast", desc: "Instant site provisioning" },
                  { icon: Heart, label: "Fair", desc: "85% developer revenue" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-card p-6 text-center hover:shadow-md transition-shadow">
                    <item.icon className="mx-auto h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold">{item.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-16">How Saasifyy Works</h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="relative rounded-2xl border bg-card p-8">
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">1</div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Code className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Developers Register</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Developers sign up, get approved by the admin, and provision a WordPress
                  subsite where they build their SaaS product using Elementor and plugins.
                </p>
              </div>
              <div className="relative rounded-2xl border bg-card p-8">
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">2</div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Products Go Live</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Developers create product listings with pricing plans and submit for review.
                  Once approved, products appear on the marketplace for customers to discover.
                </p>
              </div>
              <div className="relative rounded-2xl border bg-card p-8">
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">3</div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Customers Subscribe</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Customers browse, subscribe via Stripe, and instantly access the developer&apos;s
                  WordPress-powered application through our secure launch system.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="border-t py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Built By</h2>
            <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
              A Final Year Project by BS Computer Science students at
              University of Engineering & Technology, Peshawar.
            </p>
            <div className="inline-flex items-center gap-3 rounded-2xl border bg-card p-8 shadow-sm">
              <GraduationCap className="h-10 w-10 text-primary" />
              <div className="text-left">
                <h3 className="font-semibold text-lg">UET Peshawar</h3>
                <p className="text-sm text-muted-foreground">Department of Computer Science & IT</p>
                <p className="text-sm text-muted-foreground">Batch 2022 - 2026</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ready to explore?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse our marketplace or sign up to start building your SaaS product.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/marketplace">
                <Button size="lg" className="h-12 px-8 shadow-lg shadow-primary/25">
                  Browse Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store className="h-4 w-4" />
              </div>
              <span>Saasifyy</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Saasifyy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
