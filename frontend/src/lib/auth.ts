import Cookies from "js-cookie";

import type { Role } from "@/types";

const TOKEN_COOKIE_NAME = "token";

type TokenPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
  fullName?: string;
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf-8");
  }

  throw new Error("No base64 decoder available");
}

function getClaim(payload: Record<string, unknown>, names: string[]): string | null {
  for (const name of names) {
    const value = payload[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

export function saveToken(token: string): void {
  Cookies.set(TOKEN_COOKIE_NAME, token, {
    expires: 1,
    sameSite: "strict",
    path: "/",
  });
}

export function removeToken(): void {
  Cookies.remove(TOKEN_COOKIE_NAME, { path: "/" });
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_COOKIE_NAME);
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    const [, payloadPart] = token.split(".");

    if (!payloadPart) {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(payloadPart)) as Record<string, unknown>;
    const role = getClaim(payload, [
      "role",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
    ]);
    const userId = getClaim(payload, [
      "userId",
      "sub",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier",
    ]);
    const email = getClaim(payload, [
      "email",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/emailaddress",
    ]);
    const name = getClaim(payload, [
      "name",
      "fullName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/name",
    ]);

    if (
      userId === null ||
      email === null ||
      typeof payload.exp !== "number" ||
      !["Admin", "Agent", "Manager", "Employee"].includes(role ?? "")
    ) {
      return null;
    }

    return {
      userId,
      email,
      name: name ?? "",
      role: role as Role,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

export function getRoleFromToken(token: string): Role | null {
  return decodeToken(token)?.role ?? null;
}

export function isAuthenticated(): boolean {
  const token = getToken();

  if (!token) {
    return false;
  }

  const decoded = decodeToken(token);

  return decoded !== null && decoded.exp > Date.now() / 1000;
}
