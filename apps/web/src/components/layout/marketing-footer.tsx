import Link from "next/link";
import { Store } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-10">
          {/* Top row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
              <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-black text-primary-foreground">
                <Store className="h-4.5 w-4.5" />
              </div>
              <span>Saasifyy</span>
            </div>
            <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
              <Link href="/marketplace" className="text-gray-500 hover:text-foreground transition-colors">Marketplace</Link>
              <Link href="/about" className="text-gray-500 hover:text-foreground transition-colors">About</Link>
              <Link href="/contact" className="text-gray-500 hover:text-foreground transition-colors">Contact</Link>
              <Link href="/terms" className="text-gray-500 hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="text-gray-500 hover:text-foreground transition-colors">Privacy</Link>
            </nav>
          </div>

          {/* Separator */}
          <div className="line-separator" />

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Saasifyy. All rights reserved.</p>
            <p>A Final Year Project — UET Peshawar</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
