"use client";

import { useState } from "react";
import { FormError } from "@/components/ui/form-error";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";

import { Store, Loader2, Mail, KeyRound, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[420px] mx-auto my-auto p-8 pt-8 pb-12 border border-gray-200 shadow-sm rounded-sm text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded border border-gray-200 bg-white">
            <Mail className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-gray-600 text-sm mb-8">If an account exists for <span className="font-semibold">{email}</span>, we sent a password reset link.</p>
          <Link href="/login" className="block">
            <button type="button" className="w-full h-11 bg-black text-white font-semibold tracking-tight rounded-sm hover:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all duration-200">Back to login</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] mx-auto my-auto p-8 pt-8 pb-12 border border-gray-200 shadow-sm rounded-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded border border-gray-200 bg-white">
            <KeyRound className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
          <p className="text-gray-600 text-sm">Enter your email and we&apos;ll send you a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormError message={error} />
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
          <div className="pt-2">
            <button
              type="submit"
              className="w-full h-12 bg-black text-white font-semibold tracking-tight rounded-[4px] hover:bg-neutral-800 cursor-pointer   border border-black focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="ml-2 h-4 w-4 transform transition-transform duration-200 group-hover:translate-x-1" />
                </>
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
