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

export function getAgentPerformance(): Promise<AgentPerformance[]> {
  return request(api.get<AgentPerformance[]>("/dashboard/agent-performance"));
}
