import { NextRequest, NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Optimistic check: does a session cookie exist?
  // Do NOT validate the session here -- just redirect if no cookie
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  // Consent status cookie (set by server actions after all required consents are recorded)
  const consentComplete = request.cookies.get("consent-complete");

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isSessionRoute = pathname.startsWith("/session");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isConsentRoute =
    pathname.startsWith("/verify-age") || pathname.startsWith("/accept-terms");
  const isLegalRoute =
    pathname.startsWith("/privacy") || pathname.startsWith("/terms");

  // Not logged in -> redirect to login (protected and session routes)
  if ((isProtectedRoute || isSessionRoute) && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but consent not complete -> redirect to consent flow
  // Applies to dashboard and session routes, but NOT consent or legal pages
  if (
    (isProtectedRoute || isSessionRoute) &&
    sessionCookie &&
    !consentComplete &&
    !isConsentRoute &&
    !isLegalRoute
  ) {
    return NextResponse.redirect(new URL("/verify-age", request.url));
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
    "/login",
    "/register",
    "/verify-age",
    "/accept-terms",
  ],
};
