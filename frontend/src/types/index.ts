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