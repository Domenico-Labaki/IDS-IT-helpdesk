import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/forgot-password", "/reset-password"];

function getClaim(payload: Record<string, unknown>, names: string[]): string | null {
  for (const name of names) {
    const value = payload[name];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

function getRole(token: string) {
  try {
    const payloadPart = token.split(".")[1];
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const role = getClaim(payload, [
      "role",
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
    ]);

    return ["Admin", "Agent", "Manager", "Employee"].includes(role ?? "") ? role : null;
  } catch {
    return null;
  }
}

function isMatch(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;
  const role = token ? getRole(token) : null;
  const isPublic = publicPaths.some((p) => isMatch(pathname, p));
  if ((!token || !role) && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  if (token && role && isPublic) return NextResponse.redirect(new URL("/dashboard", request.url));
  if (!role) return NextResponse.next();
  if ((isMatch(pathname, "/admin") || isMatch(pathname, "/users")) && role !== "Admin") return NextResponse.redirect(new URL("/dashboard", request.url));
  if (isMatch(pathname, "/reports") && role !== "Admin" && role !== "Manager") return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"] };
