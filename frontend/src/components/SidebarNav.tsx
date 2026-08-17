"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart2,
  Bot,
  ChevronUp,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Ticket,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { logout } from "@/lib/api/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getAvatarSrc } from "@/lib/avatar";
import { getMyProfile } from "@/lib/api/profile";
import type { Role } from "@/types";
import { HelixLogoMark } from "@/components/HelixLogoMark";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { section?: string; items: NavItem[] };

const baseSections: NavSection[] = [
  {
    section: "Operate",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/tickets", label: "Tickets", icon: Ticket },
    ],
  },
  { section: "Intelligence", items: [{ href: "/ai", label: "HELIX", icon: Bot }] },
];

const navSections: Record<Role, NavSection[]> = {
  Employee: [...baseSections],
  Agent: [...baseSections],
  Manager: [
    { section: "Operate", items: [...baseSections[0].items, { href: "/reports", label: "Reports", icon: BarChart2 }] },
    baseSections[1],
  ],
  Admin: [
    { section: "Operate", items: [...baseSections[0].items, { href: "/reports", label: "Reports", icon: BarChart2 }] },
    baseSections[1],
    {
      section: "Administration",
      items: [
        { href: "/users", label: "Users", icon: Users },
        { href: "/activity-logs", label: "Activity", icon: ClipboardList },
        { href: "/monitoring", label: "Monitoring", icon: Activity },
      ],
    },
  ],
};

type SidebarContentProps = {
  pathname: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: () => void;
};

function SidebarContent({ pathname, collapsed = false, onCollapsedChange, onNavigate }: SidebarContentProps) {
  const router = useRouter();
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile, staleTime: 60000 });
  const role = (["Admin", "Agent", "Manager", "Employee"] as string[]).includes(profile?.role ?? "") ? profile!.role as Role : "Employee";

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    try { await logout(); } catch { /* The local session still ends. */ }
    setAccountMenuOpen(false);
    onNavigate?.();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className={`relative flex h-16 shrink-0 items-center border-b border-sidebar-border ${collapsed ? "justify-center px-2" : "gap-3 px-5"}`}>
        <HelixLogoMark className="size-10" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">HELIX AI Helpdesk</p>
            <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{profile?.companyName ?? "Your organization"}</p>
          </div>
        )}
        {onCollapsedChange && (
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className="absolute -right-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-sidebar-border bg-background text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-foreground md:flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="size-3.5" /> : <PanelLeftClose className="size-3.5" />}
          </button>
        )}
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
              {section.section && (
                <p
                  className={`mb-2 flex h-4 items-center font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 ${collapsed ? "justify-center px-0 text-sm leading-none" : "px-2"}`}
                  aria-label={collapsed ? section.section : undefined}
                  title={collapsed ? section.section : undefined}
                >
                  {collapsed ? <span aria-hidden="true">•</span> : section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  const isHelix = href === "/ai";
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onNavigate}
                      title={label}
                      className={`relative flex h-10 items-center rounded-[10px] text-sm font-semibold transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : isHelix
                            ? "border border-primary/20 bg-primary/[0.055] text-primary hover:bg-primary/10"
                            : "text-sidebar-foreground/62 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground"
                      }`}
                    >
                      {active && <span className="absolute -left-3 h-5 w-0.5 rounded-r-full bg-primary" />}
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && <span className="truncate">{label}</span>}
                      {isHelix && !collapsed && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className={`h-[76px] shrink-0 border-t border-sidebar-border ${collapsed ? "p-3" : "p-4"}`}>
        <div ref={accountMenuRef} className="relative h-full">
          {accountMenuOpen && (
            <div className={`absolute bottom-[calc(100%+0.6rem)] z-50 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl ${collapsed ? "left-0 w-52" : "inset-x-0"}`}>
              <Link
                href="/profile"
                onClick={() => {
                  setAccountMenuOpen(false);
                  onNavigate?.();
                }}
                className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <UserRound className="size-4 text-muted-foreground" />
                <span>Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors hover:bg-muted"
              >
                <LogOut className="size-4 text-muted-foreground" />
                <span>Logout</span>
              </button>
            </div>
          )}

          <div className={`flex h-full items-center ${collapsed ? "relative justify-center" : "gap-2"}`}>
            <button
              type="button"
              onClick={() => setAccountMenuOpen((open) => !open)}
              className={`min-w-0 rounded-xl text-left transition-colors hover:bg-muted ${collapsed ? "flex size-10 items-center justify-center" : "flex h-11 flex-1 items-center gap-3 px-1.5"}`}
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              title={collapsed ? profile?.fullName || "Account" : undefined}
            >
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={getAvatarSrc(profile?.avatarUrl)} alt={profile?.fullName || "User"} />
                <AvatarFallback>{getInitials(profile?.fullName || "User")}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{profile?.fullName || "Signed in user"}</span>
                    <span className="block font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{role}</span>
                  </span>
                  <ChevronUp className={`size-4 shrink-0 text-muted-foreground transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>

            {role === "Admin" && (
              <Link
                href="/settings"
                onClick={onNavigate}
                className={`flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${collapsed ? "absolute -bottom-1 -right-1 size-7 rounded-full border border-sidebar-border bg-sidebar shadow-sm" : "size-9 rounded-lg"}`}
                aria-label="Open settings"
                title="Settings"
              >
                <Settings className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type SidebarNavProps = {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function SidebarNav({ collapsed, onCollapsedChange }: SidebarNavProps) {
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
      <aside className={`fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 md:block ${collapsed ? "w-[76px]" : "w-[248px]"}`}>
        <SidebarContent pathname={pathname} collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
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
