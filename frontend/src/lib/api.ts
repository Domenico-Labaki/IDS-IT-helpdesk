import axios, { AxiosHeaders } from "axios";

import {
  type ChangePasswordPayload,
  type CreateUserPayload,
  type ForgotPasswordPayload,
  type ForgotPasswordResponse,
  type LoginRequest,
  type LoginResponse,
  type ResetPasswordPayload,
  type UpdateProfilePayload,
  type User,
  type UserProfile,
} from "@/types";

import { getToken, removeToken, saveToken } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
  withCredentials: true,
});

function isAuthEndpoint(url?: string): boolean {
  if (!url) {
    return false;
  }

  return [
    "/auth/login",
    "/auth/refresh",
    "/auth/logout",
    "/auth/forgot-password",
    "/auth/reset-password",
  ].some((endpoint) => url.includes(endpoint));
}

api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const token = getToken();

    if (token) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const requestUrl = String(originalRequest?.url ?? "");
    const isAuthRequest = isAuthEndpoint(requestUrl);

    // Try to refresh token once when we receive a 401
    if (error?.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const refreshResp = await api.post<LoginResponse>("/auth/refresh");
        const newToken = refreshResp.data.token;
        if (newToken) {
          saveToken(newToken);
          // update header and retry original request
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        // fall-through to logout handling
      }
    }

    if (error?.response?.status === 401 && typeof window !== "undefined" && !isAuthRequest) {
      removeToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

async function request<T>(promise: Promise<{ data: T }>): Promise<T> {
  const response = await promise;
  return response.data;
}

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

export function getMyProfile(): Promise<UserProfile> {
  return request(api.get<UserProfile>("/profile"));
}

export function updateMyProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  return request(api.put<UserProfile>("/profile", data));
}

export function getUsers(): Promise<User[]> {
  return request(api.get<User[]>("/users"));
}

export function createUser(data: CreateUserPayload): Promise<User> {
  return request(api.post<User>("/users", data));
}

export function toggleUserActive(id: string): Promise<void> {
  return request(api.patch(`/users/${id}/toggle-active`));
}
