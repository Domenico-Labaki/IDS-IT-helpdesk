"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { getTickets } from "@/lib/api/tickets";
import type { Role, Ticket } from "@/types";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TicketCheck,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { priorityStyles, statusStyles } from "@/lib/ticket-styles";

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      <div className="rounded-xl border border-zinc-200 p-6 space-y-3">
        <div className="h-4 w-24 rounded bg-zinc-200" />
        <div className="h-8 w-12 rounded bg-zinc-100" />
      </div>
      <div className="rounded-xl border border-zinc-200 p-6 space-y-3">
        <div className="h-4 w-20 rounded bg-zinc-200" />
        <div className="h-8 w-12 rounded bg-zinc-100" />
      </div>
      <div className="rounded-xl border border-zinc-200 p-6 space-y-3">
        <div className="h-4 w-24 rounded bg-zinc-200" />
        <div className="h-8 w-12 rounded bg-zinc-100" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { role, currentUserId } = useAuth();

  useEffect(() => {
    let mounted = true;

    getTickets()
      .then((data) => {
        if (mounted) setTickets(data);
      })
      .catch(() => {
        if (mounted) setError("Unable to load dashboard data.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openCount = useMemo(
    () => tickets.filter((t) => t.statusName === "Open").length,
    [tickets]
  );

  const inProgressCount = useMemo(
    () => tickets.filter((t) => t.statusName === "In Progress").length,
    [tickets]
  );

  const resolvedCount = useMemo(
    () => tickets.filter((t) => t.statusName === "Resolved").length,
    [tickets]
  );

  const myCount = useMemo(
    () => tickets.filter((t) => t.createdBy === currentUserId).length,
    [tickets, currentUserId]
  );

  const unassignedCount = useMemo(
    () => tickets.filter((t) => !t.assignedTo).length,
    [tickets]
  );

  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  const highPriorityTickets = useMemo(
    () =>
      tickets.filter(
        (t) => t.priorityName === "High" || t.priorityName === "Critical"
      ).slice(0, 3),
    [tickets]
  );

  const getStatusBadge = (statusName: string) => {
    const classes = statusStyles[statusName] ?? "bg-zinc-100 text-zinc-700";
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
      >
        {statusName}
      </span>
    );
  };

  const getPriorityBadge = (priorityName: string) => {
    const classes = priorityStyles[priorityName] ?? "bg-zinc-100 text-zinc-700";
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
      >
        {priorityName}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your help desk.
          </p>
        </div>
        {(role === "Admin" || role === "Employee") && (
          <Button onClick={() => router.push("/tickets/new")}>Create Ticket</Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <TicketCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.length}</div>
                <p className="text-xs text-muted-foreground mt-1">All time tickets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resolvedCount}</div>
                <p className="text-xs text-muted-foreground mt-1">Successfully resolved</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Tickets</CardTitle>
                    <CardDescription>Latest support requests</CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/tickets">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No tickets yet.
                    </p>
                  ) : (
                    recentTickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                        className="block"
                      >
                        <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {ticket.referenceNumber}
                              </span>
                              {getPriorityBadge(ticket.priorityName)}
                            </div>
                            <h4 className="font-semibold mb-1 truncate">
                              {ticket.title}
                            </h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {ticket.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{ticket.createdByName}</span>
                              <span>&bull;</span>
                              <span>
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {getStatusBadge(ticket.statusName)}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full justify-start">
                    <Link href="/tickets/new">
                      <TicketCheck className="mr-2 h-4 w-4" />
                      Create New Ticket
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/tickets">
                      <Clock className="mr-2 h-4 w-4" />
                      View All Tickets
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link href="/reports">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Reports
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Priority Alerts</CardTitle>
                  <CardDescription>High priority items</CardDescription>
                </CardHeader>
                <CardContent>
                  {highPriorityTickets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No priority alerts.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {highPriorityTickets.map((ticket) => (
                        <Link
                          key={ticket.id}
                          href={`/tickets/${ticket.id}`}
                          className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {ticket.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {ticket.referenceNumber} &bull; {ticket.priorityName}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
