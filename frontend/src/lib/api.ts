import axios from "axios";

import {
  type ChangePasswordPayload,
  type CreateUserPayload,
  type ForgotPasswordPayload,
  type LoginRequest,
  type LoginResponse,
  type ResetPasswordPayload,
  type UpdateProfilePayload,
  type User,
  type UserProfile,
} from "@/types";

import { getToken, removeToken } from "@/lib/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  if (typeof document !== "undefined") {
    const token = getToken();

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
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

export function forgotPassword(data: ForgotPasswordPayload): Promise<void> {
  return request(api.post("/auth/forgot-password", data));
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
