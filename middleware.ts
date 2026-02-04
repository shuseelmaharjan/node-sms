import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PUBLIC_ROUTES, IGNORE_PREFIXES, isRouteInList } from "@/router/routes";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (IGNORE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isPublic = isRouteInList(pathname, PUBLIC_ROUTES);

  // must exist with Path="/"
  const hasRefresh = Boolean(request.cookies.get("refresh_token")?.value);

  // logged-in users should not see /login etc
  if (isPublic && hasRefresh) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  // protect everything except public routes
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
