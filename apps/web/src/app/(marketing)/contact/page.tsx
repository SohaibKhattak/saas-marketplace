"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Store,
  Mail,
  MapPin,
  Send,
  CheckCircle,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    // Simulate form submission
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    setSubmitted(true);
  }

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
        {/* Hero */}
        <section className="relative hero-gradient overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl animate-float" />
          </div>
          <div className="container relative mx-auto px-4 py-24 text-center">
            <h1 className="animate-fade-in text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="animate-fade-in-delay-1 mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Have a question, feedback, or need support? We&apos;d love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Content */}
        <section className="border-t py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 md:grid-cols-2 max-w-5xl mx-auto">
              {/* Contact Info */}
              <div className="animate-slide-up">
                <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-muted-foreground">support@saasifyy.tech</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Location</h3>
                      <p className="text-muted-foreground">
                        University of Engineering & Technology<br />
                        Peshawar, Pakistan
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-12 rounded-2xl border bg-card p-6">
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24-48 hours during business days.
                    For urgent issues related to billing or account access, please
                    include &quot;URGENT&quot; in the subject.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="animate-slide-up-delay-1">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center h-full text-center rounded-2xl border bg-card p-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold">Message Sent!</h2>
                    <p className="mt-2 text-muted-foreground">
                      Thank you for reaching out. We&apos;ll get back to you soon.
                    </p>
                    <Button className="mt-6" onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-8 space-y-6">
                    <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium mb-1.5 block">
                          Full Name
                        </label>
                        <Input id="name" placeholder="Your name" required />
                      </div>
                      <div>
                        <label htmlFor="email" className="text-sm font-medium mb-1.5 block">
                          Email
                        </label>
                        <Input id="email" type="email" placeholder="you@example.com" required />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject" className="text-sm font-medium mb-1.5 block">
                        Subject
                      </label>
                      <Input id="subject" placeholder="What is this about?" required />
                    </div>
                    <div>
                      <label htmlFor="message" className="text-sm font-medium mb-1.5 block">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Tell us more..."
                        rows={5}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={sending}>
                      {sending ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" /> Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
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
