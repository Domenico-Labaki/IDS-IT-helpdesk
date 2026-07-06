"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Users, Ticket, Clock, RefreshCw, Server, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { getHealthStatus, getSystemMetrics, getSystemInfo } from "@/lib/api/settings";

export default function MonitoringPage() {
  const { data: health, refetch: refetchHealth } = useQuery({
    queryKey: ["health"],
    queryFn: getHealthStatus,
    refetchInterval: 30000,
  });

  const { data: metrics } = useQuery({
    queryKey: ["metrics"],
    queryFn: getSystemMetrics,
    refetchInterval: 60000,
  });

  const { data: sysInfo } = useQuery({
    queryKey: ["system-info"],
    queryFn: getSystemInfo,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="System Monitoring" description="Real-time system health and performance metrics">
        <Button variant="outline" size="sm" onClick={() => { refetchHealth(); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${health?.status === "Healthy" ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-red-400 to-rose-400"}`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            {health?.status === "Healthy" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                health?.status === "Healthy"
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30"
                  : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${health?.status === "Healthy" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                {health?.status ?? "Unknown"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Uptime: {health?.uptime ?? "-"}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${health?.database === "Connected" ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-red-400 to-rose-400"}`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                health?.database === "Connected"
                  ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30"
                  : "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${health?.database === "Connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                {health?.database ?? "Unknown"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{sysInfo?.version ?? "-"} / {sysInfo?.lastUpdated ?? "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users (24h)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsersLast24h ?? 0}</div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all" style={{ width: `${metrics?.activeUsersLast24h && metrics?.totalUsers ? Math.min((metrics.activeUsersLast24h / metrics.totalUsers) * 100, 100) : 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total registered: {metrics?.totalUsers ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Activity (24h)</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-500">{metrics?.ticketsCreatedLast24h ?? 0}</div>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-500">{metrics?.ticketsResolvedLast24h ?? 0}</div>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Current system state</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
              <p className="text-lg font-semibold">{sysInfo?.totalTickets ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-lg font-semibold">{sysInfo?.totalUsers ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Application Version</p>
              <p className="text-lg font-semibold">{sysInfo?.version ?? "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-lg font-semibold">{sysInfo?.lastUpdated ?? "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
