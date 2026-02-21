import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check: does a session cookie exist?
  // Do NOT validate the session here -- just redirect if no cookie
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
