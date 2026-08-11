"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart2, Bell, Bot, ClipboardList, LayoutDashboard, LogOut,
  Menu, Settings, Ticket, Users, X,
} from "lucide-react";

import { logout } from "@/lib/api/auth";
import { getUnreadCount } from "@/lib/api/notifications";
import { getSettings } from "@/lib/api/settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarSrc } from "@/lib/avatar";
import { getMyProfile } from "@/lib/api/profile";
import type { Role } from "@/types";
import { startSignalRConnection, stopSignalRConnection, setOnNotification, setOnUnreadCount } from "@/lib/signalr";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { section?: string; items: NavItem[] };

const baseSections: NavSection[] = [
  { section: "Operate", items: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
  ] },
  { section: "Intelligence", items: [{ href: "/ai", label: "HELIX", icon: Bot }] },
];

const personal: NavSection = {
  section: "Personal",
  items: [
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/profile", label: "Profile", icon: Users },
  ],
};

const navSections: Record<Role, NavSection[]> = {
  Employee: [...baseSections, personal],
  Agent: [...baseSections, personal],
  Manager: [
    { section: "Operate", items: [...baseSections[0].items, { href: "/reports", label: "Reports", icon: BarChart2 }] },
    baseSections[1], personal,
  ],
  Admin: [
    { section: "Operate", items: [...baseSections[0].items, { href: "/reports", label: "Reports", icon: BarChart2 }] },
    baseSections[1],
    { section: "Administration", items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/activity-logs", label: "Activity", icon: ClipboardList },
      { href: "/monitoring", label: "Monitoring", icon: Activity },
      { href: "/settings", label: "Settings", icon: Settings },
    ] },
    personal,
  ],
};

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter();
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile, staleTime: 60000 });
  const role = (["Admin", "Agent", "Manager", "Employee"] as string[]).includes(profile?.role ?? "") ? profile!.role as Role : "Employee";
  const { data: settings } = useQuery({ queryKey: ["sidebar-settings"], queryFn: getSettings, staleTime: 120000 });
  const { data: unreadData, refetch: refetchUnread } = useQuery({ queryKey: ["unread-count"], queryFn: getUnreadCount, refetchInterval: 30000 });

  useEffect(() => {
    startSignalRConnection();
    setOnNotification(() => void refetchUnread());
    setOnUnreadCount(() => void refetchUnread());
    return () => { void stopSignalRConnection(); };
  }, [refetchUnread]);

  const handleLogout = async () => {
    try { await logout(); } catch { /* The local session still ends. */ }
    onNavigate?.();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-4 md:justify-center md:px-3 xl:justify-start xl:px-5">
        <div className="helix-gradient relative flex size-10 shrink-0 items-center justify-center rounded-xl text-white">
          <span className="absolute inset-[5px] rounded-full border border-white/35" />
          <span className="size-2 rounded-full bg-white" />
        </div>
        <div className="sidebar-copy min-w-0">
          <p className="truncate text-sm font-semibold">{settings?.companyName ?? "IT Help Desk"}</p>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Powered by HELIX</p>
        </div>
        {onNavigate && (
          <button type="button" onClick={onNavigate} className="ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden" aria-label="Close navigation">
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-6">
          {navSections[role].map((section) => (
            <section key={section.section}>
              {section.section && <p className="sidebar-copy mb-2 px-2 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">{section.section}</p>}
              <div className="space-y-1">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  const isHelix = href === "/ai";
                  const unread = label === "Notifications" ? unreadData?.count ?? 0 : 0;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      title={label}
                      className={`relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors md:justify-center xl:justify-start ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : isHelix
                            ? "border border-primary/20 bg-primary/[0.055] text-primary hover:bg-primary/10"
                            : "text-sidebar-foreground/62 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground"
                      }`}
                    >
                      {active && <span className="absolute -left-3 h-5 w-0.5 rounded-r-full bg-primary" />}
                      <Icon className="size-4 shrink-0" />
                      <span className="sidebar-copy truncate">{label}</span>
                      {isHelix && <span className="sidebar-copy ml-auto size-1.5 rounded-full bg-primary" />}
                      {unread > 0 && <span className="ml-auto min-w-5 rounded-md bg-primary px-1.5 py-0.5 text-center font-mono text-[9px] text-white md:absolute md:right-1 md:top-1 md:size-2 md:min-w-0 md:p-0 xl:static xl:size-auto xl:min-w-5 xl:px-1.5 xl:py-0.5">{unread > 99 ? "99+" : unread}</span>}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3 xl:p-4">
        <div className="flex items-center gap-3 md:justify-center xl:justify-start">
          <Avatar className="size-9">
            <AvatarImage src={getAvatarSrc(profile?.avatarUrl)} alt={profile?.fullName || "User"} />
            <AvatarFallback>{getInitials(profile?.fullName || "User")}</AvatarFallback>
          </Avatar>
          <div className="sidebar-copy min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">{profile?.fullName || "Signed in user"}</p>
            <p className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{role}</p>
          </div>
          <button type="button" onClick={handleLogout} title="Log out" className="sidebar-copy rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Log out">
            <LogOut className="size-4" />
          </button>
        </div>
        {settings?.supportEmail && <p className="sidebar-copy mt-3 truncate px-1 font-mono text-[9px] text-muted-foreground/70">{settings.supportEmail}</p>}
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

  if (!mounted) return null;

  return (
    <>
      {!open && (
        <button type="button" className="fixed left-3 top-3 z-40 flex size-10 items-center justify-center rounded-[10px] border border-border bg-background text-muted-foreground md:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
      )}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] md:block xl:w-[248px]">
        <SidebarContent pathname={pathname} />
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-label="Close navigation backdrop" />
          <aside className="absolute inset-y-0 left-0 w-[286px] shadow-2xl">
            <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
