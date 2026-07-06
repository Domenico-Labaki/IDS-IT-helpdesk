import type { CreateUserPayload, User } from "@/types";

import { api, request } from "@/lib/api";

export function getUsers(): Promise<User[]> {
  return request(api.get<User[]>("/users"));
}

export function createUser(data: CreateUserPayload): Promise<User> {
  return request(api.post<User>("/users", data));
}

export function toggleUserActive(id: string): Promise<void> {
  return request(api.patch(`/users/${id}/toggle-active`));
}

export function unlockUser(id: string): Promise<void> {
  return request(api.post(`/users/${id}/unlock`));
}
