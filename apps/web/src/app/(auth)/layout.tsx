"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from '@/components/ui/loader';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hasHydrated) return;

    const isAuthPage = pathname === "/login" || pathname === "/register";
    
    if (accessToken && isAuthPage) {
      if (user?.role === "ADMIN") {
        router.replace("/admin/analytics"); // Admins might prefer analytics or profile
      } else if (user?.role === "DEVELOPER") {
        router.replace("/developer/profile");
      } else {
        router.replace("/customer/profile");
      }
    }
  }, [accessToken, user, router, pathname, hasHydrated]);

  // Prevent flicker: Don't show auth pages if not hydrated OR if logged in on an auth page
  const isAuthPage = pathname === "/login" || pathname === "/register";
  if (!hasHydrated || (accessToken && isAuthPage)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader /></div>
    );
  }

  return <>{children}</>;
}
