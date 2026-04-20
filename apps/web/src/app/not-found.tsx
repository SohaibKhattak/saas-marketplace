import Link from "next/link";
import { Store } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-gray-100 mb-6">
        <Store className="h-8 w-8 text-neutral-900" />
      </div>
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/marketplace"
          className="inline-flex items-center justify-center rounded-sm bg-black px-6 py-2.5 text-sm font-semibold tracking-tight text-primary-foreground shadow hover:bg-gray-100"
        >
          Browse Marketplace
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-sm border border-input bg-background px-6 py-2.5 text-sm font-semibold tracking-tight shadow-sm hover:bg-accent"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
