"use client";

import { Suspense, useState, useEffect, useRef } from "react";
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
import { Store, CheckCircle2, Mail, ArrowRight, XCircle, Loader2 } from "lucide-react";
import { Loader } from '@/components/ui/loader';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const hasAttempted = useRef(false);

  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  async function handleResend() {
    if (!email || resendCountdown > 0) return;
    setIsResending(true);
    setError("");
    try {
      await api.post("/auth/resend-verification", { email });
      setResendCountdown(30);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while resending");
      }
    } finally {
      setIsResending(false);
    }
  }

  // Auto-verify if token is in URL (from email link)
  useEffect(() => {
    if (token && !hasAttempted.current) {
      hasAttempted.current = true;
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
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span>Saasifyy</span>
          </Link>

        </div>
        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in text-center">
            <Loader /><p className="text-lg font-semibold tracking-tight">Verifying your email...</p>
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
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black text-primary-foreground">
              <Store className="h-4 w-4" />
            </div>
            <span>Saasifyy</span>
          </Link>

        </div>

        <div className="flex-1 flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <Card className="shadow-sm border-0 shadow-black/5 dark:shadow-black/30">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-green-500/10">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold">Email verified</CardTitle>
                <CardDescription>
                  Your email has been successfully verified. You can now sign in.
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col gap-4">
                <Link href="/login" className="w-full">
                  <Button className="w-full h-11 shadow-sm shadow-primary/20">
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
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <span>Saasifyy</span>
        </Link>

      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="shadow-sm border-0 shadow-black/5 dark:shadow-black/30">
            <CardHeader className="text-center pb-2">
              {error ? (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <CardTitle className="text-2xl font-bold">Verification failed</CardTitle>
                  <CardDescription>{error}</CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-sm bg-gray-100">
                    <Mail className="h-8 w-8 text-neutral-900" />
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
                <p className="text-sm text-gray-500 text-center">
                  Click the link in your email to verify your account. Check your spam folder if you don&apos;t see it.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              {!error && email && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={isResending || resendCountdown > 0}
                >
                  {isResending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {resendCountdown > 0
                    ? `Resend available in ${resendCountdown}s`
                    : "Resend verification email"}
                </Button>
              )}
              <p className="text-sm text-gray-500">
                Already verified?{" "}
                <Link href="/login" className="text-neutral-900 font-semibold tracking-tight hover:underline">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
