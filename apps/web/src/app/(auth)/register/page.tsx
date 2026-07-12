"use client";

import { useState, useEffect, Suspense } from "react";
import { FormError } from "@/components/ui/form-error";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Store, Users, Code, Check, Eye, EyeOff } from "lucide-react";
import { Loader } from '@/components/ui/loader';

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
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handleGoogleContinue() {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
    const redirectTo = `${window.location.origin}/auth/google/callback`;
    window.location.href = `${apiBase}/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`;
  }

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

    if (role === "developer" && !businessName.trim()) {
      setLocalError("Business name is required for developer accounts");
      return;
    }

    try {
      const extra = role === "developer"
        ? { businessName: businessName.trim(), businessEmail: businessEmail.trim() || undefined }
        : undefined;
      await register(email, password, fullName, role === "developer" ? "DEVELOPER" : "CUSTOMER", extra);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      // Error is set in the store
    }
  }

  const [showError, setShowError] = useState(true);
  const displayError = (localError || error) && showError;

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-4">
      {/* Fixed-width container */}
      <div className="w-full max-w-[480px] mx-auto my-auto p-8 pt-8 pb-12 border border-gray-200 shadow-sm rounded-sm">
        {/* Header Section */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex items-center gap-3 text-black uppercase tracking-tight font-bold text-sm mb-8 hover:opacity-70 transition-all duration-200">
            <Store className="h-5 w-5" />
            <span>Saasifyy</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm">Register to {role === "developer" ? "publish products" : "discover tools"}.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormError
            message={displayError ? (localError || error) : undefined}
            onClose={() => setShowError(false)}
          />

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
            <span>or sign up with email</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>

          {/* Role selector */}
          <div className="space-y-3 mb-8">
            <label className="block text-sm font-semibold tracking-tight text-neutral-900">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`flex items-start gap-3 rounded-sm border border-gray-200 hover:border-gray-300 p-4 transition-all duration-200 text-left focus:outline-none transition-all duration-200 ${
                  role === "customer"
                    ? "border-black ring-1 ring-black bg-white shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="mt-0.5">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Subscriber</p>
                  <p className={`text-xs mt-0.5 ${role === "customer" ? "text-gray-300" : "text-gray-500"}`}>Find tools</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("developer")}
                className={`flex items-start gap-3 rounded-sm border border-gray-200 hover:border-gray-300 p-4 transition-all duration-200 text-left focus:outline-none transition-all duration-200 ${
                  role === "developer"
                    ? "border-black ring-1 ring-black bg-white shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="mt-0.5">
                  <Code className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Developer</p>
                  <p className={`text-xs mt-0.5 ${role === "developer" ? "text-gray-300" : "text-gray-500"}`}>Publish SaaS</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-semibold tracking-tight text-neutral-900">Full Name</label>
            <input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white text-black border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200 placeholder:text-gray-400"
            />
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
            <label htmlFor="password" className="block text-sm font-semibold tracking-tight text-neutral-900">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, uppercase, number, special"
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
                placeholder="Confirm your password"
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

          {role === "developer" && (
            <div className="pt-4 border-t border-gray-200 space-y-5">
              <div className="space-y-2">
                <label htmlFor="businessName" className="block text-sm font-semibold tracking-tight text-neutral-900">Business Name *</label>
                <input
                  id="businessName"
                  placeholder="Your company or brand name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={200}
                  className="w-full h-11 px-3 bg-white text-black border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="businessEmail" className="block text-sm font-semibold tracking-tight text-neutral-900">Business Email (optional)</label>
                <input
                  id="businessEmail"
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-white text-black border border-gray-300 rounded-sm hover:border-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all duration-200 placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full h-12 bg-black text-white font-semibold tracking-tight cursor-pointer rounded-[4px] hover:bg-gray-900 border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader className="w-5 mr-2" /></>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>

        {role === "developer" && (
          <div className="mt-8 border border-gray-200 bg-white p-4 text-sm text-black rounded-[4px]">
            <p className="font-semibold mb-1">Developer Notice</p>
            <p className="text-gray-600">Accounts are manually vetted. Upon approval you can begin publishing apps to our marketplace.</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-black">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-semibold underline hover:text-gray-600 transition-all duration-200 ml-1">
              Switch to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader className="w-5 mr-2" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
