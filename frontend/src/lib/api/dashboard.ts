import type { AgentPerformance, ChartDataPoint, DashboardStats, PriorityCount, TicketsOverTimeEntry } from "@/types";

import { api, request } from "@/lib/api";

export function getDashboardStats(): Promise<DashboardStats> {
  return request(api.get<DashboardStats>("/dashboard/stats"));
}

export function getTicketsByCategory(): Promise<ChartDataPoint[]> {
  return request(api.get<ChartDataPoint[]>("/dashboard/tickets-by-category"));
}

export function getTicketsByPriority(): Promise<PriorityCount[]> {
  return request(api.get<PriorityCount[]>("/dashboard/tickets-by-priority"));
}

export function getTicketsByStatus(): Promise<ChartDataPoint[]> {
  return request(api.get<ChartDataPoint[]>("/dashboard/tickets-by-status"));
}

export function getTicketsOverTime(days: number): Promise<TicketsOverTimeEntry[]> {
  return request(api.get<TicketsOverTimeEntry[]>(`/dashboard/tickets-over-time?days=${days}`));
}

export type SlaComplianceData = {
  totalTickets: number;
  breachedCount: number;
  compliancePercentage: number;
  breaches: Array<{
    ticketId: string;
    referenceNumber: string;
    title: string;
    priorityName: string;
    createdAt: string;
    resolvedAt?: string | null;
    slaDeadline?: string | null;
  }>;
};

export function getSlaCompliance(from?: string, to?: string): Promise<SlaComplianceData> {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return request(api.get<SlaComplianceData>("/dashboard/sla-compliance", { params }));
}

export function getAgentPerformance(): Promise<AgentPerformance[]> {
  return request(api.get<AgentPerformance[]>("/dashboard/agent-performance"));
}

export function exportMonthlyReport(from: string, to: string, format: "excel" | "pdf"): Promise<Blob> {
  return request(api.get(`/dashboard/export/monthly?from=${from}&to=${to}&format=${format}`, { responseType: "blob" }));
}

export function exportAgentPerformance(from: string, to: string, format: "excel" | "pdf"): Promise<Blob> {
  return request(api.get(`/dashboard/export/agent-performance?from=${from}&to=${to}&format=${format}`, { responseType: "blob" }));
}
