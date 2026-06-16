"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Activity } from "lucide-react";

import {
  getDashboardStats,
  getTicketsByCategory,
  getTicketsByPriority,
  getTicketsByStatus,
  getTicketsOverTime,
  getAgentPerformance,
  getSlaCompliance,
  exportMonthlyReport,
  exportAgentPerformance,
} from "@/lib/api/dashboard";

const COLORS = {
  blue: "#3b82f6",
  yellow: "#eab308",
  green: "#22c55e",
  gray: "#6b7280",
  red: "#ef4444",
  orange: "#f97316",
  purple: "#a855f7",
  cyan: "#06b6d4",
};

const STATUS_COLORS = [COLORS.blue, COLORS.yellow, COLORS.green, COLORS.gray, COLORS.red, COLORS.orange];
const PRIORITY_COLORS = [COLORS.green, COLORS.yellow, COLORS.orange, COLORS.red];

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse p-4 lg:p-8">
      <div className="h-8 w-48 rounded bg-zinc-200" />
      <div className="h-4 w-72 rounded bg-zinc-200" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-zinc-100" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-80 rounded-xl bg-zinc-100" />
        <div className="h-80 rounded-xl bg-zinc-100" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("30");
  const days = parseInt(period, 10);

  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats });
  const { data: categoryData, isLoading: catLoading } = useQuery({
    queryKey: ["tickets-by-category"],
    queryFn: getTicketsByCategory,
  });
  const { data: priorityData, isLoading: priLoading } = useQuery({
    queryKey: ["tickets-by-priority"],
    queryFn: getTicketsByPriority,
  });
  const { data: statusData, isLoading: stLoading } = useQuery({
    queryKey: ["tickets-by-status"],
    queryFn: getTicketsByStatus,
  });
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["tickets-over-time", days],
    queryFn: () => getTicketsOverTime(days),
  });
  const { data: agentData, isLoading: agentLoading } = useQuery({
    queryKey: ["agent-performance"],
    queryFn: getAgentPerformance,
  });

  const { data: slaData, isLoading: slaLoading } = useQuery({
    queryKey: ["sla-compliance", days],
    queryFn: () => getSlaCompliance(fmtDate(periodStart), fmtDate(today)),
  });

  const isLoading = catLoading || priLoading || stLoading || trendLoading || agentLoading || slaLoading;

  if (isLoading) return <LoadingSkeleton />;

  const today = new Date();
  const periodStart = new Date(today);
  periodStart.setDate(periodStart.getDate() - days);
  const fmtDate = (d: Date) => d.toISOString().split("T")[0];

  const handleExport = async (type: "monthly" | "agent", format: "excel" | "pdf") => {
    try {
      const blob = type === "monthly"
        ? await exportMonthlyReport(fmtDate(periodStart), fmtDate(today), format)
        : await exportAgentPerformance(fmtDate(periodStart), fmtDate(today), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${fmtDate(periodStart)}-${fmtDate(today)}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  const resolutionRate = stats?.totalTickets && stats?.resolvedCount
    ? Math.round((stats.resolvedCount / stats.totalTickets) * 100)
    : 0;

  const totalCreated = stats?.totalTickets ?? 0;
  const totalResolved = stats?.resolvedCount ?? 0;

  const avgResolutionHours = agentData && agentData.length > 0
    ? agentData.reduce((sum, a) => sum + a.avgResolutionHours, 0) / agentData.length
    : 0;

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and analyze ticket trends
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExport("monthly", "excel")}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("monthly", "pdf")}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalResolved} resolved out of {totalCreated} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionHours.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across all agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaData?.compliancePercentage ?? 100}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {slaData?.breachedCount ?? 0} breached out of {slaData?.totalTickets ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Current distribution of ticket statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData ?? []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: { label?: string; percent?: number }) =>
                        `${entry.label ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="label"
                    >
                      {(statusData ?? []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
                <CardDescription>Priority level distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priorityName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {(priorityData ?? []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tickets by Category</CardTitle>
                <CardDescription>Issue category breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Volume Trend</CardTitle>
              <CardDescription>Created vs Resolved tickets over the last {days} days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    name="Created"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Resolution metrics by agent</CardDescription>
              </CardHeader>
              <CardContent>
                {agentData && agentData.length > 0 ? (
                  <div className="space-y-4">
                    {agentData.map((agent) => (
                      <div
                        key={agent.agentId}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.resolvedCount} resolved / {agent.assignedCount} assigned
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{agent.avgResolutionHours.toFixed(1)}h</p>
                          <p className="text-xs text-muted-foreground">Avg time</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No agent data available.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Metrics</CardTitle>
                <CardDescription>Average resolution times by priority</CardDescription>
              </CardHeader>
              <CardContent>
                {priorityData && priorityData.length > 0 ? (
                  <div className="space-y-4">
                    {priorityData.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium">{item.priorityName}</p>
                          <p className="text-sm text-muted-foreground">Priority Level</p>
                        </div>
                        <div className={`font-semibold ${PRIORITY_COLORS[index % PRIORITY_COLORS.length] ? `text-[${PRIORITY_COLORS[index % PRIORITY_COLORS.length]}]` : ""}`}>
                          {item.count} tickets
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No priority data available.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
