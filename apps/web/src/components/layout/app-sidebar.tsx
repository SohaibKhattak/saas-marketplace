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
  LayoutGrid, // Replaced LayoutDashboard
  CreditCard,
  Package,
  Settings,
  Users,
  FileCheck2, // Refined
  Activity, // Replaced BarChart3
  Wallet, // Replaced DollarSign
  ShieldCheck,
  LogOut,
  ChevronUp,
  Store,
  Rocket,
  UserCircle2, // Refined
  Wrench, // Replaced Hammer
  BellRing, // Refined
  Search,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const customerNav: NavItem[] = [
  { label: "Profile", href: "/customer/profile", icon: UserCircle2 },
  { label: "Subscriptions", href: "/customer/subscriptions", icon: Zap },
  { label: "Billing", href: "/customer/billing", icon: CreditCard },
  // { label: "Settings", href: "/customer/settings", icon: Settings },
  // { label: "Notifications", href: "/customer/notifications", icon: Package },
];

const developerNav: NavItem[] = [
  { label: "Profile", href: "/developer/profile", icon: UserCircle2 },
  { label: "Products", href: "/developer/products", icon: Package },
  { label: "Workspace", href: "/developer/start", icon: Wrench },
  { label: "Analytics", href: "/developer/analytics", icon: Activity },
  { label: "Revenue", href: "/developer/revenue", icon: Wallet },
  { label: "Updates", href: "/developer/notifications", icon: BellRing },
  { label: "Settings", href: "/developer/settings", icon: Settings },
];

const adminNav: NavItem[] = [
  { label: "Overview", href: "/admin/analytics", icon: LayoutGrid },
  { label: "User Management", href: "/admin/users", icon: Users },
  { label: "Applications", href: "/admin/applications", icon: FileCheck2 },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldCheck },
  { label: "Catalog", href: "/admin/products", icon: Package },
  { label: "Finance", href: "/admin/payouts", icon: Wallet },
  { label: "System Logs", href: "/admin/reports", icon: Activity },
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
      <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  className={`transition-all duration-200 hover:bg-accent/50 ${isActive ? "font-medium text-primary bg-secondary/80" : "text-muted-foreground"
                    }`}
                  render={<Link href={item.href} />}
                >
                  <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : "opacity-70"}`} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
    <Sidebar className="border-r border-border/40 bg-background">
      <SidebarHeader className="border-b border-border/40 px-6 py-6">
        <Link
          href="/marketplace"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Saasifyy</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        {/* Dynamic Role Navigation */}
        {user.role === "CUSTOMER" && <NavSection label="Account" items={customerNav} pathname={pathname} />}
        {user.role === "DEVELOPER" && <NavSection label="Developer Console" items={developerNav} pathname={pathname} />}
        {user.role === "ADMIN" && <NavSection label="Administration" items={adminNav} pathname={pathname} />}

        {/* Global Shortcuts Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Explore
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {user.role === "CUSTOMER" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="text-muted-foreground transition-colors hover:text-primary"
                    render={<Link href="/developer/onboarding" />}
                  >
                    <Rocket className="h-4 w-4" />
                    <span>Become a Developer</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === "/marketplace"}
                  className={`transition-all ${pathname === "/marketplace" ? "bg-secondary" : "text-muted-foreground"}`}
                  render={<Link href="/marketplace" />}
                >
                  <Search className="h-4 w-4" />
                  <span>Marketplace</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton className="h-12 w-full ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-8 w-8 border border-border/50">
                      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start gap-0.5 text-left">
                      <span className="max-w-[120px] truncate text-sm font-medium leading-none">
                        {user.fullName}
                      </span>
                      <span className="text-xs text-muted-foreground/80 font-normal">
                        {user.role.toLowerCase()}
                      </span>
                    </div>
                    <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground" />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent side="top" align="start" className="w-64 p-2 shadow-xl">
                <div className="flex items-center gap-3 px-2 py-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
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