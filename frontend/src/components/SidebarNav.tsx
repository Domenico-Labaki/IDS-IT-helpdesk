"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart2, Bell, ClipboardList, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, Ticket, Users, X } from "lucide-react";

import { decodeToken, getToken, removeToken } from "@/lib/auth";
import { getUnreadCount } from "@/lib/api/notifications";
import { useTheme } from "@/lib/theme-provider";
import type { Role } from "@/types";
import { startSignalRConnection, stopSignalRConnection, setOnNotification, setOnUnreadCount } from "@/lib/signalr";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navItems: Record<Role, NavItem[]> = {
  Employee: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: Users },
  ],
  Agent: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: Users },
  ],
  Manager: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/reports", label: "Reports", icon: BarChart2 },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: Users },
  ],
  Admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/reports", label: "Reports", icon: BarChart2 },
    { href: "/users", label: "Users", icon: Users },
    { href: "/monitoring", label: "Monitoring", icon: Activity },
    { href: "/activity-logs", label: "Activity Logs", icon: ClipboardList },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/profile", label: "Profile", icon: Users },
  ],
};

const badgeClasses: Record<Role, string> = {
  Admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Agent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Manager: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Employee: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const token = getToken();
  const decoded = token ? decodeToken(token) : null;
  const role = decoded?.role ?? "Employee";
  const items = navItems[role];

  const { data: unreadData, refetch: refetchUnread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
    enabled: !!token,
  });

  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    if (!token) return;
    startSignalRConnection();
    setOnNotification(() => {
      refetchUnread();
    });
    setOnUnreadCount(() => {
      refetchUnread();
    });
    return () => {
      stopSignalRConnection();
    };
  }, [token]);

  const handleLogout = () => {
    removeToken();
    onNavigate?.();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col justify-between border-r border-sidebar-border bg-sidebar/95 px-4 py-5 backdrop-blur">
      <div>
        <div className="mb-8 flex items-center justify-between md:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/60">IT Help Desk</p>
            <p className="mt-1 text-lg font-semibold text-sidebar-foreground">Support Console</p>
          </div>
          {onNavigate ? (
            <button className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden" onClick={onNavigate} aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        <nav className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-zinc-900 text-white dark:bg-sidebar-primary dark:text-sidebar-primary-foreground" : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="space-y-4 border-t border-sidebar-border pt-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-sidebar-foreground">{decoded?.name || "Signed in user"}</p>
          <div className="flex items-center justify-between">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[role]}`}>{role}</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="relative rounded-full p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link
                href="/notifications"
                onClick={onNavigate}
                className="relative rounded-full p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          className="fixed left-4 top-4 z-40 rounded-xl border border-sidebar-border bg-sidebar p-2 text-sidebar-foreground/60 shadow-sm md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] md:block">
        <SidebarContent pathname={pathname} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-30 md:hidden">
          <button className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-label="Close navigation backdrop" />
          <aside className="absolute inset-y-0 left-0 w-[240px] shadow-2xl">
            <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
