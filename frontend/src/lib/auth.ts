import Cookies from "js-cookie";

import { getClaim, parseJwtPayload } from "@/lib/jwt";
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
    const payload = parseJwtPayload(token);

    if (!payload) {
      return null;
    }

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
