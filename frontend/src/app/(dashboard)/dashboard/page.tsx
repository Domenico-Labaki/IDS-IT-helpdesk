"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getDashboardStats } from "@/lib/api/dashboard";
import { getTickets } from "@/lib/api/tickets";
import { getNotifications } from "@/lib/api/notifications";
import { getMyProfile } from "@/lib/api/profile";
import { getUsers } from "@/lib/api/users";
import { getSystemInfo } from "@/lib/api/settings";
import { useAuth } from "@/hooks/useAuth";
import { statusStyles } from "@/lib/ticket-styles";
import { getInitials, getAvatarSrc } from "@/lib/avatar";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TicketCheck, Clock, CheckCircle2, TrendingUp, Users, CalendarDays, UserCheck, Plus,
  ArrowRight, Bell, Activity, BarChart2, Settings,
} from "lucide-react";

const indicatorColors: Record<string, string> = {
  totalTickets: "border-t-slate-500",
  totalCreated: "border-t-blue-500",
  totalAssigned: "border-t-blue-500",
  openCount: "border-t-yellow-500",
  inProgressCount: "border-t-orange-500",
  resolvedCount: "border-t-green-500",
  unassignedCount: "border-t-orange-500",
  createdTodayCount: "border-t-red-500",
};

type KpiDef = {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  desc: string;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border p-6 space-y-3">
            <div className="h-4 w-24 rounded bg-zinc-200" />
            <div className="h-8 w-12 rounded bg-zinc-100" />
            <div className="h-3 w-32 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();

  const isManagerOrAbove = role === "Admin" || role === "Manager";
  const isAdmin = role === "Admin";

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const ticketsQuery = useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
  });

  const profileQuery = useQuery({
    queryKey: ["my-profile"],
    queryFn: getMyProfile,
  });

  const notifQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => getNotifications(true),
  });

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: isManagerOrAbove,
  });

  const sysInfoQuery = useQuery({
    queryKey: ["system-info"],
    queryFn: getSystemInfo,
    enabled: isAdmin,
  });

  const allTickets = ticketsQuery.data ?? [];
  const recentTickets = useMemo(
    () => [...allTickets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [allTickets]
  );

  if (statsQuery.isLoading) {
    return <LoadingSkeleton />;
  }

  if (statsQuery.error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm font-medium text-destructive">Unable to load dashboard data.</p>
      </div>
    );
  }

  const stats = statsQuery.data!;
  const profile = profileQuery.data;
  const unreadNotifs = notifQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];

  const activeUsers = allUsers.filter((u) => u.isActive).length;

  const getKpis = (): KpiDef[] => {
    switch (role) {
      case "Employee":
        return [
          { key: "totalCreated", label: "My Tickets", value: stats.totalCreated, icon: <TicketCheck className="h-4 w-4" />, desc: "Tickets you created" },
          { key: "openCount", label: "Open", value: stats.openCount, icon: <Clock className="h-4 w-4" />, desc: "Awaiting response" },
          { key: "resolvedCount", label: "Resolved", value: stats.resolvedCount, icon: <CheckCircle2 className="h-4 w-4" />, desc: "Successfully resolved" },
        ];
      case "Agent":
        return [
          { key: "totalAssigned", label: "Assigned", value: stats.totalAssigned, icon: <UserCheck className="h-4 w-4" />, desc: "Tickets assigned to you" },
          { key: "openCount", label: "Open", value: stats.openCount, icon: <Clock className="h-4 w-4" />, desc: "Awaiting action" },
          { key: "inProgressCount", label: "In Progress", value: stats.inProgressCount, icon: <TrendingUp className="h-4 w-4" />, desc: "Being worked on" },
          { key: "resolvedCount", label: "Resolved", value: stats.resolvedCount, icon: <CheckCircle2 className="h-4 w-4" />, desc: "Resolved by you" },
        ];
      default:
        return [
          { key: "totalTickets", label: "Total Tickets", value: stats.totalTickets, icon: <TicketCheck className="h-4 w-4" />, desc: "All time tickets" },
          { key: "openCount", label: "Open", value: stats.openCount, icon: <Clock className="h-4 w-4" />, desc: "Awaiting assignment" },
          { key: "inProgressCount", label: "In Progress", value: stats.inProgressCount, icon: <TrendingUp className="h-4 w-4" />, desc: "Being worked on" },
          { key: "resolvedCount", label: "Resolved", value: stats.resolvedCount, icon: <CheckCircle2 className="h-4 w-4" />, desc: "Successfully resolved" },
          { key: "unassignedCount", label: "Unassigned", value: stats.unassignedCount, icon: <Users className="h-4 w-4" />, desc: "Not yet assigned" },
          { key: "createdTodayCount", label: "Created Today", value: stats.createdTodayCount, icon: <CalendarDays className="h-4 w-4" />, desc: "Tickets created today" },
        ];
    }
  };

  const kpis = getKpis();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your help desk.</p>
        </div>
        {(role === "Admin" || role === "Employee") && (
          <Button onClick={() => router.push("/tickets/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.key} className={`border-t-4 ${indicatorColors[kpi.key] ?? "border-t-slate-500"}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Tickets */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Latest ticket activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tickets">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {ticketsQuery.isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 rounded bg-zinc-100" />
                <div className="h-10 rounded bg-zinc-100" />
                <div className="h-10 rounded bg-zinc-100" />
              </div>
            ) : recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No tickets yet.</p>
            ) : (
              <div className="space-y-2">
                {recentTickets.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{ticket.referenceNumber}</span>
                      <span className="flex-1 text-sm font-medium truncate">{ticket.title}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${statusStyles[ticket.statusName] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                        {ticket.statusName}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">{timeAgo(ticket.createdAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/tickets/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Ticket
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/tickets")}>
              <Activity className="mr-2 h-4 w-4" />
              View Tickets
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/profile")}>
              <Users className="mr-2 h-4 w-4" />
              My Profile
            </Button>
            {isAdmin && (
              <>
                <Separator />
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/users")}>
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notifications Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Unread updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/notifications">
                View All
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {notifQuery.isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 rounded bg-zinc-100" />
                <div className="h-10 rounded bg-zinc-100" />
              </div>
            ) : unreadNotifs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Bell className="h-8 w-8" />
                <p className="text-sm">No unread notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {unreadNotifs.slice(0, 3).map((notif) => (
                  <Link key={notif.id} href={notif.ticketId ? `/tickets/${notif.ticketId}` : "/notifications"}>
                    <div className="p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <p className="text-sm line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>My Profile</CardTitle>
            <CardDescription>Your account summary</CardDescription>
          </CardHeader>
          <CardContent>
            {profileQuery.isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-zinc-100" />
                <div className="h-4 w-32 rounded bg-zinc-100" />
              </div>
            ) : profile ? (
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-16 w-16 mb-3">
                  {profile.avatarUrl ? <AvatarImage src={getAvatarSrc(profile.avatarUrl)} alt={profile.fullName} /> : null}
                  <AvatarFallback>{getInitials(profile.fullName)}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{profile.fullName}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge variant="secondary" className="mt-2">{profile.role}</Badge>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-4 w-full text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-semibold">{stats.totalCreated}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Assigned</p>
                    <p className="font-semibold">{stats.totalAssigned}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Resolved</p>
                    <p className="font-semibold">{stats.resolvedCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="font-semibold">
                      {stats.totalAssigned > 0 ? Math.round((stats.resolvedCount / stats.totalAssigned) * 100) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Team Summary (Manager+) */}
        {isManagerOrAbove && (
          <Card>
            <CardHeader>
              <CardTitle>Team Summary</CardTitle>
              <CardDescription>User overview</CardDescription>
            </CardHeader>
            <CardContent>
              {usersQuery.isLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 rounded bg-zinc-100" />
                  <div className="h-10 rounded bg-zinc-100" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="font-semibold">{allUsers.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{activeUsers}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Inactive</span>
                    <span className="font-semibold text-muted-foreground">{allUsers.length - activeUsers}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tickets Created Today</span>
                    <span className="font-semibold">{stats.createdTodayCount}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <Link href="/users">
                      View All Users
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* System Health (Admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform status</CardDescription>
            </CardHeader>
            <CardContent>
              {sysInfoQuery.isLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-10 rounded bg-zinc-100" />
                  <div className="h-10 rounded bg-zinc-100" />
                </div>
              ) : sysInfoQuery.data ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Version</span>
                    <span className="text-sm font-mono">{sysInfoQuery.data.version}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <Badge className="bg-green-500 dark:bg-green-600 text-xs">Healthy</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Storage</span>
                    <span className="text-sm">{sysInfoQuery.data.storageUsed} / {sysInfoQuery.data.storageLimit}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Tickets</span>
                    <span className="font-semibold">{sysInfoQuery.data.totalTickets}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <Link href="/settings">
                      View System Details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">Unable to load system info.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
