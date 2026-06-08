"use client";

import { useMemo } from "react";
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
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

const mockTickets = [
  { id: "1", status: "open", priority: "high", category: "network", createdAt: new Date("2026-05-20") },
  { id: "2", status: "in-progress", priority: "medium", category: "hardware", createdAt: new Date("2026-05-19") },
  { id: "3", status: "resolved", priority: "low", category: "access", createdAt: new Date("2026-05-18") },
  { id: "4", status: "open", priority: "medium", category: "software", createdAt: new Date("2026-05-24") },
  { id: "5", status: "in-progress", priority: "high", category: "hardware", createdAt: new Date("2026-05-23") },
  { id: "6", status: "closed", priority: "low", category: "access", createdAt: new Date("2026-05-17") },
];

export default function ReportsPage() {
  const statusData = [
    { name: "Open", value: mockTickets.filter((t) => t.status === "open").length },
    { name: "In Progress", value: mockTickets.filter((t) => t.status === "in-progress").length },
    { name: "Resolved", value: mockTickets.filter((t) => t.status === "resolved").length },
    { name: "Closed", value: mockTickets.filter((t) => t.status === "closed").length },
  ];

  const priorityData = [
    { name: "Urgent", value: mockTickets.filter((t) => t.priority === "urgent").length },
    { name: "High", value: mockTickets.filter((t) => t.priority === "high").length },
    { name: "Medium", value: mockTickets.filter((t) => t.priority === "medium").length },
    { name: "Low", value: mockTickets.filter((t) => t.priority === "low").length },
  ];

  const categoryData = [
    { name: "Hardware", value: mockTickets.filter((t) => t.category === "hardware").length },
    { name: "Software", value: mockTickets.filter((t) => t.category === "software").length },
    { name: "Network", value: mockTickets.filter((t) => t.category === "network").length },
    { name: "Access", value: mockTickets.filter((t) => t.category === "access").length },
    { name: "Other", value: mockTickets.filter((t) => t.category === "other").length },
  ];

  const trendData = [
    { day: "Mon", created: 4, resolved: 2 },
    { day: "Tue", created: 3, resolved: 5 },
    { day: "Wed", created: 5, resolved: 3 },
    { day: "Thu", created: 2, resolved: 4 },
    { day: "Fri", created: 6, resolved: 3 },
    { day: "Sat", created: 1, resolved: 2 },
    { day: "Sun", created: 2, resolved: 1 },
  ];

  const COLORS = {
    blue: "#3b82f6",
    yellow: "#eab308",
    green: "#22c55e",
    gray: "#6b7280",
    red: "#ef4444",
    orange: "#f97316",
  };

  const statusColors = [COLORS.blue, COLORS.yellow, COLORS.green, COLORS.gray];
  const priorityColors = [COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green];

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Track performance and analyze ticket trends
          </p>
        </div>
        <Select defaultValue="7days">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">+12%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Response Time</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">-0.5 hrs</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-500">-0.2</span> from last period
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
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: { name?: string; percent?: number }) =>
                        `${entry.name ?? ""} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={statusColors[index % statusColors.length]}
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
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {priorityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={priorityColors[index % priorityColors.length]}
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
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
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
              <CardDescription>Created vs Resolved tickets over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
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
                <CardDescription>Top performing support agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Sarah Smith", tickets: 12, rating: 4.8 },
                    { name: "Mike Johnson", tickets: 10, rating: 4.6 },
                    { name: "Admin User", tickets: 8, rating: 4.5 },
                  ].map((agent, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {agent.tickets} tickets resolved
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{agent.rating}/5.0</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Metrics</CardTitle>
                <CardDescription>Average response times by priority</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { priority: "Urgent", time: "30 mins", color: "text-red-500" },
                    { priority: "High", time: "1.5 hrs", color: "text-orange-500" },
                    { priority: "Medium", time: "4 hrs", color: "text-yellow-500" },
                    { priority: "Low", time: "24 hrs", color: "text-green-500" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{item.priority}</p>
                        <p className="text-sm text-muted-foreground">Priority Level</p>
                      </div>
                      <div className={`font-semibold ${item.color}`}>
                        {item.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
