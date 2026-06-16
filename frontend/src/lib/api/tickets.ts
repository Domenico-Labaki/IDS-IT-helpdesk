import type {
  ActivityLogEntry,
  AddCommentPayload,
  AssignmentHistoryEntry,
  Category,
  Comment,
  PagedResult,
  Priority,
  Status,
  StatusHistoryEntry,
  Ticket,
  TicketCreatePayload,
  TicketUpdatePayload,
} from "@/types";

import { api, request } from "@/lib/api";

export function assignTicket(id: string, assignedToUserId: string): Promise<void> {
  return request(api.put(`/tickets/${id}/assign`, { assignedToUserId }));
}

export function unassignTicket(id: string): Promise<void> {
  return request(api.delete(`/tickets/${id}/assign`));
}

export function updateTicketStatus(id: string, statusId: number, notes?: string): Promise<void> {
  return request(api.put(`/tickets/${id}/status`, { statusId, notes }));
}

export type TicketFilterParams = {
  page?: number;
  pageSize?: number;
  searchText?: string;
  categoryId?: number;
  priorityId?: number;
  statusId?: number;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
};

export function getTickets(params?: TicketFilterParams): Promise<PagedResult<Ticket>> {
  return request(api.get<PagedResult<Ticket>>("/tickets", { params }));
}

export function getTicketById(id: string): Promise<Ticket> {
  return request(api.get<Ticket>(`/tickets/${id}`));
}

export function createTicket(payload: TicketCreatePayload): Promise<Ticket> {
  return request(api.post<Ticket>("/tickets", payload));
}

export function updateTicket(id: string, payload: TicketUpdatePayload): Promise<Ticket> {
  return request(api.put<Ticket>(`/tickets/${id}`, payload));
}

export function deleteTicket(id: string): Promise<void> {
  return request(api.delete(`/tickets/${id}`));
}

export function getComments(ticketId: string): Promise<Comment[]> {
  return request(api.get<Comment[]>(`/tickets/${ticketId}/comments`));
}

export function addComment(ticketId: string, payload: AddCommentPayload): Promise<Comment> {
  return request(api.post<Comment>(`/tickets/${ticketId}/comments`, payload));
}

export function deleteComment(ticketId: string, commentId: string): Promise<void> {
  return request(api.delete(`/tickets/${ticketId}/comments/${commentId}`));
}

export function getStatusHistory(ticketId: string): Promise<StatusHistoryEntry[]> {
  return request(api.get<StatusHistoryEntry[]>(`/tickets/${ticketId}/status-history`));
}

export function getAssignmentHistory(ticketId: string): Promise<AssignmentHistoryEntry[]> {
  return request(api.get<AssignmentHistoryEntry[]>(`/tickets/${ticketId}/assignment-history`));
}

export function getTicketActivity(ticketId: string): Promise<ActivityLogEntry[]> {
  return request(api.get<ActivityLogEntry[]>(`/tickets/${ticketId}/activity`));
}

export function getCategories(): Promise<Category[]> {
  return request(api.get<Category[]>("/categories"));
}

export function createCategory(name: string, description?: string): Promise<Category> {
  return request(api.post<Category>("/categories", { name, description }));
}

export function updateCategory(id: number, name: string, description?: string): Promise<Category> {
  return request(api.put<Category>(`/categories/${id}`, { name, description }));
}

export function deleteCategory(id: number): Promise<void> {
  return request(api.delete(`/categories/${id}`));
}

export function getPriorities(): Promise<Priority[]> {
  return request(api.get<Priority[]>("/priorities"));
}

export function createPriority(name: string, level: number): Promise<Priority> {
  return request(api.post<Priority>("/priorities", { name, level }));
}

export function updatePriority(id: number, name: string, level: number): Promise<Priority> {
  return request(api.put<Priority>(`/priorities/${id}`, { name, level }));
}

export function deletePriority(id: number): Promise<void> {
  return request(api.delete(`/priorities/${id}`));
}

export function getStatuses(): Promise<Status[]> {
  return request(api.get<Status[]>("/statuses"));
}

export function createStatus(name: string): Promise<Status> {
  return request(api.post<Status>("/statuses", { name }));
}

export function updateStatus(id: number, name: string): Promise<Status> {
  return request(api.put<Status>(`/statuses/${id}`, { name }));
}

export function deleteStatus(id: number): Promise<void> {
  return request(api.delete(`/statuses/${id}`));
}
