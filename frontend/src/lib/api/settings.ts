import type { User } from "@/types";

import { api, request } from "@/lib/api";

export function getSettings(): Promise<Record<string, string>> {
  return request(api.get<Record<string, string>>("/admin/settings"));
}

export function updateSettings(settings: { key: string; value: string }[]): Promise<void> {
  return request(api.put("/admin/settings", { settings }));
}

export type EmailTemplate = {
  id: number;
  name: string;
  subject: string;
  body: string;
};

export function getEmailTemplates(): Promise<EmailTemplate[]> {
  return request(api.get<EmailTemplate[]>("/admin/email-templates"));
}

export function updateEmailTemplate(id: number, data: { subject: string; body: string }): Promise<void> {
  return request(api.put(`/admin/email-templates/${id}`, data));
}

export type SystemInfo = {
  version: string;
  lastUpdated: string;
  databaseStatus: string;
  totalUsers: number;
  totalTickets: number;
};

export function getSystemInfo(): Promise<SystemInfo> {
  return request(api.get<SystemInfo>("/admin/system/info"));
}

export function updateUserRole(userId: string, roleId: number): Promise<User> {
  return request(api.patch<User>(`/users/${userId}/role`, { roleId }));
}

export function updateUser(userId: string, data: { fullName: string; email: string; department?: string }): Promise<User> {
  return request(api.put<User>(`/users/${userId}`, data));
}

export function deleteUser(userId: string): Promise<void> {
  return request(api.delete(`/users/${userId}`));
}

export type ActivityLogFilter = {
  userId?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type ActivityLogEntry = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata: string;
  performedAt: string;
};

export type PagedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export function clearCache(): Promise<{ message: string }> {
  return request(api.post("/admin/system/clear-cache"));
}

export function createBackup(): Promise<{ message: string; file: string }> {
  return request(api.post("/admin/system/backup"));
}

export function checkUpdates(): Promise<{ message: string; currentVersion: string; latestVersion: string; updateAvailable: boolean }> {
  return request(api.post("/admin/system/check-updates"));
}

export type HealthStatus = {
  status: string;
  database: string;
  timestamp: string;
  uptime: string;
};

export function getHealthStatus(): Promise<HealthStatus> {
  return request(api.get<HealthStatus>("/admin/system/health"));
}

export type SystemMetrics = {
  activeUsersLast24h: number;
  ticketsCreatedLast24h: number;
  ticketsResolvedLast24h: number;
  totalUsers: number;
  totalTickets: number;
  requestRatePerMin: string;
};

export function getSystemMetrics(): Promise<SystemMetrics> {
  return request(api.get<SystemMetrics>("/admin/system/metrics"));
}

export type EscalationRule = {
  id: number;
  name: string;
  priorityId: number;
  priorityName: string;
  triggerHours: number;
  targetRoleId?: number | null;
  targetRoleName?: string;
  escalateToRoleId?: number | null;
  escalateToRoleName?: string;
  isActive: boolean;
};

export type SlaTarget = {
  id: number;
  priorityId: number;
  priorityName: string;
  targetHours: number;
};

export function getSlaTargets(): Promise<SlaTarget[]> {
  return request(api.get<SlaTarget[]>("/sla-targets"));
}

export function updateSlaTarget(id: number, targetHours: number): Promise<void> {
  return request(api.put(`/sla-targets/${id}`, { targetHours }));
}

export function getEscalationRules(): Promise<EscalationRule[]> {
  return request(api.get<EscalationRule[]>("/admin/escalation-rules"));
}

export function createEscalationRule(data: { name: string; priorityId: number; triggerHours: number; targetRoleId?: number | null; escalateToRoleId?: number | null }): Promise<void> {
  return request(api.post("/admin/escalation-rules", data));
}

export function updateEscalationRule(id: number, data: { name: string; priorityId: number; triggerHours: number; targetRoleId?: number | null; escalateToRoleId?: number | null; isActive: boolean }): Promise<void> {
  return request(api.put(`/admin/escalation-rules/${id}`, data));
}

export function deleteEscalationRule(id: number): Promise<void> {
  return request(api.delete(`/admin/escalation-rules/${id}`));
}

export function getActivityLogs(params?: ActivityLogFilter): Promise<PagedResult<ActivityLogEntry>> {
  return request(api.get<PagedResult<ActivityLogEntry>>("/admin/activity-logs", { params }));
}
