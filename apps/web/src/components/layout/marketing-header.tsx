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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black text-white">
            <Store className="h-4 w-4" />
          </div>
          <span>Saasifyy</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${pathname === link.href
                ? "text-black"
                : "text-zinc-500 hover:text-black"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {!hasHydrated ? (
            <div className="w-20 h-8 animate-pulse bg-zinc-100 rounded-md" />
          ) : accessToken ? (
            <Link href={
              user?.role === "ADMIN" ? "/admin/analytics" :
                user?.role === "DEVELOPER" ? "/developer/profile" :
                  "/customer/profile"
            }>
              <Button size="sm" className="font-semibold rounded-md active:scale-95 transition-transform">Dashboard</Button>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-black transition-colors">
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-semibold rounded-md active:scale-95 transition-transform">Get started</Button>
              </Link>
            </div>
          )}
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -mr-2 text-zinc-500 hover:text-black transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-base font-medium transition-colors ${pathname === link.href
                  ? "text-black"
                  : "text-zinc-500 hover:text-black"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
              {!hasHydrated ? (
                <div className="w-full h-10 animate-pulse bg-zinc-100 rounded-md" />
              ) : accessToken ? (
                <Link href={
                  user?.role === "ADMIN" ? "/admin/analytics" :
                    user?.role === "DEVELOPER" ? "/developer/profile" :
                      "/customer/profile"
                } onClick={() => setMobileOpen(false)}>
                  <Button className="w-full font-semibold rounded-md">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="text-center text-sm font-medium text-zinc-500 py-2 hover:text-black">
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full font-semibold rounded-md">Get started</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
