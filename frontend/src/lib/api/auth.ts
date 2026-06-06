import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordPayload,
} from "@/types";

import { api, request } from "@/lib/api";
import { removeToken } from "@/lib/auth";

export function login(data: LoginRequest): Promise<LoginResponse> {
  return request(api.post<LoginResponse>("/auth/login", data));
}

export async function logout(): Promise<void> {
  await request(api.post("/auth/logout"));
  removeToken();
}

export function forgotPassword(data: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  return request(api.post<ForgotPasswordResponse>("/auth/forgot-password", data));
}

export function resetPassword(data: ResetPasswordPayload): Promise<void> {
  return request(api.post("/auth/reset-password", data));
}

export function changePassword(data: ChangePasswordPayload): Promise<void> {
  return request(api.post("/auth/change-password", data));
}
