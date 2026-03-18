import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check: does a session cookie exist?
  // Do NOT validate the session here -- just redirect if no cookie
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isSessionRoute = pathname.startsWith("/session");
  const isSubscribeRoute = pathname.startsWith("/subscribe");
  const isConsentRoute =
    pathname.startsWith("/verify-age") || pathname.startsWith("/accept-terms");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Not logged in -> redirect to login (protected, session, subscribe, and consent routes)
  if (
    (isProtectedRoute || isSessionRoute || isSubscribeRoute || isConsentRoute) &&
    !sessionCookie
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in -> redirect away from auth pages
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/session/:path*",
    "/subscribe/:path*",
    "/login",
    "/register",
    "/verify-age",
    "/accept-terms",
  ],
};
