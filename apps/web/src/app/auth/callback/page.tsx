"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Loader } from '@/components/ui/loader';
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const handleCallback = async () => {
      // 1. Check for error in query params
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      if (error) {
        setStatus("error");
        setErrorMsg(errorDescription || error);
        return;
      }

      // 2. Extract tokens from hash
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const type = params.get("type");

      if (!accessToken) {
        // If we land here without an access token, check if it's just a simple success redirect
        const success = searchParams.get("success");
        if (success === "true") {
          setStatus("success");
          return;
        }

        setStatus("error");
        setErrorMsg("No session tokens found. Please try logging in again.");
        return;
      }

      try {
        // 3. Update auth store with the new tokens
        useAuthStore.setState({
          accessToken,
          isLoading: true
        });

        // 4. Fetch the full user profile from our backend
        await fetchUser();

        const { user } = useAuthStore.getState();

        if (!user) {
          throw new Error("Failed to retrieve user profile.");
        }

        setStatus("success");

        // 5. Redirect based on status/role after a short delay
        setTimeout(() => {
          if (!user.profileComplete) {
            router.replace("/auth/onboarding");
          } else if (user.role === "ADMIN") {
            router.replace("/admin/analytics");
          } else if (user.role === "DEVELOPER") {
            router.replace("/developer/products");
          } else {
            router.replace("/customer/subscriptions");
          }
        }, 2000);

      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "An error occurred during verification.");
        useAuthStore.setState({ accessToken: null, user: null, isLoading: false });
      }
    };

    void handleCallback();
  }, [router, searchParams, fetchUser]);

  if (status === "error") {
    return (
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-[10px] shadow-[0_6px_32px_0_rgba(0,0,0,0.08)] border border-gray-100 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-sm text-gray-500 mb-8">{errorMsg}</p>
          <Link
            href="/login"
            className="flex items-center justify-center w-full h-11 bg-black text-white font-semibold rounded-sm hover:bg-neutral-800 transition-all duration-200"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="bg-white p-8 rounded-[10px] shadow-[0_6px_32px_0_rgba(0,0,0,0.08)] border border-gray-100 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
          <p className="text-sm text-gray-500 mb-8">Successfully verified your email. Redirecting you to your dashboard...</p>
          <div className="flex justify-center">
            <Loader className="w-5 mr-2" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md animate-in fade-in duration-500 text-center">
      <div className="inline-flex items-center gap-2 mb-8 text-black opacity-80">
        <Store className="h-5 w-5" />
        <span className="font-bold tracking-tight text-lg uppercase">Saasifyy</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying account</h1>
      <p className="text-sm text-gray-500 mb-8">Please wait while we complete your verification...</p>
      <div className="flex justify-center">
        <Loader /></div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="text-center">
          <Loader /><p className="text-gray-500">Initializing...</p>
        </div>
      }>
        <CallbackHandler />
      </Suspense>
    </div>
  );
}
