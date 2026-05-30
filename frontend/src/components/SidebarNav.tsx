"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BarChart2, LayoutDashboard, LogOut, Menu, Ticket, Users, X } from "lucide-react";

import { decodeToken, getToken, removeToken } from "@/lib/auth";
import type { Role } from "@/types";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const navItems: Record<Role, NavItem[]> = {
  Employee: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/profile", label: "Profile", icon: Users },
  ],
  Agent: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/profile", label: "Profile", icon: Users },
  ],
  Manager: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/reports", label: "Reports", icon: BarChart2 },
    { href: "/profile", label: "Profile", icon: Users },
  ],
  Admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/tickets", label: "Tickets", icon: Ticket },
    { href: "/reports", label: "Reports", icon: BarChart2 },
    { href: "/users", label: "Users", icon: Users },
    { href: "/profile", label: "Profile", icon: Users },
  ],
};

const badgeClasses: Record<Role, string> = {
  Admin: "bg-red-100 text-red-700",
  Agent: "bg-blue-100 text-blue-700",
  Manager: "bg-purple-100 text-purple-700",
  Employee: "bg-green-100 text-green-700",
};

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const router = useRouter();
  const token = getToken();
  const decoded = token ? decodeToken(token) : null;
  const role = decoded?.role ?? "Employee";
  const items = navItems[role];

  const handleLogout = () => {
    removeToken();
    onNavigate?.();
    router.push("/login");
  };

  return (
    <div className="flex h-full flex-col justify-between border-r border-zinc-200 bg-white/95 px-4 py-5 backdrop-blur">
      <div>
        <div className="mb-8 flex items-center justify-between md:block">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">IT Help Desk</p>
            <p className="mt-1 text-lg font-semibold text-zinc-950">Support Console</p>
          </div>
          {onNavigate ? (
            <button className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 md:hidden" onClick={onNavigate} aria-label="Close navigation">
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
                  active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="space-y-4 border-t border-zinc-200 pt-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-950">{decoded?.name || "Signed in user"}</p>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[role]}`}>{role}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
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

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-40 rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 shadow-sm md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

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