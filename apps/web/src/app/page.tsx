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
  ArrowUpRight,
  Layers,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero — Bold, minimal, Orisa-style */}
        <section className="relative overflow-hidden hero-gradient">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-[15%] h-72 w-72 rounded-sm bg-gray-100 blur-[100px] animate-float" />
            <div className="absolute bottom-20 left-[10%] h-56 w-56 rounded-sm bg-gray-100 blur-[80px] animate-float" style={{ animationDelay: "3s" }} />
          </div>

          <div className="container relative mx-auto px-4 pt-20 pb-32 sm:pt-28 sm:pb-40 lg:pt-36 lg:pb-48">
            <div className="animate-fade-in mb-8">
              <div className="inline-flex items-center gap-2 rounded-sm border border-gray-200 bg-gray-100 px-4 py-1.5 text-sm text-neutral-900 font-semibold tracking-tight">
                <Zap className="h-3.5 w-3.5" />
                <span>Multi-tenant SaaS Platform</span>
              </div>
            </div>

            <h1 className="animate-fade-in-delay-1 text-5xl font-bold tracking-tight sm:text-6xl lg:text-8xl leading-[1.05] max-w-5xl">
              Build, Publish &<br />
              <span className="gradient-text">Scale Your SaaS</span>
            </h1>

            <p className="animate-fade-in-delay-2 mt-8 max-w-xl text-lg sm:text-xl text-gray-500 leading-relaxed">
              The marketplace where developers launch WordPress-powered SaaS products
              and customers discover tools that grow their business.
            </p>

            <div className="animate-fade-in-delay-3 mt-10 flex flex-col sm:flex-row items-start gap-4">
              <Link href="/marketplace">
                <Button size="lg" className="group h-14 px-10 text-base cursor-pointer font-semibold rounded-sm shadow-sm shadow-primary/25 hover:shadow-sm hover:shadow-primary/30 transition-all">
                  Explore Marketplace
                  <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 duration-250 transition-all" />
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 text-base font-semibold rounded-sm border-2 cursor-pointer transition-all hover:!bg-black hover:!text-primary-foreground hover:!border-primary"
                >
                  Start Building
                  <Rocket className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Marquee — scrolling text strip */}
        <section className="border-y bg-gray-100 py-5 overflow-hidden">
          <div className="marquee-track animate-marquee">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 px-6 shrink-0">
                {[
                  "WordPress Multisite",
                  "Stripe Payments",
                  "Subscription Management",
                  "Developer Dashboard",
                  "Admin Moderation",
                  "Revenue Analytics",
                  "Secure Access Control",
                  "Multi-Tenant Architecture",
                ].map((text) => (
                  <span key={`${i}-${text}`} className="flex items-center gap-3 text-sm font-semibold tracking-tight text-gray-500 whitespace-nowrap">
                    <Star className="h-3.5 w-3.5 text-neutral-900 shrink-0" />
                    {text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Features — clean grid with icons */}
        <section className="py-28 lg:py-36">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl animate-slide-up">
              <p className="text-neutral-900 font-semibold text-sm tracking-widest uppercase mb-4">How It Works</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Three steps to launch<br />your SaaS product
              </h2>
            </div>

            <div className="mt-20 grid gap-8 md:grid-cols-3">
              {[
                {
                  num: "01",
                  icon: Code,
                  title: "Build Your Product",
                  desc: "Register as a developer, get approved, and provision a WordPress subsite. Build your SaaS using Elementor, themes, and plugins.",
                },
                {
                  num: "02",
                  icon: Globe,
                  title: "Publish & Distribute",
                  desc: "Create product listings with flexible pricing plans. Submit for review and go live on the marketplace for customers to discover.",
                },
                {
                  num: "03",
                  icon: CreditCard,
                  title: "Earn Revenue",
                  desc: "Customers subscribe via Stripe. You earn 85% of every transaction. Track your revenue with real-time analytics.",
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className={`animate-slide-up${i > 0 ? `-delay-${i}` : ""} group relative rounded-sm border bg-card p-10 hover:border-primary/30 transition-all duration-300`}
                >
                  <span className="text-7xl font-bold text-muted/20 absolute top-6 right-8 group-hover:text-neutral-900/10 transition-colors">{step.num}</span>
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 text-neutral-900 group-hover:bg-black group-hover:text-primary-foreground transition-all duration-300">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="line-separator mx-auto w-[80%]" />

        {/* Stats — bold counters */}
        <section className="py-28 lg:py-36">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: "85%", label: "Developer revenue share", icon: BarChart3 },
                { value: "$0", label: "Upfront cost to start", icon: CreditCard },
                { value: "15%", label: "Platform fee only", icon: Shield },
                { value: "24/7", label: "Platform availability", icon: Zap },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className={`animate-slide-up${i > 0 ? `-delay-${i}` : ""} text-center p-10 rounded-sm border bg-card hover:border-primary/30 transition-all duration-300`}
                >
                  <stat.icon className="mx-auto h-8 w-8 text-neutral-900 mb-5" />
                  <div className="text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                  <p className="text-gray-500 text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Separator */}
        <div className="line-separator mx-auto w-[80%]" />

        {/* Roles — who it's for */}
        <section className="py-28 lg:py-36">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <p className="text-neutral-900 font-semibold text-sm tracking-widest uppercase mb-4">Built For Everyone</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                One platform, three roles
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Customer */}
              <div className="rounded-sm border bg-card p-10 hover:border-primary/30 transition-all duration-300 group">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 text-neutral-900 mb-8 group-hover:bg-black group-hover:text-primary-foreground transition-all duration-300">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Customers</h3>
                <ul className="space-y-3 text-gray-500">
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Browse & compare SaaS tools</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Subscribe with secure Stripe checkout</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Manage all subscriptions in one place</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Rate & review products</li>
                </ul>
                <Link href="/register" className="mt-8 block">
                  <Button className="w-full rounded-sm cursor-pointer" variant="outline">Sign up as Customer</Button>
                </Link>
              </div>

              {/* Developer — highlighted */}
              <div className="rounded-sm border-2 border-primary bg-card p-10 shadow-sm shadow-primary/10 relative group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-primary-foreground text-xs font-bold px-4 py-1 rounded-sm tracking-wide uppercase">
                  Popular
                </div>
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-sm bg-black text-primary-foreground mb-8">
                  <Code className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Developers</h3>
                <ul className="space-y-3 text-gray-500">
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Build on WordPress Multisite</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Set flexible pricing & trials</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Earn 85% revenue share</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Real-time analytics dashboard</li>
                </ul>
                <Link href="/register?role=developer" className="mt-8 block">
                  <Button className="w-full rounded-sm shadow-sm shadow-primary/20 cursor-pointer">Become a Developer</Button>
                </Link>
              </div>

              {/* Admin */}
              <div className="rounded-sm border bg-card p-10 hover:border-primary/30 transition-all duration-300 group">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-sm bg-gray-100 text-neutral-900 mb-8 group-hover:bg-black group-hover:text-primary-foreground transition-all duration-300">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Admins</h3>
                <ul className="space-y-3 text-gray-500">
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Approve developers & products</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Platform analytics dashboard</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> Manage payouts & reports</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-neutral-900 mt-0.5 shrink-0" /> User management & moderation</li>
                </ul>
                <Link href="/login" className="mt-8 block">
                  <Button className="w-full rounded-sm cursor-pointer" variant="outline">Admin Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid — compact */}
        <section className="border-t bg-card/50 py-28 lg:py-36">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <p className="text-neutral-900 font-semibold text-sm tracking-widest uppercase mb-4">Platform Features</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Everything you need
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {[
                { icon: Layers, title: "WordPress Multisite", desc: "Each developer gets their own WordPress subsite with full admin access" },
                { icon: CreditCard, title: "Stripe Integration", desc: "Secure payments, subscriptions, and automatic revenue splitting" },
                { icon: Lock, title: "Access Control", desc: "Token-based SSO ensures only subscribed customers access products" },
                { icon: BarChart3, title: "Analytics", desc: "Real-time revenue, subscriber, and performance dashboards" },
                { icon: Shield, title: "Admin Moderation", desc: "Review developers and products before they go live" },
                { icon: Globe, title: "Marketplace", desc: "Search, filter, and discover SaaS products with ratings and reviews" },
              ].map((feature) => (
                <div key={feature.title} className="flex gap-5 p-6 rounded-sm hover:bg-accent/50 transition-colors">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-neutral-900">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 lg:py-36">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl rounded-sm border-2 border-gray-200 bg-card p-16 shadow-sm animate-pulse-glow">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Ready to start?
              </h2>
              <p className="mt-6 text-lg text-gray-500 max-w-md mx-auto">
                Join Saasifyy today. It&apos;s free to sign up and takes less than 2 minutes.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register">
                  <Button size="lg" className="group h-14 px-10 text-base font-semibold rounded-sm shadow-sm shadow-primary/25 cursor-pointer">
                    Create Account
                    <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-all duration-300" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" size="lg" className="group h-14 px-10 text-base font-semibold rounded-sm border-2 cursor-pointer hover:!bg-black hover:!text-white">
                    Explore Products
                    <ArrowRight className="ml-1 h-5 w-5 group-hover:translate-x-1 transition-all duration-300" />
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
