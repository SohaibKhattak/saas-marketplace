"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Store, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

const navLinks = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const { accessToken, user, hasHydrated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-card border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-black text-primary-foreground">
            <Store className="h-4.5 w-4.5" />
          </div>
          <span>Saasifyy</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-2 text-sm rounded-sm transition-all duration-200 ${
                pathname === link.href
                  ? "text-neutral-900 font-semibold bg-gray-100"
                  : "text-gray-500 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!hasHydrated ? (
            <div className="w-20 h-8 animate-pulse bg-gray-100 rounded-sm" />
          ) : accessToken ? (
            <Link href={
              user?.role === "ADMIN" ? "/admin/analytics" :
              user?.role === "DEVELOPER" ? "/developer/profile" :
              "/customer/profile"
            }>
              <Button size="sm" className="rounded-sm shadow-sm shadow-primary/20 font-semibold">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-sm">Sign in</Button>
              </Link>
              <Link href="/register" className="hidden sm:inline-flex">
                <Button size="sm" className="rounded-sm shadow-sm shadow-primary/20 font-semibold">Get started</Button>
              </Link>
            </>
          )}
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-sm hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-4 py-2.5 text-sm rounded-sm transition-all ${
                  pathname === link.href
                    ? "text-neutral-900 font-semibold bg-gray-100"
                    : "text-gray-500 hover:text-foreground hover:bg-accent/50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!hasHydrated ? (
              <div className="w-full h-10 animate-pulse bg-gray-100 rounded-sm mt-3" />
            ) : accessToken ? (
              <Link href={
                user?.role === "ADMIN" ? "/admin/analytics" :
                user?.role === "DEVELOPER" ? "/developer/profile" :
                "/customer/profile"
              } className="mt-3" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full rounded-sm shadow-sm shadow-primary/20 font-semibold">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/register" className="mt-3" onClick={() => setMobileOpen(false)}>
                <Button size="sm" className="w-full rounded-sm shadow-sm shadow-primary/20 font-semibold">Get started</Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
