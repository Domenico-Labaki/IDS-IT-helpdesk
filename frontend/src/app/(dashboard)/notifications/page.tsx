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
import { CheckCheck, Bell, Mail, MailOpen } from "lucide-react";
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
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Stay updated with your ticket activities">
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            {markAllMutation.isPending ? "Marking..." : "Mark All as Read"}
          </Button>
        )}
      </PageHeader>

      <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/20 p-1 w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
            filter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
            filter === "unread" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread {unreadCount > 0 && <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">{unreadCount}</span>}
        </button>
      </div>

      <Card>
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
                  className={`flex items-start gap-4 p-4 cursor-pointer transition-all hover:bg-accent group ${
                    index < notifications.length - 1 ? "border-b border-border" : ""
                  } ${!notification.isRead ? "bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/10" : ""}`}
                >
                  <div className="flex-shrink-0 mt-1.5">
                    {!notification.isRead ? (
                      <span className="flex h-2 w-2 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-800" />
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
                          className="hover:underline text-blue-600 dark:text-blue-400 truncate max-w-[400px]"
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
