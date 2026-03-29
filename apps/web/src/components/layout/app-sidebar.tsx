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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Globe,
  ShieldCheck,
  LogOut,
  ChevronUp,
  Store,
  Rocket,
  Code2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const customerNav: NavItem[] = [
  { label: "My Subscriptions", href: "/customer/subscriptions", icon: Package },
  { label: "Billing History", href: "/customer/billing", icon: CreditCard },
  { label: "Settings", href: "/customer/settings", icon: Settings },
];

const developerNav: NavItem[] = [
  { label: "My Products", href: "/developer/products", icon: Package },
  { label: "Code Editor", href: "/ide", icon: Code2 },
  { label: "WordPress Sites", href: "/developer/sites", icon: Globe },
  { label: "Analytics", href: "/developer/analytics", icon: BarChart3 },
  { label: "Revenue", href: "/developer/revenue", icon: DollarSign },
];

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/analytics", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Applications", href: "/admin/applications", icon: FileCheck },
  { label: "Product Moderation", href: "/admin/moderation", icon: ShieldCheck },
  { label: "Payouts", href: "/admin/payouts", icon: DollarSign },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
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
                isActive={pathname === item.href}
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
          <span>SaaS Marketplace</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavSection label="Customer" items={customerNav} pathname={pathname} />

        {(user.role === "DEVELOPER" || user.role === "ADMIN") && (
          <NavSection label="Developer" items={developerNav} pathname={pathname} />
        )}

        {user.role === "ADMIN" && (
          <NavSection label="Admin" items={adminNav} pathname={pathname} />
        )}

        {user.role === "CUSTOMER" && (
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
