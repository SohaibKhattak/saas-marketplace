"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import {
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Globe,
  CreditCard,
  Users,
  Rocket,
  Code,
  Star,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative hero-gradient overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-float" />
            <div className="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
          </div>

          <div className="container relative mx-auto px-4 py-24 sm:py-32 lg:py-40 text-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 backdrop-blur px-4 py-1.5 text-sm text-muted-foreground mb-8 shadow-sm">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span>Multi-tenant SaaS platform powered by WordPress</span>
              </div>
            </div>

            <h1 className="animate-fade-in-delay-1 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl leading-tight">
              Discover, Subscribe &<br />
              <span className="gradient-text">Grow with SaaS</span>
            </h1>

            <p className="animate-fade-in-delay-2 mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed">
              A marketplace where developers publish WordPress-powered SaaS products
              and customers find the perfect tools for their business.
            </p>

            <div className="animate-fade-in-delay-3 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/marketplace">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Browse Marketplace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  <Rocket className="mr-2 h-4 w-4" />
                  Become a Developer
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="animate-fade-in-delay-3 mt-12 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1">
                <Shield className="h-3 w-3 text-primary" /> Secure Payments
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1">
                <CreditCard className="h-3 w-3 text-primary" /> Powered by Stripe
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1">
                <Globe className="h-3 w-3 text-primary" /> WordPress Multisite
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="text-center animate-slide-up">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to launch or subscribe to SaaS products
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="animate-slide-up-delay-1 group relative rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Code className="h-6 w-6" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">1</div>
                <h3 className="text-xl font-semibold">Developers Build</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Create SaaS products on your WordPress site, connect it to our
                  platform, and set up flexible subscription plans.
                </p>
              </div>

              <div className="animate-slide-up-delay-2 group relative rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Globe className="h-6 w-6" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">2</div>
                <h3 className="text-xl font-semibold">We Distribute</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Products are published in our marketplace. We handle payments,
                  subscriptions, and automatic revenue splitting.
                </p>
              </div>

              <div className="animate-slide-up-delay-3 group relative rounded-2xl border bg-card p-8 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30">3</div>
                <h3 className="text-xl font-semibold">Customers Subscribe</h3>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Browse the catalog, subscribe to the tools you need, and access
                  them instantly through the developer&apos;s site.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-t bg-muted/30 py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: "85%", label: "Revenue share for developers", icon: BarChart3 },
                { value: "$0", label: "Upfront cost to start", icon: CreditCard },
                { value: "15%", label: "Platform fee only", icon: Shield },
                { value: "24/7", label: "Platform availability", icon: Zap },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`animate-slide-up${i > 0 ? `-delay-${i}` : ""} text-center rounded-2xl border bg-card p-8 shadow-sm`}
                >
                  <stat.icon className="mx-auto h-8 w-8 text-primary mb-4" />
                  <div className="text-4xl font-bold gradient-text">{stat.value}</div>
                  <p className="mt-2 text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Built for everyone</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Whether you build, buy, or manage — we&apos;ve got you covered
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-shadow">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">For Customers</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Browse & compare SaaS tools</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Subscribe with Stripe checkout</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Manage all subscriptions in one place</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Rate & review products</li>
                </ul>
                <Link href="/register" className="mt-6 block">
                  <Button className="w-full" variant="outline">Sign up as Customer</Button>
                </Link>
              </div>

              <div className="rounded-2xl border-2 border-primary bg-card p-8 shadow-lg shadow-primary/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                  <Code className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">For Developers</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Host SaaS on WordPress Multisite</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Set up flexible pricing plans</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> 85% revenue share</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Analytics & revenue dashboard</li>
                </ul>
                <Link href="/register?role=developer" className="mt-6 block">
                  <Button className="w-full shadow-md shadow-primary/20">Sign up as Developer</Button>
                </Link>
              </div>

              <div className="rounded-2xl border bg-card p-8 hover:shadow-lg transition-shadow">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-6">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">For Admins</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Approve developers & products</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Platform analytics dashboard</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> Manage payouts & reports</li>
                  <li className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-primary" /> User management & moderation</li>
                </ul>
                <Link href="/login?role=admin" className="mt-6 block">
                  <Button className="w-full" variant="outline">Admin Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-24 text-center">
            <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-12 shadow-lg animate-pulse-glow">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join our marketplace today — it&apos;s free to sign up.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8 shadow-lg shadow-primary/25">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Explore Products
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
