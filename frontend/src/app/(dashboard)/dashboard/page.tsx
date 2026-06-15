"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { getDashboardStats, getTicketsByCategory, getTicketsByStatus, getTicketsOverTime, getAgentPerformance } from "@/lib/api/dashboard";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TicketCheck,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  CalendarDays,
  UserCheck,
  Plus,
} from "lucide-react";

const statusColors: Record<string, string> = {
  Open: "#3b82f6",
  "In Progress": "#eab308",
  Resolved: "#22c55e",
  Closed: "#71717a",
  Cancelled: "#ef4444",
};

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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-zinc-200" />
          <div className="h-48 rounded bg-zinc-100" />
        </div>
        <div className="rounded-2xl border border-border p-6 space-y-4">
          <div className="h-5 w-40 rounded bg-zinc-200" />
          <div className="h-48 rounded bg-zinc-100" />
        </div>
        <div className="rounded-2xl border border-border p-6 space-y-4 lg:col-span-2">
          <div className="h-5 w-40 rounded bg-zinc-200" />
          <div className="h-48 rounded bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { role } = useAuth();

  const isAgentOrAbove = role === "Admin" || role === "Agent" || role === "Manager";
  const isManagerOrAbove = role === "Admin" || role === "Manager";

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
  });

  const categoryQuery = useQuery({
    queryKey: ["tickets-by-category"],
    queryFn: getTicketsByCategory,
    enabled: isAgentOrAbove,
  });

  const statusQuery = useQuery({
    queryKey: ["tickets-by-status"],
    queryFn: getTicketsByStatus,
    enabled: isAgentOrAbove,
  });

  const timeQuery = useQuery({
    queryKey: ["tickets-over-time", 30],
    queryFn: () => getTicketsOverTime(30),
    enabled: isManagerOrAbove,
  });

  const agentQuery = useQuery({
    queryKey: ["agent-performance"],
    queryFn: getAgentPerformance,
    enabled: isManagerOrAbove,
  });

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

      {isAgentOrAbove && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tickets by Category</CardTitle>
              <CardDescription>Distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryQuery.isLoading ? (
                <div className="h-64 animate-pulse rounded bg-zinc-100" />
              ) : categoryQuery.data && categoryQuery.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={categoryQuery.data} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="label" width={90} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tickets by Status</CardTitle>
              <CardDescription>Current status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {statusQuery.isLoading ? (
                <div className="h-64 animate-pulse rounded bg-zinc-100" />
              ) : statusQuery.data && statusQuery.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusQuery.data}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ payload }) => `${payload.label} (${payload.count})`}
                    >
                      {statusQuery.data.map((entry) => (
                        <Cell key={entry.label} fill={statusColors[entry.label] ?? "#71717a"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>
              )}
            </CardContent>
          </Card>

          {isManagerOrAbove && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tickets Over Time</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {timeQuery.isLoading ? (
                  <div className="h-64 animate-pulse rounded bg-zinc-100" />
                ) : timeQuery.data && timeQuery.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={timeQuery.data} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No data available.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isManagerOrAbove && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>Resolution metrics by agent</CardDescription>
          </CardHeader>
          <CardContent>
            {agentQuery.isLoading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-8 rounded bg-zinc-100" />
                <div className="h-8 rounded bg-zinc-100" />
                <div className="h-8 rounded bg-zinc-100" />
              </div>
            ) : agentQuery.data && agentQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted-foreground border-b text-xs uppercase">
                    <tr>
                      <th className="px-3 py-3 font-medium">Agent</th>
                      <th className="px-3 py-3 font-medium">Assigned</th>
                      <th className="px-3 py-3 font-medium">Resolved</th>
                      <th className="px-3 py-3 font-medium">Avg Resolution Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentQuery.data.map((agent) => (
                      <tr key={agent.agentId} className="border-b last:border-b-0 hover:bg-zinc-50">
                        <td className="px-3 py-3 font-medium">{agent.agentName}</td>
                        <td className="px-3 py-3">{agent.assignedCount}</td>
                        <td className="px-3 py-3">{agent.resolvedCount}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {agent.avgResolutionHours > 0
                            ? `${agent.avgResolutionHours.toFixed(1)} hrs`
                            : "\u2014"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No agent data available.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
