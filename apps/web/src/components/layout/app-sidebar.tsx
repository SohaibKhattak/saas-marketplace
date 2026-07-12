"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Playfair_Display } from "next/font/google";
import Image from "next/image";

const classicFont = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

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

  if (user.role === "CUSTOMER") {
    menuItems.push({ label: "Become a Developer", href: "/developer/onboarding", icon: Rocket });
  }

  const isExpanded = state === "expanded";

  return (
    <Sidebar className="border-r border-border/40 bg-white" collapsible="icon">
      {isExpanded ? (
        <SidebarHeader className="border-b border-border/40 px-4 py-2 flex flex-row items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            {/* <div className="flex h-9 w-9 items-center justify-center bg-black text-white text-lg font-bold select-none rounded-none shrink-0">
              S
            </div> */}
            <Image
              src="/logo-1.png"
              alt="saasifyy"
              width={36}
              height={36}
              className="object-contain"
            />
            <span className={`text-2xl tracking-tighter ${classicFont.className}`}>Saasifyy</span>
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
            <Link href="/" className="transition-opacity hover:opacity-80">
              <Image
                src="/logo-1.png"
                alt="saasifyy"
                width={36}
                height={36}
                className="object-contain"
              />
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

      <SidebarContent className="py-4 px-3">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className={`h-10 px-3 gap-3 transition-all duration-200 rounded-md text-sm tracking-tight font-medium ${isActive
                        ? "bg-black! text-white! shadow-md hover:bg-black/90! hover:text-white!"
                        : "text-gray-600 hover:text-black hover:bg-gray-100/80"
                        } group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10`}
                      render={<Link href={item.href} />}
                      tooltip={item.label}
                    >
                      <item.icon
                        className={`h-5 w-5 shrink-0 transition-colors ${isActive ? "text-white!" : "text-gray-500 group-hover/menu-button:text-black"
                          }`}
                      />
                      <span className={`${isActive ? "font-semibold" : ""}`}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/40 bg-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="w-full h-12 px-2.5 transition-all duration-200 rounded-md text-left flex items-center gap-3 text-sm font-medium text-gray-700 hover:bg-gray-100/80 cursor-pointer group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                  />
                }
              >
                <Avatar className="h-8 w-8 rounded-full shrink-0 ring-1 ring-gray-200">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.fullName} />
                  <AvatarFallback className="bg-black text-white text-xs font-bold rounded-full">
                    {user.fullName ? user.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-semibold tracking-tight text-gray-900 leading-none mb-1.5">
                    {user.fullName}
                  </span>
                  <span className="truncate text-xs text-gray-500 font-medium tracking-tight leading-none">
                    {user.email}
                  </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="end"
                className="w-60 mb-2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl font-sans"
              >
                <div className="px-2 py-2 border-b border-gray-100 mb-2">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold leading-none mb-2">Account</p>
                  <p className="text-sm font-semibold tracking-tight text-gray-900 truncate">{user.fullName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-2.5 py-2 text-sm font-medium text-red-600 hover:text-red-700 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}