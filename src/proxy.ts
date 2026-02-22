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

  // Subscription status cookie (set by checkSubscriptionStatus server action)
  const subscriptionActive = request.cookies.get("subscription-active");

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isSessionRoute = pathname.startsWith("/session");
  const isSubscribeRoute = pathname.startsWith("/subscribe");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isConsentRoute =
    pathname.startsWith("/verify-age") || pathname.startsWith("/accept-terms");
  const isLegalRoute =
    pathname.startsWith("/privacy") || pathname.startsWith("/terms");

  // Not logged in -> redirect to login (protected, session, and subscribe routes)
  if ((isProtectedRoute || isSessionRoute || isSubscribeRoute) && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in but consent not complete -> redirect to consent flow
  // Applies to dashboard, session, and subscribe routes, but NOT consent or legal pages
  // Skip in development for easier testing
  if (
    (isProtectedRoute || isSessionRoute || isSubscribeRoute) &&
    sessionCookie &&
    !consentComplete &&
    !isConsentRoute &&
    !isLegalRoute &&
    process.env.NODE_ENV !== "development"
  ) {
    return NextResponse.redirect(new URL("/verify-age", request.url));
  }

  // Session routes only: require active subscription
  // Dashboard is NOT gated. Subscribe routes are NOT gated (users need to reach them).
  // Disabled until CCBill is configured
  // if (
  //   isSessionRoute &&
  //   sessionCookie &&
  //   consentComplete &&
  //   !subscriptionActive &&
  //   process.env.NODE_ENV !== "development"
  // ) {
  //   return NextResponse.redirect(new URL("/subscribe", request.url));
  // }

  // Already logged in -> redirect away from auth pages
  // Only redirect if consent is also complete, otherwise let them access login
  // (prevents redirect loops when session cookie exists but is invalid)
  if (isAuthRoute && sessionCookie && consentComplete) {
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
