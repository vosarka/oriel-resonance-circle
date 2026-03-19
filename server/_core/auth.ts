/**
 * Better Auth Configuration
 *
 * Provides Google OAuth and Email+Password authentication.
 * Uses a separate ba_* table set — bridged to the legacy `users` table
 * via email in context.ts so all existing user data (conversations,
 * readings, subscriptions) is preserved.
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../../drizzle/schema";
import { ENV } from "./env";

// ─── Drizzle instance for Better Auth ────────────────────────────────────────

function createBetterAuthDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for Better Auth");
  }
  return drizzle(process.env.DATABASE_URL);
}

// ─── Better Auth instance ────────────────────────────────────────────────────

export const auth = betterAuth({
  trustedOrigins: ["http://localhost:*"],
  baseURL: ENV.appBaseUrl || `http://localhost:${process.env.PORT || 3000}`,
  basePath: "/api/auth",
  secret: ENV.betterAuthSecret || ENV.cookieSecret || "dev-fallback-secret-change-me",

  database: drizzleAdapter(createBetterAuthDb(), {
    provider: "mysql",
    schema: {
      user: schema.baUser,
      session: schema.baSession,
      account: schema.baAccount,
      verification: schema.baVerification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  socialProviders: {
    google: {
      clientId: ENV.googleClientId,
      clientSecret: ENV.googleClientSecret,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Update session daily
  },
});

export type BetterAuthSession = typeof auth.$Infer.Session;
