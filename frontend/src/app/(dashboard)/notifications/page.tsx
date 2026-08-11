"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getNotifications, markAsRead, markAllAsRead } from "@/lib/api/notifications";
import type { Notification } from "@/types";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { CheckCheck, Bell, MailOpen } from "lucide-react";
import { toast } from "sonner";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60000) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <div className="mt-1.5 h-2 w-2 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-zinc-200" />
            <div className="h-3 w-1/3 rounded bg-zinc-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const unreadOnly = filter === "unread";

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => getNotifications(unreadOnly),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      toast.success("All notifications marked as read");
    },
    onError: () => {
      toast.error("Failed to mark all as read");
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markOneMutation.mutate(notification.id);
    }
    if (notification.ticketId) {
      router.push(`/tickets/${notification.ticketId}`);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="workspace-page">
      <PageHeader title="Notifications" description="A chronological signal of ticket changes, assignments, and system events.">
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck />
            {markAllMutation.isPending ? "Marking..." : "Mark all as read"}
          </Button>
        )}
      </PageHeader>

      <div className="flex w-fit items-center gap-1 border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`border-b-2 px-3.5 py-2 text-sm font-semibold transition-colors ${
            filter === "all" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`border-b-2 px-3.5 py-2 text-sm font-semibold transition-colors ${
            filter === "unread" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread {unreadCount > 0 && <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-md bg-primary px-1 font-mono text-[9px] text-white">{unreadCount}</span>}
        </button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <LoadingSkeleton />
            </div>
          ) : error ? (
            <p className="text-sm font-medium text-destructive p-6">
              Unable to load notifications.
            </p>
          ) : notifications && notifications.length > 0 ? (
            <div>
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-accent/45 sm:p-5 ${
                    index < notifications.length - 1 ? "border-b border-border" : ""
                  } ${!notification.isRead ? "bg-primary/[0.04]" : ""}`}
                >
                  <div className="flex-shrink-0 mt-1.5">
                    {!notification.isRead ? (
                      <span className="flex size-2 rounded-full bg-primary ring-4 ring-primary/10" />
                    ) : (
                      <MailOpen className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.isRead ? "font-semibold" : "text-muted-foreground"}`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {notification.ticketTitle && (
                        <Link
                          href={`/tickets/${notification.ticketId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="max-w-[400px] truncate font-semibold text-primary hover:underline"
                        >
                          {notification.ticketTitle}
                        </Link>
                      )}
                      {notification.ticketReferenceNumber && (
                        <span className="font-mono text-muted-foreground/50">
                          #{notification.ticketReferenceNumber}
                        </span>
                      )}
                      <span>&bull;</span>
                      <span>{formatRelativeTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Bell className="h-12 w-12" />}
              title={filter === "unread" ? "No unread notifications" : "No notifications"}
              description={filter === "unread" ? "You're all caught up!" : "You haven't received any notifications yet."}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
