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
import { Store, Users, Code, Shield, ArrowRight, Loader2 } from "lucide-react";

const demoAccounts = [
  { role: "customer", email: "david@company.com", password: "Password1!", icon: Users, label: "Customer", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
  { role: "developer", email: "alice@devstudio.com", password: "Password1!", icon: Code, label: "Developer", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
  { role: "admin", email: "admin@saasmarket.com", password: "Password1!", icon: Shield, label: "Admin", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Auto-fill from ?role= query param
  useEffect(() => {
    const role = searchParams.get("role");
    if (role) {
      const account = demoAccounts.find((a) => a.role === role);
      if (account) {
        setEmail(account.email);
        setPassword(account.password);
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      const { user } = useAuthStore.getState();
      if (user?.role === "ADMIN") router.push("/admin/analytics");
      else if (user?.role === "DEVELOPER") router.push("/developer/products");
      else router.push("/customer/subscriptions");
    } catch {
      // Error is set in the store
    }
  }

  async function handleDemoLogin(account: (typeof demoAccounts)[0]) {
    clearError();
    setEmail(account.email);
    setPassword(account.password);
    try {
      await login(account.email, account.password);
      const { user } = useAuthStore.getState();
      if (user?.role === "ADMIN") router.push("/admin/analytics");
      else if (user?.role === "DEVELOPER") router.push("/developer/products");
      else router.push("/customer/subscriptions");
    } catch {
      // Error is set in the store
    }
  }

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
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to your SaaS Marketplace account</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive animate-fade-in">
                    {error}
                  </div>
                )}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-11 shadow-md shadow-primary/20" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                  ) : (
                    <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-primary font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>

          {/* Demo Quick Login */}
          <div className="space-y-3 animate-fade-in-delay-2">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quick Demo Login</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.role}
                  onClick={() => handleDemoLogin(account)}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 hover:bg-accent hover:shadow-md transition-all disabled:opacity-50 group"
                >
                  <div className={`rounded-lg p-2 ${account.color} group-hover:scale-110 transition-transform`}>
                    <account.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{account.label}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Password for all demo accounts: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">Password1!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
