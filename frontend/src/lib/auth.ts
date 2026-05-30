import Cookies from "js-cookie";

import type { Role } from "@/types";

const TOKEN_COOKIE_NAME = "token";

type TokenPayload = {
  userId: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
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

    const payload = JSON.parse(decodeBase64Url(payloadPart)) as Partial<TokenPayload> & {
      fullName?: string;
    };

    const role = payload.role;

    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      !["Admin", "Agent", "Manager", "Employee"].includes(role)
    ) {
      return null;
    }

    const name =
      typeof payload.name === "string"
        ? payload.name
        : typeof payload.fullName === "string"
          ? payload.fullName
          : "";

    return {
      userId: payload.userId,
      email: payload.email,
      name,
      role,
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