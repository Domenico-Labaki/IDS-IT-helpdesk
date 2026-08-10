import axios from "axios";

import type { LoginResponse } from "@/types";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5055/api",
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = String(originalRequest?.url ?? "");
    const isAuthRequest = isAuthEndpoint(requestUrl);

    // Try to refresh token once when we receive a 401
    if (error?.response?.status === 401 && !originalRequest?._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        await api.post<LoginResponse>("/auth/refresh");
        return api(originalRequest);
      } catch {
        // fall-through to logout handling
      }
    }

    if (error?.response?.status === 401 && typeof window !== "undefined" && !isAuthRequest) {
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export async function request<T>(promise: Promise<{ data: T }>): Promise<T> {
  const response = await promise;
  return response.data;
}
