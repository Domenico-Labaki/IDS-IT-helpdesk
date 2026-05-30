import { NextRequest, NextResponse } from "next/server";

const publicPaths = ["/login", "/forgot-password", "/reset-password"];

function getRole(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return ["Admin", "Agent", "Manager", "Employee"].includes(payload.role) ? payload.role : null;
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