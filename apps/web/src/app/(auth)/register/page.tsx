"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Store, Users, Code, ArrowRight, Loader2, Check } from "lucide-react";

type RoleOption = "customer" | "developer";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [role, setRole] = useState<RoleOption>("customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "developer") setRole("developer");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await register(email, password, fullName, role === "developer" ? "DEVELOPER" : "CUSTOMER");
      // If developer, redirect to onboarding after verification
      const redirectPath = role === "developer"
        ? `/verify-email?email=${encodeURIComponent(email)}&next=developer`
        : `/verify-email?email=${encodeURIComponent(email)}`;
      router.push(redirectPath);
    } catch {
      // Error is set in the store
    }
  }

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <span>SaaS Market</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <Card className="shadow-xl border-0 shadow-black/5 dark:shadow-black/30">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>
                Join the SaaS Marketplace to {role === "developer" ? "publish products" : "discover tools"}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                {displayError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-fade-in">
                    {displayError}
                  </div>
                )}

                {/* Role selector */}
                <div className="space-y-2">
                  <Label>I want to</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("customer")}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left ${
                        role === "customer"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`rounded-lg p-2 ${role === "customer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} transition-colors`}>
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Subscribe</p>
                        <p className="text-xs text-muted-foreground">Find & use SaaS</p>
                      </div>
                      {role === "customer" && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("developer")}
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left ${
                        role === "developer"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className={`rounded-lg p-2 ${role === "developer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} transition-colors`}>
                        <Code className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Develop</p>
                        <p className="text-xs text-muted-foreground">Publish SaaS</p>
                      </div>
                      {role === "developer" && <Check className="h-4 w-4 text-primary ml-auto" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 chars, uppercase, number, special"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-11 shadow-md shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
                  ) : (
                    <>
                      {role === "developer" ? "Create Developer Account" : "Create Account"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          {role === "developer" && (
            <div className="rounded-xl border bg-primary/5 p-4 text-sm text-muted-foreground animate-fade-in">
              <p className="font-medium text-foreground mb-1">Developer accounts</p>
              <p>After registering, you&apos;ll complete a developer application with your business details. An admin will review and approve your application.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
