// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  PUBLIC_ROUTES,
  IGNORE_PREFIXES,
  SYSTEM_ROUTES,
  isRouteInList,
} from "@/router/routes";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next internals / api / static
  if (IGNORE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow system routes always
  const isSystem = isRouteInList(pathname, SYSTEM_ROUTES as any);
  if (isSystem) return NextResponse.next();

  const isPublic = isRouteInList(pathname, PUBLIC_ROUTES);
  const hasRefresh = Boolean(request.cookies.get("refresh_token")?.value);

  // ✅ Only redirect "/" if logged in
  if (pathname === "/" && hasRefresh) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  // ✅ Only redirect PUBLIC routes if the request is EXACTLY public
  // (avoid edge cases where a private route gets matched incorrectly)
  if (hasRefresh && isPublic) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  // ✅ Protect private routes
  if (!isPublic && !hasRefresh) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
