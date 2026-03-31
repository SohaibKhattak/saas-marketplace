"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { api } from "@/lib/api-client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    api.get<{ data: { count: number } }>("/notifications/unread-count", { token: accessToken })
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {});

    // Poll every 60s
    const interval = setInterval(() => {
      api.get<{ data: { count: number } }>("/notifications/unread-count", { token: accessToken })
        .then((res) => setUnreadCount(res.data.count))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const notifPath = user?.role === "DEVELOPER"
    ? "/developer/notifications"
    : user?.role === "ADMIN"
      ? "/admin/notifications"
      : "/customer/notifications";

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Saasifyy</span>
              {user && (
                <Badge variant="outline" className="text-xs capitalize">
                  {user.role.toLowerCase()}
                </Badge>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link href={notifPath}>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
