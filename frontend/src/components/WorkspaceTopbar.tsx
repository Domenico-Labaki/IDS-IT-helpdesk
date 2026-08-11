"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Bell, Bot, Command, Loader2, Moon, Send, Sun } from "lucide-react";

import { useAiAgent } from "@/components/ai/AiAgentProvider";
import { getNotifications, getUnreadCount, markAsRead } from "@/lib/api/notifications";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
import { setOnNotification, setOnUnreadCount, startSignalRConnection, stopSignalRConnection } from "@/lib/signalr";

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

function formatRelativeTime(dateString: string) {
  const elapsed = Date.now() - new Date(dateString).getTime();
  if (elapsed < 60_000) return "Now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function WorkspaceTopbar() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const helixInputRef = useRef<HTMLInputElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helixPrompt, setHelixPrompt] = useState("");
  const { streaming, sendMessage } = useAiAgent();
  const { theme, toggleTheme } = useTheme();
  const { data: unread, refetch: refetchUnread } = useQuery({ queryKey: ["unread-count"], queryFn: getUnreadCount, refetchInterval: 30000 });
  const { data: notifications, isLoading: notificationsLoading, isError: notificationsError } = useQuery({
    queryKey: ["notifications", false],
    queryFn: () => getNotifications(false),
    enabled: notificationsOpen,
    staleTime: 15000,
  });
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const openHelix = useCallback(() => {
    if (pathname === "/ai") {
      document.getElementById("helix-workspace-input")?.focus();
      return;
    }
    window.dispatchEvent(new CustomEvent("helix:open"));
  }, [pathname]);

  const submitHelixPrompt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = helixPrompt.trim();
    if (!message || streaming) return;

    setHelixPrompt("");
    if (pathname !== "/ai") openHelix();
    await sendMessage(message);
  };

  useEffect(() => {
    void startSignalRConnection();
    setOnNotification(() => {
      void refetchUnread();
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    setOnUnreadCount(() => void refetchUnread());

    return () => {
      setOnNotification(null);
      setOnUnreadCount(null);
      stopSignalRConnection();
    };
  }, [queryClient, refetchUnread]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        helixInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!notificationsRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotificationsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  const previewNotifications = notifications?.slice(0, 5) ?? [];

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 pl-16 backdrop-blur-xl md:px-5 md:pl-5 lg:px-8">
      <div className="min-w-0 shrink-0">
        <p className="section-label hidden sm:block">Active workspace</p>
        <p className="truncate text-sm font-semibold">{resolvePageName(pathname)}</p>
      </div>

      <form
        onSubmit={(event) => void submitHelixPrompt(event)}
        className="group mx-auto flex h-10 min-w-0 max-w-2xl flex-1 items-center gap-2 rounded-xl border border-primary/20 bg-primary/[0.045] px-2 transition-colors focus-within:border-primary/40 focus-within:bg-primary/[0.075] focus-within:ring-2 focus-within:ring-primary/15"
        role="search"
        aria-label="Ask HELIX"
      >
        <button
          type="button"
          onClick={openHelix}
          className="helix-gradient flex size-7 shrink-0 items-center justify-center rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Open HELIX conversation"
        >
          <Bot className="size-3.5" />
        </button>
        <input
          ref={helixInputRef}
          value={helixPrompt}
          onChange={(event) => setHelixPrompt(event.target.value)}
          disabled={streaming}
          maxLength={4000}
          placeholder={streaming ? "HELIX is responding..." : "Ask HELIX about this workspace..."}
          className="min-w-0 flex-1 bg-transparent text-xs font-medium text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
          aria-label="Ask HELIX about this workspace"
        />
        {helixPrompt.trim() ? (
          <button
            type="submit"
            disabled={streaming}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/88 disabled:opacity-50"
            aria-label="Send message to HELIX"
          >
            {streaming ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </button>
        ) : (
          <span className="hidden items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground sm:flex">
            <Command className="size-3" />K
          </span>
        )}
      </form>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>

        <div ref={notificationsRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-label="Open notifications preview"
            aria-haspopup="dialog"
            aria-expanded={notificationsOpen}
          >
            <Bell />
            {(unread?.count ?? 0) > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />}
          </Button>

          {notificationsOpen && (
            <div
              role="dialog"
              aria-label="Recent notifications"
              className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
            >
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <div>
                  <p className="text-sm font-semibold">Notifications</p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Recent platform signals</p>
                </div>
                {(unread?.count ?? 0) > 0 && (
                  <span className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[10px] font-semibold text-primary">
                    {unread!.count > 99 ? "99+" : unread!.count} unread
                  </span>
                )}
              </div>

              <div className="max-h-[360px] overflow-y-auto p-1.5">
                {notificationsLoading ? (
                  <div className="space-y-1">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex animate-pulse gap-3 rounded-xl px-3 py-3">
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/20" />
                        <span className="min-w-0 flex-1 space-y-2">
                          <span className="block h-3 w-full rounded bg-muted" />
                          <span className="block h-2.5 w-2/5 rounded bg-muted/70" />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : notificationsError ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">Notifications are temporarily unavailable.</p>
                ) : previewNotifications.length > 0 ? (
                  <div className="space-y-1">
                    {previewNotifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.ticketId ? `/tickets/${notification.ticketId}` : "/notifications"}
                        onClick={() => {
                          setNotificationsOpen(false);
                          if (!notification.isRead) markReadMutation.mutate(notification.id);
                        }}
                        className={`flex gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted ${notification.isRead ? "text-muted-foreground" : "bg-primary/[0.045]"}`}
                      >
                        <span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-muted-foreground/25" : "bg-primary ring-4 ring-primary/10"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`line-clamp-2 text-xs leading-5 ${notification.isRead ? "font-medium" : "font-semibold text-foreground"}`}>{notification.message}</span>
                          <span className="mt-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/70">
                            {notification.ticketReferenceNumber && <span>#{notification.ticketReferenceNumber}</span>}
                            {notification.ticketReferenceNumber && <span aria-hidden="true">•</span>}
                            <span>{formatRelativeTime(notification.createdAt)}</span>
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-9 text-center">
                    <span className="mx-auto mb-3 flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Bell className="size-4" />
                    </span>
                    <p className="text-sm font-semibold">No notifications yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">New platform activity will appear here.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-2">
                <Link
                  href="/notifications"
                  onClick={() => setNotificationsOpen(false)}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.07]"
                >
                  View all notifications
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
