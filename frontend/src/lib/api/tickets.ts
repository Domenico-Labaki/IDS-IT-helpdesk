import type {
  Category,
  Priority,
  Status,
  Ticket,
  TicketCreatePayload,
  TicketUpdatePayload,
} from "@/types";

import { api, request } from "@/lib/api";

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

export function getCategories(): Promise<Category[]> {
  return request(api.get<Category[]>("/categories"));
}

export function getPriorities(): Promise<Priority[]> {
  return request(api.get<Priority[]>("/priorities"));
}

export function getStatuses(): Promise<Status[]> {
  return request(api.get<Status[]>("/statuses"));
}
