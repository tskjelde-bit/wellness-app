import type { DefaultSession } from "next-auth";

export type { SessionState } from "@/lib/session-store";

// Extend Auth.js types to include user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
