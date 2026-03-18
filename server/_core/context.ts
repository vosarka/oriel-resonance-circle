import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import type { User } from "../../drizzle/schema";
import { auth } from "./auth";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Creates tRPC context from an Express request.
 *
 * Flow:
 *   1. Verify session via Better Auth → get ba_user (email, name, id)
 *   2. Look up our legacy `users` table by email
 *   3. If no legacy user exists, create one (for new Better Auth signups)
 *   4. Return the legacy User object so all existing code works unchanged
 */
export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(opts.req.headers),
    });

    if (session?.user) {
      const baUser = session.user;

      // Bridge: find the matching legacy user by email
      let legacyUser = baUser.email
        ? await db.getUserByEmail(baUser.email)
        : undefined;

      // Auto-create a legacy user record for new Better Auth signups
      if (!legacyUser && baUser.email) {
        const { nanoid } = await import("nanoid");
        const openId = nanoid(21);

        await db.upsertUser({
          openId,
          email: baUser.email,
          name: baUser.name || null,
          loginMethod: "better-auth",
          lastSignedIn: new Date(),
        });

        legacyUser = await db.getUserByEmail(baUser.email);
      }

      // Update last sign-in time (lightweight — don't await)
      if (legacyUser) {
        db.upsertUser({
          openId: legacyUser.openId,
          lastSignedIn: new Date(),
        }).catch(() => {});
      }

      user = legacyUser ?? null;
    }
  } catch (error) {
    // Authentication is optional for public procedures
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
