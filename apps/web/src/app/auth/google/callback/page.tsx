"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader } from '@/components/ui/loader';
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Playfair_Display } from "next/font/google";
const classicFont = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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
          <Image
            src="/logo-1.png"
            alt="saasifyy"
            width={36}
            height={36}
            className="object-contain"
          />
          <span className={`${classicFont.className} font-semibold tracking-wider uppercase text-xs`}>Saasifyy</span>
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
              <Loader className="w-5 mr-2" /></div>
          </>
        )}
      </div>
    </div>
  );
}
