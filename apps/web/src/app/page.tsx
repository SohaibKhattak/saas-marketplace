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
    <div className="flex min-h-screen flex-col bg-white selection:bg-black selection:text-white">
      <MarketingHeader />

      <main className="flex-1">
        {/* Hero — Minimalist, high contrast */}
        <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pt-40 lg:pb-48 flex items-center justify-center border-b border-zinc-100">
          {/* Background overlays */}
          <div className="absolute inset-0 z-0 bg-grid-pattern bg-grid-pattern-mask opacity-60" />
          <div className="absolute inset-0 z-0 bg-noise pointer-events-none" />
          
          <div className="container relative z-10 mx-auto px-4 text-center flex flex-col items-center">
            <div className="animate-fade-in mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/50 backdrop-blur-sm px-4 py-1.5 text-xs text-black font-semibold tracking-wide uppercase shadow-sm">
                <Zap className="h-3.5 w-3.5" />
                <span>Multi-tenant SaaS Platform</span>
              </div>
            </div>

            <h1 className="animate-fade-in-delay-1 text-5xl font-extrabold tracking-tighter sm:text-6xl lg:text-8xl leading-[1.05] max-w-5xl text-black drop-shadow-sm">
              Build, Publish & <br className="hidden sm:block" />
              Scale Your SaaS.
            </h1>

            <p className="animate-fade-in-delay-2 mt-8 max-w-2xl text-lg sm:text-xl text-zinc-500 leading-relaxed font-medium">
              The marketplace where developers launch WordPress-powered SaaS products 
              and customers discover tools that grow their business.
            </p>

            <div className="animate-fade-in-delay-3 mt-12 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="group relative w-full sm:w-auto h-14 px-10 text-base cursor-pointer font-medium rounded-md active:scale-95 transition-all bg-black text-white hover:bg-zinc-900 overflow-hidden shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20">
                  <span className="relative z-10 flex items-center gap-2">Start Building <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                  <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[marquee_1s_ease-in-out_forwards]" />
                </Button>
              </Link>
              <Link href="/marketplace" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-10 text-base font-medium rounded-md border-zinc-200 cursor-pointer active:scale-95 transition-all hover:bg-zinc-50 hover:border-black text-black bg-white/50 backdrop-blur-sm"
                >
                  Explore Marketplace
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Marquee — scrolling text strip */}
        <section className="border-b border-zinc-100 bg-zinc-50/50 py-4 overflow-hidden">
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
                  <span key={`${i}-${text}`} className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-zinc-400 whitespace-nowrap">
                    <Star className="h-3 w-3 text-black shrink-0" />
                    {text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Features — clean grid with icons */}
        <section className="py-24 lg:py-32 border-b border-zinc-100">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl animate-slide-up">
              <p className="text-black font-semibold text-xs tracking-widest uppercase mb-4">How It Works</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter leading-tight">
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
                  className={`animate-slide-up${i > 0 ? `-delay-${i}` : ""} relative rounded-xl border border-zinc-200 bg-white p-10 hover:border-black transition-colors duration-300`}
                >
                  <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 text-black">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight">{step.title}</h3>
                  <p className="text-zinc-500 leading-relaxed text-sm font-medium">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats — bold counters */}
        <section className="py-24 lg:py-32 bg-zinc-50 border-b border-zinc-100">
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
                  className={`animate-slide-up${i > 0 ? `-delay-${i}` : ""} flex flex-col justify-center`}
                >
                  <div className="text-6xl font-extrabold text-black mb-2 tracking-tighter">{stat.value}</div>
                  <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles — who it's for */}
        <section className="py-24 lg:py-32 border-b border-zinc-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <p className="text-black font-semibold text-xs tracking-widest uppercase mb-4">Built For Everyone</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter">
                One platform, three roles
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Customer */}
              <div className="rounded-xl border border-zinc-200 bg-white p-10 hover:border-black transition-all duration-300">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 text-black mb-8">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">Customers</h3>
                <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Browse & compare SaaS tools</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Subscribe with secure Stripe checkout</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Manage all subscriptions in one place</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Rate & review products</li>
                </ul>
                <Link href="/register" className="mt-10 block">
                  <Button className="w-full rounded-md font-medium" variant="outline">Sign up as Customer</Button>
                </Link>
              </div>

              {/* Developer */}
              <div className="rounded-xl border-2 border-black bg-white p-10 relative">
                <div className="absolute -top-3 left-10 bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                  Popular
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-black text-white mb-8">
                  <Code className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">Developers</h3>
                <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Build on WordPress Multisite</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Set flexible pricing & trials</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Earn 85% revenue share</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Real-time analytics dashboard</li>
                </ul>
                <Link href="/register?role=developer" className="mt-10 block">
                  <Button className="w-full rounded-md font-medium bg-black text-white hover:bg-zinc-900">Become a Developer</Button>
                </Link>
              </div>

              {/* Admin */}
              <div className="rounded-xl border border-zinc-200 bg-white p-10 hover:border-black transition-all duration-300">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 text-black mb-8">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">Admins</h3>
                <ul className="space-y-4 text-zinc-500 text-sm font-medium">
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Approve developers & products</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Platform analytics dashboard</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> Manage payouts & reports</li>
                  <li className="flex items-start gap-3"><ArrowUpRight className="h-4 w-4 text-black mt-0.5 shrink-0" /> User management & moderation</li>
                </ul>
                <Link href="/login" className="mt-10 block">
                  <Button className="w-full rounded-md font-medium" variant="outline">Admin Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid — compact */}
        <section className="py-24 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter">
                Everything you need.
              </h2>
            </div>

            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {[
                { icon: Layers, title: "WordPress Multisite", desc: "Each developer gets their own WordPress subsite with full admin access." },
                { icon: CreditCard, title: "Stripe Integration", desc: "Secure payments, subscriptions, and automatic revenue splitting." },
                { icon: Lock, title: "Access Control", desc: "Token-based SSO ensures only subscribed customers access products." },
                { icon: BarChart3, title: "Analytics", desc: "Real-time revenue, subscriber, and performance dashboards." },
                { icon: Shield, title: "Admin Moderation", desc: "Review developers and products before they go live." },
                { icon: Globe, title: "Marketplace", desc: "Search, filter, and discover SaaS products with ratings and reviews." },
              ].map((feature) => (
                <div key={feature.title} className="flex flex-col gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-black">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-2 tracking-tight text-lg">{feature.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed font-medium">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-32 lg:py-48 bg-black text-white overflow-hidden">
          {/* Subtle animated background elements for CTA */}
          <div className="absolute inset-0 z-0 bg-grid-pattern opacity-10 bg-grid-pattern-mask" />
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-zinc-800 rounded-full blur-[100px] opacity-30 animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-zinc-800 rounded-full blur-[100px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
          
          <div className="container relative z-10 mx-auto px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold tracking-tighter mb-6 drop-shadow-lg">
                Start Building Now
              </h2>
              <p className="text-xl text-zinc-400 max-w-xl mx-auto font-medium mb-12">
                Join Saasifyy today. It's free to sign up and takes less than 2 minutes to provision your first app.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/register">
                  <Button size="lg" className="group relative overflow-hidden h-16 px-12 text-lg font-bold rounded-md bg-white text-black hover:bg-zinc-100 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]">
                    <span className="relative z-10 flex items-center gap-2">Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[marquee_1s_ease-in-out_forwards]" />
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="outline" size="lg" className="h-16 px-12 text-lg font-bold rounded-md border-zinc-700 bg-transparent text-white hover:bg-zinc-800 hover:text-white active:scale-95 transition-transform hover:border-zinc-500">
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
