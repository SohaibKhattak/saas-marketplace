"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store, Loader2, CheckCircle2, Mail, ArrowRight, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-verify if token is in URL (from email link)
  useEffect(() => {
    if (token && !success && !isLoading) {
      verifyToken(token);
    }
  }, [token]);

  async function verifyToken(verifyToken: string) {
    setError("");
    setIsLoading(true);
    try {
      await api.post("/auth/verify-email", { token: verifyToken });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state while auto-verifying from email link
  if (token && isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span>Saasifyy</span>
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span>Saasifyy</span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <Card className="shadow-xl border-0 shadow-black/5 dark:shadow-black/30">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold">Email verified</CardTitle>
                <CardDescription>
                  Your email has been successfully verified. You can now sign in.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4">
                <Link href="/login" className="w-full">
                  <Button className="w-full h-11 shadow-md shadow-primary/20">
                    Go to login <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state (from auto-verify) or waiting state (no token, just registered)
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <span>Saasifyy</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="shadow-xl border-0 shadow-black/5 dark:shadow-black/30">
            <CardHeader className="text-center pb-2">
              {error ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Verification failed</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                  <CardDescription>
                    {email
                      ? `We sent a verification link to ${email}`
                      : "We sent a verification link to your email address"}
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {!error && (
                <p className="text-sm text-muted-foreground text-center">
                  Click the link in your email to verify your account. Check your spam folder if you don&apos;t see it.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Already verified?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
