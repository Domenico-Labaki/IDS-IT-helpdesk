"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Users, Ticket, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">System Monitoring</h1>
          <p className="text-muted-foreground">Real-time system health and performance metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { refetchHealth(); }}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Activity className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Badge className={health?.status === "Healthy" ? "bg-green-500" : "bg-red-500"}>
              {health?.status ?? "Unknown"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Uptime: {health?.uptime ?? "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Badge className={health?.database === "Connected" ? "bg-green-500" : "bg-red-500"}>
              {health?.database ?? "Unknown"}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">{sysInfo?.version ?? "-"} / {sysInfo?.lastUpdated ?? "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users (24h)</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsersLast24h ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registered: {metrics?.totalUsers ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Activity (24h)</CardTitle>
            <Ticket className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
              <p className="text-lg font-semibold">{sysInfo?.totalTickets ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-lg font-semibold">{sysInfo?.totalUsers ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
              <p className="text-lg font-semibold">{sysInfo?.storageUsed ?? "0 MB"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Storage Limit</p>
              <p className="text-lg font-semibold">{sysInfo?.storageLimit ?? "10 GB"}</p>
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
