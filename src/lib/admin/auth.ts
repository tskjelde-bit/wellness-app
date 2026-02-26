import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";

/**
 * For server components and server actions.
 * Redirects to /login if not authenticated, returns 403-equivalent redirect if not admin.
 */
export async function requireAdmin() {
  const session = (await auth()) as Session | null;

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  return session;
}

/**
 * For API routes.
 * Returns a 403 Response if not admin, or the session if authorized.
 */
export async function requireAdminApi(): Promise<
  | { authorized: true; session: Session }
  | { authorized: false; response: Response }
> {
  const session = (await auth()) as Session | null;

  if (!session?.user) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  if (!session.user.isAdmin) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { authorized: true, session };
}
