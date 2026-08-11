"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRef, useState } from "react";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
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
import { TrendingUp, TrendingDown, Activity, FileSpreadsheet, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
import { PageHeader } from "@/components/PageHeader";

const COLORS = {
  blue: "#1769ff",
  yellow: "#69a7ff",
  green: "#4e8eff",
  gray: "#94a3b8",
  red: "#0b3fbf",
  orange: "#78afff",
  purple: "#345dcc",
  cyan: "#9ac1ff",
};

const STATUS_COLORS = [COLORS.blue, COLORS.yellow, COLORS.green, COLORS.gray, COLORS.red, COLORS.orange];
const PRIORITY_COLORS = [COLORS.green, COLORS.yellow, COLORS.orange, COLORS.red];

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-4 lg:p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("30");
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const [animateCharts, setAnimateCharts] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const trendsRef = useRef<HTMLDivElement>(null);
  const perfRef = useRef<HTMLDivElement>(null);
  const days = parseInt(period, 10);
  const today = new Date();
  const periodStart = new Date(today);
  periodStart.setDate(periodStart.getDate() - days);
  const fmtDate = (d: Date) => d.toISOString().split("T")[0];

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: getDashboardStats, staleTime: 60000 });
  const { data: categoryData, isLoading: catLoading } = useQuery({
    queryKey: ["tickets-by-category"],
    queryFn: getTicketsByCategory,
    staleTime: 60000,
  });
  const { data: priorityData, isLoading: priLoading } = useQuery({
    queryKey: ["tickets-by-priority"],
    queryFn: getTicketsByPriority,
    staleTime: 60000,
  });
  const { data: statusData, isLoading: stLoading } = useQuery({
    queryKey: ["tickets-by-status"],
    queryFn: getTicketsByStatus,
    staleTime: 60000,
  });
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ["tickets-over-time", days],
    queryFn: () => getTicketsOverTime(days),
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });
  const { data: agentData, isLoading: agentLoading } = useQuery({
    queryKey: ["agent-performance"],
    queryFn: getAgentPerformance,
    staleTime: 60000,
  });

  const { data: slaData, isLoading: slaLoading } = useQuery({
    queryKey: ["sla-compliance", days],
    queryFn: () => getSlaCompliance(fmtDate(periodStart), fmtDate(today)),
    placeholderData: keepPreviousData,
    staleTime: 60000,
  });

  const isLoading = statsLoading || catLoading || priLoading || stLoading || trendLoading || agentLoading || slaLoading;

  if (isLoading) return <LoadingSkeleton />;

  const waitForRecharts = () =>
    new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 300)));

  const captureNode = async (node: HTMLElement) => {
    const originalStyle = node.getAttribute("style");
    node.style.overflow = "visible";
    node.style.backgroundColor = "#ffffff";
    node.style.color = "#111827";
    node.style.setProperty("--foreground", "#111827");
    node.style.setProperty("--card", "#ffffff");
    node.style.setProperty("--card-foreground", "#111827");
    node.style.setProperty("--muted-foreground", "#667085");
    node.style.setProperty("--border", "#e5e7eb");
    const w = node.scrollWidth;
    const h = node.scrollHeight;
    try {
      const dataUrl = await domtoimage.toPng(node, {
        bgcolor: "#ffffff",
        width: w,
        height: h,
        style: { width: `${w}px`, height: `${h}px` },
      });
      return { dataUrl, width: w, height: h };
    } finally {
      if (originalStyle === null) node.removeAttribute("style");
      else node.setAttribute("style", originalStyle);
    }
  };

  const handleExport = async (type: "monthly" | "agent", format: "excel" | "pdf") => {
    const filename = `${type}-report-${fmtDate(periodStart)}-${fmtDate(today)}`;
    setIsExporting(true);
    if (format === "pdf") {
      setAnimateCharts(false);
      try {
        await new Promise((r) => requestAnimationFrame(r));
        const prevTab = activeTab;

        const captureSectionsIn = async (container: HTMLElement) => {
          const items = container.querySelectorAll<HTMLElement>("[data-pdf-section]");
          for (const item of items) {
            sections.push(await captureNode(item));
          }
        };

        const sections: { dataUrl: string; width: number; height: number }[] = [];

        const statsEl = statsRef.current;
        if (statsEl) sections.push(await captureNode(statsEl));

        const tabDefs = [
          { value: "overview", ref: overviewRef },
          { value: "trends", ref: trendsRef },
          { value: "performance", ref: perfRef },
        ];

        for (const tab of tabDefs) {
          setActiveTab(tab.value);
          await waitForRecharts();
          const el = tab.ref.current;
          if (el) await captureSectionsIn(el);
        }

        setActiveTab(prevTab);

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 5;
        const usableWidth = pageWidth - 2 * margin;
        let y = margin;

        for (const section of sections) {
          const sectionPdfHeight = (section.height * usableWidth) / section.width;
          if (y + sectionPdfHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.addImage(section.dataUrl, "PNG", margin, y, usableWidth, sectionPdfHeight);
          y += sectionPdfHeight + 5;
        }

        pdf.save(`${filename}.pdf`);
      } catch (error) {
        toast.error("Failed to generate PDF. Check console for details.");
        console.error("PDF export error:", error);
      } finally {
        setAnimateCharts(true);
        setIsExporting(false);
      }
      return;
    }
    try {
      const blob = type === "monthly"
        ? await exportMonthlyReport(fmtDate(periodStart), fmtDate(today), format)
        : await exportAgentPerformance(fmtDate(periodStart), fmtDate(today), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Failed to export Excel report.");
      console.error("Excel export error:", error);
    } finally {
      setIsExporting(false);
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
    <div className="workspace-page">
      <PageHeader title="Reports & analytics" description="Read performance, workload, and SLA signals from one analytical canvas.">
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
          <Button variant="outline" onClick={() => handleExport("monthly", "excel")} disabled={isExporting}>
            <FileSpreadsheet /> {isExporting ? "Exporting..." : "Excel"}
          </Button>
          <Button variant="outline" onClick={() => handleExport("monthly", "pdf")} disabled={isExporting}>
            <FileText /> {isExporting ? "Exporting..." : "PDF"}
          </Button>
        </div>
      </PageHeader>

      <div ref={reportRef} className="space-y-6">

      <div ref={statsRef} data-pdf-section className="grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-4">
        <Card className="rounded-none border-0 border-r border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalResolved} resolved out of {totalCreated} total
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 border-r border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Resolution Time</CardTitle>
            <Activity className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionHours.toFixed(1)} hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Average across all agents
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0 border-r border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <TrendingDown className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently unresolved
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-none border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <Activity className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{slaData?.compliancePercentage ?? 100}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {slaData?.breachedCount ?? 0} breached out of {slaData?.totalTickets ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" ref={overviewRef} className="space-y-4">
          <div data-pdf-section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Status</CardTitle>
                <CardDescription>Current distribution of ticket statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      isAnimationActive={animateCharts}
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
                    <Bar isAnimationActive={animateCharts} dataKey="count" radius={[8, 8, 0, 0]}>
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
          </div>
          <div data-pdf-section>
            <Card>
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
                    <Bar isAnimationActive={animateCharts} dataKey="count" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" ref={trendsRef} className="space-y-4">
          <Card data-pdf-section>
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
                    isAnimationActive={animateCharts}
                    type="monotone"
                    dataKey="created"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    name="Created"
                  />
                  <Line
                    isAnimationActive={animateCharts}
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

        <TabsContent value="performance" ref={perfRef} className="space-y-4">
          <div data-pdf-section className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
