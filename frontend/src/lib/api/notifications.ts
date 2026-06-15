import type { Notification, UnreadCount } from "@/types";

import { api, request } from "@/lib/api";

export function getNotifications(unreadOnly?: boolean): Promise<Notification[]> {
  const params = unreadOnly ? "?unreadOnly=true" : "";
  return request(api.get<Notification[]>(`/notifications${params}`));
}

export function getUnreadCount(): Promise<UnreadCount> {
  return request(api.get<UnreadCount>("/notifications/unread-count"));
}

export function markAsRead(id: string): Promise<void> {
  return request(api.patch(`/notifications/${id}/read`));
}

export function markAllAsRead(): Promise<void> {
  return request(api.patch("/notifications/read-all"));
}
