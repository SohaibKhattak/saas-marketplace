"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Loader2, Users, Code } from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { Loader } from "@/components/ui/loader";
import { FormError } from "@/components/ui/form-error";

type RoleOption = "CUSTOMER" | "DEVELOPER";

type OnboardingResponse = {
  data: {
    user: {
      id: string;
      email: string;
      fullName: string;
      role: RoleOption;
      avatarUrl: string | null;
      authProvider?: "PASSWORD" | "GOOGLE";
      profileComplete?: boolean;
    };
    profileCompleted: boolean;
  };
};

export default function GoogleOnboardingPage() {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  const [role, setRole] = useState<RoleOption>("CUSTOMER");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    if (user?.profileComplete) {
      if (user.role === "DEVELOPER") router.replace("/developer/products");
      else if (user.role === "ADMIN") router.replace("/admin/analytics");
      else router.replace("/customer/subscriptions");
      return;
    }

    setFullName(user?.fullName ?? "");
  }, [accessToken, router, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!accessToken) {
      setError("Session expired. Please sign in again.");
      return;
    }

    if (role === "DEVELOPER" && !businessName.trim()) {
      setError("Business name is required for developer accounts.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post<OnboardingResponse>(
        "/auth/onboarding/complete",
        {
          role,
          fullName: fullName.trim(),
          businessName: role === "DEVELOPER" ? businessName.trim() : undefined,
          businessEmail: role === "DEVELOPER" ? businessEmail.trim() || undefined : undefined,
        },
        { token: accessToken }
      );

      useAuthStore.setState({
        user: {
          ...res.data.user,
          profileComplete: true,
        },
        error: null,
        isLoading: false,
      });

      if (res.data.user.role === "DEVELOPER") router.replace("/developer/products");
      else router.replace("/customer/subscriptions");
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to complete onboarding.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-130 mx-auto p-8 shadow-[0_6px_32px_0_rgba(0,0,0,0.10)] rounded-[10px]">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4 text-black">
            <Store className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-xs">Saasifyy</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Complete Your Profile</h1>
          <p className="text-sm text-gray-500">Choose your role to continue using the platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <FormError message={error} />

          <div className="space-y-3">
            <label className="block text-sm font-semibold tracking-tight text-black">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("CUSTOMER")}
                className={`flex items-start gap-3 rounded-sm border border-black p-4 text-left transition-none ${
                  role === "CUSTOMER" ? "bg-black text-white" : "bg-white text-black hover:bg-white"
                }`}
              >
                <Users className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Subscriber</p>
                  <p className={`text-xs mt-0.5 ${role === "CUSTOMER" ? "text-gray-300" : "text-gray-500"}`}>Find tools</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole("DEVELOPER")}
                className={`flex items-start gap-3 rounded-sm border border-black p-4 text-left transition-none ${
                  role === "DEVELOPER" ? "bg-black text-white" : "bg-white text-black hover:bg-white"
                }`}
              >
                <Code className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Developer</p>
                  <p className={`text-xs mt-0.5 ${role === "DEVELOPER" ? "text-gray-300" : "text-gray-500"}`}>Publish SaaS</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-semibold tracking-tight text-black">Full Name</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-11 px-3 bg-white text-black border border-black rounded-sm focus:outline-none placeholder:text-gray-400"
            />
          </div>

          {role === "DEVELOPER" && (
            <div className="space-y-4 pt-3 border-t border-gray-200">
              <div className="space-y-2">
                <label htmlFor="businessName" className="block text-sm font-semibold tracking-tight text-black">Business Name</label>
                <input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full h-11 px-3 bg-white text-black border border-black rounded-sm focus:outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="businessEmail" className="block text-sm font-semibold tracking-tight text-black">Business Email (optional)</label>
                <input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full h-11 px-3 bg-white text-black border border-black rounded-sm focus:outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-black text-white font-semibold tracking-tight rounded-sm border border-black hover:bg-gray-900 flex items-center justify-center disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Complete Setup"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
