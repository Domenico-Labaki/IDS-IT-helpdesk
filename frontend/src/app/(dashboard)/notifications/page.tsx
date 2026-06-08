"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Date;
}

const initialNotifications: Notification[] = [
  {
    id: "1",
    title: "New Ticket Assigned",
    message: "You have been assigned ticket TICK-001: Unable to connect to VPN",
    type: "info",
    read: false,
    createdAt: new Date("2026-05-24T09:30:00"),
  },
  {
    id: "2",
    title: "Ticket Updated",
    message: "TICK-002 status changed to In Progress",
    type: "success",
    read: false,
    createdAt: new Date("2026-05-24T08:15:00"),
  },
  {
    id: "3",
    title: "SLA Warning",
    message: "Ticket TICK-005 is approaching SLA deadline",
    type: "warning",
    read: true,
    createdAt: new Date("2026-05-23T14:00:00"),
  },
  {
    id: "4",
    title: "System Maintenance",
    message: "Scheduled maintenance on May 26 from 2-4 AM",
    type: "info",
    read: true,
    createdAt: new Date("2026-05-22T10:00:00"),
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success("Notification marked as read");
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your ticket activities
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {unreadCount > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <CardTitle>Unread Notifications</CardTitle>
                  <Badge>{unreadCount}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications
                  .filter((n) => !n.read)
                  .map((notification) => (
                    <div key={notification.id}>
                      <div className="flex gap-4 p-4 rounded-lg bg-accent">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm">
                              {notification.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {notification.createdAt.toLocaleDateString()} at{" "}
                              {notification.createdAt.toLocaleTimeString()}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-auto p-0 text-xs"
                            >
                              Mark as read
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BellOff className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Earlier Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {notifications.filter((n) => n.read).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No read notifications
                </p>
              ) : (
                <div className="space-y-3">
                  {notifications
                    .filter((n) => n.read)
                    .map((notification, index) => (
                      <div key={notification.id}>
                        <div className="flex gap-4 p-4 rounded-lg hover:bg-accent transition-colors">
                          <div className="flex-shrink-0 mt-1 opacity-60">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 opacity-80">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">
                                {notification.createdAt.toLocaleDateString()} at{" "}
                                {notification.createdAt.toLocaleTimeString()}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-auto p-0 text-xs text-destructive"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                        {index < notifications.filter((n) => n.read).length - 1 && (
                          <Separator className="my-2" />
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifs">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifs"
                  checked={emailNotifs}
                  onCheckedChange={setEmailNotifs}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifs">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive browser notifications
                  </p>
                </div>
                <Switch
                  id="push-notifs"
                  checked={pushNotifs}
                  onCheckedChange={setPushNotifs}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>What you'll be notified about</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium">Updates</p>
                  <p className="text-xs text-muted-foreground">
                    Ticket status changes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div>
                  <p className="text-sm font-medium">Assignments</p>
                  <p className="text-xs text-muted-foreground">
                    New ticket assignments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Warnings</p>
                  <p className="text-xs text-muted-foreground">
                    SLA and deadline alerts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-gray-500" />
                <div>
                  <p className="text-sm font-medium">System</p>
                  <p className="text-xs text-muted-foreground">
                    Platform announcements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
