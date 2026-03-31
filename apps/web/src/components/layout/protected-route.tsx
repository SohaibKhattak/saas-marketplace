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
  const [isRestoring, setIsRestoring] = useState(!accessToken && !!user);

  // If user is persisted but no access token, try refreshing first
  useEffect(() => {
    if (!accessToken && user) {
      setIsRestoring(true);
      refreshToken().finally(() => setIsRestoring(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isRestoring) return; // Wait for token refresh to complete

    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      switch (user.role) {
        case "ADMIN":
          router.replace("/admin/analytics");
          break;
        case "DEVELOPER":
          router.replace("/developer/products");
          break;
        default:
          router.replace("/customer/subscriptions");
      }
    }
  }, [user, accessToken, allowedRoles, router, isRestoring]);

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!accessToken || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
