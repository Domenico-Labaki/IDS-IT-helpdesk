export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
};

export type CreateUserPayload = {
  fullName: string;
  email: string;
  password: string;
  roleId: number;
  department?: string;
};

export type UpdateProfilePayload = {
  fullName: string;
  department?: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ForgotPasswordResponse = {
  message: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type Role = "Admin" | "Agent" | "Manager" | "Employee";

export type ApiError = {
  message: string;
  status: number;
};

export type Ticket = {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  priorityId: number;
  priorityName: string;
  statusId: number;
  statusName: string;
  createdBy: string;
  createdByName: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type TicketCreatePayload = {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
};

export type TicketUpdatePayload = {
  title: string;
  description: string;
  categoryId: number;
  priorityId: number;
  statusId: number;
  assignedTo?: string | null;
};

export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type Priority = {
  id: number;
  name: string;
  level: number;
};

export type Status = {
  id: number;
  name: string;
};