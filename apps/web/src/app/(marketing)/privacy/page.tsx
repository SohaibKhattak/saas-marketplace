import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - Saasifyy",
  description: "Privacy policy for the Saasifyy SaaS marketplace platform.",
};

export default function PrivacyPage() {
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
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-12">Last updated: April 2, 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Saasifyy (&quot;we&quot;, &quot;our&quot;, &quot;the Platform&quot;) is committed to protecting your
                privacy. This Privacy Policy explains how we collect, use, store, and protect
                your personal information when you use our SaaS marketplace platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect the following types of information:
              </p>
              <h3 className="text-lg font-medium mt-4 mb-2">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Full name and email address</li>
                <li>Password (stored securely using bcrypt hashing)</li>
                <li>Account role (Customer, Developer, or Admin)</li>
                <li>Business name and business email (for developer accounts)</li>
              </ul>
              <h3 className="text-lg font-medium mt-4 mb-2">Payment Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Payment details are processed directly by Stripe</li>
                <li>We store Stripe customer IDs and subscription IDs, not card details</li>
                <li>Transaction history (amounts, dates, status)</li>
              </ul>
              <h3 className="text-lg font-medium mt-4 mb-2">Usage Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Products viewed and subscriptions created</li>
                <li>Reviews and ratings submitted</li>
                <li>WordPress subsite activity (for developers)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>To create and manage your user account</li>
                <li>To process subscription payments and manage billing</li>
                <li>To provision and manage WordPress subsites for developers</li>
                <li>To send transactional emails (verification, password reset, subscription notifications)</li>
                <li>To display reviews and ratings on product pages</li>
                <li>To provide analytics dashboards for developers and administrators</li>
                <li>To enforce our Terms of Service and prevent abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Storage & Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We take data security seriously and implement the following measures:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Passwords are hashed using bcrypt with salt rounds</li>
                <li>JWT tokens for secure authentication with short-lived access tokens</li>
                <li>HTTPS encryption for all data in transit</li>
                <li>Secure HTTP headers via Helmet.js (HSTS, CSP, X-Frame-Options)</li>
                <li>Rate limiting to prevent brute-force attacks</li>
                <li>Database hosted on Supabase with encrypted connections</li>
                <li>HttpOnly cookies for refresh tokens to prevent XSS theft</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use the following third-party services that may process your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Stripe</strong> — Payment processing (PCI-DSS compliant)</li>
                <li><strong>Supabase</strong> — Database hosting (PostgreSQL)</li>
                <li><strong>Resend</strong> — Transactional email delivery</li>
                <li><strong>WordPress</strong> — Multi-tenant site hosting for developer products</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Each service has its own privacy policy. We recommend reviewing their policies
                for details on how they handle your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use essential cookies for authentication (refresh tokens stored as HttpOnly
                cookies) and subscription access verification on WordPress subsites. We do not
                use tracking cookies or third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your account data for as long as your account is active. Transaction
                records are retained for accounting and legal compliance purposes. If you delete
                your account, your personal information will be removed, but anonymized transaction
                records may be retained for financial reporting.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access and view your personal data through your account dashboard</li>
                <li>Update or correct your account information</li>
                <li>Delete your account and associated personal data</li>
                <li>Export your data upon request</li>
                <li>Opt out of non-essential email communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Saasifyy is not intended for use by individuals under the age of 18. We do not
                knowingly collect personal information from minors. If we learn that we have
                collected data from a minor, we will take steps to delete it promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. Changes will be posted on
                this page with an updated &quot;Last updated&quot; date. Continued use of the Platform
                after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions or concerns about this Privacy Policy or how we handle
                your data, please reach out via our{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>{" "}
                or email us at support@saasifyy.tech.
              </p>
            </section>
          </div>
        </div>
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
