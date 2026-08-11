"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Bot, Command, Moon, Sun } from "lucide-react";

import { getUnreadCount } from "@/lib/api/notifications";
import { getMyProfile } from "@/lib/api/profile";
import { getInitials, getAvatarSrc } from "@/lib/avatar";
import { useTheme } from "@/lib/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const pageNames: Record<string, string> = {
  "/dashboard": "Operations overview",
  "/tickets": "Ticket workspace",
  "/ai": "HELIX intelligence",
  "/reports": "Reports & analytics",
  "/users": "User administration",
  "/activity-logs": "Audit activity",
  "/monitoring": "System monitoring",
  "/settings": "System settings",
  "/notifications": "Notifications",
  "/profile": "Personal workspace",
};

function resolvePageName(pathname: string) {
  if (pathname === "/tickets/new") return "Create ticket";
  if (/^\/tickets\/[^/]+\/edit$/.test(pathname)) return "Edit ticket";
  if (/^\/tickets\/[^/]+$/.test(pathname)) return "Ticket command view";
  return pageNames[pathname] ?? "IT operations";
}

export function WorkspaceTopbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile, staleTime: 60000 });
  const { data: unread } = useQuery({ queryKey: ["unread-count"], queryFn: getUnreadCount, refetchInterval: 30000 });

  const openHelix = () => window.dispatchEvent(new CustomEvent("helix:open"));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openHelix();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 pl-16 backdrop-blur-xl md:px-5 md:pl-5 lg:px-8">
      <div className="min-w-0 shrink-0">
        <p className="section-label hidden sm:block">Active workspace</p>
        <p className="truncate text-sm font-semibold">{resolvePageName(pathname)}</p>
      </div>

      <button
        type="button"
        onClick={openHelix}
        className="group mx-auto flex h-10 min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.045] px-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        aria-label="Open HELIX command center"
      >
        <span className="helix-gradient flex size-6 shrink-0 items-center justify-center rounded-lg text-white">
          <Bot className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground sm:text-sm">
          Ask HELIX about tickets, teams, or platform actions
        </span>
        <span className="hidden items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
          <Command className="size-3" />K
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
        <Button asChild variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <Link href="/notifications">
            <Bell />
            {(unread?.count ?? 0) > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />}
          </Link>
        </Button>
        <Link href="/profile" className="ml-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <Avatar className="size-8">
            <AvatarImage src={getAvatarSrc(profile?.avatarUrl)} alt={profile?.fullName || "User"} />
            <AvatarFallback>{getInitials(profile?.fullName || "User")}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
