"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import {
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
      <MarketingHeader />

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

      <MarketingFooter />
    </div>
  );
}
