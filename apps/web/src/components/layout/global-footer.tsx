"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Playfair_Display } from "next/font/google";

const classicFont = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const footerLinks = {
  product: [
    { label: "Platform", href: "/marketplace" },
    { label: "Security", href: "/security" },
    { label: "Pricing", href: "/pricing" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  social: [
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "X", href: "https://x.com" },
    { label: "GitHub", href: "https://github.com" },
  ],
};

export function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white text-black border-t border-zinc-200 overflow-hidden shrink-0 mt-auto">
      <div className="container mx-auto px-4 md:px-8 py-16 md:py-24 pb-8 md:pb-12">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between gap-16 md:gap-8 mb-24 md:mb-32">
          {/* Left: CTA */}
          <div className="flex flex-col items-start gap-8 max-w-md">
            <h2 className="text-5xl md:text-6xl font-medium tracking-tight leading-tight">
              Get started with Saasifyy.
            </h2>
            <Link href="/marketplace">
              <Button 
                size="lg" 
                className="rounded-full bg-[#111] text-white hover:bg-black px-8 py-6 text-base font-medium transition-all"
              >
                <span className="mr-2">→</span> Explore Marketplace
              </Button>
            </Link>
          </div>

          {/* Right: Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
            <div>
              <h3 className="font-semibold text-zinc-900 mb-6 text-sm">Product</h3>
              <ul className="flex flex-col gap-4">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-zinc-600 hover:text-black transition-colors text-sm font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 mb-6 text-sm">Company</h3>
              <ul className="flex flex-col gap-4">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-zinc-600 hover:text-black transition-colors text-sm font-medium">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h3 className="font-semibold text-zinc-900 mb-6 text-sm">Social</h3>
              <ul className="flex flex-col gap-4">
                {footerLinks.social.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-black transition-colors text-sm font-medium">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Middle Section: Huge Typographic Logo */}
        <div className="w-full flex justify-center items-center overflow-hidden mb-12">
          <h1 
            className={`text-[20vw] leading-[0.75] tracking-tighter text-[#111] select-none ${classicFont.className}`}
          >
            saasifyy
          </h1>
        </div>

        {/* Separator */}
        <div className="h-px w-full bg-zinc-200 mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-zinc-500">
          <div>
            Copyright © {currentYear} Saasifyy
          </div>
          <div className="flex items-center gap-8">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy policy</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms of use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
