"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Store } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";

type GoogleSessionResponse = {
  data: {
    accessToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: "CUSTOMER" | "DEVELOPER" | "ADMIN" | null;
      avatarUrl: string | null;
      authProvider?: "PASSWORD" | "GOOGLE";
      profileComplete?: boolean;
    };
    requiresOnboarding: boolean;
  };
};

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");

      if (!accessToken) {
        setError("Google login failed: access token not found in callback.");
        return;
      }

      try {
        const res = await api.post<GoogleSessionResponse>("/auth/google/session", {
          access_token: accessToken,
        });

        useAuthStore.setState({
          accessToken: res.data.accessToken,
          user: res.data.user,
          error: null,
          isLoading: false,
        });

        window.history.replaceState({}, document.title, window.location.pathname);

        if (res.data.requiresOnboarding) {
          router.replace("/auth/onboarding");
          return;
        }

        if (res.data.user.role === "ADMIN") {
          router.replace("/admin/analytics");
        } else if (res.data.user.role === "DEVELOPER") {
          router.replace("/developer/products");
        } else {
          router.replace("/customer/subscriptions");
        }
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : "Unable to complete Google session.";
        setError(msg);
      }
    };

    void run();
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-black font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-120 mx-auto p-8 shadow-[0_6px_32px_0_rgba(0,0,0,0.10)] rounded-[10px] text-center">
        <div className="inline-flex items-center gap-2 mb-4 text-black">
          <Store className="h-5 w-5" />
          <span className="font-semibold tracking-wider uppercase text-xs">Saasifyy</span>
        </div>
        {error ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Google Login Failed</h1>
            <p className="text-sm text-red-600 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="w-full h-11 bg-black text-white rounded-sm border border-black"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Signing you in</h1>
            <p className="text-sm text-gray-500 mb-6">Completing your Google session...</p>
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
