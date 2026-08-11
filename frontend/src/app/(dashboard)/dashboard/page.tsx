"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Bell, Bot, CalendarDays, CheckCircle2, Clock, Plus,
  Settings, TicketCheck, TrendingUp, UserCheck, Users,
} from "lucide-react";

import { getDashboardStats } from "@/lib/api/dashboard";
import { getTickets } from "@/lib/api/tickets";
import { getNotifications } from "@/lib/api/notifications";
import { getMyProfile } from "@/lib/api/profile";
import { getUsers } from "@/lib/api/users";
import { useAuth } from "@/hooks/useAuth";
import { statusStyles } from "@/lib/ticket-styles";
import { getInitials, getAvatarSrc } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

type KpiDef = { key: string; label: string; value: number; icon: React.ReactNode; desc: string };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function DashboardSkeleton() {
  return (
    <div className="workspace-page animate-pulse">
      <div className="h-20 rounded-xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-56 rounded-xl bg-muted lg:col-span-2" />
        <div className="h-56 rounded-xl bg-muted" />
      </div>
      <div className="h-28 rounded-xl bg-muted" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();
  const isManagerOrAbove = role === "Admin" || role === "Manager";
  const isAdmin = role === "Admin";

  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats });
  const ticketsQuery = useQuery({ queryKey: ["tickets"], queryFn: () => getTickets() });
  const profileQuery = useQuery({ queryKey: ["my-profile"], queryFn: getMyProfile });
  const notifQuery = useQuery({ queryKey: ["notifications", "unread"], queryFn: () => getNotifications(true) });
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: getUsers, enabled: isManagerOrAbove });

  const ticketItems = ticketsQuery.data?.items;
  const recentTickets = useMemo(() => [...(ticketItems ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6), [ticketItems]);

  if (statsQuery.isLoading) return <DashboardSkeleton />;

  if (statsQuery.error) {
    return <div className="workspace-page"><PageHeader title="Dashboard" description="The operations feed could not be loaded." /><p className="text-sm text-destructive">Unable to load dashboard data.</p></div>;
  }

  const stats = statsQuery.data ?? {
    totalTickets: 0, totalCreated: 0, totalAssigned: 0, openCount: 0, inProgressCount: 0,
    resolvedCount: 0, unassignedCount: 0, createdTodayCount: 0, closedCount: 0, cancelledCount: 0,
  };
  const profile = profileQuery.data;
  const unreadNotifs = notifQuery.data ?? [];
  const allUsers = usersQuery.data ?? [];
  const activeUsers = allUsers.filter((user) => user.isActive).length;

  const kpis: KpiDef[] = role === "Employee"
    ? [
        { key: "created", label: "My tickets", value: stats.totalCreated, icon: <TicketCheck />, desc: "Created by you" },
        { key: "open", label: "Open", value: stats.openCount, icon: <Clock />, desc: "Awaiting response" },
        { key: "resolved", label: "Resolved", value: stats.resolvedCount, icon: <CheckCircle2 />, desc: "Successfully completed" },
      ]
    : role === "Agent"
      ? [
          { key: "assigned", label: "Assigned", value: stats.totalAssigned, icon: <UserCheck />, desc: "In your queue" },
          { key: "open", label: "Open", value: stats.openCount, icon: <Clock />, desc: "Awaiting action" },
          { key: "progress", label: "In progress", value: stats.inProgressCount, icon: <TrendingUp />, desc: "Currently active" },
          { key: "resolved", label: "Resolved", value: stats.resolvedCount, icon: <CheckCircle2 />, desc: "Completed by you" },
        ]
      : [
          { key: "total", label: "Total tickets", value: stats.totalTickets, icon: <TicketCheck />, desc: "All-time volume" },
          { key: "open", label: "Open", value: stats.openCount, icon: <Clock />, desc: "Awaiting assignment" },
          { key: "progress", label: "In progress", value: stats.inProgressCount, icon: <TrendingUp />, desc: "Being worked on" },
          { key: "resolved", label: "Resolved", value: stats.resolvedCount, icon: <CheckCircle2 />, desc: "Successfully completed" },
          { key: "unassigned", label: "Unassigned", value: stats.unassignedCount, icon: <Users />, desc: "Needs an owner" },
          { key: "today", label: "Created today", value: stats.createdTodayCount, icon: <CalendarDays />, desc: "New demand" },
        ];

  const helixPrompts = role === "Employee"
    ? ["Show my open tickets", "Help me create a ticket"]
    : role === "Agent"
      ? ["Show my urgent queue", "Check tickets at SLA risk"]
      : ["Summarize today’s operations", "Show unassigned critical tickets"];

  const openHelix = () => window.dispatchEvent(new CustomEvent("helix:open"));

  return (
    <div className="workspace-page">
      <PageHeader title="Operations" description={`Welcome back${profile?.fullName ? `, ${profile.fullName.split(" ")[0]}` : ""}. Here is the helpdesk signal right now.`}>
        {(role === "Admin" || role === "Employee") && <Button onClick={() => router.push("/tickets/new")}><Plus />Create ticket</Button>}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
        <section className="helix-gradient relative min-h-60 overflow-hidden rounded-2xl p-6 text-white sm:p-8">
          <div className="signal-grid pointer-events-none absolute inset-0 opacity-30" />
          <div className="absolute -right-16 -top-20 size-64 rounded-full border border-white/15" />
          <div className="absolute -right-4 -top-8 size-40 rounded-full border border-white/20" />
          <div className="relative flex h-full max-w-2xl flex-col justify-between gap-8">
            <div>
              <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />HELIX intelligence online
              </div>
              <h2 className="max-w-xl text-2xl font-semibold tracking-[-0.045em] sm:text-3xl">Move from signal to action without leaving your workspace.</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/72">Ask for live ticket context, operational summaries, or a prepared platform action. You approve every change.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {helixPrompts.map((prompt) => <button key={prompt} type="button" onClick={openHelix} className="rounded-lg border border-white/22 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/18">{prompt}</button>)}
              <button type="button" onClick={openHelix} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#0b3fbf] hover:bg-white/90"><Bot className="size-4" />Ask HELIX</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div><p className="section-label">Priority pulse</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Needs attention</h2></div>
            <span className="font-mono text-xs text-muted-foreground">{stats.unassignedCount + stats.openCount} items</span>
          </div>
          <div className="mt-5 divide-y divide-border">
            <div className="flex items-center justify-between py-3"><span className="text-sm text-muted-foreground">Unassigned queue</span><span className="font-mono text-xl font-semibold">{stats.unassignedCount}</span></div>
            <div className="flex items-center justify-between py-3"><span className="text-sm text-muted-foreground">Open tickets</span><span className="font-mono text-xl font-semibold">{stats.openCount}</span></div>
            <div className="flex items-center justify-between py-3"><span className="text-sm text-muted-foreground">Created today</span><span className="font-mono text-xl font-semibold">{stats.createdTodayCount}</span></div>
          </div>
          <Button asChild variant="outline" className="mt-4 w-full"><Link href="/tickets">Open ticket workspace <ArrowRight /></Link></Button>
        </section>
      </div>

      <section className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2 lg:grid-cols-3 xl:grid-flow-col xl:auto-cols-fr">
        {kpis.map((kpi) => (
          <div key={kpi.key} className="group flex min-h-28 items-start gap-4 border-b border-r border-border p-4 last:border-r-0 sm:p-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:text-primary [&_svg]:size-4">{kpi.icon}</div>
            <div className="min-w-0"><p className="text-xs font-semibold text-muted-foreground">{kpi.label}</p><p className="mt-1 font-mono text-2xl font-semibold tracking-tight">{kpi.value}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{kpi.desc}</p></div>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.45fr)]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div><p className="section-label">Live queue</p><h2 className="mt-1 text-base font-semibold">Recent tickets</h2></div>
            <Button variant="ghost" size="sm" asChild><Link href="/tickets">View all <ArrowRight /></Link></Button>
          </div>
          {ticketsQuery.isLoading ? <div className="h-64 animate-pulse bg-muted/40" /> : recentTickets.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No tickets yet.</p> : (
            <div className="divide-y divide-border">
              {recentTickets.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="grid gap-3 px-5 py-4 transition-colors hover:bg-accent/40 sm:grid-cols-[110px_minmax(0,1fr)_auto_auto] sm:items-center">
                  <span className="font-mono text-[10px] font-semibold text-muted-foreground">{ticket.referenceNumber}</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{ticket.title}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{ticket.categoryName} · {ticket.assignedToName ?? "Unassigned"}</p></div>
                  <span className={`w-fit rounded-md px-2 py-1 font-mono text-[9px] font-semibold uppercase ${statusStyles[ticket.statusName] ?? "bg-muted text-muted-foreground"}`}>{ticket.statusName}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{timeAgo(ticket.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between"><div><p className="section-label">Inbox</p><h2 className="mt-1 text-base font-semibold">Notifications</h2></div><Bell className="size-4 text-muted-foreground" /></div>
            <div className="mt-4 divide-y divide-border">
              {unreadNotifs.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No unread updates.</p> : unreadNotifs.slice(0, 3).map((notif) => (
                <Link key={notif.id} href={notif.ticketId ? `/tickets/${notif.ticketId}` : "/notifications"} className="block py-3 first:pt-0"><p className="line-clamp-2 text-xs leading-relaxed">{notif.message}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground">{timeAgo(notif.createdAt)} ago</p></Link>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full"><Link href="/notifications">Notification center</Link></Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <p className="section-label">Identity</p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="size-11"><AvatarImage src={getAvatarSrc(profile?.avatarUrl)} alt={profile?.fullName ?? "User"} /><AvatarFallback>{getInitials(profile?.fullName ?? "User")}</AvatarFallback></Avatar>
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{profile?.fullName}</p><p className="truncate text-xs text-muted-foreground">{profile?.email}</p></div>
              <Badge variant="secondary" className="ml-auto">{profile?.role}</Badge>
            </div>
            {isManagerOrAbove && <div className="mt-4 grid grid-cols-2 border-t border-border pt-4"><div><p className="text-xs text-muted-foreground">Active users</p><p className="mt-1 font-mono text-lg font-semibold">{activeUsers}</p></div><div><p className="text-xs text-muted-foreground">Total users</p><p className="mt-1 font-mono text-lg font-semibold">{allUsers.length}</p></div></div>}
          </section>

          <section className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => router.push("/tickets")}>Tickets</Button>
            <Button variant="outline" onClick={() => router.push("/profile")}>Profile</Button>
            {isAdmin && <><Button variant="outline" onClick={() => router.push("/users")}><Users />Users</Button><Button variant="outline" onClick={() => router.push("/settings")}><Settings />Settings</Button></>}
          </section>
        </div>
      </div>
    </div>
  );
}
