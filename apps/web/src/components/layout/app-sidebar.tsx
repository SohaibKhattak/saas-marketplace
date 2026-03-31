"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Settings,
  Users,
  FileCheck,
  BarChart3,
  DollarSign,
  ShieldCheck,
  LogOut,
  ChevronUp,
  Store,
  Rocket,
  UserCircle,
  Hammer,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// ── Customer-only sidebar ──────────────────────────────────
const customerNav: NavItem[] = [
  { label: "Profile", href: "/customer/profile", icon: UserCircle },
  { label: "My Subscriptions", href: "/customer/subscriptions", icon: Package },
  { label: "Billing History", href: "/customer/billing", icon: CreditCard },
  { label: "Notifications", href: "/customer/notifications", icon: Bell },
  { label: "Settings", href: "/customer/settings", icon: Settings },
];

// ── Developer sidebar ──────────────────────────────────────
const developerNav: NavItem[] = [
  { label: "Profile", href: "/developer/profile", icon: UserCircle },
  { label: "My Products", href: "/developer/products", icon: Package },
  { label: "Start Building", href: "/developer/start", icon: Hammer },
  { label: "Analytics", href: "/developer/analytics", icon: BarChart3 },
  { label: "Revenue", href: "/developer/revenue", icon: DollarSign },
  { label: "Notifications", href: "/developer/notifications", icon: Bell },
  { label: "Settings", href: "/developer/settings", icon: Settings },
];

// ── Admin sidebar ──────────────────────────────────────────
const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/analytics", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Applications", href: "/admin/applications", icon: FileCheck },
  { label: "Product Moderation", href: "/admin/moderation", icon: ShieldCheck },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Payouts", href: "/admin/payouts", icon: DollarSign },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

function NavSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                render={<Link href={item.href} />}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <Link href="/marketplace" className="flex items-center gap-2 font-semibold">
          <Store className="h-5 w-5" />
          <span>Saasifyy</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* CUSTOMER role — show customer nav */}
        {user.role === "CUSTOMER" && (
          <>
            <NavSection label="Customer" items={customerNav} pathname={pathname} />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link href="/developer/onboarding" />}>
                      <Rocket className="h-4 w-4" />
                      <span>Become a Developer</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link href="/marketplace" />}>
                      <Store className="h-4 w-4" />
                      <span>Browse Marketplace</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* DEVELOPER role — show developer nav + explore link */}
        {user.role === "DEVELOPER" && (
          <>
            <NavSection label="Developer" items={developerNav} pathname={pathname} />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === "/marketplace"}
                      render={<Link href="/marketplace" />}
                    >
                      <Store className="h-4 w-4" />
                      <span>Explore Marketplace</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* ADMIN role — show admin nav only */}
        {user.role === "ADMIN" && (
          <>
            <NavSection label="Admin" items={adminNav} pathname={pathname} />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === "/marketplace"}
                      render={<Link href="/marketplace" />}
                    >
                      <Store className="h-4 w-4" />
                      <span>Browse Marketplace</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="w-full">
                    <Avatar className="h-6 w-6">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{user.fullName}</span>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent side="top" align="start" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
