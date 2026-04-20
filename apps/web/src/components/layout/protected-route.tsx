"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, accessToken, refreshToken } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // If user is persisted but no access token, try refreshing first
  useEffect(() => {
    if (!isHydrated) return;
    
    if (!accessToken && user) {
      setIsRestoring(true);
      refreshToken().finally(() => setIsRestoring(false));
    }
  }, [isHydrated, accessToken, user, refreshToken]);

  useEffect(() => {
    if (!isHydrated || isRestoring) return;

    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
      switch (user.role) {
        case "ADMIN":
          router.replace("/admin/analytics");
          break;
        case "DEVELOPER":
          router.replace("/developer/revenue");
          break;
        default:
          router.replace("/customer/subscriptions");
      }
    }
  }, [isHydrated, user, accessToken, allowedRoles, router, isRestoring]);

  if (!isHydrated || isRestoring) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-black animate-spin" />
      </div>
    );
  }

  if (!accessToken || !user) {
    return null;
  }

  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
