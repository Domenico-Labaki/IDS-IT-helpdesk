import type {
  ActivityLogEntry,
  AddCommentPayload,
  AssignmentHistoryEntry,
  Category,
  Comment,
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

export function getTickets(): Promise<Ticket[]> {
  return request(api.get<Ticket[]>("/tickets"));
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

export function getPriorities(): Promise<Priority[]> {
  return request(api.get<Priority[]>("/priorities"));
}

export function getStatuses(): Promise<Status[]> {
  return request(api.get<Status[]>("/statuses"));
}
