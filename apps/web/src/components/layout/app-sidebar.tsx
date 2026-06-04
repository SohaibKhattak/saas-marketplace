"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import {
  LayoutGrid,
  CreditCard,
  Package,
  Settings,
  Users,
  FileCheck2,
  Activity,
  Wallet,
  ShieldCheck,
  LogOut,
  Rocket,
  UserCircle2,
  Wrench,
  BellRing,
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
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
];

const developerNav: NavItem[] = [
  { label: "Profile", href: "/developer/profile", icon: UserCircle2 },
  { label: "Products", href: "/developer/products", icon: Package },
  { label: "Workspace", href: "/developer/start", icon: Wrench },
  { label: "Analytics", href: "/developer/analytics", icon: Activity },
  { label: "Revenue", href: "/developer/revenue", icon: Wallet },
  // { label: "Updates", href: "/developer/notifications", icon: BellRing },
  // { label: "Settings", href: "/developer/settings", icon: Settings },
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

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { state, toggleSidebar, isMobile } = useSidebar();

  if (!user) return null;

  // Consolidate navigation items based on user role
  const menuItems: NavItem[] = [];

  if (user.role === "CUSTOMER") {
    menuItems.push(...customerNav);
  } else if (user.role === "DEVELOPER") {
    menuItems.push(...developerNav);
  } else if (user.role === "ADMIN") {
    menuItems.push(...adminNav);
  }

  // Add global shortcuts
  if (user.role === "CUSTOMER") {
    menuItems.push({ label: "Become a Developer", href: "/developer/onboarding", icon: Rocket });
  }
  menuItems.push({ label: "Marketplace", href: "/marketplace", icon: Search });

  const isExpanded = state === "expanded";

  return (
    <Sidebar className="border-r border-border/40 bg-white" collapsible="icon">
      {isExpanded ? (
        <SidebarHeader className="border-b border-border/40 px-4 py-4 flex flex-row items-center justify-between">
          <Link
            href="/marketplace"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center bg-black text-white text-lg font-bold select-none rounded-none shrink-0">
              S
            </div>
            <span className="text-base font-bold tracking-tight text-black font-sans">
              Saasifyy
            </span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-[#8B95A5] hover:text-black hover:bg-accent/55 transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </SidebarHeader>
      ) : (
        <>
          <SidebarHeader className="px-2 py-4 flex items-center justify-center">
            <Link href="/marketplace" className="transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center bg-black text-white text-base font-bold select-none rounded-none shrink-0">
                S
              </div>
            </Link>
          </SidebarHeader>
          {!isMobile && (
            <>
              <div className="border-b border-border/40 w-full" />
              <div className="px-2 py-2 flex items-center justify-center">
                <button
                  onClick={toggleSidebar}
                  className="flex h-8 w-8 items-center justify-center rounded-sm text-[#8B95A5] hover:text-black hover:bg-accent/55 transition-colors cursor-pointer"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
          <div className="border-b border-border/40 w-full" />
        </>
      )}

      <SidebarContent className="py-4 px-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={`h-9.5 px-3 gap-2.5 transition-all duration-150 rounded-none text-sm font-sans font-medium ${
                        isActive
                          ? "bg-black! text-white! hover:bg-black! hover:text-white!"
                          : "text-[#8B95A5] hover:text-black hover:bg-gray-50/50"
                      } group-data-[collapsible=icon]:p-1.5!`}
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          isActive ? "text-white!" : "text-[#8B95A5] group-hover/menu-button:text-black"
                        }`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2.5 border-t border-border/40 bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="w-full h-12 px-2.5 transition-all duration-150 rounded-none text-left flex items-center gap-3 text-sm font-sans font-medium text-black hover:bg-gray-50/50 cursor-pointer group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:p-0!"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-full shrink-0">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
                  <AvatarFallback className="bg-black text-white text-xs font-bold rounded-full">
                    {user.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-bold text-black font-sans leading-none mb-1">
                    {user.fullName}
                  </span>
                  <span className="truncate text-xs text-[#8B95A5] font-sans leading-none">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-[#8B95A5] shrink-0 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-56 mb-2 rounded-none border border-border/40 bg-white p-1.5 shadow-md font-sans"
              >
                <div className="px-2 py-1.5 border-b border-border/40 mb-1">
                  <p className="text-xs text-[#8B95A5] font-medium leading-none">Logged in as</p>
                  <p className="text-sm font-bold text-black truncate mt-1">{user.fullName}</p>
                  <p className="text-xs text-[#8B95A5] truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-2.5 py-2 text-sm text-[#8B95A5] hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-none"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}