"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, BarChart2, Bell, Bot, ClipboardList, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, Ticket, Users, X } from "lucide-react";

import { logout } from "@/lib/api/auth";
import { getUnreadCount } from "@/lib/api/notifications";
import { getSettings } from "@/lib/api/settings";
import { useTheme } from "@/lib/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarSrc } from "@/lib/avatar";
import { getMyProfile } from "@/lib/api/profile";
import type { Role } from "@/types";
import { startSignalRConnection, stopSignalRConnection, setOnNotification, setOnUnreadCount } from "@/lib/signalr";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { section?: string; items: NavItem[] };

const navSections: Record<Role, NavSection[]> = {
  Employee: [
    {
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/tickets", label: "Tickets", icon: Ticket },
      ],
    },
    {
      section: "AI",
      items: [
        { href: "/ai", label: "HELIX AI", icon: Bot },
      ],
    },
    {
      section: "Personal",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: Users },
      ],
    },
  ],
  Agent: [
    {
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/tickets", label: "Tickets", icon: Ticket },
      ],
    },
    {
      section: "AI",
      items: [
        { href: "/ai", label: "HELIX AI", icon: Bot },
      ],
    },
    {
      section: "Personal",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: Users },
      ],
    },
  ],
  Manager: [
    {
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/tickets", label: "Tickets", icon: Ticket },
        { href: "/reports", label: "Reports", icon: BarChart2 },
      ],
    },
    {
      section: "AI",
      items: [
        { href: "/ai", label: "HELIX AI", icon: Bot },
      ],
    },
    {
      section: "Personal",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: Users },
      ],
    },
  ],
  Admin: [
    {
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/tickets", label: "Tickets", icon: Ticket },
        { href: "/reports", label: "Reports", icon: BarChart2 },
      ],
    },
    {
      section: "AI",
      items: [
        { href: "/ai", label: "HELIX AI", icon: Bot },
      ],
    },
    {
      section: "Administration",
      items: [
        { href: "/users", label: "Users", icon: Users },
        { href: "/activity-logs", label: "Activity Logs", icon: ClipboardList },
      ],
    },
    {
      section: "System",
      items: [
        { href: "/monitoring", label: "Monitoring", icon: Activity },
        { href: "/settings", label: "Settings", icon: Settings },
      ],
    },
    {
      section: "Personal",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/profile", label: "Profile", icon: Users },
      ],
    },
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
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
    staleTime: 60000,
  });
  const role = (["Admin", "Agent", "Manager", "Employee"] as string[]).includes(profile?.role ?? "")
    ? profile!.role as Role
    : "Employee";
  const sections = navSections[role];

  const { data: settings } = useQuery({
    queryKey: ["sidebar-settings"],
    queryFn: getSettings,
    staleTime: 120000,
  });

  const companyName = settings?.companyName ?? "IT Help Desk";
  const supportEmail = settings?.supportEmail;

  const { data: unreadData, refetch: refetchUnread } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
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
  }, [refetchUnread]);

  const handleLogout = async () => {
    try { await logout(); } catch { /* Local navigation still ends this browser session. */ }
    onNavigate?.();
    router.push("/login");
  };

  let itemIndex = 0;

  return (
    <div className="flex h-full flex-col justify-between border-r border-sidebar-border bg-sidebar/95 px-4 py-5 backdrop-blur">
      <div>
        <div className="mb-8 flex items-center justify-between md:block">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-b from-primary to-primary/80 shadow-lg shadow-black/10 flex items-center justify-center shrink-0">
              <Ticket className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/60">{companyName}</p>
              <p className="mt-0.5 text-lg font-semibold text-sidebar-foreground">Support Console</p>
            </div>
          </div>
          {onNavigate ? (
            <button className="rounded-lg p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent md:hidden" onClick={onNavigate} aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
        <nav className="space-y-5">
          {sections.map((section, si) => (
            <div key={si}>
              {section.section && (
                <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                  {section.section}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  const idx = itemIndex++;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-slide-up ${
                        active
                          ? "bg-zinc-900 text-white dark:bg-sidebar-primary dark:text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                      style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                      {label === "Notifications" && unreadCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white leading-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
      {supportEmail && (
        <div className="px-3 pb-2">
          <p className="text-xs text-sidebar-foreground/40 truncate">Contact: {supportEmail}</p>
        </div>
      )}
      <div className="space-y-4 border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={getAvatarSrc(profile?.avatarUrl)} alt={profile?.fullName || "User"} />
            <AvatarFallback>{getInitials(profile?.fullName || "User")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{profile?.fullName || "Signed in user"}</p>
            <div className="flex items-center gap-2">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClasses[role]}`}>{role}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="relative rounded-full p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
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
