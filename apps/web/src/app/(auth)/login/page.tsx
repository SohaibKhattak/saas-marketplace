"use client";

import { useState, Suspense } from "react";
import { FormError } from "@/components/ui/form-error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Store, Loader2, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleGoogleContinue() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const redirectTo = `${window.location.origin}/auth/google/callback`;
    window.location.href = `${apiBase}/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`;
  }

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

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-4">
      {/* Fixed-width container */}
      <div className="w-full max-w-[480px] mx-auto my-auto p-8 pt-8 pb-12 border border-gray-200 shadow-sm rounded-sm">
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-black uppercase tracking-tight font-bold text-sm mb-8 hover:opacity-70">
            <Store className="h-5 w-5" />
            <span>Saasifyy</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Login</h1>
          <p className="text-gray-500 text-sm">Access your Saasifyy account.</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormError message={error} />

          <button
            type="button"
            onClick={handleGoogleContinue}
            className="w-full h-12 bg-white cursor-pointer text-black font-semibold tracking-tight rounded-sm border border-gray-300 hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="currentColor" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8S6.8 21.2 12 21.2c6.9 0 9.2-4.8 9.2-7.3 0-.5-.1-.9-.1-1.3H12z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="h-px flex-1 bg-gray-300" />
            <span>or continue with email</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold tracking-tight text-neutral-900">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white text-black border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200 placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold tracking-tight text-neutral-900">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-black underline hover:text-gray-600 transition-all duration-200"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-3 bg-white text-black border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200 pr-10 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full h-12 bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
              ) : (
                "Log In"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-black">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-black font-semibold underline hover:text-gray-600 transition-all duration-200 ml-1">
              Switch to Signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center lg:p-0"><Loader2 className="h-6 w-6 animate-spin text-black" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
