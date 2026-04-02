import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store } from "lucide-react";

export const metadata = {
  title: "Terms of Service - Saasifyy",
  description: "Terms and conditions for using the Saasifyy marketplace platform.",
};

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-12">Last updated: April 2, 2026</p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Saasifyy (&quot;the Platform&quot;), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, you may not use the Platform.
                These terms apply to all users, including customers, developers, and administrators.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                Saasifyy is a multi-tenant SaaS marketplace that enables developers to publish
                WordPress-powered software applications and customers to discover, subscribe to,
                and access those applications. The Platform provides payment processing via Stripe,
                subscription management, WordPress site provisioning, and administrative tools.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To use certain features of the Platform, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Developer Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Developers who publish products on the Platform agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Submit accurate product information and pricing</li>
                <li>Maintain and support their published products</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Accept the Platform&apos;s revenue sharing model (85% developer / 15% platform fee)</li>
                <li>Not engage in fraudulent, misleading, or harmful practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Subscription & Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                All payments are processed securely through Stripe. Subscription charges are
                recurring based on the selected billing cycle (monthly or yearly). You may cancel
                your subscription at any time from your dashboard. Upon cancellation, you retain
                access until the end of your current billing period. Refund requests are handled
                on a case-by-case basis.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                You agree not to use the Platform to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the intellectual property rights of others</li>
                <li>Distribute malware, spam, or harmful content</li>
                <li>Attempt to gain unauthorized access to other accounts or systems</li>
                <li>Manipulate reviews, ratings, or marketplace rankings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Content & Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                Developers retain ownership of their products and content. By publishing on
                Saasifyy, developers grant the Platform a non-exclusive license to display,
                distribute, and promote their products within the marketplace. The Saasifyy
                name, logo, and platform design are the intellectual property of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these terms,
                engage in fraudulent activity, or harm the Platform community. Users may delete
                their account at any time. Upon termination, active subscriptions will remain
                accessible until their current billing period ends.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Platform is provided &quot;as is&quot; without warranties of any kind. Saasifyy is
                not liable for any indirect, incidental, or consequential damages arising from
                your use of the Platform or any products available through it. Our total liability
                is limited to the amount you paid to us in the preceding 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms from time to time. Significant changes will be
                communicated via email or through a notice on the Platform. Continued use of
                the Platform after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about these Terms of Service, please contact us
                at{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  our contact page
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
