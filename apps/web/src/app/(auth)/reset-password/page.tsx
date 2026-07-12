"use client";

import { Suspense, useState, useEffect } from "react";
import { FormError } from "@/components/ui/form-error";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, Eye, EyeOff } from "lucide-react";
import { Loader } from '@/components/ui/loader';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showError, setShowError] = useState(true);

  useEffect(() => {
    // 1. Check direct query params (e.g. ?token=123 or ?access_token=123)
    let foundToken = searchParams.get("token") || searchParams.get("access_token") || "";
    
    // 2. If not found in query params, check the URL hash fragment (Supabase default for implicit grant)
    if (!foundToken && typeof window !== "undefined" && window.location.hash) {
      const hashString = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hashString);
      foundToken = hashParams.get("access_token") || hashParams.get("token") || "";
    }
    
    if (foundToken) {
      setToken(foundToken);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", { token, password });
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

  if (success) {
    return (
      <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[480px] mx-auto my-auto p-8 pt-8 pb-12 border border-gray-200 shadow-sm rounded-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded border border-neutral-200 bg-white">
            <Store className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Password reset</h1>
          <p className="text-gray-600 text-sm mb-8">Your password has been successfully reset. You can now sign in with your new password.</p>
          <Link href="/login" className="block">
            <button type="button" className="w-full h-11 bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200">Go to login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[480px] mx-auto my-auto p-8 pt-8 pb-12 border border-gray-200 shadow-sm rounded-sm">
        {/* Header Section */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-black uppercase tracking-tight font-bold text-sm mb-8 hover:opacity-70 transition-all duration-200">
            <Store className="h-5 w-5" />
            <span>Saasifyy</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Reset Password</h1>
          <p className="text-gray-500 text-sm">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormError message={showError ? error : undefined} onClose={() => setShowError(false)} />
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold tracking-tight text-neutral-900">New Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, uppercase, number, special char"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
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
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold tracking-tight text-neutral-900">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-11 px-3 bg-white text-black border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200 pr-10 placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-gray-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                <><Loader className="w-5 mr-2" /></>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </form>
        <div className="mt-8 text-center">
          <p className="text-sm text-black">
            Remember your password?{" "}
            <Link href="/login" className="text-black font-semibold underline hover:text-gray-600 transition-all duration-200 ml-1">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
