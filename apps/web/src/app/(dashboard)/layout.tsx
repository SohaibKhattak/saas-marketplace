"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useAuthStore } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { api } from "@/lib/api-client";
import { Playfair_Display } from "next/font/google";

const classicFont = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  // useEffect(() => {
  //   if (!accessToken) return;
  //   api.get<{ data: { count: number } }>("/notifications/unread-count", { token: accessToken })
  //     .then((res) => setUnreadCount(res.data.count))
  //     .catch(() => {});

  //   // Poll every 60s
  //   const interval = setInterval(() => {
  //     api.get<{ data: { count: number } }>("/notifications/unread-count", { token: accessToken })
  //       .then((res) => setUnreadCount(res.data.count))
  //       .catch(() => {});
  //   }, 60000);
  //   return () => clearInterval(interval);
  // }, [accessToken]);

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
            <div className="flex w-full justify-between items-center gap-2">
              <div className="flex items-center gap-4">
                <span className={`text-2xl tracking-tighter ${classicFont.className}`}>Saasifyy</span>
              </div>

              <div className="flex flex-row items-center gap-6">
                <nav className="hidden sm:flex items-center gap-4 pl-4">
                  <Link href="/marketplace" className="text-sm font-medium text-gray-600 hover:text-black transition-colors rounded-full border-[0.2px] px-3 py-1 hover:bg-accent">Marketplace</Link>
                </nav>
                {user && (
                  <Badge variant="secondary" className={`text-xs ${classicFont.className}  p-3 uppercase tracking-tight font-bold`}>
                    {user?.role?.toLowerCase()}
                  </Badge>
                )}

              </div>
            </div>
            {/* <div className="ml-auto flex items-center gap-2">
              <Link href={notifPath}>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-sm bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              
            </div> */}
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
