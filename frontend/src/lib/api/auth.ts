import type {
  ChangePasswordPayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  ResetPasswordPayload,
  TwoFactorSetup,
} from "@/types";

import { api, request } from "@/lib/api";

export function login(data: LoginRequest): Promise<LoginResponse> {
  return request(api.post<LoginResponse>("/auth/login", data));
}

export async function logout(): Promise<void> {
  await request(api.post("/auth/logout"));
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

export function setup2FA(currentPassword: string, currentCode?: string): Promise<TwoFactorSetup> {
  return request(api.post<TwoFactorSetup>("/auth/2fa/setup", { currentPassword, currentCode }));
}

export function verify2FA(code: string): Promise<void> {
  return request(api.post("/auth/2fa/verify", { code }));
}

export function disable2FA(currentPassword: string, code: string): Promise<void> {
  return request(api.post("/auth/2fa/disable", { currentPassword, code }));
}

export function login2FA(twoFactorToken: string, code: string): Promise<LoginResponse> {
  return request(api.post<LoginResponse>("/auth/2fa/login", { twoFactorToken, code }));
}
