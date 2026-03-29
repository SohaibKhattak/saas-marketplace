"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate default page based on role
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
  }, [user, accessToken, allowedRoles, router]);

  if (!accessToken || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
