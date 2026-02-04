import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require auth
const publicRoutes = ["/login", "/register", "/forget-password"];

// Static/API routes to ignore
const ignoreRoutes = ["/api", "/_next", "/favicon.ico"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static/API routes
  if (ignoreRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check refresh token cookie (httpOnly cookie) - common variations
  const allCookies = Array.from(request.cookies.getAll());
  const hasRefreshToken =
    request.cookies.has("refresh_token") ||
    request.cookies.has("refreshToken") ||
    request.cookies.has("refresh") ||
    allCookies.some(
      (cookie) =>
        cookie.name.toLowerCase().includes("refresh") &&
        cookie.value &&
        cookie.value.trim() !== "" &&
        cookie.value !== "undefined" &&
        cookie.value !== "null"
    );

  // Is current path a public auth route?
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // If user is on a public route and already authenticated -> redirect
  if (isPublicRoute && hasRefreshToken) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  // If not authenticated and trying to access non-public route -> redirect to login
  if (!isPublicRoute && !hasRefreshToken) {
    // allow root to go to login as well
    return NextResponse.redirect(
      new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
    );
  }

  // Root path redirect (optional, but keeps behavior explicit)
  if (pathname === "/") {
    if (hasRefreshToken) {
      return NextResponse.redirect(new URL("/overview", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
