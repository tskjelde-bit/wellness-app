import { NextResponse } from "next/server";

/**
 * GET /api/clear-cookies
 * Clears all auth/consent cookies and redirects to /login.
 * Useful when stale cookies cause redirect loops in development.
 */
export async function GET() {
  const response = NextResponse.redirect(new URL("/login", process.env.AUTH_URL || "http://localhost:3001"));

  // Auth.js session cookies
  response.cookies.delete("authjs.session-token");
  response.cookies.delete("__Secure-authjs.session-token");
  response.cookies.delete("authjs.csrf-token");
  response.cookies.delete("__Host-authjs.csrf-token");
  response.cookies.delete("authjs.callback-url");
  response.cookies.delete("__Secure-authjs.callback-url");

  // App cookies
  response.cookies.delete("consent-complete");
  response.cookies.delete("subscription-active");

  return response;
}
