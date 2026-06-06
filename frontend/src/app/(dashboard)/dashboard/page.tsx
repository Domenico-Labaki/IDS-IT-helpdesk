"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getTickets } from "@/lib/api/tickets";
import type { Role, Ticket } from "@/types";
import { decodeToken, getToken } from "@/lib/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

  const token = typeof window !== "undefined" ? getToken() : undefined;
  const decoded = token ? decodeToken(token) : null;
  const role = decoded?.role as Role | undefined;
  const currentUserId = decoded?.userId;

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

  const myCount = useMemo(
    () => tickets.filter((t) => t.createdBy === currentUserId).length,
    [tickets, currentUserId]
  );

  const unassignedCount = useMemo(
    () => tickets.filter((t) => !t.assignedTo).length,
    [tickets]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        {(role === "Admin" || role === "Employee") && (
          <Button onClick={() => router.push("/tickets/new")}>Create Ticket</Button>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-muted-foreground">Open Tickets</p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{openCount}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-sm font-medium text-muted-foreground">
                {role === "Employee" ? "My Tickets" : "Total Tickets"}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {role === "Employee" ? myCount : tickets.length}
              </p>
            </CardContent>
          </Card>

          {(role === "Admin" || role === "Agent") && (
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{unassignedCount}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
